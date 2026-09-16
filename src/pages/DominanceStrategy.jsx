import React, { useState, useMemo } from 'react';
import { Crown, Rocket, Target, Layers, Copy, Check, Search, Zap, Shield, TrendingUp, Globe, Bot, FileText, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NUMBERED_PROMPTS, PROMPT_PHASES, TOTAL_PROMPTS } from '@/lib/dominancePrompts';

export default function DominanceStrategy() {
  const [search, setSearch] = useState('');
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [copied, setCopied] = useState(null);
  const [activePhase, setActivePhase] = useState('all');

  const filteredPrompts = useMemo(() => {
    return NUMBERED_PROMPTS.filter(p => {
      if (activePhase !== 'all' && p.phase !== activePhase) return false;
      if (search && !`${p.title} ${p.prompt}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, activePhase]);

  function copyPrompt(num, text) {
    navigator.clipboard.writeText(text);
    setCopied(num);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Crown className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Digital Dominance — Core Strategy</h1>
          <p className="text-sm text-muted-foreground">Vision, execution architecture, and exhaustive prompt library</p>
        </div>
        <Link to="/digital-dominance" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <Rocket className="w-4 h-4" /> Launch Generator
        </Link>
      </div>

      {/* Vision */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 mb-6 text-white">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> The Vision</h2>
        <p className="text-sm leading-relaxed text-gray-200 max-w-4xl">
          Enter business information <strong className="text-yellow-400">once</strong>. The system discovers every website, directory, review platform, social network, industry association, and government registry where the business should be listed. The CloudBrowser swarm then navigates to each target, analyzes the form, maps the business profile to form fields using LLM intelligence, fills the form, and submits — automatically. The result: the business's information floods every digital space, achieving complete online dominance without manual data entry on a single site.
        </p>
        <div className="grid sm:grid-cols-4 gap-3 mt-4">
          <VisionStat icon={Target} value="100+" label="Submission Targets" />
          <VisionStat icon={Bot} value="Swarm" label="CloudBrowser Auto-Fill" />
          <VisionStat icon={FileText} value={`${TOTAL_PROMPTS}`} label="Engineered Prompts" />
          <VisionStat icon={TrendingUp} value="∞" label="Digital Coverage" />
        </div>
      </div>

      {/* Strategy */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StrategyCard icon={Search} title="1. Discover" desc="Seed 80+ catalog targets + LLM discovers 20+ niche-specific directories. Every submission source on the internet, found." color="text-blue-600" />
        <StrategyCard icon={Bot} title="2. Automate" desc="CloudBrowser swarm navigates, extracts form structure, LLM maps fields, fills, and submits. React-compatible native setters." color="text-purple-600" />
        <StrategyCard icon={Shield} title="3. Verify" desc="Swarm revisits each target 48-72h later, confirms the listing is live, captures proof screenshots, flags errors." color="text-green-600" />
        <StrategyCard icon={TrendingUp} title="4. Dominate" desc="Track live listings, backlinks acquired, review growth, ranking changes. Continuous improvement loop refines the system." color="text-yellow-600" />
      </div>

      {/* Prompt Library Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-yellow-500" /> Prompt Library
          <span className="text-sm font-normal text-muted-foreground">({TOTAL_PROMPTS} prompts)</span>
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} className="w-full input pl-10" />
        </div>
        <select value={activePhase} onChange={e => setActivePhase(e.target.value)} className="input min-w-[200px]">
          <option value="all">All Phases</option>
          {PROMPT_PHASES.map(p => <option key={p.phase} value={p.phase}>{p.phase}</option>)}
        </select>
      </div>

      {/* Phase descriptions */}
      {activePhase === 'all' && !search && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {PROMPT_PHASES.map(p => (
            <div key={p.phase} className="border border-border rounded-lg p-3 bg-card">
              <div className="text-sm font-bold text-foreground mb-1">{p.phase}</div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              <div className="text-xs text-yellow-600 mt-1">{p.prompts.length} prompts</div>
            </div>
          ))}
        </div>
      )}

      {/* Prompts */}
      <div className="space-y-3">
        {filteredPrompts.map(prompt => (
          <div key={prompt.number} className="border border-border rounded-lg bg-card overflow-hidden">
            {/* Prompt header */}
            <button
              onClick={() => setExpandedPrompt(expandedPrompt === prompt.number ? null : prompt.number)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-400 text-gray-900 font-bold text-sm flex items-center justify-center shrink-0">
                {prompt.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{prompt.title}</div>
                <div className="text-xs text-muted-foreground">{prompt.phase}</div>
              </div>
              {expandedPrompt === prompt.number ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Prompt body */}
            {expandedPrompt === prompt.number && (
              <div className="border-t border-border px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Prompt #{prompt.number} — {prompt.title}</span>
                  <button
                    onClick={() => copyPrompt(prompt.number, prompt.prompt)}
                    className={`text-xs px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${copied === prompt.number ? 'bg-green-100 text-green-700' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'}`}
                  >
                    {copied === prompt.number ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-muted/50 rounded p-3 max-h-[400px] overflow-y-auto leading-relaxed">
{prompt.prompt}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No prompts match your search.</p>
        </div>
      )}
    </div>
  );
}

function VisionStat({ icon: Icon, value, label }) {
  return (
    <div className="bg-white/10 rounded-lg p-3">
      <Icon className="w-5 h-5 text-yellow-400 mb-1" />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function StrategyCard({ icon: Icon, title, desc, color }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}