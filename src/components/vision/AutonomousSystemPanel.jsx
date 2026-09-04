import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import { useGlobalData } from '@/lib/useTenantData';
import { Play, Brain, RefreshCw, GitMerge, Wrench, Shield, Zap, CheckCircle2, AlertTriangle, Activity, FileText, Cpu } from 'lucide-react';

const ORCHESTRATOR_PHASES = [
  { key: 'audit_dna', label: 'Audit: System DNA', icon: Cpu, fn: 'SystemDNA' },
  { key: 'audit_brain', label: 'Audit: Brain Watch', icon: Brain, fn: 'VisionCortexWatch' },
  { key: 'reflect', label: 'Self-Reflection', icon: Activity, fn: 'SystemSelfReflection' },
  { key: 'discover_capabilities', label: 'Discover Capabilities', icon: Zap, fn: 'DiscoverCapabilities' },
  { key: 'discover_methods', label: 'Discover Methods', icon: Zap, fn: 'GenerateRankingMethods' },
  { key: 'suggest', label: 'Generate Suggestions', icon: FileText, fn: 'AreSuggest' },
  { key: 'implement_capabilities', label: 'Implement Capabilities', icon: Wrench, fn: 'AutonomousSystemImplementer' },
  { key: 'implement_treatments', label: 'Deploy Treatments', icon: Wrench, fn: 'AreImplement' },
  { key: 'validate', label: 'Validate System', icon: CheckCircle2, fn: 'ValidateSystem' },
  { key: 'heal', label: 'Auto-Heal Blocked', icon: Shield, fn: 'FixEngine' },
  { key: 'converge', label: 'Convergence Loop', icon: GitMerge, fn: 'AutonomousConvergence' },
];

const DIRECTIVE_ICONS = {
  auto_fix: Wrench,
  auto_heal: Shield,
  auto_harden: Shield,
  auto_optimize: Zap,
  auto_implement: Wrench,
};

const DIRECTIVE_TONES = {
  auto_fix: 'bad',
  auto_heal: 'warn',
  auto_harden: 'info',
  auto_optimize: 'good',
  auto_implement: 'info',
};

