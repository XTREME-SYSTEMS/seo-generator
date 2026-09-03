import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import EmptyState from '@/components/kit/EmptyState';
import { Loader2, Search, TrendingUp } from 'lucide-react';

const TREND_TONE = { breakout: 'good', rising: 'good', stable: 'idle', declining: 'bad' };
const COMP_TONE = { low: 'good', medium: 'idle', high: 'bad' };
const TYPE_LABEL = {
  head: 'Head', long_tail: 'Long-tail', question: 'Question', local_modifier: 'Local', underserved: 'Underserved', trending: 'Trending',
};

export default function TractionScanner() {
  const [url, setUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [market, setMarket] = useState('US');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  async function loadHistory() {
    try {
      const recent = await base44.entities.TractionKeyword.list('-scanned_at', 60);
      setHistory(recent);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadHistory(); }, []);

  async function scan() {
    setScanning(true); setError(null); setResults([]);
    try {
      const res = await base44.functions.invoke('TractionScanner', { url, industry, market });
      setResults(res.keywords || []);
      await loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  }

  const sorted = [...results].sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

  return (
    <div>
      <PageHeader
        eyebrow="Traction Scanner"
        title="Find Keywords & Phrases That Gain Traction Fastest"
        description="Input a URL or industry. The scanner researches Google Trends, search demand, and competitor gaps to surface trending keywords, low-competition long-tails, underserved question queries, and local modifiers — ranked by fastest path to traction."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Panel title="Scan Target">
            <div className="space-y-3">
              <Field label="URL (optional)" value={url} onChange={setUrl} placeholder="https://example.com/" />
              <Field label="Industry (optional)" value={industry} onChange={setIndustry} placeholder="Epoxy Coatings & Flooring" />
              <Field label="Market" value={market} onChange={setMarket} placeholder="US" />
              <button onClick={scan} disabled={scanning || (!url && !industry)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {scanning ? 'Scanning...' : 'Scan for Opportunities'}
              </button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </Panel>

          <Panel title="Recent Scans" className="mt-6" subtitle={`${history.length} saved`}>
            {history.length === 0 ? (
              <EmptyState title="No scans yet" />
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {history.slice(0, 20).map((k) => (
                  <div key={k.id} className="flex items-center justify-between gap-2 py-1 text-xs">
                    <span className="truncate text-foreground">{k.keyword}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{Math.round(k.opportunity_score || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-3">
          <Panel title="Ranked Opportunities" subtitle={sorted.length ? `${sorted.length} keywords` : ''}>
            {sorted.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No results yet" description="Run a scan to discover high-opportunity keywords and phrases." />
            ) : (
              <div className="space-y-2">
                {sorted.map((k, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{k.keyword}</span>
                          <StatusPill tone="idle">{TYPE_LABEL[k.type] || k.type}</StatusPill>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{k.rationale}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ScoreRing score={k.opportunity_score || 0} />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                      <StatusPill tone={TREND_TONE[k.trend]}>{k.trend}</StatusPill>
                      <StatusPill tone={COMP_TONE[k.competition]}>{k.competition} comp</StatusPill>
                      <span className="text-muted-foreground">difficulty {Math.round(k.difficulty || 0)}</span>
                      <span className="text-muted-foreground">· {k.intent}</span>
                    </div>
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

function ScoreRing({ score }) {
  const tone = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-blue-600' : 'text-amber-600';
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current font-heading text-xs font-semibold">
      <span className={tone}>{Math.round(score)}</span>
    </div>
  );
}