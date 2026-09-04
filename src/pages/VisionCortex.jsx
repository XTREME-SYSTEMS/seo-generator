import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import {
  RefreshCw, Brain, Dna, GitMerge, Bot, Globe, Crosshair, Zap, Activity,
  AlertTriangle, CheckCircle2, TrendingUp, Cpu, Network, Eye,
} from 'lucide-react';

// ── The SEO Agent Council (ported from Vision Cortex + Fault Line, adapted for SEO) ──
const AGENT_COUNCIL = [
  { name: 'Commander', icon: Cpu, role: 'Orchestrates the entire autonomous loop. Decides what to run next based on convergence state.', color: 'text-primary', status: 'active' },
  { name: 'Scout', icon: Eye, role: 'Crawls the internet for new ranking methods, competitor moves, and algorithm changes. The eyes of the system.', color: 'text-blue-500', status: 'active' },
  { name: 'Architect', icon: Brain, role: 'Designs the strategy for each URL. Decides which methods to deploy, in what order, against the SERP Digital Twin.', color: 'text-violet-500', status: 'active' },
  { name: 'Builder', icon: Network, role: 'Executes the plan. Uses CloudBrowser to sign up to directories, create citations, generate content, and deploy treatments.', color: 'text-emerald-500', status: 'active' },
  { name: 'Healer', icon: Zap, role: 'Auto-fixes anything that breaks. When a row is blocked, the healer diagnoses the binding constraint and generates a fix.', color: 'text-amber-500', status: 'active' },
  { name: 'Sentinel', icon: AlertTriangle, role: 'Monitors for regressions, algorithm changes, and competitor moves. Alerts the council when action is needed.', color: 'text-rose-500', status: 'active' },
  { name: 'Validator', icon: CheckCircle2, role: 'Validates outcomes. Correlates deployed treatments with measured GSC deltas. Promotes or demotes methods.', color: 'text-cyan-500', status: 'active' },
  { name: 'Reporter', icon: Activity, role: 'Generates the daily results dashboard. Proves the system is working with measured data.', color: 'text-indigo-500', status: 'active' },
];

const DIMENSIONS = [
  { key: 'measurement', label: 'Measurement', desc: 'Rank tracking, GSC, GA4, SERP API' },
  { key: 'intelligence', label: 'Intelligence', desc: 'Method discovery, competitor analysis' },
  { key: 'execution', label: 'Execution', desc: 'CloudBrowser, content, citations' },
  { key: 'orchestration', label: 'Orchestration', desc: 'ARE loop, convergence, council' },
  { key: 'validation', label: 'Validation', desc: 'Reflection, attribution, proof' },
  { key: 'autonomy', label: 'Autonomy', desc: 'Non-stop workflows, self-healing' },
];

