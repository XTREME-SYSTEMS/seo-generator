import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileCheck, Zap, RefreshCw } from 'lucide-react';

export default function ComplianceIngester() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        base44.entities.SubmissionTarget.list('-created_date', 200),
        base44.entities.ComplianceRequirement.list('-created_date', 200),
      ]);
      setTargets(t);
      setRequirements(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScrape = async (target) => {
    setScraping(target.id);
    try {
      const res = await base44.functions.invoke('IngestComplianceRequirements', {
        target_id: target.id,
        url: target.url,
      });
      setToast({ type: 'success', msg: `${target.site_name}: ${res.data?.requirements_found || 0} requirements scraped` });
      await loadData();
    } catch (e) {
      setToast({ type: 'error', msg: `Scrape failed: ${e.message}` });
    }
    setScraping(null);
  };

  const handleBatchScrape = async () => {
    const unscraped = targets.filter(t => t.submission_status === 'identified');
    for (const t of unscraped.slice(0, 10)) {
      await handleScrape(t);
    }
  };

  const reqsByTarget = requirements.reduce((acc, r) => {
    const key = r.site_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Compliance Ingester</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Scrapes submission requirements from every identified site so you're 100% compliant before submitting. Uses CloudBrowser to extract guidelines, policies, and API docs.</p>
        <button
          onClick={handleBatchScrape}
          disabled={loading || scraping}
          className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Batch Scrape Requirements (10)
        </button>
      </div>

      {/* Requirements by Site */}
      <div className="space-y-3">
        {Object.entries(reqsByTarget).map(([site, reqs]) => (
          <div key={site} className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading text-sm font-semibold text-foreground mb-2">{site} <span className="text-xs text-muted-foreground">({reqs.length} requirements)</span></h4>
            <div className="space-y-1.5">
              {reqs.map(r => (
                <div key={r.id} className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{r.requirement_type}</span>
                  <span className="text-foreground">{r.requirement_text}</span>
                  {r.action_needed && <span className="text-primary italic">→ {r.action_needed}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Targets to Scrape */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Targets Awaiting Scrape</h4>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-1.5">
            {targets.filter(t => t.submission_status === 'identified').slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-xs border-b border-border pb-1.5">
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{t.site_name}</span>
                  <span className="text-muted-foreground ml-2 truncate">{t.url}</span>
                </div>
                <button
                  onClick={() => handleScrape(t)}
                  disabled={scraping === t.id}
                  className="px-2 py-1 rounded text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {scraping === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  Scrape
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 cursor-pointer ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`} onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}