import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, Plus, AlertCircle, Building2, Mail, Phone, ExternalLink } from 'lucide-react';

export default function BuyerProspectsTab({ urls, buyers, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', domain: '', industry: '', contact_name: '', contact_email: '', contact_phone: '', linkedin_url: '', strategic_url_id: '', estimated_budget: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.company_name) { setError('Company name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const selectedUrl = urls.find(u => u.id === form.strategic_url_id);
      await base44.entities.BuyerProspect.create({
        ...form,
        strategic_url: selectedUrl?.url || '',
        estimated_budget: Number(form.estimated_budget) || 0,
        pitch_status: 'identified',
      });
      setForm({ company_name: '', domain: '', industry: '', contact_name: '', contact_email: '', contact_phone: '', linkedin_url: '', strategic_url_id: '', estimated_budget: '' });
      setShowForm(false);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sortedBuyers = [...buyers].sort((a, b) => (b.estimated_budget || 0) - (a.estimated_budget || 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Buyer Prospects</h3>
          <p className="text-sm text-muted-foreground">Companies most likely to buy your strategic URL portfolios</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Buyer
        </button>
      </div>

      {/* Add Buyer Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-5 mb-4">
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Company Name *" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} />
            <input className="input" placeholder="Domain (e.g. company.com)" value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} />
            <input className="input" placeholder="Industry" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} />
            <input className="input" placeholder="Contact Name" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} />
            <input className="input" placeholder="Contact Email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} />
            <input className="input" placeholder="Contact Phone" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} />
            <input className="input" placeholder="LinkedIn URL" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} />
            <input className="input" type="number" placeholder="Estimated Budget ($)" value={form.estimated_budget} onChange={e => setForm({...form, estimated_budget: e.target.value})} />
            <select className="input md:col-span-2" value={form.strategic_url_id} onChange={e => setForm({...form, strategic_url_id: e.target.value})}>
              <option value="">Link to Strategic URL...</option>
              {urls.map(u => <option key={u.id} value={u.id}>{u.url} (${(u.estimated_site_value || 0).toLocaleString()})</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} disabled={saving} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium text-sm px-4 py-2 rounded-lg flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Buyer
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground px-4 py-2">Cancel</button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}
        </div>
      )}

      {/* Buyers List */}
      {sortedBuyers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No buyer prospects yet. Add companies that would want to acquire your strategic URLs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBuyers.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-foreground">{b.company_name}</h4>
                    <PitchStatusBadge status={b.pitch_status} />
                  </div>
                  {b.strategic_url && <p className="text-xs text-yellow-600 font-medium mb-2">Interested in: {b.strategic_url}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {b.industry && <span>{b.industry}</span>}
                    {b.domain && (
                      <a href={`https://${b.domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                        {b.domain} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {b.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {b.contact_email}</span>}
                    {b.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {b.contact_phone}</span>}
                  </div>
                  {b.reason_to_buy && <p className="text-sm text-muted-foreground mt-2">{b.reason_to_buy}</p>}
                  {b.price_evaluation > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Price evaluation: </span>
                      <span className="font-bold text-yellow-600">${b.price_evaluation.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Est. Budget</div>
                  <div className="text-lg font-bold text-foreground">${(b.estimated_budget || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PitchStatusBadge({ status }) {
  const colors = {
    identified: 'bg-muted text-muted-foreground',
    pitched: 'bg-blue-100 text-blue-700',
    negotiating: 'bg-yellow-100 text-yellow-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${colors[status] || colors.identified}`}>{status}</span>;
}