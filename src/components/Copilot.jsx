import React, { useState } from 'react';
import { Bot, Send, X, Globe, Search, Zap, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

const QUICK_ACTIONS = [
  { label: 'Audit my URLs', icon: Search, action: 'Run a full SEO audit on all my URLs' },
  { label: 'Scrape competitor', icon: Globe, action: 'Scrape my top competitor and find gaps' },
  { label: 'Generate content', icon: Zap, action: 'Generate optimized content for my top URL' },
  { label: 'Check rankings', icon: Sparkles, action: 'Check my current Google rankings' },
];

export default function Copilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Xtreme SEO Optimizer AI Copilot. The user asks: "${text}". 
        Provide a helpful, concise response about their SEO system. If they ask to perform an action, 
        describe what you would do and suggest next steps. Be friendly and professional.`,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.response || res }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD700] shadow-lg shadow-[#FFD700]/30 transition-transform hover:scale-110"
        title="Open AI Copilot"
      >
        <img src={LOGO_URL} alt="Copilot" className="h-9 w-9 rounded-full" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[80vh] w-96 flex-col rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Copilot" className="h-7 w-7 rounded-full" />
          <div>
            <div className="font-heading text-sm font-semibold text-white">AI Copilot</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <img src={LOGO_URL} alt="Xtreme SEO" className="mb-4 h-12 w-12 rounded-full" />
            <p className="mb-1 text-sm font-medium text-white">How can I help you?</p>
            <p className="mb-4 text-xs text-white/40">I can scrape the web, audit your URLs, generate content, and operate your system.</p>
            <div className="grid w-full grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button key={a.label} onClick={() => send(a.action)} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-left text-xs text-white/60 hover:border-[#FFD700]/30 hover:bg-[#FFD700]/[0.03]">
                  <a.icon className="h-3.5 w-3.5 shrink-0 text-[#FFD700]" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user' ? 'bg-[#FFD700] text-black' : 'bg-white/5 text-white'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="rounded-lg bg-white/5 px-3 py-2"><Loader2 className="h-4 w-4 animate-spin text-[#FFD700]" /></div></div>}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask anything..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#FFD700]/30 focus:outline-none"
          />
          <button onClick={() => send(input)} disabled={loading || !input.trim()} className="rounded-lg bg-[#FFD700] p-2 text-black hover:bg-[#FFD700]/90 disabled:opacity-30">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}