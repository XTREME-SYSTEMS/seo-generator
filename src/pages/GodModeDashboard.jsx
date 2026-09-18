import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Loader2, AlertCircle, RotateCcw, Activity } from 'lucide-react';
import GodModeButton from '@/components/godmode/GodModeButton';
import StageProgress from '@/components/godmode/StageProgress';
import WinnerBanner from '@/components/godmode/WinnerBanner';
import ParallelSimChart from '@/components/godmode/ParallelSimChart';
import RevenueChart from '@/components/godmode/RevenueChart';
import CompetitiveTable from '@/components/godmode/CompetitiveTable';
import GoldenEggsPanel from '@/components/godmode/GoldenEggsPanel';
import ValuationCard from '@/components/godmode/ValuationCard';

export default function GodModeDashboard() {
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [vision, setVision] = useState('Build an autonomous digital empire that dominates Google search, identifies every golden-egg technology, and generates maximum revenue with zero human input');

  const execute = useCallback(async () => {
    setStatus('running');
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('GodModeOrchestrator', {
        vision,
        iterations: 100,
        generate_site: true,
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStatus('done');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [vision]);

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center">
            <Zap className="w-7 h-7 text-gray-900" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">God Mode Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              One button runs 1,000 parallel simulations, discovers golden eggs, benchmarks competitors, generates sites, and calculates your $15M valuation
            </p>
          </div>
          {status === 'done' && (
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium text-foreground"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
        </div>

        {/* Vision input */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Your Vision</label>
          <textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            disabled={status === 'running'}
            rows={2}
            className="w-full input resize-none"
            placeholder="Describe your ultimate vision..."
          />
        </div>

        {/* The One Button */}
        <div className="mb-8">
          <GodModeButton onClick={execute} status={status} disabled={false} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Execution Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button onClick={reset} className="mt-2 text-xs text-red-600 underline">Try again</button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {status === 'running' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
            <p className="text-sm text-muted-foreground">Running 1,000 parallel simulations, discovering golden eggs, benchmarking competitors...</p>
            <div className="w-full max-w-md bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full bg-yellow-400 animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Results */}
        {status === 'done' && result && (
          <div className="space-y-6">
            {/* Stage Progress */}
            <StageProgress stages={result.stages} />

            {/* Winner Banner */}
            <WinnerBanner
              winner={result.winner}
              runnerUp={result.runner_up}
              totalSimulations={result.total_simulations}
            />

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <ParallelSimChart simulations={result.simulations} />
              <RevenueChart projectedMonthly={result.winner?.projected_monthly} />
            </div>

            {/* Valuation + Competitive */}
            <div className="grid lg:grid-cols-2 gap-4">
              <ValuationCard valuation={result.valuation} />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-foreground">Autonomous Audit Result</h3>
                </div>
                {result.audit ? (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-2">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-[300px]">
                      {typeof result.audit === 'string'
                        ? result.audit
                        : JSON.stringify(result.audit, null, 2).slice(0, 2000)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
                    Audit was skipped or failed
                  </div>
                )}
              </div>
            </div>

            {/* Competitive Table */}
            <CompetitiveTable competitors={result.competitive_comparison} />

            {/* Golden Eggs */}
            <GoldenEggsPanel
              goldenEggs={result.golden_eggs}
              techAccelerators={result.tech_accelerators}
            />

            {/* Generated Site */}
            {result.generated_site && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-bold text-foreground mb-3">Programmatically Generated Site</h3>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-[400px]">
                  {typeof result.generated_site === 'string'
                    ? result.generated_site
                    : JSON.stringify(result.generated_site, null, 2).slice(0, 3000)}
                </pre>
              </div>
            )}

            {/* Duration */}
            <div className="text-center text-xs text-muted-foreground">
              God Mode completed in {(result.duration_ms / 1000).toFixed(1)}s — {result.total_simulations?.toLocaleString()} total simulations
            </div>
          </div>
        )}

        {/* Idle state */}
        {status === 'idle' && (
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <InfoCard
              icon={Zap}
              title="1,000 Parallel Simulations"
              desc="100 Monte Carlo iterations × 10 strategies, run in parallel, with P10–P90 confidence bands to identify the absolute best strategy."
            />
            <InfoCard
              icon={Activity}
              title="Golden Egg Discovery"
              desc="Live web search identifies every technology and method that can double your speed, capabilities, and digital presence."
            />
            <InfoCard
              icon={RotateCcw}
              title="Autonomous Audit Loop"
              desc="Recursive self-audit validates every result. The system proves it works — then optimizes itself to exceed expectations."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-yellow-600" />
      </div>
      <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}