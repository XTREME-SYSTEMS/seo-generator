import React, { useState } from 'react';
import { Loader2, Target, FileSpreadsheet, CheckCircle2, AlertCircle, Rocket } from 'lucide-react';

export default function LandingPagesTab({ urls, onRefresh }) {
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (url) => {
    setGenerating(url.id);
    setError('');
    try {
      // Simulate landing page generation — in production this would call a backend function
      // that generates programmatic pages, submits sitemaps, and syncs to GSC
      await new Promise(r => setTimeout(r, 1500));

      // Update the URL status to 'generating'
      // In production, this would trigger actual page generation
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  };

  const liveUrls = urls.filter(u => u.status === 'live' || u.status === 'generating' || u.landing_pages_generated > 0);

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-gray-900">Programmatic Landing Page Generator</h4>
            <p className="text-sm text-gray-700 mt-1">
              Each strategic URL can generate hundreds of programmatic landing pages optimized for Google's algorithm.
              Pages include LocalBusiness schema, FAQ schema, optimized H1/H2s, and city+service keyword targeting.
              Sitemaps auto-submit to Google Search Console and IndexNow for instant crawling.
            </p>
          </div>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Discover strategic URLs first, then generate landing pages here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {urls.map(u => (
            <div key={u.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{u.url}</h4>
                    <StatusBadge status={u.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{u.primary_keyword || u.niche} • {u.keyword_category}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs">
                    <span className="text-muted-foreground">Programmatic potential: <strong className="text-foreground">{(u.programmatic_pages_potential || 0).toLocaleString()} pages</strong></span>
                    <span className="text-muted-foreground">Pages generated: <strong className="text-foreground">{u.landing_pages_generated || 0}</strong></span>
                    <span className="text-muted-foreground">SEO score: <strong className="text-foreground">{u.seo_score || 0}/100</strong></span>
                    <span className="text-muted-foreground">AEO score: <strong className="text-foreground">{u.aeo_score || 0}/100</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.sitemap_submitted && (
                    <span className="text-xs flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sitemap submitted
                    </span>
                  )}
                  <button
                    onClick={() => handleGenerate(u)}
                    disabled={generating === u.id}
                    className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {generating === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    {u.landing_pages_generated > 0 ? 'Regenerate' : 'Generate Pages'}
                  </button>
                </div>
              </div>
              {error && generating === u.id && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SEO/AEO Pipeline Info */}
      <div className="mt-6 bg-card border border-border rounded-lg p-5">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Automated SEO & AEO Pipeline
        </h4>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          {[
            'Google-optimized H1, H2, and meta titles with primary keyword',
            'LocalBusiness + FAQ + Breadcrumb JSON-LD schema on every page',
            'City × service page matrix for maximum local SEO coverage',
            'AEO-optimized content for AI search (ChatGPT, Perplexity, Google AI)',
            'Automatic sitemap generation and IndexNow ping',
            'Google Search Console sync for indexing status tracking',
            'Core Web Vitals optimization (LCP, CLS, INP)',
            'Internal linking structure for topical authority',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    discovered: 'bg-muted text-muted-foreground',
    evaluated: 'bg-blue-100 text-blue-700',
    generating: 'bg-yellow-100 text-yellow-700',
    live: 'bg-green-100 text-green-700',
    for_sale: 'bg-purple-100 text-purple-700',
    sold: 'bg-gray-200 text-gray-600',
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${colors[status] || colors.discovered}`}>{status}</span>;
}