import React, { useState } from 'react';
import { Loader2, FileText, TrendingUp, AlertCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function SalesPitchesTab({ urls, buyers, onRefresh }) {
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState('');
  const [viewingPitch, setViewingPitch] = useState(null);

  const handleGeneratePitch = async (buyer) => {
    setGenerating(buyer.id);
    setError('');
    try {
      const res = await fetch('/functions/GenerateSalesPitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_prospect_id: buyer.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Pitch generation failed');
      }
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  };

  const handleQuickPitch = async (urlId) => {
    setGenerating(`url-${urlId}`);
    setError('');
    try {
      const res = await fetch('/functions/GenerateSalesPitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategic_url_id: urlId, company_name: 'General Prospect' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Pitch generation failed');
      }
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  };

  const pitchedBuyers = buyers.filter(b => b.pitch_document);
  const unpitchedUrls = urls.filter(u => !buyers.some(b => b.strategic_url_id === u.id && b.pitch_document));

  return (
    <div>
      {/* Quick pitch from strategic URL */}
      {unpitchedUrls.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <h4 className="font-semibold text-foreground mb-3">Quick Pitch Generator</h4>
          <p className="text-sm text-muted-foreground mb-3">Generate a sales pitch directly from a strategic URL (creates a general buyer prospect):</p>
          <div className="flex flex-wrap gap-2">
            {unpitchedUrls.slice(0, 10).map(u => (
              <button
                key={u.id}
                onClick={() => handleQuickPitch(u.id)}
                disabled={generating === `url-${u.id}`}
                className="text-xs bg-muted hover:bg-yellow-100 disabled:opacity-60 text-foreground px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {generating === `url-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                {u.url}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</p>}

      {/* Generated Pitches */}
      {pitchedBuyers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No sales pitches generated yet. Select a strategic URL above or add a buyer prospect first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pitchedBuyers.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Pitch Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-foreground">{b.company_name}</h4>
                    {b.strategic_url && <p className="text-sm text-yellow-600 font-medium">{b.strategic_url}</p>}
                    {b.stats_summary && <p className="text-sm text-muted-foreground mt-1">{b.stats_summary}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Price Evaluation</div>
                    <div className="text-2xl font-bold text-yellow-600">${(b.price_evaluation || 0).toLocaleString()}</div>
                  </div>
                </div>
                {b.roi_projection && (
                  <div className="mt-3 flex items-start gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{b.roi_projection}</span>
                  </div>
                )}
              </div>

              {/* Pitch Actions */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
                <button
                  onClick={() => setViewingPitch(b)}
                  className="text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> View Full Pitch
                </button>
                <button
                  onClick={() => handleGeneratePitch(b)}
                  disabled={generating === b.id}
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 flex items-center gap-1.5"
                >
                  {generating === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Regenerate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Pitch Modal */}
      {viewingPitch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingPitch(null)}>
          <div className="bg-background max-w-3xl w-full max-h-[85vh] rounded-lg border border-border overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Sales Pitch — {viewingPitch.company_name}</h3>
                {viewingPitch.strategic_url && <p className="text-sm text-yellow-600">{viewingPitch.strategic_url}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-yellow-600">${(viewingPitch.price_evaluation || 0).toLocaleString()}</span>
                <button onClick={() => setViewingPitch(null)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
              <ReactMarkdown>{viewingPitch.pitch_document}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}