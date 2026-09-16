import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, Loader2, RefreshCw, Play, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PHASE_COLORS = {
  reflect: 'bg-blue-50 text-blue-700 border-blue-200',
  analyze: 'bg-purple-50 text-purple-700 border-purple-200',
  detect: 'bg-amber-50 text-amber-700 border-amber-200',
  recommend: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  implement: 'bg-green-50 text-green-700 border-green-200',
  validate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  audit: 'bg-red-50 text-red-700 border-red-200',
  self_reflect: 'bg-primary/10 text-primary border-primary/20',
};

export default function SelfReflection() {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.ReflectionRecord.list('-created_date', 100).catch(() => []);
      setReflections(rows || []);
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runReflection = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke('SystemSelfReflection', {});
      setToast({ type: 'success', msg: 'Self-reflection cycle triggered.' });
      setTimeout(load, 3000);
    } catch (e) { setToast({ type: 'error', msg: `Reflection failed: ${e.message}` }); }
    setRunning(false);
  };

  const stats = {
    total: reflections.length,
    passes: reflections.filter(r => r.validation_status === 'pass').length,
    fails: reflections.filter(r => r.validation_status === 'fail').length,
    autoFixed: reflections.filter(r => r.auto_fix_attempted).length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Self-Reflection Log</h1>
              <p className="text-xs text-muted-foreground">The system's own reflections, improvement decisions, and auto-fix outcomes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runReflection} disabled={running} className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 font-medium">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run Reflection
            </button>
            <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Reflections" value={stats.total} />
          <StatCard label="Validated (Pass)" value={stats.passes} tone="good" />
          <StatCard label="Failed" value={stats.fails} tone={stats.fails > 0 ? 'bad' : 'neutral'} />
          <StatCard label="Auto-Fixes Attempted" value={stats.autoFixed} tone="info" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : reflections.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">No reflections yet. Click "Run Reflection" to start a self-reflection cycle.</div>
        ) : (
          <div className="space-y-3">
            {reflections.map(r => {
              const delta = (r.measured_score || 0) - (r.expected_score || 0);
              const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
              return (
                <div key={r.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${PHASE_COLORS[r.phase] || 'bg-muted text-muted-foreground border-border'}`}>{r.phase}</span>
                    <div className="min-w-0 flex-1">
                      {r.url && <div className="text-xs font-mono text-muted-foreground truncate">{r.url}</div>}
                      {r.query && <div className="text-xs text-foreground">"{r.query}"</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.validation_status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${r.validation_status === 'pass' ? 'bg-green-50 text-green-700' : r.validation_status === 'fail' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{r.validation_status}</span>
                      )}
                      {delta !== 0 && (
                        <span className={`flex items-center gap-0.5 text-[10px] font-medium ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <TrendIcon className="w-3 h-3" /> {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.deployed && <div className="text-xs text-foreground mb-1"><span className="text-muted-foreground">Deployed:</span> {r.deployed}</div>}
                  {r.expected && <div className="text-xs text-muted-foreground mb-1"><span className="font-medium">Expected:</span> {r.expected}</div>}
                  {r.measured && <div className="text-xs text-muted-foreground mb-1"><span className="font-medium">Measured:</span> {r.measured}</div>}
                  {r.binding_constraint && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">⚠ Binding constraint: {r.binding_constraint}</div>}
                  {r.auto_fix_attempted && (
                    <div className="text-xs mt-2 flex items-center gap-2">
                      <span className="text-muted-foreground">Auto-fix:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${r.auto_fix_result === 'fixed' ? 'bg-green-50 text-green-700' : r.auto_fix_result === 'unresolved' ? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'}`}>{r.auto_fix_result}</span>
                    </div>
                  )}
                  {r.failed_guidelines && r.failed_guidelines.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.failed_guidelines.map((g, i) => <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600 border border-red-200">{g}</span>)}
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-2">{(r.occurred_at || r.created_date || '').slice(0, 19).replace('T', ' ')}</div>
                </div>
              );
            })}
          </div>
        )}

        {toast && <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`} onClick={() => setToast(null)}>{toast.msg}</div>}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const colors = { good: 'text-green-600', bad: 'text-red-600', info: 'text-blue-600', neutral: 'text-foreground' };
  return <div className="bg-card border border-border rounded-lg p-4"><div className="text-xs text-muted-foreground mb-1">{label}</div><div className={`text-2xl font-semibold tabular ${colors[tone] || 'text-foreground'}`}>{value}</div></div>;
}