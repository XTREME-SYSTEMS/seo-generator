import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, FileText, Link2, Search, Filter, CheckCircle2, XCircle, AlertTriangle, Trash2, Shield, Zap, Brain, Target, RefreshCw, Download, Eye, FolderX, FolderCheck, FolderOpen, HardDrive, FileCode, Image, Video, Mic, Code2, Database, Archive, Globe, Sparkles, Wand2 } from 'lucide-react';
import { Image as UIImage } from '@/components/ui/image';

const SOURCE_TYPES = [
  { value: 'image', label: 'Image', icon: Image, color: 'text-green-600' },
  { value: 'prompt', label: 'Prompt', icon: Wand2, color: 'text-purple-600' },
  { value: 'voice', label: 'Voice/Audio', icon: Mic, color: 'text-orange-600' },
  { value: 'video', label: 'Video', icon: Video, color: 'text-red-600' },
  { value: 'url', label: 'URL', icon: Globe, color: 'text-blue-600' },
  { value: 'folder', label: 'Folder', icon: HardDrive, color: 'text-amber-600' },
  { value: 'file', label: 'File', icon: FileText, color: 'text-slate-600' },
  { value: 'document', label: 'Document', icon: FileText, color: 'text-indigo-600' },
  { value: 'code', label: 'Code', icon: Code2, color: 'text-cyan-600' },
  { value: 'data', label: 'Data', icon: Database, color: 'text-teal-600' },
  { value: 'config', label: 'Config', icon: Shield, color: 'text-rose-600' },
  { value: 'archive', label: 'Archive', icon: Archive, color: 'text-brown-600' },
];

