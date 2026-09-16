import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Globe, Star, Shield, Rocket, AlertCircle, CheckCircle2, XCircle, ExternalLink, Download, Sparkles, Layers, ZoomIn, X, Maximize2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';

const NICHES = [
  'plumbing', 'water damage restoration', 'locksmith', 'towing', 'roofing',
  'HVAC', 'electrical', 'pest control', 'tree service', 'junk removal',
  'concrete polishing', 'epoxy flooring', 'garage door repair', 'fence installation',
  'landscaping', 'solar installation', 'waterproofing', 'mold remediation',
  'emergency dentist', 'emergency vet', 'emergency plumber', 'fire damage restoration',
  'carpet cleaning', 'air duct cleaning', 'chimney sweep', 'gutter cleaning',
  'window replacement', 'siding contractor', 'deck builder', 'paver installation',
];

export default function CloneGallery() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);
  const [cloneProgress, setCloneProgress] = useState('');
  const [filter, setFilter] = useState('');
  const [activeNiche, setActiveNiche] = useState('all');
  const [view, setView] = useState('gallery');
  const [lightbox, setLightbox] = useState(null);
  const [lightboxMode, setLightboxMode] = useState('screenshot');
  const [recloning, setRecloning] = useState(null);
  const [recloneMsg, setRecloneMsg] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await base44.entities.ClonedTemplate.list('-cloned_at', 200);
      setTemplates(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const grouped = useMemo(() => {
    const m = {};
    for (const t of templates) {
      if (activeNiche !== 'all' && t.niche !== activeNiche) continue;
      if (filter && !`${t.niche} ${t.site_name} ${t.source_url}`.toLowerCase().includes(filter.toLowerCase())) continue;
      (m[t.niche] ||= []).push(t);
    }
    // Sort each group by rank
    for (const k of Object.keys(m)) m[k].sort((a, b) => (a.rank || 99) - (b.rank || 99));
    return m;
  }, [templates, activeNiche, filter]);

  const stats = useMemo(() => {
    const cloned = templates.filter(t => t.status === 'cloned' || t.status === 'validated').length;
    const failed = templates.filter(t => t.status === 'failed').length;
    const avgParity = cloned > 0
      ? Math.round(templates.filter(t => t.status === 'cloned' || t.status === 'validated').reduce((s, t) => s + (t.visual_parity_score || 0), 0) / cloned)
      : 0;
    const nichesCovered = new Set(templates.map(t => t.niche)).size;
    const selfContained = templates.filter(t => t.is_self_contained).length;
    const totalAssets = templates.reduce((s, t) => s + (t.assets_rehosted || 0), 0);
    return { total: templates.length, cloned, failed, avgParity, nichesCovered, selfContained, totalAssets };
  }, [templates]);

  async function cloneNiche(niche) {
    setCloning(niche);
    setCloneProgress(`Finding top 5 sites for ${niche}...`);
    try {
      const res = await base44.functions.invoke('CloneTopNiches', { niche, limit: 5 });
      const data = res.data || res;
      setCloneProgress(`Done: ${data.succeeded || 0} cloned, ${data.failed || 0} failed`);
      await loadTemplates();
    } catch (e) {
      setCloneProgress(`Error: ${e.message}`);
    } finally {
      setCloning(null);
      setTimeout(() => setCloneProgress(''), 5000);
    }
  }

  async function recloneSite(template) {
    setRecloning(template.id);
    setRecloneMsg('');
    try {
      await base44.functions.invoke('RecloneSite', { template_id: template.id });
      setRecloneMsg(`Re-cloned ${template.site_name || template.source_url} successfully`);
      await loadTemplates();
    } catch (e) {
      setRecloneMsg(`Re-clone failed: ${e.message}`);
    } finally {
      setRecloning(null);
      setTimeout(() => setRecloneMsg(''), 5000);
    }
  }

  async function cloneAllNiches() {
    setCloning('all');
    for (const niche of NICHES) {
      setCloneProgress(`Cloning ${niche}...`);
      try {
        await base44.functions.invoke('CloneTopNiches', { niche, limit: 5 });
        await loadTemplates();
      } catch (e) { console.error(`Failed ${niche}:`, e.message); }
    }
    setCloning(null);
    setCloneProgress('All niches complete!');
    setTimeout(() => setCloneProgress(''), 5000);
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Layers className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Clone Gallery</h1>
          <p className="text-sm text-muted-foreground">Top 5 highest-rated websites per niche — cloned at 99% visual parity</p>
        </div>
        <button
          onClick={cloneAllNiches}
          disabled={!!cloning}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {cloning === 'all' ? <><Loader2 className="w-4 h-4 animate-spin" /> Cloning All...</> : <><Rocket className="w-4 h-4" /> Clone All 30 Niches</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Clones" value={stats.total} icon={Layers} color="text-blue-600" />
        <StatCard label="Successfully Cloned" value={stats.cloned} icon={CheckCircle2} color="text-green-600" />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} color="text-red-600" />
        <StatCard label="Avg Visual Parity" value={`${stats.avgParity}%`} icon={Shield} color="text-yellow-600" />
        <StatCard label="Self-Contained" value={stats.selfContained} icon={Shield} color="text-green-600" />
        <StatCard label="Assets Re-Hosted" value={stats.totalAssets} icon={Layers} color="text-blue-600" />
      </div>

      {/* Progress */}
      {cloneProgress && (
        <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex items-center gap-2">
          {cloning ? <Loader2 className="w-4 h-4 animate-spin text-yellow-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <span className="text-sm text-yellow-800">{cloneProgress}</span>
        </div>
      )}

      {/* Reclone message */}
      {recloneMsg && (
        <div className="mb-4 bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-center gap-2">
          {recloning ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <span className="text-sm text-blue-800">{recloneMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clones by niche, site name, or URL..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full input pl-10"
          />
        </div>
        <select value={activeNiche} onChange={(e) => setActiveNiche(e.target.value)} className="input min-w-[180px]">
          <option value="all">All Niches</option>
          {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setView('gallery')} className={`px-3 py-2 text-sm ${view === 'gallery' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>Gallery</button>
          <button onClick={() => setView('niches')} className={`px-3 py-2 text-sm ${view === 'niches' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-card text-foreground'}`}>By Niche</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : view === 'niches' ? (
        <NicheGrid niches={NICHES} templates={templates} cloning={cloning} onClone={cloneNiche} onZoom={setLightbox} />
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No clones yet. Start by cloning a niche.</p>
          <button onClick={() => cloneNiche(NICHES[0])} disabled={!!cloning} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-lg inline-flex items-center gap-2">
            {cloning === NICHES[0] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Clone First Niche ({NICHES[0]})
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([niche, items]) => (
            <div key={niche}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-foreground capitalize flex items-center gap-2">
                  {niche}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{items.length} clones</span>
                </h2>
                <button
                  onClick={() => cloneNiche(niche)}
                  disabled={!!cloning}
                  className="text-xs bg-card border border-border hover:border-yellow-400 text-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {cloning === niche ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                  Re-clone
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {items.map(t => <CloneCard key={t.id} template={t} onZoom={setLightbox} onOpenLive={(tpl) => { setLightboxMode('live'); setLightbox(tpl); }} onReclone={recloneSite} recloning={recloning === t.id} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          template={lightbox}
          mode={lightboxMode}
          onModeChange={setLightboxMode}
          onClose={() => { setLightbox(null); setLightboxMode('screenshot'); }}
        />
      )}
    </div>
  );
}

function CloneCard({ template, onZoom, onOpenLive, onReclone, recloning }) {
  const [showDetails, setShowDetails] = useState(false);
  const isFailed = template.status === 'failed';
  const parity = template.visual_parity_score || 0;
  const parityColor = parity >= 80 ? 'text-green-600 bg-green-100' : parity >= 50 ? 'text-yellow-700 bg-yellow-100' : 'text-red-600 bg-red-100';
  const hasScreenshot = template.screenshot_url && !isFailed;

  return (
    <div className={`border rounded-lg overflow-hidden bg-card transition-all ${isFailed ? 'border-red-300' : 'border-border hover:border-yellow-400 hover:shadow-lg'}`}>
      {/* Screenshot */}
      <div
        className={`relative aspect-video bg-muted overflow-hidden ${hasScreenshot ? 'cursor-zoom-in group' : ''}`}
        onClick={hasScreenshot ? () => onZoom(template) : undefined}
      >
        {hasScreenshot ? (
          <>
            <Image
              src={template.screenshot_url}
              alt={template.site_name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              fittingType="fill"
            />
            {/* Zoom overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <ZoomIn className="w-5 h-5 text-gray-900" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isFailed ? <XCircle className="w-8 h-8 text-red-400" /> : <Globe className="w-8 h-8 text-muted-foreground" />}
          </div>
        )}
        {/* Rank badge */}
        {template.rank > 0 && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
            #{template.rank}
          </div>
        )}
        {/* Parity badge */}
        {!isFailed && parity > 0 && (
          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${parityColor}`}>
            {parity}% parity
          </div>
        )}
        {/* Self-contained badge */}
        {!isFailed && template.is_self_contained && (
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" /> Self-Contained
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-foreground truncate flex-1">{template.site_name || template.source_url}</h3>
          {template.rating && <span className="text-xs text-yellow-600 flex items-center gap-0.5 shrink-0"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{template.rating}</span>}
        </div>
        <p className="text-xs text-muted-foreground truncate mb-2">{template.source_url}</p>

        {isFailed ? (
          <div className="space-y-2">
            <p className="text-xs text-red-600 line-clamp-2">{template.clone_error || 'Clone failed'}</p>
            <button
              onClick={() => onReclone(template)}
              disabled={recloning}
              className="text-xs bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-3 py-1.5 rounded flex items-center gap-1.5"
            >
              {recloning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Re-clone This Site
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {template.strengths && template.strengths.length > 0 && (
              <p className="text-xs text-green-700 line-clamp-1"><strong>Strengths:</strong> {template.strengths.slice(0, 2).join(', ')}</p>
            )}
            {template.weaknesses && template.weaknesses.length > 0 && (
              <p className="text-xs text-orange-600 line-clamp-1"><strong>Gaps:</strong> {template.weaknesses.slice(0, 2).join(', ')}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
          {!isFailed && template.html_file_url && (
            <button
              onClick={() => onOpenLive(template)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" /> Full Screen
            </button>
          )}
          {!isFailed && template.source_url && (
            <a href={template.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Original
            </a>
          )}
          <button
            onClick={() => onReclone(template)}
            disabled={recloning}
            className="text-xs text-yellow-700 hover:text-yellow-800 disabled:opacity-50 flex items-center gap-1"
            title="Re-clone this site"
          >
            {recloning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Re-clone
          </button>
          <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
            {showDetails ? 'Less' : 'Details'}
          </button>
        </div>

        {/* Details */}
        {showDetails && !isFailed && template.design_tokens && (
          <div className="mt-2 pt-2 border-t border-border space-y-2">
            {(() => {
              try {
                const tokens = JSON.parse(template.design_tokens);
                return (
                  <>
                    {tokens.colors && tokens.colors.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Colors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tokens.colors.slice(0, 8).map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded border border-border" style={{ background: c }} title={c} />
                          ))}
                        </div>
                      </div>
                    )}
                    {tokens.fonts && tokens.fonts.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Fonts:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tokens.fonts.slice(0, 3).map((f, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-muted-foreground">Sections: <strong className="text-foreground">{tokens.sectionCount || 0}</strong></span>
                      <span className="text-muted-foreground">Images: <strong className="text-foreground">{tokens.imageCount || 0}</strong></span>
                      <span className="text-muted-foreground">Links: <strong className="text-foreground">{tokens.linkCount || 0}</strong></span>
                      <span className="text-muted-foreground">Forms: <strong className="text-foreground">{tokens.formCount || 0}</strong></span>
                    </div>
                    {/* Deterministic stats */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-border">
                      {template.assets_rehosted > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> {template.assets_rehosted} assets re-hosted
                        </span>
                      )}
                      {template.css_inlined && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                          CSS inlined
                        </span>
                      )}
                      {template.is_self_contained && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold">
                          Self-Contained
                        </span>
                      )}
                    </div>
                  </>
                );
              } catch { return null; }
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function NicheGrid({ niches, templates, cloning, onClone, onZoom }) {
  const templatesByNiche = useMemo(() => {
    const m = {};
    for (const t of templates) (m[t.niche] ||= []).push(t);
    return m;
  }, [templates]);

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {niches.map(niche => {
        const items = templatesByNiche[niche] || [];
        const cloned = items.filter(t => t.status === 'cloned' || t.status === 'validated').length;
        const avgParity = cloned > 0 ? Math.round(items.filter(t => t.status !== 'failed').reduce((s, t) => s + (t.visual_parity_score || 0), 0) / cloned) : 0;

        return (
          <div key={niche} className="border border-border rounded-lg p-4 bg-card hover:border-yellow-400 transition-colors">
            <h3 className="font-semibold text-sm text-foreground capitalize mb-2">{niche}</h3>
            {cloned > 0 ? (
              <div className="space-y-1 mb-3">
                <p className="text-xs text-green-600">{cloned}/5 sites cloned</p>
                <p className="text-xs text-yellow-600">Avg parity: {avgParity}%</p>
                {/* Mini thumbnails */}
                <div className="flex gap-1 mt-2">
                  {items.filter(t => t.screenshot_url).slice(0, 5).map(t => (
                    <div key={t.id} className="w-10 h-8 rounded overflow-hidden border border-border cursor-zoom-in hover:ring-2 hover:ring-yellow-400 transition-all" onClick={() => onZoom(t)}>
                      <Image src={t.screenshot_url} alt={t.site_name} className="w-full h-full object-cover" fittingType="fill" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">Not yet cloned</p>
            )}
            <button
              onClick={() => onClone(niche)}
              disabled={!!cloning}
              className="w-full text-xs bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold py-1.5 rounded flex items-center justify-center gap-1.5"
            >
              {cloning === niche ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
              {cloned > 0 ? 'Re-clone' : 'Clone Top 5'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Lightbox({ template, mode, onModeChange, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const hasLive = !!template.html_file_url;
  const hasScreenshot = !!template.screenshot_url;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/80" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 min-w-0">
          {template.rank > 0 && <span className="bg-yellow-400 text-gray-900 text-sm font-bold px-2.5 py-0.5 rounded-full shrink-0">#{template.rank}</span>}
          <h2 className="text-white font-bold text-sm md:text-lg truncate">{template.site_name}</h2>
          {template.rating && <span className="text-yellow-400 flex items-center gap-0.5 text-sm shrink-0"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{template.rating}</span>}
          {template.visual_parity_score > 0 && <span className="text-white/60 text-xs shrink-0 hidden md:block">{template.visual_parity_score}% parity</span>}
          {template.is_self_contained && <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0 hidden md:flex items-center gap-1"><Shield className="w-3 h-3" /> Self-Contained</span>}
          {template.assets_rehosted > 0 && <span className="text-white/60 text-xs shrink-0 hidden lg:block">{template.assets_rehosted} assets</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode toggle */}
          {hasLive && hasScreenshot && (
            <div className="flex bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => onModeChange('screenshot')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${mode === 'screenshot' ? 'bg-yellow-400 text-gray-900' : 'text-white hover:bg-white/10'}`}
              >
                Screenshot
              </button>
              <button
                onClick={() => onModeChange('live')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${mode === 'live' ? 'bg-yellow-400 text-gray-900' : 'text-white hover:bg-white/10'}`}
              >
                Live Site
              </button>
            </div>
          )}
          {template.source_url && (
            <a href={template.source_url} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Original
            </a>
          )}
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content area — single scroll container */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {mode === 'live' && hasLive ? (
          <iframe
            src={template.html_file_url}
            title={template.site_name}
            className="w-full h-full max-w-[1400px] mx-auto rounded-lg bg-white"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        ) : hasScreenshot ? (
          <img
            src={template.screenshot_url}
            alt={template.site_name}
            className="max-w-full max-h-full h-auto object-contain rounded-lg"
          />
        ) : (
          <p className="text-white/60">No preview available</p>
        )}
      </div>
    </div>
  );
}