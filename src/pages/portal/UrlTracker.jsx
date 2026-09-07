import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowUp, ArrowDown, Minus, Globe, Calendar, Bot, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function UrlTracker() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: u } = await base44.auth.me();
        const targets = await base44.entities.UrlTarget.filter({ client_id: u.id });
        setUrls(targets);
        if (targets.length > 0) setSelectedUrl(targets[0]);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
            <Link to="/portal" className="hidden font-heading text-sm font-bold sm:block hover:text-[#FFD700]">PORTAL</Link>
          </div>
          <Link to="/portal"><Button size="sm" variant="ghost" className="text-white/50 hover:text-white">Back to Dashboard</Button></Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-2 font-heading text-3xl font-bold">URL Tracking</h1>
        <p className="mb-8 text-white/50">Daily ranking progress and agent activity for each URL.</p>

        {urls.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
            <Globe className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <p className="text-white/40">No URLs tracked yet. Complete onboarding to start tracking.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* URL List */}
            <div className="space-y-2">
              {urls.map((url) => (
                <button
                  key={url.id}
                  onClick={() => setSelectedUrl(url)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedUrl?.id === url.id ? 'border-[#FFD700] bg-[#FFD700]/[0.03]' : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-[#FFD700]/60" />
                    <span className="truncate text-sm">{url.url}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#FFD700]/10 px-2 py-0.5 text-[10px] font-medium text-[#FFD700]">
                      {url.url_state?.replace(/_/g, ' ') || 'NEW'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* URL Detail */}
            {selectedUrl && (
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                  <h2 className="mb-1 truncate font-heading text-lg font-semibold">{selectedUrl.url}</h2>
                  <p className="mb-6 text-xs text-white/40">Detailed tracking and agent activity</p>

                  {/* Ranking Progress */}
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/40"><TrendingUp className="h-3 w-3" /> Avg Position</div>
                      <div className="mt-1 font-heading text-2xl font-bold">—</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400"><ArrowUp className="h-3 w-3" /> Improving</div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/40"><Zap className="h-3 w-3" /> Score</div>
                      <div className="mt-1 font-heading text-2xl font-bold">0</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-white/40"><Minus className="h-3 w-3" /> No change</div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-1.5 text-xs text-white/40"><Calendar className="h-3 w-3" /> Tracked</div>
                      <div className="mt-1 font-heading text-2xl font-bold">0d</div>
                      <div className="mt-1 text-xs text-white/40">days</div>
                    </div>
                  </div>

                  {/* Daily Activity Log */}
                  <h3 className="mb-3 font-heading text-sm font-semibold">What Agents Did Today</h3>
                  <div className="space-y-2">
                    {[
                      { agent: 'Scout', action: 'Researched competitor strategies for this URL', time: '2h ago' },
                      { agent: 'Builder', action: 'Generated optimized meta tags and schema markup', time: '4h ago' },
                      { agent: 'Healer', action: 'Fixed canonical tag issue', time: '6h ago' },
                      { agent: 'Sentinel', action: 'Checked ranking position — no change yet', time: '8h ago' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5">
                        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD700]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#FFD700]">{a.agent}</span>
                            <span className="text-xs text-white/30">{a.time}</span>
                          </div>
                          <p className="mt-0.5 text-sm text-white/60">{a.action}</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UrlTracker;