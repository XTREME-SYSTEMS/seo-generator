import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, CheckCircle2, XCircle, AlertCircle, Target, Zap, TrendingUp, RefreshCw, Gauge } from 'lucide-react';

export default function ValidationMeshTab() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState(null);

  const runMesh = async (scope = 'full') => {
    setRunning(true);
    setError('');
    try {
      const res = await base44.functions.invoke('ValidationMesh', { scope });
      setResult(res.data);
      setLastRun(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    }
    setRunning(false);
  };

  useEffect(() => { runMesh('full'); }, []);

  if (running && !result) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <span className="ml-3 text-muted-foreground">Running validation mesh...</span>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button onClick={() => runMesh('full')} className="mt-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium">Retry</button>
      </div>
    );
  }

  if (!result) return null;

  const overall = result.overall || {};
  const vc = result.variable_compliance || {};
  const wc = result.workflow_compliance || {};
  const bc = result.benchmark_compliance || {};
  const fr = result.forensic_remediation || {};
  const ch = result.connector_health || {};
  const cv = result.cross_validation || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" /> Centralized Validation Mesh
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-validates {result.totals?.variables || 0} system variables, {result.totals?.workflows || 0} workflow specs, {result.totals?.benchmarks || 0} benchmark checks against performance targets
            {lastRun && <span className="ml-2 text-xs">· Last run: {lastRun}</span>}
          </p>
        </div>
        <button onClick={() => runMesh('full')} disabled={running}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium px-4 py-2 rounded-lg flex items-center gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {running ? 'Running...' : 'Re-run Mesh'}
        </button>
      </div>

      {/* Overall Score */}
      <div className={`rounded-xl border-2 p-5 ${overall.status === 'VERIFIED_100' ? 'border-green-500 bg-green-50' : overall.status === 'IN_PROGRESS' ? 'border-yellow-400 bg-yellow-50' : 'border-red-400 bg-red-50'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${overall.status === 'VERIFIED_100' ? 'bg-green-500 text-white' : overall.status === 'IN_PROGRESS' ? 'bg-yellow-400 text-gray-900' : 'bg-red-500 text-white'}`}>
              {overall.score || 0}
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{overall.status || 'UNKNOWN'}</p>
              <p className="text-sm text-muted-foreground">Target: 100% · Gap: {overall.gap_to_100 || 100} points</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">{overall.score || 0}<span className="text-lg text-muted-foreground">/100</span></p>
            <p className="text-xs text-muted-foreground">{overall.all_targets_met ? 'All targets met!' : `${cv.targets_met || 0}/${cv.total_targets || 0} targets met`}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {overall.domains?.map(d => {
            const target = PERFORMANCE_TARGETS[d.domain];
            const pct = Math.round((d.score / 100) * 100);
            const met = pct >= (target?.target || 100);
            return (
              <div key={d.domain} className="bg-white rounded-lg p-2 border border-border">
                <p className="text-xs text-muted-foreground truncate">{d.domain.replace(/_/g, ' ')}</p>
                <p className={`text-lg font-bold ${met ? 'text-green-600' : 'text-amber-600'}`}>{pct}%</p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className={`h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Variable Compliance */}
        <ComplianceCard
          title="Variable Compliance"
          icon={Target}
          score={vc.compliance_score}
          target={100}
          total={vc.total}
          targetCount={vc.target_count}
          coveragePct={vc.coverage_pct}
          metrics={[
            { label: 'Resolved', value: `${vc.resolved || 0}/${vc.total || 0}`, pct: vc.resolution_pct },
            { label: 'High Confidence', value: `${vc.high_confidence || 0}`, pct: vc.confidence_pct },
            { label: 'With Impact Domains', value: `${vc.with_impact_domains || 0}`, pct: vc.impact_pct },
            { label: 'Assumptions', value: `${vc.assumptions || 0}`, warning: true },
          ]}
          failedCount={vc.failed_count}
          failed={vc.failed}
        />

        {/* Workflow Compliance */}
        <ComplianceCard
          title="Workflow Compliance"
          icon={Zap}
          score={wc.compliance_score}
          target={100}
          total={wc.total}
          targetCount={wc.target_count}
          coveragePct={wc.coverage_pct}
          metrics={[
            { label: 'Active', value: `${wc.active || 0}/${wc.total || 0}`, pct: wc.activation_pct },
            { label: 'Mapped to Function', value: `${wc.with_mapped_function || 0}`, pct: wc.mapping_pct },
            { label: 'With KPI', value: `${wc.with_kpi || 0}`, pct: wc.kpi_pct },
            { label: 'With Idempotency', value: `${wc.with_idempotency || 0}`, pct: wc.idempotency_pct },
          ]}
          failedCount={wc.failed_count}
          failed={wc.failed}
        />

        {/* Benchmark Compliance */}
        <ComplianceCard
          title="Benchmark Compliance"
          icon={Shield}
          score={bc.compliance_score}
          target={100}
          total={bc.total}
          targetCount={bc.target_count}
          coveragePct={bc.coverage_pct}
          metrics={[
            { label: 'Mandatory Pass', value: `${bc.mandatory_pass || 0}/${bc.mandatory_total || 0}`, pct: bc.pass_pct },
            { label: 'Not Run', value: `${bc.mandatory_not_run || 0}`, warning: bc.mandatory_not_run > 0 },
            { label: 'Failed', value: `${bc.mandatory_fail || 0}`, danger: bc.mandatory_fail > 0 },
            { label: 'With Evidence', value: `${bc.with_evidence || 0}`, pct: bc.evidence_pct },
          ]}
          failedCount={(bc.mandatory_fail || 0) + (bc.mandatory_not_run || 0)}
          failed={[...(bc.failed_benchmarks || []).slice(0, 5), ...(bc.not_run_benchmarks || []).slice(0, 5)]}
        />

        {/* Forensic Remediation */}
        <ComplianceCard
          title="Forensic Remediation"
          icon={AlertCircle}
          score={fr.remediation_pct}
          target={100}
          total={fr.total}
          metrics={[
            { label: 'Fixed', value: `${fr.fixed || 0}/${fr.total || 0}`, pct: fr.remediation_pct },
            { label: 'P0 Open', value: `${fr.p0_open || 0}`, danger: fr.p0_open > 0 },
            { label: 'P1 Open', value: `${fr.p1_open || 0}`, warning: fr.p1_open > 0 },
            { label: 'P0 Total', value: `${fr.p0_total || 0}` },
          ]}
          failedCount={fr.p0_open + fr.p1_open}
          failed={fr.open_p0}
        />
      </div>

      {/* Cross-Validation Results */}
      {cv.target_compliance && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-yellow-600" /> Cross-Validation: Performance Targets
          </h4>
          <div className="space-y-2">
            {cv.target_compliance.map(t => (
              <div key={t.domain} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
                {t.met ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t.domain.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{t.earned}/{t.weight} pts</p>
                  <p className="text-xs text-muted-foreground">Target: {t.target}%</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'PASS' ? 'bg-green-100 text-green-700' : t.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
              </div>
            ))}
          </div>
          {cv.orphaned_count > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">⚠ {cv.orphaned_count} orphaned workflows (mapped function doesn't exist):</p>
              <ul className="mt-1 text-xs text-red-600">
                {cv.orphaned_workflows?.slice(0, 5).map((w, i) => <li key={i}>· {w.name} → {w.mapped_function}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Connector Health */}
      {ch.total > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-yellow-600" /> Connector Health
          </h4>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><span className="text-muted-foreground">Authorized:</span> <strong className="text-green-600">{ch.authorized}/{ch.total}</strong></div>
            <div><span className="text-muted-foreground">Pending:</span> <strong className="text-amber-600">{ch.pending}</strong></div>
            <div><span className="text-muted-foreground">Failed:</span> <strong className="text-red-600">{ch.failed}</strong></div>
            <div><span className="text-muted-foreground">Health:</span> <strong className={ch.target_met ? 'text-green-600' : 'text-amber-600'}>{ch.health_pct}%</strong></div>
          </div>
          {ch.pending_connectors?.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Pending: {ch.pending_connectors.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

const PERFORMANCE_TARGETS = {
  variable_resolution: { target: 100, weight: 15 },
  workflow_activation: { target: 100, weight: 15 },
  benchmark_pass_rate: { target: 100, weight: 20 },
  forensic_remediation: { target: 100, weight: 15 },
  connector_health: { target: 90, weight: 10 },
};

function ComplianceCard({ title, icon: Icon, score, target, total, targetCount, coveragePct, metrics, failedCount, failed }) {
  const met = score >= target;
  return (
    <div className={`bg-card border rounded-xl p-4 ${met ? 'border-green-300' : 'border-amber-300'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${met ? 'text-green-500' : 'text-amber-500'}`} />
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${met ? 'text-green-600' : 'text-amber-600'}`}>{score || 0}%</p>
          <p className="text-xs text-muted-foreground">Target: {target}%</p>
        </div>
      </div>
      {targetCount && (
        <p className="text-xs text-muted-foreground mb-2">{total}/{targetCount} ({coveragePct}% coverage)</p>
      )}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {metrics.map((m, i) => (
          <div key={i} className="bg-muted/30 rounded px-2 py-1.5">
            <span className="text-xs text-muted-foreground">{m.label}: </span>
            <span className={`text-sm font-medium ${m.danger ? 'text-red-600' : m.warning ? 'text-amber-600' : 'text-foreground'}`}>{m.value}</span>
            {m.pct !== undefined && <span className="text-xs text-muted-foreground ml-1">({m.pct}%)</span>}
          </div>
        ))}
      </div>
      {failedCount > 0 && (
        <div className="mt-2">
          <p className="text-xs text-amber-700 font-medium">{failedCount} issues found:</p>
          <div className="mt-1 max-h-24 overflow-y-auto space-y-0.5">
            {failed?.slice(0, 8).map((f, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                · {f.key || f.id || f.benchmark_id || f.finding_id || f.name}: {f.issue || f.check || f.finding?.substring(0, 60) || ''}
              </p>
            ))}
            {failedCount > 8 && <p className="text-xs text-muted-foreground">... and {failedCount - 8} more</p>}
          </div>
        </div>
      )}
    </div>
  );
}