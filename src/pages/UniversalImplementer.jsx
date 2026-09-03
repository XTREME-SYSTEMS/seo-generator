import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import EmptyState from '@/components/kit/EmptyState';
import { Loader2, Rocket, RefreshCw } from 'lucide-react';

const STEP_TONE = { pending: 'idle', running: 'info', done: 'good', failed: 'bad', skipped: 'idle' };

export default function UniversalImplementer() {
  const [url, setUrl] = useState('');
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);

  async function poll(rid) {
    try {
      const all = await base44.entities.ImplementationStep.filter({ run_id: rid }, 'step_number', 50);
      setSteps(all);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (!runId || !running) return;
    const t = setInterval(() => poll(runId), 3000);
    return () => clearInterval(t);
  }, [runId, running]);

  async function run() {
    setRunning(true); setError(null); setSteps([]);
    try {
      const res = await base44.functions.invoke('UniversalImplementer', { url, business, industry, execute_steps: 6 });
      setRunId(res.run_id);
      await poll(res.run_id);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const done = steps.filter((s) => s.status === 'done').length;
  const failed = steps.filter((s) => s.status === 'failed').length;
  const pending = steps.filter((s) => s.status === 'pending').length;

  return (
    <div>
      <PageHeader
        eyebrow="Universal Autonomous Implementer"
        title="Implement Everything — For Any URL, Business, Industry"
        description="AI builds the perfect step-by-step implementation plan ordered by fastest-greatest impact, then executes it autonomously in the background. Works for any URL, any business, any industry."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Panel title="Target Input">
            <div className="space-y-3">
              <Field label="URL (optional)" value={url} onChange={setUrl} placeholder="https://example.com/" />
              <Field label="Business name (optional)" value={business} onChange={setBusiness} placeholder="Xtreme Polishing Systems" />
              <Field label="Industry (optional)" value={industry} onChange={setIndustry} placeholder="Epoxy Coatings & Flooring" />
              <button onClick={run} disabled={running} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {running ? 'Implementing...' : 'Run Autonomous Implementation'}
              </button>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                The engine loads every applicable capability, ranks them by impact × speed, and executes the top steps now. Remaining steps stay queued for the autonomous loop.
              </p>
            </div>
          </Panel>

          {steps.length > 0 && (
            <Panel title="Run Summary" className="mt-6">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Mini label="Done" value={done} tone="good" />
                <Mini label="Failed" value={failed} tone="bad" />
                <Mini label="Queued" value={pending} tone="idle" />
              </div>
              {runId && (
                <button onClick={() => poll(runId)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              )}
            </Panel>
          )}
        </div>

        <div className="lg:col-span-3">
          <Panel title="Step-by-Step Execution Plan" subtitle={runId ? `run ${runId}` : 'No run yet'}>
            {steps.length === 0 ? (
              <EmptyState title="No steps yet" description="Enter a target and run the implementer to see the autonomous step-by-step plan." />
            ) : (
              <div className="space-y-2">
                {steps.map((s) => (
                  <div key={s.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-medium text-foreground">{s.step_number}</span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{s.capability_name}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{s.category}</span>
                            <span>·</span>
                            <span>impact {Math.round(s.impact_score || 0)}</span>
                            <span>·</span>
                            <span>{s.speed_tier}</span>
                            <span>·</span>
                            <span>{s.delivery}</span>
                          </div>
                        </div>
                      </div>
                      <StatusPill tone={STEP_TONE[s.status]}>{s.status === 'running' ? 'running' : s.status}</StatusPill>
                    </div>
                    {s.result && <p className="mt-2 ml-8 text-[11px] leading-relaxed text-muted-foreground">{s.result}</p>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Mini({ label, value, tone }) {
  const colors = { good: 'text-emerald-600', bad: 'text-rose-600', idle: 'text-muted-foreground' };
  return (
    <div className="rounded-md border border-border py-2">
      <div className={`font-heading text-xl font-semibold ${colors[tone]}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}