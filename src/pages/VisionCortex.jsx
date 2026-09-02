import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';
import { base44 } from '@/api/base44Client';

const PRIO_TONE = { critical: 'bad', high: 'warn', medium: 'info', low: 'idle' };
const CAT_LABEL = {
  measurement: 'Measurement', intelligence: 'Intelligence', execution: 'Execution',
  orchestration: 'Orchestration', validation: 'Validation', speed: 'Speed',
  infrastructure: 'Infrastructure', connectors: 'Connectors',
};

export default function VisionCortex() {
  const { rows: gaps, loading } = useGlobalData('SystemGap', '-logged_at');
  const { rows: telemetry } = useGlobalData('RunTelemetry', '-started_at');
  const { rows: tests } = useGlobalData('ValidationTest');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const brainGaps = (gaps || []).filter((g) => (g.notes || '').startsWith('Vision Cortex'));
  const latestWatch = (telemetry || []).find((t) => t.run_type === 'vision_cortex_watch');
  const failing = (tests || []).filter((t) => t.status === 'fail').length;
  const blocked = (tests || []).filter((t) => t.status === 'blocked').length;

  const runWatch = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('VisionCortexWatch', {});
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setRunning(false);
    }
  };

  const display = result?.enhancements || brainGaps.map((g) => ({
    title: (g.gap || '').split(' — ')[0],
    downfall: (g.gap || '').split(' — ').slice(1).join(' — ') || g.gap,
    recommended_enhancement: g.recommendation,
    technical_protocols: [],
    category: g.category,
    priority: g.priority,
    binding_constraint: (g.notes || '').replace('Vision Cortex brain · ', '').split(' · protocols:')[0],
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Vision Cortex"
        title="The Brain — System Watch + Optimization"
        description="The Vision Cortex brain watches the entire SEO Generator system and surfaces the highest-leverage enhancements to reach top-3 rankings. Web-search-grounded, doctrine-compounding, admin-triggered."
        actions={[
          <button key="r" onClick={runWatch} disabled={running}
            className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Watching…' : 'Run Vision Cortex Watch'}
          </button>,
        ]}
      />

      {error && (
        <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <Panel title="Brain enhancements"><div className="text-2xl font-semibold tabular text-foreground">{brainGaps.length}</div></Panel>
        <Panel title="Failing validations"><div className="text-2xl font-semibold tabular text-red-300">{failing}</div></Panel>
        <Panel title="Blocked gates"><div className="text-2xl font-semibold tabular text-amber-300">{blocked}</div></Panel>
        <Panel title="Last watch"><div className="text-xs text-muted-foreground">{latestWatch ? new Date(latestWatch.started_at).toLocaleString() : 'never'}</div></Panel>
      </div>

      {result?.system_assessment && (
        <Panel className="mb-4" title="System assessment" subtitle="The brain's overall read of system state vs the goal">
          <p className="text-sm leading-relaxed text-foreground">{result.system_assessment}</p>
        </Panel>
      )}

      <Panel title="Ranked system enhancements" subtitle="The brain's optimization queue — highest leverage first">
        {running ? (
          <Loading label="Brain scanning system + searching web…" />
        ) : display.length === 0 ? (
          <EmptyState title="No enhancements yet" description="Run the Vision Cortex watch to let the brain analyze the system." />
        ) : (
          <ul className="space-y-3">
            {display.map((e, i) => (
              <li key={i} className="rounded border border-border/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                  <StatusPill tone={PRIO_TONE[e.priority] || 'idle'}>{e.priority}</StatusPill>
                  {e.category && <StatusPill tone="info">{CAT_LABEL[e.category] || e.category}</StatusPill>}
                </div>
                <h3 className="mt-1.5 text-sm font-medium text-foreground">{e.title}</h3>
                {e.downfall && <p className="mt-1 text-xs text-muted-foreground"><span className="text-red-300/80">Downfall:</span> {e.downfall}</p>}
                {e.recommended_enhancement && <p className="mt-1 text-xs text-foreground"><span className="text-emerald-300/80">Fix:</span> {e.recommended_enhancement}</p>}
                {e.binding_constraint && <p className="mt-1 text-xs text-muted-foreground"><span className="text-amber-300/80">Constraint:</span> {e.binding_constraint}</p>}
                {e.technical_protocols?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.technical_protocols.map((p, j) => (
                      <span key={j} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{p}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}