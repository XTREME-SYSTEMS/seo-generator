import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import { Dna, Lightbulb, FlaskConical, Brain, Zap, Sparkles, TrendingUp, Target, Eye, Rocket, CheckCircle2, AlertCircle, ArrowUpRight, GitBranch } from 'lucide-react';

const VISION_TEXT = `Move any URL to Google's first-page top 5 as fast as technologically possible, then hold it there — autonomously, 24/7, with zero human input. The system discovers every ranking method in existence, researches each one, tests it in a simulated SERP, validates the outcome, perfects the implementation, and deploys it to production. It learns from every cycle, grows its knowledge base, and continuously evolves new strategies. The goal: organic parity with paid advertising — without paying Google.`;

const STRATEGY_PHASES = [
  { num: 1, name: 'DISCOVER', desc: 'Find every ranking method in existence', icon: Eye },
  { num: 2, name: 'RESEARCH', desc: 'Deep-dive each method, classify by Google signal', icon: Brain },
  { num: 3, name: 'TEST', desc: 'Deploy candidates into the SERP Digital Twin', icon: FlaskConical },
  { num: 4, name: 'VALIDATE', desc: 'Measure GSC delta, promote or demote', icon: CheckCircle2 },
  { num: 5, name: 'PERFECT', desc: 'Optimize implementation, build sprint plan', icon: Zap },
  { num: 6, name: 'ACHIEVE', desc: 'Execute the sprint, drive to top 5', icon: Target },
  { num: 7, name: 'EVOLVE', desc: 'Learn, grow, find new and improved ways', icon: Dna },
];

const AUTONOMOUS_FUNCTIONS = [
  { name: 'EvolutionEngine', desc: 'Learn-and-grow brain', icon: Dna, schedule: 'Every 4h' },
  { name: 'AutonomousConvergence', desc: 'Drive URLs to top-5', icon: Target, schedule: 'Every 15min' },
  { name: 'SystemDNA', desc: 'Self-analysis & healing', icon: Brain, schedule: 'Every 15min' },
  { name: 'VisionCortexWatch', desc: 'Surface enhancements', icon: Eye, schedule: 'Every 15min' },
  { name: 'SystemSelfReflection', desc: 'Compare state vs vision', icon: Sparkles, schedule: 'Every 1h' },
  { name: 'AnomalyDetection', desc: 'Detect traffic drops', icon: AlertCircle, schedule: 'Every 4h' },
  { name: 'CompetitorWatchdog', desc: 'Monitor competitors', icon: Eye, schedule: 'Every 6h' },
  { name: 'BacklinkTracker', desc: 'Monitor link velocity', icon: GitBranch, schedule: 'Every 12h' },
  { name: 'CoreWebVitalsMonitor', desc: 'Track page speed', icon: Zap, schedule: 'Every 6h' },
  { name: 'InternalLinkOptimizer', desc: 'Optimize link graph', icon: GitBranch, schedule: 'Every 12h' },
  { name: 'SchemaValidator', desc: 'Validate schema markup', icon: CheckCircle2, schedule: 'Every 8h' },
  { name: 'ABTestRunner', desc: 'A/B test in twin', icon: FlaskConical, schedule: 'Every 6h' },
  { name: 'PredictiveRankingModel', desc: 'Predict top-5 trajectory', icon: TrendingUp, schedule: 'Every 12h' },
  { name: 'AutoHealingEscalation', desc: 'Escalate failed fixes', icon: Zap, schedule: 'Every 2h' },
  { name: 'ContentGenerator', desc: 'Generate meta/schema/copy', icon: Lightbulb, schedule: 'Every 3h' },
  { name: 'AISearchVisibility', desc: 'Track AI search presence', icon: Sparkles, schedule: 'Every 4h' },
  { name: 'GoogleBusinessProfileSync', desc: 'Generate GBP content', icon: Target, schedule: 'Daily' },
  { name: 'MultiPlatformSocialSync', desc: 'Generate social content', icon: Zap, schedule: 'Every 12h' },
  { name: 'CrossDomainAuthorityBuilder', desc: 'Cross-link owned domains', icon: GitBranch, schedule: 'Daily' },
  { name: 'WeeklyDigest', desc: 'Email performance report', icon: CheckCircle2, schedule: 'Weekly' },
];

const TABS = [
  { id: 'engine', label: 'Evolution Engine', icon: Dna },
  { id: 'ideas', label: 'Ideas Lab', icon: Lightbulb },
  { id: 'simulations', label: 'Simulations', icon: FlaskConical },
  { id: 'intelligence', label: 'System Intelligence', icon: Brain },
];

