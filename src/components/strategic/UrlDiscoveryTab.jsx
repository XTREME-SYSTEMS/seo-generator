import React, { useState } from 'react';
import { Loader2, Search, AlertCircle } from 'lucide-react';

const LOCATION_TYPES = [
  { value: 'near_you', label: 'Near You' },
  { value: 'near_me', label: 'Near Me' },
  { value: 'emergency', label: 'Emergency Services' },
  { value: 'service', label: 'Service-Based' },
  { value: 'local', label: 'Local' },
];

const NICHES = [
  'plumbing', 'water damage restoration', 'locksmith', 'towing', 'roofing',
  'HVAC', 'electrical', 'pest control', 'tree service', 'junk removal',
  'concrete polishing', 'epoxy flooring', 'garage door repair', 'fence installation',
  'landscaping', 'solar installation', 'waterproofing', 'mold remediation',
  'emergency dentist', 'emergency vet', 'emergency plumber',
];

export default function UrlDiscoveryTab({ urls, onRefresh }) {
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [locationType, setLocationType] = useState('near_you');
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const handleDiscover = async () => {
    const finalNiche = customNiche || niche;
    if (!finalNiche) {
      setError('Please select or enter a niche');
      return;
    }
    setDiscovering(true);
    setError('');
    try {
      const res = await fetch('/functions/DiscoverStrategicUrls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: finalNiche, location_type: locationType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Discovery failed');
      }
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setDiscovering(false);
    }
  };

  const sorted = [...urls].sort((a, b) => (b.estimated_site_value || 0) - (a.estimated_site_value || 0));

  return (
    <div>
      {/* Discovery Controls */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Discover Strategic URLs</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Niche / Industry</label>
            <select
              value={niche}
              onChange={(e) => { setNiche(e.target.value); setCustomNiche(''); }}
              className="w-full input"
            >
              <option value="">Select a niche...</option>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Or Enter Custom Niche</label>
            <input
              type="text"
              value={customNiche}
              onChange={(e) => setCustomNiche(e.target.value)}
              placeholder="e.g. emergency roof repair"
              className="w-full input"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">URL Type</label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="w-full input"
            >
              {LOCATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="mt-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
        >
          {discovering ? <><Loader2 className="w-4 h-4 animate-spin" /> Discovering...</> : <><Search className="w-4 h-4" /> Discover Strategic URLs</>}
        </button>
        {error && <p className="mt-3 text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</p>}
      </div>

      {/* Results Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No strategic URLs yet. Run a discovery above to find high-value URLs.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">URL</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Search Vol</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">CPC</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Mo. Leads</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Mo. Revenue</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Site Value</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(u => (
                  <React.Fragment key={u.id}>
                    <tr
                      className="border-b border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{u.url}</div>
                        <div className="text-xs text-muted-foreground">{u.primary_keyword || u.niche}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">{u.keyword_category}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular">{(u.search_volume_estimate || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular">${(u.cpc_estimate || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular">{(u.estimated_monthly_leads || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular font-medium">${(u.estimated_monthly_revenue || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular font-bold text-yellow-600">${(u.estimated_site_value || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{u.status}</span>
                      </td>
                    </tr>
                    {expandedId === u.id && (
                      <tr className="bg-muted/20">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Why This URL Is Strategic</h4>
                              <p className="text-sm text-muted-foreground">{u.rationale || 'No rationale available.'}</p>
                              {u.secondary_keywords?.length > 0 && (
                                <div className="mt-3">
                                  <span className="text-xs text-muted-foreground">Secondary keywords: </span>
                                  {u.secondary_keywords.map((k, i) => (
                                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 mr-1">{k}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <Metric label="Lead Potential Score" value={`${u.lead_gen_potential_score || 0}/100`} />
                              <Metric label="Lead Value" value={`$${(u.estimated_lead_value || 0)}`} />
                              <Metric label="Programmatic Pages" value={(u.programmatic_pages_potential || 0).toLocaleString()} />
                              <Metric label="1st Page Difficulty" value={`${u.google_first_page_difficulty || 0}/100`} />
                              <Metric label="Target Buyer" value={u.target_buyer_industry || 'N/A'} />
                              <Metric label="Competition" value={u.competition_level || 'N/A'} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}