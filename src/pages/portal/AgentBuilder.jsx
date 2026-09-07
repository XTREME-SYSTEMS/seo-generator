import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Plus, Trash2, Power, Loader2, Sparkles, Target, Brain, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

const AGENT_TEMPLATES = [
  { name: 'Ranking Scout', icon: Target, desc: 'Researches new ranking methods and competitor strategies', role: 'research' },
  { name: 'Content Builder', icon: Brain, desc: 'Generates optimized content, meta tags, and schema markup', role: 'content' },
  { name: 'Technical Healer', icon: Shield, desc: 'Fixes technical SEO issues and auto-heals failures', role: 'technical' },
  { name: 'Authority Builder', icon: Zap, desc: 'Builds backlinks and manages outreach campaigns', role: 'authority' },
  { name: 'AI Search Optimizer', icon: Sparkles, desc: 'Optimizes for ChatGPT, Perplexity, and AI search engines', role: 'aeo' },
  { name: 'Custom Agent', icon: Bot, desc: 'Build a custom agent with your own configuration', role: 'custom' },
];

function AgentBuilder() {
  const [agents, setAgents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', role: 'research', goal: '', schedule: 'hourly' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Load existing agents from onboarding profile
    async function load() {
      try {
        const { data: u } = await base44.auth.me();
        const profiles = await base44.entities.OnboardingProfile.filter({ user_id: u.id });
        if (profiles.length > 0 && profiles[0].agent_config) {
          setAgents(JSON.parse(profiles[0].agent_config));
        } else {
          // Default agents
          setAgents([
            { name: 'Commander', role: 'orchestrator', goal: 'Orchestrate all SEO phases', enabled: true, schedule: 'hourly' },
            { name: 'Scout', role: 'research', goal: 'Research ranking methods', enabled: true, schedule: '6h' },
            { name: 'Builder', role: 'content', goal: 'Implement SEO changes', enabled: true, schedule: 'hourly' },
            { name: 'Healer', role: 'technical', goal: 'Fix errors and heal failures', enabled: true, schedule: '2h' },
            { name: 'Sentinel', role: 'monitor', goal: 'Monitor rankings and detect anomalies', enabled: true, schedule: '15m' },
            { name: 'Validator', role: 'validation', goal: 'Verify ranking improvements', enabled: true, schedule: '6h' },
          ]);
        }
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  const handleCreate = async () => {
    if (!newAgent.name || !newAgent.goal) return;
    setCreating(true);
    const agent = { ...newAgent, enabled: true };
    const updated = [...agents, agent];
    setAgents(updated);
    try {
      const { data: u } = await base44.auth.me();
      const profiles = await base44.entities.OnboardingProfile.filter({ user_id: u.id });
      if (profiles.length > 0) {
        await base44.entities.OnboardingProfile.update(profiles[0].id, {
          agent_config: JSON.stringify(updated),
        });
      }
    } catch (err) { console.error(err); }
    setNewAgent({ name: '', role: 'research', goal: '', schedule: 'hourly' });
    setShowCreate(false);
    setCreating(false);
  };

  const toggleAgent = (i) => {
    const updated = [...agents];
    updated[i] = { ...updated[i], enabled: !updated[i].enabled };
    setAgents(updated);
  };

  const deleteAgent = (i) => {
    setAgents(agents.filter((_, idx) => idx !== i));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
            <Link to="/portal" className="hidden font-heading text-sm font-bold sm:block hover:text-[#FFD700]">PORTAL</Link>
          </div>
          <Link to="/portal"><Button size="sm" variant="ghost" className="text-white/50 hover:text-white">Back to Dashboard</Button></Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Agent Builder</h1>
            <p className="mt-1 text-white/50">Configure AI agents that operate autonomously to achieve your goals.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">
            <Plus className="mr-2 h-4 w-4" /> New Agent
          </Button>
        </div>

        {showCreate && (
          <div className="mb-6 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/[0.03] p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold">Create New Agent</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-white/70">Agent Name</label>
                <Input value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} placeholder="e.g. Local SEO Agent" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-white/70">Role</label>
                <select value={newAgent.role} onChange={e => setNewAgent({ ...newAgent, role: e.target.value })} className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <option value="research">Research</option>
                  <option value="content">Content</option>
                  <option value="technical">Technical</option>
                  <option value="authority">Authority</option>
                  <option value="aeo">AI Search</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-white/70">Goal</label>
                <Input value={newAgent.goal} onChange={e => setNewAgent({ ...newAgent, goal: e.target.value })} placeholder="What should this agent achieve?" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-white/70">Schedule</label>
                <select value={newAgent.schedule} onChange={e => setNewAgent({ ...newAgent, schedule: e.target.value })} className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                  <option value="15m">Every 15 minutes</option>
                  <option value="hourly">Hourly</option>
                  <option value="2h">Every 2 hours</option>
                  <option value="6h">Every 6 hours</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newAgent.name} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Agent'}
              </Button>
              <Button onClick={() => setShowCreate(false)} variant="ghost" className="text-white/50">Cancel</Button>
            </div>
          </div>
        )}

        {/* Agent Templates */}
        <div className="mb-8">
          <h2 className="mb-3 font-heading text-sm font-semibold text-white/60">Quick Templates</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGENT_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => { setNewAgent({ name: t.name, role: t.role, goal: t.desc, schedule: 'hourly' }); setShowCreate(true); }}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-left hover:border-[#FFD700]/30 hover:bg-[#FFD700]/[0.03]">
                <t.icon className="mb-2 h-5 w-5 text-[#FFD700]" />
                <h4 className="text-sm font-semibold">{t.name}</h4>
                <p className="mt-1 text-xs text-white/40">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Active Agents */}
        <div>
          <h2 className="mb-3 font-heading text-sm font-semibold text-white/60">Your Agents ({agents.length})</h2>
          <div className="space-y-2">
            {agents.map((agent, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${agent.enabled ? 'bg-[#FFD700]/10' : 'bg-white/5'}`}>
                    <Bot className={`h-5 w-5 ${agent.enabled ? 'text-[#FFD700]' : 'text-white/30'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{agent.name}</h4>
                      <span className={`h-2 w-2 rounded-full ${agent.enabled ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    </div>
                    <p className="text-xs text-white/40">{agent.goal || agent.role}</p>
                    <p className="mt-0.5 text-[10px] text-white/30">Schedule: {agent.schedule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAgent(i)} className={`rounded p-1.5 ${agent.enabled ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-white/30 hover:bg-white/5'}`}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteAgent(i)} className="rounded p-1.5 text-red-400 hover:bg-red-400/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentBuilder;