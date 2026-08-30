import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import StatusPill from '@/components/kit/StatusPill';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radar, Loader2 } from 'lucide-react';
import RegisterUrlsPanel from '@/components/crack/RegisterUrlsPanel';
import MilestoneClock from '@/components/crack/MilestoneClock';
import AsymmetryQueue from '@/components/crack/AsymmetryQueue';

const STATE_TONE = {
  NEW_NO_HISTORY: 'idle',
  DISCOVERED_NOT_INDEXED: 'bad',
  INDEXED_NO_IMPRESSIONS: 'warn',
  IMPRESSIONS_NO_VERIFIED_RANK: 'warn',
  TOP100: 'info', TOP50: 'info', TOP30: 'info',
  STRIKING_DISTANCE_11_20: 'warn',
  PAGE_ONE_6_10: 'good', TOP5: 'good', TOP3: 'good'
};

export default function AlgorithmCrack() {
  const [targets, setTargets] = useState([]);
  const [asymmetries, setAsymmetries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [t, a] = await Promise.all([
      base44.entities.UrlTarget.list('-last_synced_at', 100),
      base44.entities.Asymmetry.filter({ status: 'open' }, '-priority_score', 100)
    ]);
    setTargets(t);
    setAsymmetries(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true); setMsg('');
    try {
      const res = await base44.functions.invoke('SyncSearchConsole', { action: 'sync' });
      setMsg(`Synced ${res.data.synced} URLs · ${res.data.hourly_rows_written} new hourly rows from Search Console.`);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message);
    }
    setSyncing(false);
  };

  const scan = async () => {
    setScanning(true); setMsg('');
    try {
      const res = await base44.functions.invoke('DetectAsymmetries', {});
      setMsg(`Detected ${res.data.detected} asymmetries.`);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message);
    }
    setScanning(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pattern-Crack Engine"
        title="Algorithm Crack"
        description="Four sequential systems. Nine asymmetries. Every state advanced only by measured Search Console evidence — never by a model."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
              {syncing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
              Sync Console
            </Button>
            <Button size="sm" onClick={scan} disabled={scanning}>
              {scanning ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Radar className="mr-2 h-3.5 w-3.5" />}
              Scan
            </Button>
          </>
        }
      />

      {msg && <p className="mb-4 rounded border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{msg}</p>}

      {loading ? <Loading label="Loading URL registry" /> : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Panel
              title="URL registry"
              subtitle="Milestone clocks show measured wall-clock time to each boundary"
              right={<span className="font-mono text-[10px] text-muted-foreground">{targets.length} TRACKED</span>}
            >
              {targets.length === 0 ? (
                <EmptyState title="No URLs registered" description="Add your URLs on the right to start the clock." />
              ) : (
                <div className="space-y-4">
                  {targets.map((t) => (
                    <div key={t.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusPill tone={STATE_TONE[t.url_state] || 'idle'}>{t.url_state.replace(/_/g, ' ')}</StatusPill>
                        <span className="font-mono text-[10px] text-muted-foreground">{t.index_state}</span>
                        {t.canonical_agrees === false && t.google_canonical && (
                          <StatusPill tone="bad">CANONICAL CONFLICT</StatusPill>
                        )}
                      </div>
                      <p className="mb-2 break-all font-mono text-xs text-foreground">{t.url}</p>
                      <MilestoneClock target={t} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            <AsymmetryQueue items={asymmetries} />
          </div>

          <div className="space-y-5">
            <RegisterUrlsPanel onRegistered={load} />
            <Panel title="Integrity">
              <div className="space-y-2 text-xs">
                <Row label="Search Console" value="MEASURED" tone="good" />
                <Row label="Exact rank provider" value="UNOBSERVED" tone="warn" />
                <Row label="Milestones from models" value="BLOCKED" tone="good" />
                <Row label="Cracked code confirmed" value="FALSE" tone="idle" />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Search Console average position is a band, never an exact rank. Exact per-query rank stays
                UNOBSERVED until a licensed SERP provider is authorized.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <StatusPill tone={tone}>{value}</StatusPill>
    </div>
  );
}