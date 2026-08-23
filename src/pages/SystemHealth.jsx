import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useGlobalData } from '@/lib/useTenantData';

const TONE = { ok: 'good', degraded: 'warn', failed: 'bad', skipped_unauthorized: 'idle' };
const TEST_TONE = { pass: 'good', fail: 'bad', blocked: 'warn' };

export default function SystemHealth() {
  const { rows: telemetry, loading } = useGlobalData('RunTelemetry', '-started_at');
  const { rows: tests } = useGlobalData('ValidationTest');
  const passing = tests.filter((t) => t.status === 'pass').length;
  const blocked = tests.filter((t) => t.status === 'blocked').length;
  const failed = tests.filter((t) => t.status === 'fail').length;

  return (
    <div>
      <PageHeader eyebrow="System Health" title="Telemetry + validation"
        description="Canonical run telemetry across system, search, model, experiment and financial domains. The validation suite is the forensic audit spine; CRACKED_CODE_CONFIRMED is a permanent empirical gate." />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Panel title="Validation pass"><div className="text-2xl font-semibold tabular text-emerald-300">{passing}<span className="text-sm text-muted-foreground"> / {tests.length}</span></div></Panel>
        <Panel title="Blocked (permanent gates)"><div className="text-2xl font-semibold tabular text-amber-300">{blocked}</div></Panel>
        <Panel title="Failing"><div className="text-2xl font-semibold tabular text-red-300">{failed}</div></Panel>
      </div>
      <Panel title="Validation suite" subtitle="Forensic audit tests">
        {tests.length === 0 ? <EmptyState title="No tests" /> : (
          <ul className="space-y-2">
            {tests.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 rounded border border-border/60 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><span className="font-mono text-[10px] uppercase text-muted-foreground">{t.suite}</span><StatusPill tone={TEST_TONE[t.status]}>{t.status}</StatusPill></div>
                  <div className="mt-1 text-sm text-foreground">{t.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel className="mt-4" title="Run telemetry" subtitle="Recent runs across subsystems">
        {loading ? <Loading /> : telemetry.length === 0 ? <EmptyState title="No telemetry" /> : (
          <ul className="space-y-2">
            {telemetry.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded border border-border/60 px-3 py-2">
                <div className="min-w-0"><span className="truncate text-xs text-foreground">{t.run_type}</span><span className="ml-2 font-mono text-[10px] text-muted-foreground">{t.subsystem}</span></div>
                <div className="flex shrink-0 items-center gap-2"><span className="truncate text-xs text-muted-foreground">{t.message}</span><StatusPill tone={TONE[t.status]}>{t.status}</StatusPill></div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}