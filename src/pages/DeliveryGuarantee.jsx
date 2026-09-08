import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import { Button } from '@/components/ui/button';
import { ShieldCheck, AlertTriangle, Loader2, Zap, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function DeliveryGuarantee() {
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [orchestratorResult, setOrchestratorResult] = useState(null);

  const loadScorecard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('DeliveryGuarantee', {});
      setScorecard(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadScorecard(); }, [loadScorecard]);

  async function runFullCycle() {
    setRunning(true);
    setOrchestratorResult(null);
    try {
      const { data } = await base44.functions.invoke('MasterOrchestrator', {
        phases: ['sync', 'reflect', 'detect', 'suggest', 'implement', 'fix', 'validate', 'deliver'],
      });
      setOrchestratorResult(data);
      if (data?.delivery_report) setScorecard(data.delivery_report);
    } catch (e) {
      setOrchestratorResult({ error: e.message });
    }
    setRunning(false);
  }

  if (loading) return <Loading label="Auditing delivery against pricing promises" />;

  const score = scorecard?.delivery_score ?? 0;
  const delivered = scorecard?.delivered ?? 0;
  const partial = scorecard?.partial ?? 0;
  const gap = scorecard?.gap ?? 0;
  const total = scorecard?.total_checks ?? 0;

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div>
      <PageHeader
        eyebrow="Delivery Guarantee"
        title="Pricing Promise Delivery Audit"
        description="Every feature promised in the pricing page is checked against actual system state. This is the deterministic proof that the autonomous system delivers what customers pay for."
        actions={
          <div className="flex gap-2">
            <Button onClick={loadScorecard} disabled={loading} variant="outline" size="sm">
              <RefreshCw className="h-3.5 w-3.5" />
              Re-audit
            </Button>
            <Button onClick={runFullCycle} disabled={running} size="sm">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Run Full Autonomous Cycle
            </Button>
          </div>
        }
      />

      {/* Score Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-slate-50/50 p-4">
          <div className="text-xs font-medium text-muted-foreground">Delivery Score</div>
          <div className={`mt-1 font-heading text-3xl font-bold ${scoreColor}`}>{score}%</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full ${scoreBg} transition-all`} style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-slate-50/50 p-4">
          <div className="text-xs font-medium text-muted-foreground">Delivered</div>
          <div className="mt-1 flex items-center gap-1.5 font-heading text-3xl font-bold text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />{delivered}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">of {total} promises</div>
        </div>
        <div className="rounded-lg border border-border bg-slate-50/50 p-4">
          <div className="text-xs font-medium text-muted-foreground">Partial</div>
          <div className="mt-1 flex items-center gap-1.5 font-heading text-3xl font-bold text-amber-600">
            <Clock className="h-6 w-6" />{partial}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">in progress</div>
        </div>
        <div className="rounded-lg border border-border bg-slate-50/50 p-4">
          <div className="text-xs font-medium text-muted-foreground">Gaps</div>
          <div className="mt-1 flex items-center gap-1.5 font-heading text-3xl font-bold text-rose-600">
            <XCircle className="h-6 w-6" />{gap}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">undelivered</div>
        </div>
      </div>

      {/* Orchestrator Result */}
      {orchestratorResult && (
        <Panel title="Autonomous Cycle Result" subtitle={`Cycle ${orchestratorResult.cycle_id || ''}`} className="mb-6">
          {orchestratorResult.error ? (
            <div className="flex items-center gap-2 text-sm text-rose-600">
              <AlertTriangle className="h-4 w-4" /> Error: {orchestratorResult.error}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{orchestratorResult.phases?.length || 0} phases completed in {orchestratorResult.duration_ms}ms</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {(orchestratorResult.phases || []).map((p) => (
                  <div key={p.phase} className="rounded-md border border-border bg-slate-50/50 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium uppercase text-foreground">{p.phase}</span>
                      <StatusPill tone={p.status === 'ok' ? 'good' : 'bad'}>{p.status}</StatusPill>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{p.duration_ms}ms</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Scorecard by Plan Tier */}
      <div className="space-y-6">
        {['all', 'professional+', 'elite+', 'enterprise'].map((plan) => {
          const items = (scorecard?.scorecard || []).filter((c) => c.plan === plan);
          if (items.length === 0) return null;
          const planLabel = { all: 'All Plans', 'professional+': 'Professional+', 'elite+': 'Elite+', enterprise: 'Enterprise' }[plan];
          return (
            <Panel key={plan} title={planLabel} subtitle={`${items.filter((c) => c.status === 'delivered').length}/${items.length} delivered`}>
              <div className="space-y-2">
                {items.map((c) => (
                  <div key={c.promise} className="flex items-start gap-3 rounded-md border border-border bg-slate-50/30 p-3">
                    {c.status === 'delivered' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : c.status === 'partial' ? (
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{c.promise}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{c.detail}</div>
                    </div>
                    <StatusPill tone={c.status === 'delivered' ? 'good' : c.status === 'partial' ? 'idle' : 'bad'}>
                      {c.status}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}