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
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /> The Vision — Deep Architecture</h2>
        <p className="text-sm leading-relaxed text-gray-200 max-w-4xl">
          A <strong className="text-yellow-400">deep architecture</strong> system programmatically created according to <strong className="text-yellow-400">100% of Google's specifications</strong>. It generates <strong className="text-yellow-400">1,000+ unique web pages per day</strong> — each strategically designed to reach Google's top 5 as fast as technologically possible. It operates <strong className="text-yellow-400">fully autonomously, 24/7</strong>, setting its own ranking goals and achieving them without human intervention. Every page is born Google-compliant (E-E-A-T, Helpful Content, Core Web Vitals, structured data) — not made compliant after the fact. The CloudBrowser swarm simultaneously floods every directory, review platform, and social network with the business's information. The result: total digital dominance, automated and permanent.
        </p>
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <VisionStat icon={Layers} value="1,000+" label="Pages / Day" />
          <VisionStat icon={Shield} value="100%" label="Google Compliant" />
          <VisionStat icon={Bot} value="24/7" label="Autonomous" />
          <VisionStat icon={Target} value="Top 5" label="Ranking Goal" />
          <VisionStat icon={Bot} value="Swarm" label="CloudBrowser" />
          <VisionStat icon={FileText} value={`${TOTAL_PROMPTS}`} label="Prompts" />
        </div>
      </div>

      {/* Strategy */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StrategyCard icon={Shield} title="1. Deep Architecture" desc="8-layer system: Data, Intelligence, Generation, Deployment, Indexing, Ranking, Autonomy, Compliance. Every layer enforces Google specs as a generation constraint, not a post-check." color="text-green-600" />
        <StrategyCard icon={Layers} title="2. Mass Generation" desc="1,000+ unique pages/day via keyword×location matrix. 10+ page templates, content uniqueness engine, anti-thin-content rules. IndexNow + sitemap + GSC for instant indexing." color="text-blue-600" />
        <StrategyCard icon={Bot} title="3. Autonomous 24/7" desc="Self-healing worker pool, 5-minute generation loop, checkpoint/resume, zero human intervention. Sets goals, tracks progress, adjusts strategy, achieves rankings." color="text-purple-600" />
        <StrategyCard icon={TrendingUp} title="4. Goal Achievement" desc="System defines ranking goals (top 5 for keyword X in Y days), measures daily, adjusts strategy, and achieves them. Learns from results, escalates on failure, expands on success." color="text-yellow-600" />
      </div>

      {/* Google Compliance Pillars */}
      <div className="bg-card border border-border rounded-lg p-4 mb-8">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-green-600" /> Google Specification Compliance — Enforced at Generation</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {['E-E-A-T (Experience, Expertise, Authority, Trust)', 'Helpful Content Guidelines', 'Core Web Vitals (LCP, INP, CLS)', 'Mobile-First Indexing', 'Structured Data (JSON-LD)', 'Canonicalization', 'Sitemap & Robots.txt', 'Page Experience Signals', 'Spam Policies (no doorway pages)', 'AI Content Guidelines', 'Local SEO (GBP, NAP)', 'Link Spam Policies'].map(spec => (
            <div key={spec} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1.5">{spec}</div>
          ))}
        </div>
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