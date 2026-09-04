import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import ChatMessage from '@/components/vision/ChatMessage';
import Loading from '@/components/kit/Loading';
import { Send, Plus, MessageSquare, Trash2, Brain, Zap, Activity, Wrench, Shield, CheckCircle2, GitMerge } from 'lucide-react';

const AGENT_NAME = 'vision_cortex_orchestrator';

const QUICK_PROMPTS = [
  { label: 'Run full cycle', text: 'Run the full autonomous cycle now — audit, reflect, discover, suggest, implement, validate, and heal.', icon: Zap },
  { label: 'Self-reflect', text: 'Run a self-reflection on the system. What is working, what is failing, what is missing? Generate directives.', icon: Activity },
  { label: 'Implement capabilities', text: 'Find all unimplemented capabilities and implement them autonomously. Auto-heal any failures.', icon: Wrench },
  { label: 'Fix blocked rows', text: 'Find all blocked rows in the ARE sheet and auto-fix them. Heal every binding constraint.', icon: Shield },
  { label: 'Validate system', text: 'Run the full validation suite. Fix any failing tests. Make the system audit-ready.', icon: CheckCircle2 },
  { label: 'Drive convergence', text: 'Run the convergence loop. Drive every URL to top-5. Log every iteration as proof.', icon: GitMerge },
];

export default function VisionCortexChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(list || []);
      if (list.length > 0 && !activeId) {
        setActiveId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoadingConvos(false);
    }
  }, [activeId]);

  useEffect(() => {
    loadConversations();
  }, []);

  // Subscribe to active conversation
  useEffect(() => {
    if (!activeId) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when switching conversations
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    base44.agents.getConversation(activeId).then((conv) => {
      setMessages(conv.messages || []);
    }).catch(() => setMessages([]));
  }, [activeId]);

  async function createNewConversation() {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Session ${new Date().toLocaleString()}`, description: 'Vision Cortex autonomous session' },
      });
      setConversations([conv, ...conversations]);
      setActiveId(conv.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  }

  async function sendMessage(text) {
    const content = (text || input).trim();
    if (!content || sending) return;

    // Create a conversation if none exists
    let convId = activeId;
    if (!convId) {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Session ${new Date().toLocaleString()}`, description: 'Vision Cortex autonomous session' },
      });
      setConversations([conv, ...conversations]);
      setActiveId(conv.id);
      convId = conv.id;
    }

    const conv = conversations.find((c) => c.id === convId) || { id: convId };
    setInput('');
    setSending(true);
    try {
      await base44.agents.addMessage(conv, { role: 'user', content });
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div>
      <PageHeader
        eyebrow="Autonomous Agent"
        title="Vision Cortex Chat"
        description="Talk directly to the Vision Cortex Orchestrator — the autonomous brain that audits, analyzes, fixes, heals, hardens, optimizes, and enhances the entire system. It has full read/write/execute access and runs on scheduled crons 24/7."
        actions={
          <StatusPill tone="good">
            <Brain className="mr-1 h-3 w-3" />
            Agent Online
          </StatusPill>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Conversation List */}
        <div className="space-y-2">
          <button
            onClick={createNewConversation}
            className="flex w-full items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Session
          </button>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {loadingConvos ? (
              <Loading label="Loading sessions..." />
            ) : conversations.length === 0 ? (
              <div className="rounded-md border border-border bg-card p-4 text-center text-xs text-muted-foreground">
                No sessions yet. Start a new one.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    activeId === conv.id
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{conv.metadata?.name || 'Untitled'}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <Panel
          title={activeConv?.metadata?.name || 'Select or create a session'}
          subtitle="The agent has full system access — it can read/write entities, execute backend functions, and run autonomous loops"
          right={
            <StatusPill tone={sending ? 'warn' : 'idle'}>
              {sending ? 'Processing...' : 'Ready'}
            </StatusPill>
          }
        >
          {/* Messages */}
          <div className="mb-3 max-h-[500px] min-h-[300px] space-y-4 overflow-y-auto rounded-md border border-border bg-background p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Brain className="mb-3 h-8 w-8 text-primary" />
                <p className="font-heading text-sm font-medium text-foreground">Vision Cortex Orchestrator</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  The autonomous brain is ready. Ask it to audit, fix, heal, harden, optimize, implement, or converge — or use a quick prompt below.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                onClick={() => sendMessage(qp.text)}
                disabled={sending}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <qp.icon className="h-3 w-3" />
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tell the Vision Cortex what to do..."
              disabled={sending}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}