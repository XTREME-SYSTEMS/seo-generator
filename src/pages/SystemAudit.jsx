import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw, FileSearch, Gauge, Bug } from 'lucide-react';

export default function SystemAudit() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [scores, setScores] = useState([]);
  const [forensics, setForensics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s, f] = await Promise.all([
        base44.entities.BenchmarkCheck.list('-created_date', 200).catch(() => []),
        base44.entities.ValidationScore.list('-created_date', 100).catch(() => []),
        base44.entities.ForensicFinding.list('-created_date', 100).catch(() => []),
      ]);
      setBenchmarks(b || []);
      setScores(s || []);
      setForensics(f || []);
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAudit = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke('RunBenchmarkConstitution', {});
      setToast({ type: 'success', msg: 'Full system audit triggered — results will refresh shortly.' });
      setTimeout(load, 3000);
    } catch (e) { setToast({ type: 'error', msg: `Audit failed: ${e.message}` }); }
    setRunning(false);
  };

  const passCount = benchmarks.filter(b => b.status === 'PASS').length;
  const failCount = benchmarks.filter(b => b.status === 'FAIL').length;
  const notRunCount = benchmarks.filter(b => b.status === 'NOT_RUN').length;
  const scoreSum = scores.reduce((s, v) => s + (v.earned_score || 0), 0);
  const scoreMax = scores.reduce((s, v) => s + (v.weight || 1), 0);
  const overallPct = scoreMax ? Math.round((scoreSum / scoreMax) * 100) : 0;
  const p0Count = forensics.filter(f => (f.severity || '').toUpperCase() === 'P0').length;

  const families = [...new Set(benchmarks.map(b => b.family).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">System Audit — Unified Results</h1>
              <p className="text-xs text-muted-foreground">Every benchmark, validation score, and forensic finding on one page — scheduled to run daily</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runAudit} disabled={running} className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 font-medium">
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Run Full Audit
            </button>
            <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <ScoreCard label="Overall Score" value={`${overallPct}%`} icon={Gauge} tone={overallPct >= 80 ? 'good' : overallPct >= 50 ? 'warn' : 'bad'} />
          <ScoreCard label="Checks Passed" value={`${passCount}/${benchmarks.length}`} icon={CheckCircle2} tone="good" />
          <ScoreCard label="Checks Failed" value={failCount} icon={XCircle} tone={failCount > 0 ? 'bad' : 'good'} />
          <ScoreCard label="Not Run" value={notRunCount} icon={AlertTriangle} tone="warn" />
          <ScoreCard label="P0 Findings" value={p0Count} icon={Bug} tone={p0Count > 0 ? 'bad' : 'good'} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {/* Validation Scores */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" /> Validation Scores
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {scores.map(s => {
                  const pct = s.weight ? Math.round(((s.earned_score || 0) / s.weight) * 100) : 0;
                  const tone = s.status === 'PASS' ? 'good' : s.status === 'FAIL' ? 'bad' : s.status === 'BLOCKED' ? 'bad' : 'warn';
                  const colors = { good: 'border-green-200 bg-green-50', bad: 'border-red-200 bg-red-50', warn: 'border-amber-200 bg-amber-50' };
                  return (
                    <div key={s.id} className={`rounded-md border p-3 ${colors[tone]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground truncate">{s.domain}</span>
                        <span className="text-[10px] font-bold">{pct}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{s.status} · {s.evidence || '—'}</div>
                      {s.remediation && <div className="text-[10px] text-amber-700 mt-1">→ {s.remediation}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Benchmark Checks by Family */}
            {families.map(family => (
              <div key={family} className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-primary" /> {family}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({benchmarks.filter(b => b.family === family && b.status === 'PASS').length}/{benchmarks.filter(b => b.family === family).length} pass)
                  </span>
                </h3>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {benchmarks.filter(b => b.family === family).map(b => (
                    <div key={b.id} className="flex items-start gap-2 text-xs border-b border-border/50 py-1.5">
                      {b.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                       : b.status === 'FAIL' ? <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                       : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{b.benchmark_id}</span>
                      <span className="text-foreground flex-1">{b.check}</span>
                      {b.mandatory && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 shrink-0">MANDATORY</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Forensic Findings */}
            {forensics.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-primary" /> Forensic Findings ({forensics.length})
                </h3>
                <div className="space-y-2">
                  {forensics.map(f => (
                    <div key={f.id} className="flex items-start gap-2 rounded-md border border-border p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${(f.severity || '').toUpperCase() === 'P0' ? 'bg-red-100 text-red-700' : (f.severity || '').toUpperCase() === 'P1' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {f.severity || 'P2'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground">{f.finding || f.title}</div>
                        {f.recommendation && <div className="text-[10px] text-muted-foreground mt-0.5">→ {f.recommendation}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`} onClick={() => setToast(null)}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ label, value, icon: Icon, tone }) {
  const colors = { good: 'border-green-200 text-green-600', bad: 'border-red-200 text-red-600', warn: 'border-amber-200 text-amber-600' };
  return (
    <div className={`bg-card border rounded-lg p-4 ${colors[tone]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <p className={`text-2xl font-semibold tabular ${colors[tone].split(' ')[1]}`}>{value}</p>
    </div>
  );
}