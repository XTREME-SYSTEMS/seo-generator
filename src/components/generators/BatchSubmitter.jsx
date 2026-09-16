import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, Zap, CheckCircle2, XCircle } from 'lucide-react';

export default function BatchSubmitter() {
  const [targets, setTargets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [companyData, setCompanyData] = useState({
    business_name: '',
    website_url: '',
    description: '',
    category: '',
    contact_email: '',
    phone: '',
    address: '',
  });
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [t, j] = await Promise.all([
        base44.entities.SubmissionTarget.list('-created_date', 500),
        base44.entities.BatchSubmissionJob.list('-created_date', 20),
      ]);
      setTargets(t);
      setJobs(j);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === targets.length) setSelected(new Set());
    else setSelected(new Set(targets.map(t => t.id)));
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('BatchSubmitToSites', {
        job_name: `Batch ${new Date().toLocaleDateString()}`,
        target_ids: Array.from(selected),
        company_data: companyData,
      });
      setToast({ type: 'success', msg: `Submitted to ${res.data?.submitted || 0} sites, ${res.data?.failed || 0} failed` });
      setSelected(new Set());
      await loadData();
    } catch (e) {
      setToast({ type: 'error', msg: `Batch failed: ${e.message}` });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Data Form */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">Batch Submitter</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Fill out your company data once, select targets, and submit to all of them in a single batch. Uses CloudBrowser for form-based sites and direct API calls for API-enabled sites.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Business Name" value={companyData.business_name} onChange={v => setCompanyData(p => ({ ...p, business_name: v }))} />
          <Input label="Website URL" value={companyData.website_url} onChange={v => setCompanyData(p => ({ ...p, website_url: v }))} />
          <Input label="Category" value={companyData.category} onChange={v => setCompanyData(p => ({ ...p, category: v }))} />
          <Input label="Contact Email" value={companyData.contact_email} onChange={v => setCompanyData(p => ({ ...p, contact_email: v }))} />
          <Input label="Phone" value={companyData.phone} onChange={v => setCompanyData(p => ({ ...p, phone: v }))} />
          <Input label="Address" value={companyData.address} onChange={v => setCompanyData(p => ({ ...p, address: v }))} />
        </div>
        <div className="mt-3">
          <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
          <textarea
            value={companyData.description}
            onChange={e => setCompanyData(p => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
          />
        </div>
      </div>

      {/* Selection + Submit */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={selectAll} className="text-xs px-3 py-1.5 rounded-md bg-card border border-border text-foreground hover:border-primary/30">
            {selected.size === targets.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || selected.size === 0}
          className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {submitting ? 'Submitting...' : `Submit to ${selected.size} Sites`}
        </button>
      </div>

      {/* Targets */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {targets.map(t => (
            <label key={t.id} className="flex items-center gap-3 bg-card border border-border rounded p-2 cursor-pointer hover:border-primary/30">
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggleSelect(t.id)}
                className="accent-primary"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{t.site_name}</span>
                <span className="text-xs text-muted-foreground ml-2">{t.category?.replace(/_/g, ' ')}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${t.submission_status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : t.submission_status === 'identified' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{t.submission_status?.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      )}

      {/* Job History */}
      {jobs.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Submission History</h4>
          <div className="space-y-1.5">
            {jobs.map(j => (
              <div key={j.id} className="flex items-center justify-between gap-3 text-xs border-b border-border pb-1.5">
                <span className="font-medium text-foreground">{j.job_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{j.submitted_count}</span>
                  <span className="text-rose-600 flex items-center gap-1"><XCircle className="w-3 h-3" />{j.failed_count}</span>
                  <span className="text-muted-foreground">/ {j.total_targets}</span>
                  <span className={`px-1.5 py-0.5 rounded ${j.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : j.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{j.status}</span>
                </div>
              </div>
            ))}
          </div>
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

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
      />
    </div>
  );
}