export default function AutonomousSystemPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { data: prompts, isLoading: promptsLoading } = useGlobalData('PromptLibrary', { sortBy: '-impact', limit: 50 });
  const { data: telemetry } = useGlobalData('RunTelemetry', { sortBy: '-started_at', limit: 10 });
  const { data: capabilities } = useGlobalData('Capability', { sortBy: '-impact_score', limit: 200 });
  const { data: reflections } = useGlobalData('ReflectionRecord', { sortBy: '-occurred_at', limit: 5 });

  const readyPrompts = (prompts || []).filter((p) => p.status === 'ready');
  const runPrompts = (prompts || []).filter((p) => p.status === 'run');
  const implementedCaps = (capabilities || []).filter((c) => c.status === 'implemented').length;
  const totalCaps = (capabilities || []).length;
  const capPct = totalCaps > 0 ? Math.round((implementedCaps / totalCaps) * 100) : 0;

  const orchestratorRuns = (telemetry || []).filter((t) => t.run_type === 'vision_cortex_orchestrator');
  const lastRun = orchestratorRuns[0];

  async function runOrchestrator() {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('VisionCortexOrchestrator', {});
      setResult(res?.data || res);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function runSelfReflection() {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('SystemSelfReflection', {});
      setResult(res?.data || res);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const directives = result?.directives || [];

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Panel
        title="Vision Cortex Orchestrator"
        subtitle="The master autonomous brain — runs the entire system from the Prompt Library"
        right={
          <div className="flex items-center gap-2">
            <StatusPill tone={running ? 'warn' : lastRun ? (lastRun.status === 'ok' ? 'good' : 'bad') : 'idle'}>
              {running ? 'RUNNING' : lastRun ? lastRun.status?.toUpperCase() : 'IDLE'}
            </StatusPill>
            <button
              onClick={runOrchestrator}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {running ? 'Running...' : 'Run Full Cycle'}
            </button>
            <button
              onClick={runSelfReflection}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              <Activity className="h-3.5 w-3.5" />
              Self-Reflect
            </button>
          </div>
        }
      >
        {/* System Status Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile icon={FileText} label="Prompt Library" value={`${(prompts || []).length} prompts`} sub={`${readyPrompts.length} ready · ${runPrompts.length} run`} tone="info" />
          <StatTile icon={Wrench} label="Capabilities" value={`${implementedCaps}/${totalCaps}`} sub={`${capPct}% implemented`} tone={capPct >= 80 ? 'good' : capPct >= 50 ? 'warn' : 'bad'} />
          <StatTile icon={GitMerge} label="Orchestrator Runs" value={orchestratorRuns.length} sub={lastRun ? new Date(lastRun.started_at).toLocaleString() : 'never'} tone="idle" />
          <StatTile icon={Activity} label="Last Reflection" value={reflections?.length || 0} sub={reflections?.[0] ? new Date(reflections[0].occurred_at).toLocaleDateString() : 'never'} tone="idle" />
        </div>

        {/* The Autonomous Cycle */}
        <div className="mb-4">
          <h3 className="mb-2 font-heading text-xs font-semibold text-foreground">The Autonomous Cycle (runs every hour via workflow)</h3>
          <div className="flex flex-wrap gap-1.5">
            {ORCHESTRATOR_PHASES.map((phase, i) => {
              const phaseResult = result?.phases?.[phase.key];
              const tone = phaseResult?.ok ? 'good' : phaseResult?.ok === false ? 'bad' : 'idle';
              return (
                <div key={phase.key} className="flex items-center gap-1.5">
                  <div className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-medium ${
                    tone === 'good' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                    tone === 'bad' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>
                    <phase.icon className="h-3 w-3" />
                    {phase.label}
                    {phaseResult?.ok && <CheckCircle2 className="h-3 w-3" />}
                    {phaseResult?.ok === false && <AlertTriangle className="h-3 w-3" />}
                  </div>
                  {i < ORCHESTRATOR_PHASES.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-600">
            <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {/* Last Run Summary */}
        {result && (
          <div className="rounded-md border border-border bg-card p-3">
            <h3 className="mb-2 font-heading text-xs font-semibold text-foreground">
              Last Cycle Result — {result.cycle_id}
            </h3>
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-muted-foreground">Phases:</span> <span className="font-medium text-foreground">{result.phases_succeeded}/{result.phases_run}</span></div>
              <div><span className="text-muted-foreground">Prompts:</span> <span className="font-medium text-foreground">{result.prompts_succeeded}/{result.prompts_run}</span></div>
              <div><span className="text-muted-foreground">Errors:</span> <span className="font-medium text-foreground">{result.errors?.length || 0}</span></div>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.errors.slice(0, 5).map((e, i) => (
                  <div key={i} className="text-[11px] text-red-600">• {e}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Self-Reflection Directives */}
      {directives.length > 0 && (
        <Panel title="Self-Reflection Directives" subtitle="Auto-generated actions from the last self-reflection cycle">
          <div className="space-y-2">
            {directives.map((d, i) => {
              const Icon = DIRECTIVE_ICONS[d.action_type] || Wrench;
              return (
                <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={DIRECTIVE_TONES[d.action_type] || 'idle'}>{d.action_type.replace('_', ' ')}</StatusPill>
                      <span className="font-heading text-xs font-medium text-foreground">{d.target}</span>
                      <StatusPill tone={d.priority === 'critical' ? 'bad' : d.priority === 'high' ? 'warn' : 'idle'}>{d.priority}</StatusPill>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.description}</p>
                    {d.invoke_function && (
                      <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">→ {d.invoke_function}({JSON.stringify(d.payload || {})})</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Prompt Library Summary */}
      <Panel title="Prompt Library — The Command Center" subtitle="The entire system runs from these prompts. Each prompt auto-invokes its backend function.">
        {promptsLoading ? (
          <Loading label="Loading prompts..." />
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {(prompts || []).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5">
                <StatusPill tone={p.status === 'ready' ? 'info' : p.status === 'run' ? 'good' : 'idle'}>{p.status}</StatusPill>
                <StatusPill tone={p.impact === 'critical' ? 'bad' : p.impact === 'high' ? 'warn' : 'idle'}>{p.impact}</StatusPill>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-heading text-xs font-medium text-foreground">{p.title}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{p.intent}</div>
                </div>
                {p.invoke_function && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{p.invoke_function}</span>
                )}
                {p.last_run_at && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(p.last_run_at).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, tone }) {
  const toneClasses = {
    good: 'text-emerald-600',
    info: 'text-sky-600',
    warn: 'text-amber-600',
    bad: 'text-red-600',
    idle: 'text-muted-foreground',
  };
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${toneClasses[tone] || toneClasses.idle}`} />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="font-heading text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}