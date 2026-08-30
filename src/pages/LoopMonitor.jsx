import React, { useMemo, useState } from 'react';
import { Activity, Loader2, ShieldCheck, RotateCcw } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatCard from '@/components/kit/StatCard';
import EmptyState from '@/components/kit/EmptyState';
import Loading from '@/components/kit/Loading';
import StatusPill from '@/components/kit/StatusPill';
import FilterChips from '@/components/are/FilterChips';
import SuggestionLightbulb from '@/components/are/SuggestionLightbulb';
import { Table, Row, Cell } from '@/components/kit/Table';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';

const VALIDATION_TONE = { pass: 'good', fail: 'bad', pending: 'info', not_applicable: 'idle' };
const FIX_TONE = { hardened: 'good', fixed: 'info', rolled_back: 'warn', unresolved: 'bad', none: 'idle' };

export default function LoopMonitor() {
  const { clientId } = useTenant();
  const { rows, loading, reload } = useTenantData('ReflectionRecord', {}, '-occurred_at');
  const { rows: snapshots } = useTenantData('ModelSnapshot', { is_last_known_good: true }, '-captured_at');
  const { rows: sheet } = useTenantData('AreSheetRow', {}, '-priority_score');
  const [phase, setPhase] = useState('');
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => rows.filter((r) => !phase || r.phase === phase), [rows, phase]);

  const passed = rows.filter((r) => r.validation_status === 'pass').length;
  const failed = rows.filter((r) => r.validation_status === 'fail').length;
  const rollbacks = rows.filter((r) => r.auto_fix_result === 'rolled_back').length;
  const blocked = sheet.filter((r) => r.status === 'blocked');

  const runAudit = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('AreAudit', { client_id: clientId });
      reload();
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Self-reflection layer"
        title="Loop Monitor"
        description="Every cycle writes what it deployed, what it expected, what it measured, and whether the guidelines passed. Failures are auto-fixed, hardened, or rolled back to the last known good state."
        actions={(
          <Button variant="outline" size="sm" onClick={runAudit} disabled={busy || !clientId}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
            Run audit now
          </Button>
        )}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Validations passed" value={passed} provenance="MEASURED" />
        <StatCard label="Validations failed" value={failed} provenance="MEASURED" />
        <StatCard label="Rollbacks" value={rollbacks} provenance="MEASURED" hint="restored to last known good" />
        <StatCard label="Known-good snapshots" value={snapshots.length} provenance="MEASURED" />
      </div>

      {blocked.length > 0 && (
        <Panel title="Documented binding constraints" subtitle="The loop keeps working every other query — these are physics, not silent stops" className="mb-6">
          <ul className="space-y-2.5">
            {blocked.slice(0, 12).map((r) => (
              <li key={r.id} className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                <p className="truncate text-xs font-medium text-foreground">{r.query}</p>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{r.url}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">{r.binding_constraint}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mb-4">
        <FilterChips
          value={phase}
          onChange={setPhase}
          allLabel="All phases"
          options={['reflect', 'recommend', 'implement', 'validate', 'audit', 'self_reflect']}
        />
      </div>

      <Panel title="Cycle records" subtitle={`${visible.length} records`}>
        {loading && <Loading label="Loading reflection records" />}
        {!loading && !visible.length && (
          <EmptyState icon={Activity} title="No cycles recorded yet" description="The loop runs every 15 minutes and writes a record for each phase." />
        )}
        {!loading && visible.length > 0 && (
          <Table columns={['When', 'Phase', 'Query', 'Deployed', 'Expected', 'Measured', 'Validation', 'Auto-fix', 'Constraint']}>
            {visible.slice(0, 150).map((r) => (
              <Row key={r.id}>
                <Cell className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                  {r.occurred_at ? new Date(r.occurred_at).toLocaleString() : '—'}
                </Cell>
                <Cell className="font-mono text-[10px]">{r.phase}</Cell>
                <Cell className="max-w-[140px] truncate text-xs">{r.query || '—'}</Cell>
                <Cell className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">{r.deployed || '—'}</Cell>
                <Cell className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">{r.expected || '—'}</Cell>
                <Cell className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">{r.measured || '—'}</Cell>
                <Cell><StatusPill tone={VALIDATION_TONE[r.validation_status] || 'idle'}>{r.validation_status}</StatusPill></Cell>
                <Cell>
                  <span className="inline-flex items-center gap-1">
                    {r.auto_fix_result === 'rolled_back' && <RotateCcw className="h-3 w-3 text-amber-500" />}
                    <StatusPill tone={FIX_TONE[r.auto_fix_result] || 'idle'}>{r.auto_fix_result}</StatusPill>
                  </span>
                </Cell>
                <Cell className="max-w-[200px] text-xs text-amber-600 dark:text-amber-400">{r.binding_constraint || '—'}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Panel>

      <SuggestionLightbulb surface="system" />
    </div>
  );
}