export default function VisionCortex() {
  const { rows: gaps, loading: gapsLoading } = useGlobalData('SystemGap', '-logged_at');
  const { rows: telemetry } = useGlobalData('RunTelemetry', '-started_at');
  const { rows: tests } = useGlobalData('ValidationTest');
  const [tab, setTab] = useState('council');
  const [running, setRunning] = useState(null);
  const [dnaResult, setDnaResult] = useState(null);
  const [convergenceResult, setConvergenceResult] = useState(null);
  const [error, setError] = useState(null);

  const brainGaps = useMemo(() => (gaps || []).filter((g) => (g.notes || '').includes('Vision Cortex') || (g.notes || '').includes('System DNA')), [gaps]);
  const latestWatch = useMemo(() => (telemetry || []).find((t) => t.run_type === 'vision_cortex_watch'), [telemetry]);
  const latestDNA = useMemo(() => (telemetry || []).find((t) => t.run_type === 'system_dna'), [telemetry]);
  const latestConvergence = useMemo(() => (telemetry || []).find((t) => t.run_type === 'autonomous_convergence'), [telemetry]);
  const failing = (tests || []).filter((t) => t.status === 'fail').length;
  const blocked = (tests || []).filter((t) => t.status === 'blocked').length;

  async function runFunction(name, payload, setResultKey) {
    setRunning(name);
    setError(null);
    try {
      const res = await base44.functions.invoke(name, payload || {});
      if (setResultKey === 'dna') setDnaResult(res.data);
      if (setResultKey === 'convergence') setConvergenceResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setRunning(null);
    }
  }

  const display = dnaResult?.enhancements || brainGaps.map((g) => ({
    title: (g.gap || '').split(' — ')[0],
    downfall: (g.gap || '').split(' — ').slice(1).join(' — ') || g.gap,
    recommended_enhancement: g.recommendation,
    category: g.category,
    priority: g.priority,
    binding_constraint: (g.notes || '').split(' · ')[1] || '',
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Vision Cortex — The Brain"
        title="Autonomous Intelligence, Self-Healing & Convergence"
        description="The SEO Generator's central brain. A council of 8 specialist agents, a System DNA self-analysis engine, and a non-stop convergence loop — all working together to drive every URL to top-5 without human input. Integrated with CloudBrowser for autonomous web action."
        actions={[
          <button key="dna" onClick={() => runFunction('SystemDNA', {}, 'dna')} disabled={!!running}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50">
            <Dna className={`h-3.5 w-3.5 ${running === 'SystemDNA' ? 'animate-spin' : ''}`} />
            Run DNA Analysis
          </button>,
          <button key="conv" onClick={() => runFunction('AutonomousConvergence', { max_iterations: 5 }, 'convergence')} disabled={!!running}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <GitMerge className={`h-3.5 w-3.5 ${running === 'AutonomousConvergence' ? 'animate-spin' : ''}`} />
            Run Convergence Loop
          </button>,
        ]}
      />

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Brain} label="Brain Enhancements" value={brainGaps.length} tone="info" />
        <StatTile icon={AlertTriangle} label="Failing Validations" value={failing} tone="bad" />
        <StatTile icon={AlertTriangle} label="Blocked Gates" value={blocked} tone="warn" />
        <StatTile icon={Dna} label="DNA Score" value={dnaResult?.dna_score != null ? `${dnaResult.dna_score}/100` : '—'} tone={dnaResult?.dna_score >= 70 ? 'good' : 'warn'} />
        <StatTile icon={GitMerge} label="Convergence" value={convergenceResult?.final_convergence_pct != null ? `${convergenceResult.final_convergence_pct}%` : '—'} tone={convergenceResult?.converged ? 'good' : 'warn'} />
        <StatTile icon={Activity} label="Last Brain Run" value={latestWatch ? new Date(latestWatch.started_at).toLocaleDateString() : 'never'} tone="idle" />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {[
          ['council', 'Agent Council', Bot],
          ['dna', 'System DNA', Dna],
          ['convergence', 'Convergence Engine', GitMerge],
          ['cloudbrowser', 'CloudBrowser Integration', Globe],
          ['enhancements', 'Enhancement Queue', Brain],
        ].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Agent Council */}
      {tab === 'council' && (
        <Panel title="The SEO Agent Council" subtitle="8 specialist agents working together — ported from Vision Cortex + Fault Line, redesigned for autonomous SEO">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AGENT_COUNCIL.map((agent) => (
              <div key={agent.name} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-md bg-muted ${agent.color}`}>
                    <agent.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-heading text-sm font-semibold text-foreground">{agent.name}</div>
                    <StatusPill tone="good">{agent.status}</StatusPill>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{agent.role}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-4">
            <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">How the Council Works with CloudBrowser</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The <span className="font-medium text-foreground">Scout</span> discovers opportunities → the <span className="font-medium text-foreground">Architect</span> designs the strategy → the <span className="font-medium text-foreground">Builder</span> uses CloudBrowser to execute (sign up to directories, create citations, generate content, deploy treatments) → the <span className="font-medium text-foreground">Validator</span> measures the outcome → the <span className="font-medium text-foreground">Healer</span> fixes anything that broke → the <span className="font-medium text-foreground">Sentinel</span> watches for regressions → the <span className="font-medium text-foreground">Reporter</span> logs the proof. The <span className="font-medium text-foreground">Commander</span> orchestrates the loop non-stop.
            </p>
          </div>
        </Panel>
      )}

      {/* System DNA */}
      {tab === 'dna' && (
        <div className="space-y-4">
          <Panel title="System DNA — Self-Analysis" subtitle="The system scores itself across 6 dimensions, finds the weakest, and generates a targeted enhancement">
            {running === 'SystemDNA' ? (
              <Loading label="Analyzing system DNA..." />
            ) : dnaResult ? (
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20">
                    <span className="font-heading text-2xl font-bold text-primary">{dnaResult.dna_score}</span>
                  </div>
                  <div>
                    <div className="font-heading text-sm font-semibold text-foreground">Overall DNA Score</div>
                    <p className="text-xs text-muted-foreground">Weakest dimension: <span className="font-medium text-foreground">{dnaResult.weakest?.key}</span> ({dnaResult.weakest?.score}/100)</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {dnaResult.dimensions?.map((d) => (
                    <div key={d.key} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-medium text-foreground">{d.label}</span>
                        <span className={`font-mono text-sm font-bold ${d.score >= 70 ? 'text-emerald-600' : d.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>{d.score}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${d.score >= 70 ? 'bg-emerald-500' : d.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${d.score}%` }} />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">{d.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No DNA analysis yet" description="Run the DNA analysis to score the system and find its weakest dimension." icon={Dna} />
            )}
          </Panel>

          {dnaResult?.enhancement && (
            <Panel title="Recommended Enhancement" subtitle={`Targeting weakest dimension: ${dnaResult.weakest?.key}`}>
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                <h3 className="font-heading text-sm font-semibold text-foreground">{dnaResult.enhancement.enhancement_title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{dnaResult.enhancement.enhancement_description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="info">function: {dnaResult.enhancement.implementation_function}</StatusPill>
                  {dnaResult.enhancement.expected_score_increase > 0 && <StatusPill tone="good">+{dnaResult.enhancement.expected_score_increase} score</StatusPill>}
                </div>
                {dnaResult.enhancement.binding_constraint && (
                  <p className="mt-2 text-xs text-muted-foreground"><span className="text-amber-600">Binding constraint:</span> {dnaResult.enhancement.binding_constraint}</p>
                )}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* Convergence Engine */}
      {tab === 'convergence' && (
        <Panel title="Autonomous Convergence Engine" subtitle="Runs non-stop until every URL reaches top-5. Ported from Fault Line's continuousConvergenceEngine.">
          {running === 'AutonomousConvergence' ? (
            <Loading label="Running convergence loop — deploying treatments and measuring..." />
          ) : convergenceResult ? (
            <div>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile icon={Activity} label="Iterations" value={convergenceResult.iterations} tone="info" />
                <StatTile icon={GitMerge} label="Converged" value={convergenceResult.converged ? 'YES' : 'NO'} tone={convergenceResult.converged ? 'good' : 'warn'} />
                <StatTile icon={TrendingUp} label="Top-5 URLs" value={`${convergenceResult.final_top_rank_urls}/${convergenceResult.total_urls}`} tone="good" />
                <StatTile icon={CheckCircle2} label="Convergence" value={`${convergenceResult.final_convergence_pct}%`} tone={convergenceResult.final_convergence_pct >= 100 ? 'good' : 'warn'} />
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <h3 className="mb-2 font-heading text-xs font-semibold text-foreground">Proof Log (immutable convergence evidence)</h3>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {(convergenceResult.proof_log || []).map((entry, i) => (
                    <div key={i} className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">#{entry.iteration}</span>
                        <StatusPill tone={entry.status === 'ok' ? 'good' : 'bad'}>{entry.phase}</StatusPill>
                        {entry.function_invoked && <span className="font-mono text-[10px] text-muted-foreground">{entry.function_invoked}</span>}
                        {entry.score_delta !== 0 && <span className={`font-mono text-[10px] ${entry.score_delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{entry.score_delta > 0 ? '+' : ''}{entry.score_delta}%</span>}
                      </div>
                      <p className="mt-1 text-xs text-foreground">{entry.action_taken}</p>
                      {entry.error_message && <p className="mt-0.5 text-[11px] text-rose-600">Error: {entry.error_message}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No convergence runs yet" description="Run the convergence loop to start the non-stop autonomous optimization." icon={GitMerge} />
          )}
        </Panel>
      )}

      {/* CloudBrowser Integration */}
      {tab === 'cloudbrowser' && (
        <Panel title="CloudBrowser Integration" subtitle="How the agent council uses the browser fleet for autonomous web action">
          <div className="space-y-3">
            {[
              { agent: 'Scout', action: 'Scrape SERPs, monitor competitors, research ranking methods', tools: ['browser_navigate', 'browser_extract', 'browser_screenshot'] },
              { agent: 'Builder', action: 'Sign up to directories, create citations, post to social media, manage Google Business Profile', tools: ['browser_start', 'browser_act', 'browser_fill', 'solve_captcha', 'save_state'] },
              { agent: 'Healer', action: 'Diagnose blocked rows by browsing the live site and checking for technical issues', tools: ['browser_navigate', 'browser_extract', 'browser_evaluate'] },
              { agent: 'Validator', action: 'Verify citations are live, check backlink status, confirm content deployment', tools: ['browser_navigate', 'browser_extract', 'browser_screenshot'] },
              { agent: 'Sentinel', action: 'Monitor review sites, social platforms, and competitor sites for changes', tools: ['browser_navigate', 'browser_extract', 'browser_paginate'] },
            ].map((row, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-medium text-foreground">{row.agent}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs text-muted-foreground">{row.action}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.tools.map((t) => (
                    <span key={t} className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Enhancement Queue */}
      {tab === 'enhancements' && (
        <Panel title="Ranked System Enhancements" subtitle="The brain's optimization queue — highest leverage first">
          {gapsLoading ? (
            <Loading label="Loading enhancements..." />
          ) : display.length === 0 ? (
            <EmptyState title="No enhancements yet" description="Run the DNA analysis or Vision Cortex watch to let the brain analyze the system." icon={Brain} />
          ) : (
            <ul className="space-y-3">
              {display.map((e, i) => (
                <li key={i} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                    <StatusPill tone={e.priority === 'critical' ? 'bad' : e.priority === 'high' ? 'warn' : 'info'}>{e.priority}</StatusPill>
                    {e.category && <StatusPill tone="info">{e.category}</StatusPill>}
                  </div>
                  <h3 className="mt-1.5 font-heading text-sm font-medium text-foreground">{e.title}</h3>
                  {e.downfall && <p className="mt-1 text-xs text-muted-foreground"><span className="text-rose-600">Downfall:</span> {e.downfall}</p>}
                  {e.recommended_enhancement && <p className="mt-1 text-xs text-foreground"><span className="text-emerald-600">Fix:</span> {e.recommended_enhancement}</p>}
                  {e.binding_constraint && <p className="mt-1 text-xs text-muted-foreground"><span className="text-amber-600">Constraint:</span> {e.binding_constraint}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }) {
  const colors = { good: 'text-emerald-600', info: 'text-blue-600', warn: 'text-amber-600', bad: 'text-rose-600', idle: 'text-muted-foreground' };
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colors[tone]}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`font-heading text-xl font-semibold ${colors[tone]}`}>{value}</div>
    </div>
  );
}