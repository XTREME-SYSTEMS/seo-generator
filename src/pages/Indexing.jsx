import React, { useEffect, useState } from 'react';
import { Search, Loader2, Send, FileCheck, BarChart3, Globe } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { base44 } from '@/api/base44Client';

function todayMinus(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function Indexing() {
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [site, setSite] = useState('');
  const [tab, setTab] = useState('inspect');

  const [inspectUrl, setInspectUrl] = useState('');
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectBusy, setInspectBusy] = useState(false);

  const [sitemapUrl, setSitemapUrl] = useState('');
  const [sitemapMsg, setSitemapMsg] = useState(null);
  const [sitemapBusy, setSitemapBusy] = useState(false);

  const [analytics, setAnalytics] = useState([]);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [startDate, setStartDate] = useState(todayMinus(28));
  const [endDate, setEndDate] = useState(todayMinus(1));

  useEffect(() => {
    base44.functions.invoke('SearchConsoleIndex', { action: 'list_sites' })
      .then((res) => { setSites(res.data.sites || []); if (res.data.sites?.[0]) setSite(res.data.sites[0].url); })
      .finally(() => setLoadingSites(false));
  }, []);

  async function runInspect() {
    if (!inspectUrl || !site) return;
    setInspectBusy(true); setInspectResult(null);
    try {
      const res = await base44.functions.invoke('SearchConsoleIndex', { action: 'inspect', url: inspectUrl, site_url: site });
      setInspectResult(res.data);
    } catch (e) { setInspectResult({ error: e.message }); }
    finally { setInspectBusy(false); }
  }

  async function runSitemap() {
    if (!sitemapUrl || !site) return;
    setSitemapBusy(true); setSitemapMsg(null);
    try {
      const res = await base44.functions.invoke('SearchConsoleIndex', { action: 'submit_sitemap', site_url: site, sitemap_url: sitemapUrl });
      setSitemapMsg(res.data);
    } catch (e) { setSitemapMsg({ error: e.message }); }
    finally { setSitemapBusy(false); }
  }

  async function runAnalytics() {
    if (!site) return;
    setAnalyticsBusy(true); setAnalytics([]);
    try {
      const res = await base44.functions.invoke('SearchConsoleIndex', { action: 'search_analytics', site_url: site, start_date: startDate, end_date: endDate, dimensions: ['query'] });
      setAnalytics(res.data.rows || []);
    } catch (e) { setAnalytics([]); }
    finally { setAnalyticsBusy(false); }
  }

  const TABS = [
    { id: 'inspect', label: 'Inspect URL', icon: FileCheck },
    { id: 'sitemap', label: 'Submit sitemap', icon: Send },
    { id: 'analytics', label: 'Search analytics', icon: BarChart3 },
  ];

  return (
    <div>
      <PageHeader eyebrow="Google Search Console" title="Indexing & search performance"
        description="Inspect any URL's index status, submit sitemaps to trigger crawling, and read search performance (impressions, clicks, CTR, position) directly from your connected Google Search Console account." />

      <Panel title="Connected site" subtitle="From your Google Search Console account">
        {loadingSites ? <Loading label="Loading sites" /> : sites.length === 0 ? <EmptyState icon={Globe} title="No sites in Search Console" description="Add a property in Google Search Console, then reload." /> : (
          <select value={site} onChange={(e) => setSite(e.target.value)} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
            {sites.map((s) => <option key={s.url} value={s.url}>{s.url} ({s.permission})</option>)}
          </select>
        )}
      </Panel>

      <div className="mt-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition ${tab === t.id ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'inspect' && (
        <Panel title="URL inspection" subtitle="Check index status, coverage, and mobile usability" className="mt-4">
          <div className="flex gap-2">
            <input value={inspectUrl} onChange={(e) => setInspectUrl(e.target.value)} placeholder="https://yoursite.com/page" className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={runInspect} disabled={inspectBusy || !site} className="inline-flex items-center gap-1.5 rounded bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
              {inspectBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}Inspect
            </button>
          </div>
          {inspectResult && (
            <div className="mt-4 space-y-3">
              {inspectResult.error ? (
                <p className="text-xs text-destructive">{inspectResult.error}</p>
              ) : inspectResult.inspection && (
                <>
                  {(() => {
                    const idx = inspectResult.inspection.indexStatusResult || {};
                    const mob = inspectResult.inspection.mobileUsabilityResult || {};
                    const rich = (inspectResult.inspection.richResultsResult || {}).verdict;
                    return (
                      <div className="space-y-2">
                        <Row label="Index state" value={idx.indexState} tone={idx.indexState === 'INDEX state' ? 'good' : 'warn'} />
                        <Row label="Coverage state" value={idx.coverageState} />
                        <Row label="Crawled as" value={idx.crawledAsUrl} />
                        <Row label="Google canonical" value={idx.googleCanonical} />
                        <Row label="Mobile usability" value={mob.verdict} tone={mob.verdict === 'PASS' ? 'good' : 'warn'} />
                        {rich && <Row label="Rich results" value={rich} />}
                        {idx.indexState !== 'Index state' && idx.summary && <p className="rounded bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{idx.summary}</p>}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </Panel>
      )}

      {tab === 'sitemap' && (
        <Panel title="Submit sitemap" subtitle="Submitting a sitemap asks Google to crawl and index listed URLs" className="mt-4">
          <div className="flex gap-2">
            <input value={sitemapUrl} onChange={(e) => setSitemapUrl(e.target.value)} placeholder="https://yoursite.com/sitemap.xml" className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={runSitemap} disabled={sitemapBusy || !site} className="inline-flex items-center gap-1.5 rounded bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
              {sitemapBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Submit
            </button>
          </div>
          {sitemapMsg && (
            <p className={`mt-3 text-xs ${sitemapMsg.error ? 'text-destructive' : 'text-emerald-400'}`}>{sitemapMsg.error || sitemapMsg.message || 'Submitted'}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Note: Google's public API submits sitemaps and reads index status. On-demand "request indexing" of individual pages is only available for job postings & livestreams via the Indexing API — for general pages, sitemap submission + content quality is the indexing lever.</p>
        </Panel>
      )}

      {tab === 'analytics' && (
        <Panel title="Search analytics" subtitle="Top queries by impressions, clicks, CTR, and position" right={
          <button onClick={runAnalytics} disabled={analyticsBusy || !site} className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
            {analyticsBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />}Run
          </button>
        } className="mt-4">
          <div className="mb-3 flex gap-2">
            <label className="text-xs text-muted-foreground">From<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ml-1.5 rounded border border-input bg-background px-2 py-1 text-xs" /></label>
            <label className="text-xs text-muted-foreground">To<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ml-1.5 rounded border border-input bg-background px-2 py-1 text-xs" /></label>
          </div>
          {analyticsBusy ? <Loading label="Querying search analytics" /> : analytics.length === 0 ? <EmptyState icon={BarChart3} title="No data yet" description="Pick a date range and run the query." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border"><th className="py-2">Query</th><th className="py-2 text-right">Clicks</th><th className="py-2 text-right">Impr.</th><th className="py-2 text-right">CTR</th><th className="py-2 text-right">Pos</th></tr>
                </thead>
                <tbody>
                  {analytics.map((r, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 font-medium text-foreground">{r.keys?.[0]}</td>
                      <td className="py-2 text-right tabular">{r.clicks}</td>
                      <td className="py-2 text-right tabular">{r.impressions}</td>
                      <td className="py-2 text-right tabular">{(r.ctr * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right tabular">{r.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Row({ label, value, tone }) {
  if (!value) return null;
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>{tone ? <StatusPill tone={tone}>{value}</StatusPill> : <span className="text-foreground/90">{value}</span>}</div>;
}