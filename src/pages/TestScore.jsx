import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Play, CheckCircle2, XCircle, AlertCircle, Gauge } from 'lucide-react';

export default function TestScore() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.ValidationTest.list('-created_date', 200).catch(() => []);
      setTests(rows || []);
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runValidation = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke('ValidateSystem', {});
      setToast({ type: 'success', msg: 'Validation suite triggered — scores will refresh.' });
      setTimeout(load, 3000);
    } catch (e) { setToast({ type: 'error', msg: `Validation failed: ${e.message}` }); }
    setRunning(false);
  };

  const runScoring = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke('ScoreValidation', {});
      setToast({ type: 'success', msg: 'Scoring complete.' });
      load();
    } catch (e) { setToast({ type: 'error', msg: `Scoring failed: ${e.message}` }); }
    setRunning(false);
  };

  // Group tests by category and compute scores
  const categories = React.useMemo(() => {
    const map = {};
    tests.forEach(t => {
      const cat = t.category || t.test_category || 'general';
      if (!map[cat]) map[cat] = { name: cat, total: 0, passed: 0, failed: 0, pending: 0, tests: [] };
      map[cat].total++;
      map[cat].tests.push(t);
      if (t.status === 'pass' || t.status === 'PASS') map[cat].passed++;
      else if (t.status === 'fail' || t.status === 'FAIL') map[cat].failed++;
      else map[cat].pending++;
    });
    return Object.values(map).map(c => ({ ...c, score: c.total ? Math.round((c.passed / c.total) * 100) : 0 }));
  }, [tests]);

  const overallScore = categories.length ? Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length) : 0;
  const totalTests = tests.length;
  const totalPassed = tests.filter(t => t.status === 'pass' || t.status === 'PASS').length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Test & Score</h1>
              <p className="text-xs text-muted-foreground">Validation tests with a 0–100 score per category</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runValidation} disabled={running} className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 font-medium">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run Validation
            </button>
            <button onClick={runScoring} disabled={running} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Score
            </button>
            <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Overall Score Ring */}
        <div className="flex items-center gap-6 mb-6 bg-card border border-border rounded-lg p-6">
          <ScoreRing score={overallScore} />
          <div className="flex-1 grid grid-cols-3 gap-4">
            <Stat label="Total Tests" value={totalTests} />
            <Stat label="Passed" value={totalPassed} tone="good" />
            <Stat label="Categories" value={categories.length} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">No validation tests yet. Click "Run Validation" to execute the suite.</div>
        ) : (
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat.name} className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading text-sm font-semibold text-foreground capitalize">{cat.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{cat.passed}/{cat.total} passed</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${cat.score >= 80 ? 'bg-green-50 text-green-700 border border-green-200' : cat.score >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{cat.score}/100</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
                  <div className={`h-full ${cat.score >= 80 ? 'bg-green-500' : cat.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${cat.score}%` }} />
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {cat.tests.map(t => {
                    const pass = t.status === 'pass' || t.status === 'PASS';
                    const fail = t.status === 'fail' || t.status === 'FAIL';
                    return (
                      <div key={t.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/30">
                        {pass ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : fail ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span className="text-foreground truncate flex-1">{t.test_name || t.name || t.description || 'Test'}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{t.status || 'pending'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`} onClick={() => setToast(null)}>{toast.msg}</div>}
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 52, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular" style={{ color }}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const colors = { good: 'text-green-600' };
  return <div><div className={`text-2xl font-semibold tabular ${colors[tone] || 'text-foreground'}`}>{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}