export default function UltimateVision() {
  const [tab, setTab] = useState('engine');
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [mutations, setMutulations] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [ideaData, mutData, teleData, capData, reflData] = await Promise.all([
        base44.entities.EvolutionIdea.list('-created_at', 50).catch(() => []),
        base44.entities.TwinMutation.list('-created_at', 30).catch(() => []),
        base44.entities.RunTelemetry.list('-started_at', 30).catch(() => []),
        base44.entities.Capability.list('-impact_score', 100).catch(() => []),
        base44.entities.ReflectionRecord.list('-occurred_at', 10).catch(() => []),
      ]);
      setIdeas(ideaData || []);
      setMutulations(mutData || []);
      setTelemetry(teleData || []);
      setCapabilities(capData || []);
      setReflections(reflData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function runEvolution() {
    setRunning(true);
    try {
      const res = await base44.functions.invoke('EvolutionEngine', { idea_count: 5 });
      setLastResult(res);
      await loadData();
    } catch (e) {
      console.error(e);
      setLastResult({ error: e.message });
    } finally {
      setRunning(false);
    }
  }

  const promotedIdeas = ideas.filter((i) => i.status === 'promoted');
  const testedIdeas = ideas.filter((i) => i.status === 'tested');
  const avgImpact = ideas.length > 0 ? Math.round(ideas.reduce((s, i) => s + (i.simulated_impact_score || 0), 0) / ideas.length) : 0;
  const implementedCaps = capabilities.filter((c) => c.status === 'implemented').length;

  return (
    <div>
      <PageHeader
        eyebrow="Autonomous Evolution System"
        title="Ultimate Vision"
        description="The fully integrated Vision Cortex that learns, grows, and continuously finds new and improved ways to dominate search. It generates ideas, simulates them, scores them, and promotes winners — all autonomously."
        actions={
          <button
            onClick={runEvolution}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {running ? <Loading label="Evolving..." /> : <><Zap className="h-3.5 w-3.5" />Run Evolution Cycle</>}
          </button>
        }
      />

      {/* ── VISION HERO ── */}
      <Panel title="The Ultimate Vision" subtitle="What the system is built to achieve" className="mb-4">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-foreground">{VISION_TEXT}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Ideas Generated</div>
              <div className="mt-1 font-heading text-xl font-semibold text-foreground">{ideas.length}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Ideas Promoted</div>
              <div className="mt-1 font-heading text-xl font-semibold text-foreground">{promotedIdeas.length}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Avg Impact Score</div>
              <div className="mt-1 font-heading text-xl font-semibold text-foreground">{avgImpact}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Capabilities Live</div>
              <div className="mt-1 font-heading text-xl font-semibold text-foreground">{implementedCaps}</div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── STRATEGY PHASES ── */}
      <Panel title="The 7-Phase Strategy" subtitle="From discovery to evolution — the autonomous loop" className="mb-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {STRATEGY_PHASES.map((phase) => (
            <div key={phase.num} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <phase.icon className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] text-muted-foreground">PHASE {phase.num}</span>
              </div>
              <div className="mt-1.5 font-heading text-xs font-semibold text-foreground">{phase.name}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{phase.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── TABS ── */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      {tab === 'engine' && (
        <div className="space-y-4">
          {lastResult && !lastResult.error && (
            <>
              <Panel title="Latest Evolution Cycle Results" subtitle={`Generated ${lastResult.ideas_generated || 0} ideas, promoted ${lastResult.ideas_promoted || 0}`}>
                <div className="space-y-4">
                  {lastResult.biggest_opportunity && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-primary">Biggest Opportunity</div>
                      <div className="mt-1 text-sm text-foreground">{lastResult.biggest_opportunity}</div>
                    </div>
                  )}
                  {lastResult.patterns?.length > 0 && (
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Patterns Detected</div>
                      <ul className="space-y-1">
                        {lastResult.patterns.map((p, i) => (
                          <li key={i} className="flex gap-2 text-xs text-foreground">
                            <span className="text-primary">→</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastResult.knowledge_gained?.length > 0 && (
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Knowledge Gained</div>
                      <ul className="space-y-1">
                        {lastResult.knowledge_gained.map((k, i) => (
                          <li key={i} className="flex gap-2 text-xs text-foreground">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />{k}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lastResult.ideas?.length > 0 && (
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">New Ideas</div>
                      <div className="space-y-2">
                        {lastResult.ideas.map((idea, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md border border-border bg-background p-2.5">
                            <div className="min-w-0">
                              <div className="truncate text-xs font-medium text-foreground">{idea.title}</div>
                              <div className="text-[11px] text-muted-foreground">{idea.category}</div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">{idea.impact_score}</span>
                              {idea.status === 'promoted' && <StatusPill tone="good">Promoted</StatusPill>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </>
          )}
          {lastResult?.error && (
            <Panel title="Error"><div className="text-sm text-destructive">{lastResult.error}</div></Panel>
          )}
          {!lastResult && !loading && (
            <Panel title="Evolution Engine" subtitle="The learn-and-grow brain">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Dna className="mb-3 h-10 w-10 text-primary" />
                <p className="font-heading text-sm font-medium text-foreground">Run an Evolution Cycle to begin</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  The engine will gather system state, reflect on patterns, generate novel ideas, simulate each one, score by impact/risk, and promote winners to capabilities.
                </p>
              </div>
            </Panel>
          )}
          {reflections.length > 0 && (
            <Panel title="Recent Reflections" subtitle="What the system has learned">
              <div className="space-y-2">
                {reflections.slice(0, 5).map((r, i) => (
                  <div key={i} className="rounded-md border border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.phase}</span>
                      <StatusPill tone={r.validation_status === 'pass' ? 'good' : r.validation_status === 'fail' ? 'bad' : 'idle'}>{r.validation_status}</StatusPill>
                    </div>
                    {r.deployed && <div className="mt-1 text-xs text-foreground">{r.deployed}</div>}
                    {r.measured && <div className="mt-0.5 text-[11px] text-muted-foreground">{r.measured.slice(0, 200)}</div>}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {tab === 'ideas' && (
        <Panel title="Ideas Lab" subtitle="All ideas generated by the Evolution Engine — simulated, scored, and ranked" right={<StatusPill tone="info">{ideas.length} ideas</StatusPill>}>
          {loading ? <Loading label="Loading ideas..." /> : ideas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="mb-3 h-10 w-10 text-primary" />
              <p className="font-heading text-sm font-medium text-foreground">No ideas yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Run an Evolution Cycle to generate ideas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div key={idea.id} className="rounded-md border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{idea.title}</span>
                        <StatusPill tone={
                          idea.status === 'promoted' ? 'good' :
                          idea.status === 'tested' ? 'info' :
                          idea.status === 'rejected' ? 'bad' : 'idle'
                        }>{idea.status}</StatusPill>
                      </div>
                      {idea.description && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{idea.description}</p>}
                      {idea.implementation_plan && <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">{idea.implementation_plan.slice(0, 150)}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">IMPACT</span>
                        <span className="text-sm font-semibold text-foreground">{idea.simulated_impact_score || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">RISK</span>
                        <span className="text-xs text-foreground">{idea.simulated_risk_score || 0}</span>
                      </div>
                      {idea.simulated_ranking_delta > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-500">
                          <ArrowUpRight className="h-3 w-3" />+{idea.simulated_ranking_delta} pos
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'simulations' && (
        <Panel title="Twin Simulations" subtitle="A/B test results from the SERP Digital Twin" right={<StatusPill tone="sim">{mutations.length} mutations</StatusPill>}>
          {loading ? <Loading label="Loading simulations..." /> : mutations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FlaskConical className="mb-3 h-10 w-10 text-primary" />
              <p className="font-heading text-sm font-medium text-foreground">No simulations yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Run the A/B Test Runner to simulate treatment variants.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mutations.map((mut) => (
                <div key={mut.id} className="flex items-center justify-between rounded-md border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">{mut.url}</div>
                    <div className="text-[11px] text-muted-foreground">{mut.query || 'n/a'}</div>
                    <div className="mt-0.5 flex gap-1">
                      {(mut.modules || []).slice(0, 3).map((m, i) => (
                        <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{m}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-[10px] text-muted-foreground">PRED RANK</div>
                      <div className="text-sm font-semibold text-foreground">{mut.predicted_rank?.toFixed(1) || '—'}</div>
                    </div>
                    {mut.is_winner && <StatusPill tone="good">Winner</StatusPill>}
                    {mut.deployed && <StatusPill tone="info">Deployed</StatusPill>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'intelligence' && (
        <div className="space-y-4">
          <Panel title="Autonomous Function Fleet" subtitle={`${AUTONOMOUS_FUNCTIONS.length} scheduled functions running 24/7`} right={<StatusPill tone="good"><Rocket className="mr-1 h-3 w-3" />All Active</StatusPill>}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {AUTONOMOUS_FUNCTIONS.map((fn) => (
                <div key={fn.name} className="flex items-start gap-2.5 rounded-md border border-border bg-background p-3">
                  <fn.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">{fn.name}</div>
                    <div className="text-[11px] text-muted-foreground">{fn.desc}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">{fn.schedule}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Telemetry" subtitle="Last 30 autonomous runs">
            {loading ? <Loading label="Loading telemetry..." /> : telemetry.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No telemetry yet.</div>
            ) : (
              <div className="space-y-1.5">
                {telemetry.slice(0, 15).map((t, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground">{t.run_type}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground">{t.message?.slice(0, 80)}</span>
                    </div>
                    <StatusPill tone={t.status === 'ok' ? 'good' : t.status === 'error' ? 'bad' : 'warn'}>{t.status}</StatusPill>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}