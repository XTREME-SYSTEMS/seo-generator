import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Radar, Globe, Zap, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function DigitalScanner() {
  const [niche, setNiche] = useState('');
  const [scanning, setScanning] = useState(false);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const loadTargets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SubmissionTarget.list('-created_date', 500);
      setTargets(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadTargets(); }, [loadTargets]);

  const handleScan = async () => {
    if (!niche.trim()) return;
    setScanning(true);
    try {
      const res = await base44.functions.invoke('ScanSubmissionTargets', { niche, limit: 50 });
      setToast({ type: 'success', msg: `Found ${res.data.found} targets, saved ${res.data.created}` });
      await loadTargets();
    } catch (e) {
      setToast({ type: 'error', msg: `Scan failed: ${e.message}` });
    }
    setScanning(false);
  };

  const categories = ['all', 'directory', 'api_provider', 'api_consumer', 'review_site', 'social_platform', 'business_listing', 'press_release', 'forum', 'blog_network', 'podcast_directory', 'app_store', 'saas_marketplace', 'industry_specific', 'government'];

  const filtered = filter === 'all' ? targets : targets.filter(t => t.category === filter);

  const stats = {
    total: targets.length,
    apiTargets: targets.filter(t => t.submission_type === 'api_submit' || t.submission_type === 'api_get').length,
    free: targets.filter(t => t.is_free).length,
    highValue: targets.filter(t => t.estimated_seo_value === 'critical' || t.estimated_seo_value === 'high').length,
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Radar className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Digital Scanner</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Scans the web to identify every website, directory, API, and platform where you can submit your business, get an API, or connect — to skyrocket your digital visibility.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1.5">Your Niche / Business</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. plumbing, roofing, locksmith, SaaS..."
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !niche.trim()}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Scan Web'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Targets" value={stats.total} icon={Radar} />
        <Stat label="API Targets" value={stats.apiTargets} icon={Globe} highlight />
        <Stat label="Free to Submit" value={stats.free} icon={CheckCircle2} />
        <Stat label="High SEO Value" value={stats.highValue} icon={Zap} />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary/30'}`}
          >
            {c === 'all' ? 'All' : c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Targets List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Radar className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">No targets yet. Run a scan for your niche to identify submission sites.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-lg p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading text-sm font-semibold text-foreground">{t.site_name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{t.category?.replace(/_/g, ' ')}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">{t.submission_type?.replace(/_/g, ' ')}</span>
                  {t.is_free ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground">DA: {t.domain_authority || 0}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.estimated_seo_value === 'critical' ? 'bg-rose-100 text-rose-700' : t.estimated_seo_value === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{t.estimated_seo_value}</span>
                </div>
                <a href={t.url} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline truncate block mt-0.5">{t.url}</a>
                {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                {t.api_endpoint && <p className="text-xs text-primary font-mono mt-0.5">API: {t.api_endpoint}</p>}
                {t.submission_requirements && <p className="text-xs text-muted-foreground italic mt-1">Requirements: {t.submission_requirements}</p>}
              </div>
              <span className={`px-2 py-1 rounded text-[10px] shrink-0 ${t.submission_status === 'identified' ? 'bg-blue-100 text-blue-700' : t.submission_status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : t.submission_status === 'requirements_scraped' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>{t.submission_status?.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 cursor-pointer ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`} onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${highlight ? 'border-primary/20' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-2xl font-semibold tabular ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}