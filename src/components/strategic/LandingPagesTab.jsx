import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Target, FileSpreadsheet, CheckCircle2, AlertCircle, Rocket, Eye, FileCode2, ExternalLink, X, RefreshCw } from 'lucide-react';

export default function LandingPagesTab({ urls, onRefresh }) {
  const [generating, setGenerating] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [generatedPages, setGeneratedPages] = useState({});
  const [loadingPages, setLoadingPages] = useState(true);
  const [previewPage, setPreviewPage] = useState(null);

  // Load generated pages for all displayed URLs
  const loadGeneratedPages = async () => {
    setLoadingPages(true);
    try {
      const pages = await base44.entities.GeneratedPage.list('-created_date', 200).catch(() => []);
      const byUrl = {};
      for (const p of pages) {
        const key = p.strategic_url_id || p.url_pattern || p.niche;
        if (!byUrl[key]) byUrl[key] = [];
        byUrl[key].push(p);
      }
      setGeneratedPages(byUrl);
    } catch (e) { console.error(e); }
    setLoadingPages(false);
  };

  useEffect(() => { loadGeneratedPages(); }, []);

  const handleGenerate = async (url) => {
    setGenerating(url.id);
    setSuccessId(null);
    try {
      // Call the backend function to generate an actual HTML landing page
      const res = await base44.functions.invoke('GenerateLandingPage', {
        niche: url.niche || url.primary_keyword || url.url,
        url_pattern: url.url,
        strategic_url_id: url.id,
        page_type: 'landing'
      });

      // Update the strategic URL status
      const pagesToGenerate = url.programmatic_pages_potential || 450;
      await base44.entities.StrategicUrl.update(url.id, {
        status: 'generating',
        landing_pages_generated: (url.landing_pages_generated || 0) + 1,
        sitemap_submitted: true,
      });

      setSuccessId(url.id);
      setSuccessMsg(`Landing page generated — ${res.data?.page_title || 'success'}`);
      await loadGeneratedPages();
      await onRefresh();
    } catch (err) {
      setSuccessId(url.id);
      setSuccessMsg(`Error: ${err.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const getPagesForUrl = (url) => {
    return generatedPages[url.id] || generatedPages[url.url] || generatedPages[url.niche] || [];
  };

  return (
    <div>
      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-gray-900">Programmatic Landing Page Generator</h4>
            <p className="text-sm text-gray-700 mt-1">
              Click "Generate Page" to create a complete, production-ready HTML landing page with LocalBusiness + FAQ schema,
              mobile-responsive design, and SEO-optimized content. Generated pages appear below each URL with a live preview.
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
          {urls.map(u => {
            const pages = getPagesForUrl(u);
            return (
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
                      <span className="text-muted-foreground">Pages generated: <strong className="text-foreground">{pages.length}</strong></span>
                      <span className="text-muted-foreground">SEO score: <strong className="text-foreground">{u.seo_score || 0}/100</strong></span>
                      <span className="text-muted-foreground">AEO score: <strong className="text-foreground">{u.aeo_score || 0}/100</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.sitemap_submitted && pages.length > 0 && (
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
                      {generating === u.id ? 'Generating...' : 'Generate Page'}
                    </button>
                  </div>
                </div>

                {successId === u.id && generating !== u.id && (
                  <p className={`mt-2 text-xs flex items-center gap-1 ${successMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {successMsg.startsWith('Error') ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />} {successMsg}
                  </p>
                )}

                {/* Generated Pages List */}
                {pages.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Generated Pages ({pages.length})</span>
                    </div>
                    {pages.map(page => (
                      <div key={page.id} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{page.page_type}</span>
                        <span className="text-sm text-foreground flex-1 truncate">{page.page_title}</span>
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                        <button
                          onClick={() => setPreviewPage(page)}
                          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
            'Automatic Sitemap generation and IndexNow ping',
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

      {/* Preview Modal */}
      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewPage(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <h3 className="font-semibold text-sm text-foreground truncate">{previewPage.page_title}</h3>
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex-shrink-0">{previewPage.page_type}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{previewPage.niche}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={previewPage.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                </a>
                <button onClick={() => setPreviewPage(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              <iframe
                src={previewPage.html_url}
                title={previewPage.page_title}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
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