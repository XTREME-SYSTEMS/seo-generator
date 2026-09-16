import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, ExternalLink, Globe, Zap, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Base44Apps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Base44App.list('-created_date', 500);
      setApps(data);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => ({
    total: apps.length,
    published: apps.filter(a => a.published_url && a.published_url.length > 0).length,
    totalPages: apps.reduce((s, a) => s + (a.page_count || 0), 0),
    scraped: apps.filter(a => a.scrape_status === 'completed').length,
    failed: apps.filter(a => a.scrape_status === 'failed').length,
  }), [apps]);

  const runScrape = async () => {
    setRunning(true);
    setToast(null);
    try {
      const res = await base44.functions.invoke('ScrapeBase44Apps', { scrape_pages: true });
      setToast({
        type: 'success',
        msg: `Scraped ${res.total_apps} apps — ${res.created} new, ${res.updated} updated, ${res.total_pages_discovered} pages discovered`
      });
      await loadData();
    } catch (e) {
      setToast({ type: 'error', msg: `Scrape failed: ${e.message}` });
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Base44 App Inventory</h1>
              <p className="text-xs text-muted-foreground">All apps in your Base44 workspace, scraped and imported into this system</p>
            </div>
          </div>
          <button
            onClick={runScrape}
            disabled={running}
            className="text-xs px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1.5 transition-colors font-medium"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {running ? 'Scraping...' : 'Scrape All Apps'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Apps" value={stats.total} icon={Globe} />
          <StatCard label="Published" value={stats.published} icon={ExternalLink} highlight />
          <StatCard label="Total Pages Found" value={stats.totalPages} icon={FileText} />
          <StatCard label="Scrape Failures" value={stats.failed} icon={AlertCircle} tone={stats.failed > 0 ? 'bad' : 'good'} />
        </div>

        {/* App List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No apps scraped yet</p>
            <p className="text-xs text-muted-foreground mb-4">Click "Scrape All Apps" to pull your entire Base44 workspace into this system</p>
            <button
              onClick={runScrape}
              disabled={running}
              className="text-xs px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {running ? 'Scraping...' : 'Start Scrape'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.map((app) => (
              <div key={app.id} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* App Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-semibold text-foreground truncate">{app.name}</span>
                      {app.scrape_status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {app.scrape_status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                    </div>
                    {app.published_url && (
                      <a
                        href={app.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                      >
                        {app.published_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-foreground tabular">{app.page_count || 0}</div>
                      <div className="text-[10px] text-muted-foreground">pages</div>
                    </div>
                    {app.status && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{app.status}</span>
                    )}
                  </div>
                </div>

                {/* Expanded Pages */}
                {expandedApp === app.id && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3">
                    {app.description && (
                      <p className="text-xs text-muted-foreground mb-3">{app.description}</p>
                    )}
                    {app.pages && app.pages.length > 0 ? (
                      <div>
                        <div className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Discovered URLs ({app.pages.length})
                        </div>
                        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                          {app.pages.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-muted-foreground hover:text-primary truncate flex items-center gap-1 py-0.5"
                            >
                              <span className="text-primary/40">→</span>
                              {url.replace(app.published_url?.replace(/^https?:\/\//, '') || '', '') || url}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {app.scrape_error || 'No pages discovered. The app may not be published or may require authentication.'}
                      </p>
                    )}
                    {app.last_scraped_at && (
                      <p className="text-[10px] text-muted-foreground mt-2">Last scraped: {new Date(app.last_scraped_at).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 cursor-pointer ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
            }`}
            onClick={() => setToast(null)}
          >
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight, tone }) {
  const colors = { good: 'text-emerald-600', bad: 'text-rose-600', neutral: 'text-foreground' };
  const colorClass = colors[tone] || (highlight ? 'text-emerald-600' : 'text-foreground');
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-emerald-600' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-2xl font-semibold tabular ${colorClass}`}>{value}</p>
    </div>
  );
}