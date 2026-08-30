import React, { useMemo, useState } from 'react';
import { Boxes, Loader2, Play } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import Provenance from '@/components/kit/Provenance';
import StatCard from '@/components/kit/StatCard';
import SuggestionLightbulb from '@/components/are/SuggestionLightbulb';
import { Table, Row, Cell } from '@/components/kit/Table';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';

export default function TwinOptimizer() {
  const { clientId } = useTenant();
  const { rows: sheet } = useTenantData('AreSheetRow', {}, '-priority_score');
  const { rows: mutations, reload } = useTenantData('TwinMutation', {}, '-created_at');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const urls = useMemo(() => {
    const map = new Map();
    sheet.forEach((r) => { if (!map.has(`${r.url}|${r.query}`)) map.set(`${r.url}|${r.query}`, r); });
    return [...map.values()];
  }, [sheet]);

  const run = async () => {
    if (!selected) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await base44.functions.invoke('AreTwinOptimizer', {
        client_id: clientId, url: selected.url, query: selected.query, generations: 8, population: 300,
      });
      if (res.data?.error) setError(res.data.error);
      else setResult(res.data);
      reload();
    } finally { setBusy(false); }
  };

  const winners = mutations.filter((m) => m.is_winner).slice(0, 10);

  return (
    <div>
      <PageHeader
        eyebrow="Rubik's-cube mode"
        title="Twin Optimizer"
        description="Runs thousands of configuration mutations against the SERP digital twin, logs every move, and queues the winning configuration through the guarded deploy path — never a direct write to production."
      />

      <div className="mb-6 flex items-center gap-2">
        <Provenance value="MODELED" />
        <span className="text-xs text-muted-foreground">Twin predictions are modeled. Reality is measured on the next loop, and the twin is corrected.</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Pick a target" subtitle="URL × query from the sheet" className="lg:col-span-1">
          {!urls.length && <p className="text-xs text-muted-foreground">Run a reflect pass first to populate targets.</p>}
          <ul className="max-h-80 space-y-1.5 overflow-y-auto">
            {urls.map((r) => {
              const active = selected && selected.url === r.url && selected.query === r.query;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`w-full rounded border px-3 py-2 text-left transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <span className="block truncate text-xs text-foreground">{r.query}</span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                      {r.rank ? `#${r.rank}` : 'unranked'} · {r.url}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Button className="mt-4 w-full" onClick={run} disabled={busy || !selected || !clientId}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run optimization session
          </Button>
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          {result && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Mutations run" value={result.mutations_evaluated?.toLocaleString()} provenance="MODELED" />
                <StatCard label="Start rank" value={result.start_rank >= 101 ? 'unranked' : `#${result.start_rank}`} provenance="MEASURED" />
                <StatCard label="Predicted rank" value={`#${result.winner?.predicted_rank}`} provenance="MODELED" />
                <StatCard label="Predicted score" value={result.winner?.predicted_score} provenance="MODELED" />
              </div>
              <Panel title="Winning configuration" subtitle={`Session ${result.session_id} · difficulty ${result.difficulty}`}>
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  {result.goal_reached_in_twin
                    ? 'The twin reaches top 3 with this configuration. It has been queued for the guarded deploy path.'
                    : 'The twin does not reach top 3 with on-page modules alone — the remaining gap is an authority constraint and is documented on the row.'}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(result.winner?.config || {}).map(([k, v]) => (
                    <div key={k} className="rounded border border-border px-3 py-2">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{k}</div>
                      <div className="mt-0.5 font-heading text-sm font-semibold tabular text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          <Panel title="Session log" subtitle="Winning mutation of each session">
            {!winners.length && <EmptyState icon={Boxes} title="No sessions yet" description="Pick a target and run an optimization session." />}
            {winners.length > 0 && (
              <Table columns={['Query', 'Gen', 'Predicted rank', 'Δ', 'Modules', 'When']}>
                {winners.map((m) => (
                  <Row key={m.id}>
                    <Cell className="max-w-[160px] truncate text-xs">{m.query}</Cell>
                    <Cell className="font-mono text-xs tabular">{m.generation}</Cell>
                    <Cell className="font-mono text-xs tabular text-primary">#{m.predicted_rank}</Cell>
                    <Cell className="font-mono text-xs tabular">{m.predicted_delta}</Cell>
                    <Cell className="max-w-[220px] truncate font-mono text-[10px] text-muted-foreground">{(m.modules || []).join(', ')}</Cell>
                    <Cell className="font-mono text-[10px] text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</Cell>
                  </Row>
                ))}
              </Table>
            )}
          </Panel>
        </div>
      </div>

      <SuggestionLightbulb surface="twin" />
    </div>
  );
}