const STATUS_CONFIG = {
  ingested: { label: 'Ingested', icon: Upload, color: 'text-slate-600 bg-slate-100' },
  filtering: { label: 'Filtering', icon: Loader2, color: 'text-blue-600 bg-blue-100' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  questionable: { label: 'Questionable', icon: AlertTriangle, color: 'text-amber-600 bg-amber-100' },
  trashed: { label: 'Trashed', icon: Trash2, color: 'text-red-600 bg-red-100' },
  applied: { label: 'Applied', icon: Zap, color: 'text-purple-600 bg-purple-100' },
};

const UTILITY_ACTIONS = [
  { value: 'fix', label: 'Fix', icon: Wand2, color: 'text-blue-600' },
  { value: 'connect', label: 'Connect', icon: Link2, color: 'text-cyan-600' },
  { value: 'heal', label: 'Heal', icon: Shield, color: 'text-green-600' },
  { value: 'harden', label: 'Harden', icon: Shield, color: 'text-rose-600' },
  { value: 'optimize', label: 'Optimize', icon: Zap, color: 'text-amber-600' },
  { value: 'evolve', label: 'Evolve', icon: Sparkles, color: 'text-purple-600' },
  { value: 'none', label: 'None', icon: XCircle, color: 'text-slate-400' },
];

export default function DeepIngestionSystem() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // file | url | text
  const [formData, setFormData] = useState({
    source_type: 'file',
    source_name: '',
    source_url: '',
    content_text: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingestMsg, setIngestMsg] = useState('');
  const [auditMsg, setAuditMsg] = useState('');
  const [view, setView] = useState('all'); // all | questionable | trashed | approved

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.IngestionItem.list('-ingested_at', 200);
      setItems(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      approved: items.filter(i => i.status === 'approved' || i.status === 'applied').length,
      questionable: items.filter(i => i.status === 'questionable').length,
      trashed: items.filter(i => i.status === 'trashed').length,
      filtering: items.filter(i => i.status === 'filtering' || i.status === 'ingested').length,
      totalSize: items.reduce((s, i) => s + (i.size_bytes || 0), 0),
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (view === 'questionable' && i.status !== 'questionable') return false;
      if (view === 'trashed' && i.status !== 'trashed') return false;
      if (view === 'approved' && i.status !== 'approved' && i.status !== 'applied') return false;
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (typeFilter !== 'all' && i.source_type !== typeFilter) return false;
      if (search && !`${i.source_name} ${i.source_url} ${i.content_summary}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, view, statusFilter, typeFilter, search]);

  async function handleIngest() {
    if (uploadMode === 'file' && !selectedFile) { setIngestMsg('Please select a file'); return; }
    if (uploadMode === 'url' && !formData.source_url) { setIngestMsg('Please enter a URL'); return; }
    if (uploadMode === 'text' && !formData.content_text) { setIngestMsg('Please enter content'); return; }
    if (!formData.source_name) { setIngestMsg('Please enter a name'); return; }

    setIngesting(true);
    setIngestMsg('Uploading and running 3 filters...');
    try {
      const fd = new FormData();
      fd.append('source_type', formData.source_type);
      fd.append('source_name', formData.source_name);
      fd.append('source_url', formData.source_url);
      fd.append('content_text', formData.content_text);
      if (selectedFile) fd.append('file', selectedFile);

      const res = await fetch('/functions/DeepIngestion', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setIngestMsg(`Ingestion complete: ${data.status.toUpperCase()}${data.failedFilters ? ' — failed: ' + data.failedFilters.join(', ') : ''}`);
        setFormData({ source_type: 'file', source_name: '', source_url: '', content_text: '' });
        setSelectedFile(null);
        await loadItems();
      } else {
        setIngestMsg(`Error: ${data.error}`);
      }
    } catch (e) {
      setIngestMsg(`Error: ${e.message}`);
    } finally {
      setIngesting(false);
      setTimeout(() => setIngestMsg(''), 8000);
    }
  }

  async function handleAudit() {
    setAuditing(true);
    setAuditMsg('Auditing questionable folder...');
    try {
      const res = await base44.functions.invoke('AuditQuestionable', { strict_mode: true });
      const data = res.data || res;
      setAuditMsg(`Audit complete: ${data.promoted || 0} promoted, ${data.trashed || 0} trashed, ${data.still_questionable || 0} upheld (of ${data.audited || 0} audited)`);
      await loadItems();
    } catch (e) {
      setAuditMsg(`Audit error: ${e.message}`);
    } finally {
      setAuditing(false);
      setTimeout(() => setAuditMsg(''), 8000);
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Deep Ingestion System</h1>
          <p className="text-sm text-muted-foreground">Deterministic deep architecture ingestion — any file type, any size, 3 filters, questionable folder + audit agent</p>
        </div>
        <button
          onClick={handleAudit}
          disabled={auditing}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          {auditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Audit Questionable
        </button>
      </div>

      {/* 3 Filters Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <FilterCard icon={Target} title="Filter 1: Accuracy" desc="Factually accurate, verifiable, no hallucinations" color="text-blue-600 bg-blue-50 border-blue-200" />
        <FilterCard icon={Shield} title="Filter 2: Honesty" desc="Truthful, non-deceptive, no hidden payloads" color="text-green-600 bg-green-50 border-green-200" />
        <FilterCard icon={Zap} title="Filter 3: Utility" desc="Verifiably fix, connect, heal, harden, optimize, or evolve" color="text-amber-600 bg-amber-50 border-amber-200" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Items" value={stats.total} icon={HardDrive} color="text-slate-600" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="text-green-600" />
        <StatCard label="Questionable" value={stats.questionable} icon={AlertTriangle} color="text-amber-600" />
        <StatCard label="Trashed" value={stats.trashed} icon={Trash2} color="text-red-600" />
        <StatCard label="Filtering" value={stats.filtering} icon={Loader2} color="text-blue-600" />
        <StatCard label="Total Size" value={formatSize(stats.totalSize)} icon={Database} color="text-purple-600" />
      </div>

      {/* Messages */}
      {ingestMsg && (
        <div className="mb-4 bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-center gap-2">
          {ingesting ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <span className="text-sm text-blue-800">{ingestMsg}</span>
        </div>
      )}
      {auditMsg && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-2">
          {auditing ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4 text-red-600" />}
          <span className="text-sm text-red-800">{auditMsg}</span>
        </div>
      )}

      {/* Ingestion Form */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-yellow-500" /> Ingest New Item
        </h2>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          {['file', 'url', 'text'].map(mode => (
            <button
              key={mode}
              onClick={() => setUploadMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${uploadMode === mode ? 'bg-yellow-400 text-gray-900' : 'bg-muted text-foreground hover:bg-muted/70'}`}
            >
              {mode === 'file' ? 'Upload File' : mode === 'url' ? 'From URL' : 'Paste Text/Prompt'}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: Source config */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Source Type</label>
              <select
                value={formData.source_type}
                onChange={e => setFormData({ ...formData, source_type: e.target.value })}
                className="input"
              >
                {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Floor visualizer prompt v2"
                value={formData.source_name}
                onChange={e => setFormData({ ...formData, source_name: e.target.value })}
                className="input"
              />
            </div>
            {uploadMode === 'url' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">URL *</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.source_url}
                  onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                  className="input"
                />
              </div>
            )}
            {uploadMode === 'text' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Content / Prompt *</label>
                <textarea
                  rows={6}
                  placeholder="Paste prompt, code, document text, or any text content..."
                  value={formData.content_text}
                  onChange={e => setFormData({ ...formData, content_text: e.target.value })}
                  className="input font-mono text-xs"
                />
              </div>
            )}
          </div>

          {/* Right: File upload or info */}
          <div>
            {uploadMode === 'file' ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">File (any type, any size — no restriction)</label>
                <div
                  onClick={() => document.getElementById('ingest-file-input').click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  {selectedFile ? (
                    <div>
                      <FileCode className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)} • {selectedFile.type || 'unknown type'}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to select — any file type, any size</p>
                      <p className="text-xs text-muted-foreground mt-1">Images, videos, audio, code, archives, documents, configs...</p>
                    </div>
                  )}
                </div>
                <input
                  id="ingest-file-input"
                  type="file"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 h-full flex flex-col justify-center">
                <Brain className="w-8 h-8 text-yellow-500 mb-2" />
                <p className="text-sm text-foreground font-medium mb-1">3-Filter Pipeline</p>
                <p className="text-xs text-muted-foreground">Every ingested item passes through Accuracy, Honesty, and Utility filters. Items that fail any filter are moved to the questionable folder for audit.</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleIngest}
          disabled={ingesting}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"
        >
          {ingesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Ingest & Run 3 Filters
        </button>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { v: 'all', label: 'All Items', icon: HardDrive },
          { v: 'approved', label: 'Approved', icon: FolderCheck },
          { v: 'questionable', label: 'Questionable Folder', icon: FolderOpen },
          { v: 'trashed', label: 'Trashed', icon: FolderX },
        ].map(tab => (
          <button
            key={tab.v}
            onClick={() => setView(tab.v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${view === tab.v ? 'bg-yellow-400 text-gray-900' : 'bg-card border border-border text-foreground hover:border-yellow-400'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.v === 'questionable' && stats.questionable > 0 && <span className="ml-1 text-xs bg-amber-200 text-amber-800 px-1.5 rounded-full">{stats.questionable}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input min-w-[140px]">
          <option value="all">All Types</option>
          {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input min-w-[140px]">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={loadItems} className="bg-card border border-border hover:border-yellow-400 text-foreground px-3 py-2 rounded-lg flex items-center gap-1.5 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <HardDrive className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No items match your filters. Ingest something to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => <IngestionRow key={item.id} item={item} formatSize={formatSize} onUpdate={loadItems} />)}
        </div>
      )}
    </div>
  );
}

function FilterCard({ icon: Icon, title, desc, color }) {
  return (
    <div className={`border rounded-lg p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-sm">{title}</span>
      </div>
      <p className="text-xs opacity-80">{desc}</p>
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

function IngestionRow({ item, formatSize, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.ingested;
  const StatusIcon = statusCfg.icon;
  const typeCfg = SOURCE_TYPES.find(t => t.value === item.source_type) || SOURCE_TYPES.find(t => t.value === 'file');
  const TypeIcon = typeCfg.icon;

  return (
    <div className={`border rounded-lg bg-card overflow-hidden ${item.status === 'questionable' ? 'border-amber-300' : item.status === 'trashed' ? 'border-red-300' : 'border-border'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <TypeIcon className={`w-5 h-5 shrink-0 ${typeCfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">{item.source_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color} flex items-center gap-1 shrink-0`}>
              <StatusIcon className="w-3 h-3" /> {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{item.source_type}</span>
            {item.size_bytes > 0 && <span>{formatSize(item.size_bytes)}</span>}
            {item.mime_type && <span className="truncate">{item.mime_type}</span>}
            {item.audit_count > 0 && <span className="text-amber-600">audits: {item.audit_count}</span>}
          </div>
        </div>

        {/* Filter badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <FilterBadge label="A" status={item.filter_accuracy} />
          <FilterBadge label="H" status={item.filter_honesty} />
          <FilterBadge label="U" status={item.filter_utility} />
        </div>

        {/* Utility action */}
        {item.utility_action && item.utility_action !== 'none' && (
          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium shrink-0">
            {item.utility_action}
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {item.content_summary && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Summary:</span>
              <p className="text-sm text-foreground mt-0.5">{item.content_summary}</p>
            </div>
          )}

          {/* Filter details */}
          <div className="grid sm:grid-cols-3 gap-2">
            <FilterDetail label="Accuracy" status={item.filter_accuracy} reason={item.filter_accuracy_reason} />
            <FilterDetail label="Honesty" status={item.filter_honesty} reason={item.filter_honesty_reason} />
            <FilterDetail label="Utility" status={item.filter_utility} reason={item.filter_utility_reason} />
          </div>

          {/* Utility target */}
          {item.utility_target && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Utility Target:</span>
              <p className="text-sm text-foreground mt-0.5">{item.utility_target}</p>
              {item.utility_verification && <p className="text-xs text-muted-foreground mt-0.5">Verification: {item.utility_verification}</p>}
            </div>
          )}

          {/* Protocol compliance */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">Protocol Compliance:</span>
            <span className={`text-sm ml-2 font-medium ${item.protocol_compliance ? 'text-green-600' : 'text-red-600'}`}>
              {item.protocol_compliance ? 'Compliant' : 'Non-compliant'}
            </span>
            {item.protocol_violations && item.protocol_violations.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {item.protocol_violations.map((v, i) => <li key={i} className="text-xs text-red-600">• {v}</li>)}
              </ul>
            )}
          </div>

          {/* Questionable reason */}
          {item.questionable_reason && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              <span className="text-xs font-medium text-amber-700">Questionable Reason:</span>
              <p className="text-xs text-amber-800 mt-0.5">{item.questionable_reason}</p>
            </div>
          )}

          {/* Trashed reason */}
          {item.trashed_reason && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <span className="text-xs font-medium text-red-700">Trashed Reason:</span>
              <p className="text-xs text-red-800 mt-0.5">{item.trashed_reason}</p>
            </div>
          )}

          {/* Content text preview */}
          {item.content_text && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Content Preview:</span>
              <pre className="text-xs text-foreground mt-0.5 bg-muted/50 rounded p-2 max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                {item.content_text.slice(0, 2000)}{item.content_text.length > 2000 ? '...' : ''}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
            <span>Ingested: {new Date(item.ingested_at).toLocaleString()}</span>
            {item.last_audited_at && <span>Last audited: {new Date(item.last_audited_at).toLocaleString()}</span>}
            {item.trashed_at && <span>Trashed: {new Date(item.trashed_at).toLocaleString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBadge({ label, status }) {
  const color = status === 'pass' ? 'bg-green-100 text-green-700' : status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500';
  return <span className={`text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold ${color}`}>{label}</span>;
}

function FilterDetail({ label, status, reason }) {
  const color = status === 'pass' ? 'text-green-600' : status === 'fail' ? 'text-red-600' : 'text-slate-500';
  const Icon = status === 'pass' ? CheckCircle2 : status === 'fail' ? XCircle : Loader2;
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className={`w-3 h-3 ${status === 'pending' ? 'animate-spin' : ''}`} />
        {label}: {status || 'pending'}
      </div>
      {reason && <p className="text-xs text-muted-foreground mt-1">{reason}</p>}
    </div>
  );
}