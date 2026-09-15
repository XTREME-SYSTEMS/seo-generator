import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Shield, Gauge, AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Database, FileText, Layers, Server, Cpu, Boxes, Workflow, AlertOctagon, Network } from 'lucide-react';
import ValidationMeshTab from '@/components/universal/ValidationMeshTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'validation-mesh', label: 'Validation Mesh', icon: Network },
  { id: 'benchmarks', label: 'Benchmark Constitution', icon: Shield },
  { id: 'forensics', label: 'Forensic Audit', icon: AlertOctagon },
  { id: 'variables', label: 'System Variables', icon: Cpu },
  { id: 'concepts', label: 'Business Concepts', icon: Zap },
  { id: 'workflows', label: 'Workflow Specs', icon: Workflow },
  { id: 'architecture', label: 'Architecture', icon: Server },
  { id: 'registries', label: 'Registries', icon: Database },
];

export default function UniversalGenerator() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [benchmarks, forensics, variables, concepts, workflows, validation, risks, connectors, workers, queues, resilience, deployments, interops, accounts, domains, artifacts] = await Promise.all([
          base44.entities.BenchmarkCheck.list('-created_date', 500).catch(() => []),
          base44.entities.ForensicFinding.list('-created_date', 100).catch(() => []),
          base44.entities.SystemVariable.list('-created_date', 200).catch(() => []),
          base44.entities.BusinessConcept.list('-score', 100).catch(() => []),
          base44.entities.WorkflowSpec.list('-created_date', 100).catch(() => []),
          base44.entities.ValidationScore.list('-created_date', 100).catch(() => []),
          base44.entities.RiskItem.list('-created_date', 50).catch(() => []),
          base44.entities.ConnectorRegistry.list('-created_date', 50).catch(() => []),
          base44.entities.WorkerPool.list('-created_date', 50).catch(() => []),
          base44.entities.QueueTopology.list('-created_date', 50).catch(() => []),
          base44.entities.ResilienceControl.list('-created_date', 50).catch(() => []),
          base44.entities.DeploymentProfile.list('-created_date', 20).catch(() => []),
          base44.entities.InteropInterface.list('-created_date', 20).catch(() => []),
          base44.entities.AccountRegistry.list('-created_date', 50).catch(() => []),
          base44.entities.SiteDomainRegistry.list('-created_date', 50).catch(() => []),
          base44.entities.ArtifactManifest.list('-created_date', 50).catch(() => []),
        ]);
        setData({ benchmarks, forensics, variables, concepts, workflows, validation, risks, connectors, workers, queues, resilience, deployments, interops, accounts, domains, artifacts });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const benchmarkStats = {
    total: data.benchmarks?.length || 0,
    pass: data.benchmarks?.filter(c => c.status === 'PASS').length || 0,
    fail: data.benchmarks?.filter(c => c.status === 'FAIL').length || 0,
    notRun: data.benchmarks?.filter(c => c.status === 'NOT_RUN').length || 0,
  };
  const forensicStats = {
    total: data.forensics?.length || 0,
    p0: data.forensics?.filter(f => f.severity === 'P0').length || 0,
    open: data.forensics?.filter(f => f.fix_status === 'open').length || 0,
    fixed: data.forensics?.filter(f => f.fix_status === 'fixed' || f.fix_status === 'verified').length || 0,
  };
  const validationStats = {
    total: data.validation?.length || 0,
    pass: data.validation?.filter(v => v.status === 'PASS').length || 0,
    pending: data.validation?.filter(v => v.status === 'PENDING').length || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
            <Boxes className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">XTREME Universal Generator</h1>
            <p className="text-sm text-muted-foreground">Universal system-generation platform — benchmark constitution, variable registry, forensic audit, business concepts, workflow specs, and architecture registries</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-yellow-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} benchmarkStats={benchmarkStats} forensicStats={forensicStats} validationStats={validationStats} />}
      {activeTab === 'validation-mesh' && <ValidationMeshTab />}
      {activeTab === 'benchmarks' && <BenchmarkTab benchmarks={data.benchmarks || []} stats={benchmarkStats} />}
      {activeTab === 'forensics' && <ForensicsTab forensics={data.forensics || []} stats={forensicStats} />}
      {activeTab === 'variables' && <VariablesTab variables={data.variables || []} />}
      {activeTab === 'concepts' && <ConceptsTab concepts={data.concepts || []} />}
      {activeTab === 'workflows' && <WorkflowsTab workflows={data.workflows || []} />}
      {activeTab === 'architecture' && <ArchitectureTab data={data} />}
      {activeTab === 'registries' && <RegistriesTab data={data} />}
    </div>
  );
}

function OverviewTab({ data, benchmarkStats, forensicStats, validationStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox icon={Shield} label="Benchmark Checks" value={benchmarkStats.total} sub={`${benchmarkStats.pass} pass · ${benchmarkStats.notRun} not run`} color="text-blue-500" />
        <StatBox icon={AlertOctagon} label="Forensic Findings" value={forensicStats.total} sub={`${forensicStats.p0} P0 · ${forensicStats.open} open`} color="text-red-500" />
        <StatBox icon={Cpu} label="System Variables" value={data.variables?.length || 0} sub="Configurable" color="text-purple-500" />
        <StatBox icon={Zap} label="Business Concepts" value={data.concepts?.length || 0} sub="Modeled opportunities" color="text-yellow-500" />
        <StatBox icon={Workflow} label="Workflow Specs" value={data.workflows?.length || 0} sub="Formal definitions" color="text-green-500" />
        <StatBox icon={Server} label="Worker Pools" value={data.workers?.length || 0} sub="Provider-neutral" color="text-cyan-500" />
        <StatBox icon={Layers} label="Queue Topology" value={data.queues?.length || 0} sub="Logical queues" color="text-indigo-500" />
        <StatBox icon={Gauge} label="Validation Score" value={`${validationStats.pass}/${validationStats.total}`} sub="Domains passing" color="text-emerald-500" />
      </div>

      <div className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-transparent p-5">
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-600" /> Deterministic Completion Contract
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
            <span><strong>VERIFIED_100</strong> — All mandatory checks pass with current evidence</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-500 mt-0.5" />
            <span><strong>INCOMPLETE</strong> — Checks still not run or pending</span>
          </div>
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <span><strong>UNBENCHMARKED</strong> — No constitution defined (never 0/0 = PASS)</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Forensic Findings by Severity</h3>
          <div className="space-y-2">
            {['P0', 'P1', 'P2', 'P3'].map(sev => {
              const count = data.forensics?.filter(f => f.severity === sev).length || 0;
              const colors = { P0: 'bg-red-100 text-red-700', P1: 'bg-orange-100 text-orange-700', P2: 'bg-amber-100 text-amber-700', P3: 'bg-blue-100 text-blue-700' };
              return (
                <div key={sev} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${colors[sev]}`}>{sev}</span>
                  <span className="text-sm text-foreground">{count} findings</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Business Concept Recommendations</h3>
          <div className="space-y-2">
            {['QUICK_WIN', 'PILOT', 'RESEARCH', 'HOLD'].map(rec => {
              const count = data.concepts?.filter(c => c.recommendation === rec).length || 0;
              const colors = { QUICK_WIN: 'bg-green-100 text-green-700', PILOT: 'bg-blue-100 text-blue-700', RESEARCH: 'bg-gray-100 text-gray-700', HOLD: 'bg-amber-100 text-amber-700' };
              return (
                <div key={rec} className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${colors[rec]}`}>{rec}</span>
                  <span className="text-sm text-foreground">{count} concepts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BenchmarkTab({ benchmarks, stats }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runConstitution = async () => {
    setRunning(true);
    try {
      const res = await base44.functions.invoke('RunBenchmarkConstitution', {});
      setResult(res.data);
    } catch (e) { setResult({ error: e.message }); }
    setRunning(false);
  };

  const families = [...new Set(benchmarks.map(b => b.family))];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Benchmark Constitution ({stats.total} checks)</h3>
          <p className="text-sm text-muted-foreground">{stats.pass} pass · {stats.fail} fail · {stats.notRun} not run</p>
        </div>
        <button onClick={runConstitution} disabled={running}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium px-4 py-2 rounded-lg flex items-center gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Run Constitution
        </button>
      </div>

      {result && (
        <div className={`mb-4 p-4 rounded-lg border ${result.error ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          {result.error ? (
            <p className="text-red-600 text-sm">Error: {result.error}</p>
          ) : (
            <div className="text-sm space-y-1">
              <p className="font-bold text-foreground">{result.completionStatus} — {result.passRate}% pass rate</p>
              <p className="text-muted-foreground">Mandatory: {result.mandatoryPassRate}% · Failed: {result.totalFail} · Not Run: {result.totalNotRun}</p>
              {result.failedChecks?.length > 0 && <p className="text-red-600">Failed: {result.failedChecks.map(c => c.id).join(', ')}</p>}
            </div>
          )}
        </div>
      )}

      {families.map(family => (
        <div key={family} className="mb-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">{family}</h4>
          <div className="space-y-1">
            {benchmarks.filter(b => b.family === family).map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
                <StatusIcon status={b.status} />
                <span className="text-xs font-mono text-muted-foreground">{b.benchmark_id}</span>
                <span className="text-sm text-foreground flex-1">{b.check}</span>
                {b.mandatory && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">MANDATORY</span>}
                <span className="text-xs text-muted-foreground">{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ForensicsTab({ forensics, stats }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Forensic Audit ({stats.total} findings)</h3>
        <p className="text-sm text-muted-foreground">{stats.p0} P0 critical · {stats.open} open · {stats.fixed} fixed</p>
      </div>
      <div className="space-y-3">
        {forensics.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className={`text-xs px-2 py-1 rounded font-bold ${f.severity === 'P0' ? 'bg-red-100 text-red-700' : f.severity === 'P1' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{f.severity}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{f.finding_id}</span>
                  <span className="text-sm font-medium text-foreground">{f.finding}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2"><strong>Evidence:</strong> {f.evidence}</p>
                <p className="text-xs text-muted-foreground mb-2"><strong>Required correction:</strong> {f.required_correction}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${f.fix_status === 'fixed' || f.fix_status === 'verified' ? 'bg-green-100 text-green-700' : f.fix_status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{f.fix_status}</span>
                  {f.fix_approach && <span className="text-xs text-muted-foreground">→ {f.fix_approach}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariablesTab({ variables }) {
  const [resolving, setResolving] = useState(false);
  const [result, setResult] = useState(null);

  const resolve = async () => {
    setResolving(true);
    try {
      const res = await base44.functions.invoke('ResolveVariables', {});
      setResult(res.data);
    } catch (e) { setResult({ error: e.message }); }
    setResolving(false);
  };

  const groups = [...new Set(variables.map(v => v.group))];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">System Variables ({variables.length})</h3>
          <p className="text-sm text-muted-foreground">Configurable controls with impact graphs and recalibration rules</p>
        </div>
        <button onClick={resolve} disabled={resolving}
          className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium px-4 py-2 rounded-lg flex items-center gap-2">
          {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          Resolve All
        </button>
      </div>

      {result && !result.error && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm">
          <p className="font-bold text-foreground">{result.allResolved ? 'All Resolved' : 'Partially Resolved'}</p>
          <p className="text-muted-foreground">{result.resolved}/{result.totalVariables} resolved · {result.assumptions} assumptions · {result.unknown} unknown</p>
        </div>
      )}

      {groups.map(group => (
        <div key={group} className="mb-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">{group}</h4>
          <div className="space-y-1">
            {variables.filter(v => v.group === group).map(v => (
              <div key={v.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-muted-foreground flex-1">{v.variable_key}</span>
                <span className="text-sm text-foreground">{v.resolved_value || v.default_value || '—'}</span>
                {v.requires_approval && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">APPROVAL</span>}
                <span className={`text-xs px-1.5 py-0.5 rounded ${v.confidence === 'high' ? 'bg-green-100 text-green-700' : v.confidence === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{v.confidence || 'unknown'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConceptsTab({ concepts }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4">Business Concepts ({concepts.length})</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {concepts.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{c.concept_id}</span>
                <h4 className="font-semibold text-foreground">{c.name}</h4>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${c.recommendation === 'QUICK_WIN' ? 'bg-green-100 text-green-700' : c.recommendation === 'PILOT' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{c.recommendation}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{c.industry} · {c.sub_industry || 'General'}</p>
            <p className="text-sm text-foreground mb-2">{c.solution}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Score: <strong className="text-yellow-600">{c.score}/100</strong></span>
              <span>Price: {c.price_range}</span>
              <span>Margin: {Math.round((c.gross_margin || 0) * 100)}%</span>
              <span>Auto: {c.automation_pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowsTab({ workflows }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4">Workflow Specifications ({workflows.length})</h3>
      <div className="space-y-3">
        {workflows.map(w => (
          <div key={w.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{w.workflow_id}</span>
                <h4 className="font-semibold text-foreground">{w.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                {w.mapped_function && <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">→ {w.mapped_function}</span>}
                <span className={`text-xs px-2 py-0.5 rounded ${w.status === 'active' ? 'bg-green-100 text-green-700' : w.status === 'specified' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{w.status}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{w.objective}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Trigger: <strong className="text-foreground">{w.trigger}</strong></span>
              <span>Latency: {w.expected_latency}</span>
              <span>Cost: {w.expected_cost}</span>
              <span>KPI: {w.kpi}</span>
            </div>
            {w.steps && <p className="mt-2 text-xs text-muted-foreground"><strong>Steps:</strong> {w.steps}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchitectureTab({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-3">Worker Pools ({data.workers?.length || 0})</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {data.workers?.map(w => (
            <div key={w.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{w.worker_type}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${w.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{w.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{w.core_capabilities}</p>
              <p className="text-xs text-muted-foreground mt-1">Provider: {w.typical_provider}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Queue Topology ({data.queues?.length || 0})</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {data.queues?.map(q => (
            <div key={q.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm text-foreground">{q.logical_queue}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{q.domain}</span>
              </div>
              <p className="text-xs text-muted-foreground">{q.typical_job_types}</p>
              <p className="text-xs text-muted-foreground mt-1">Priority: {q.priority} · DLQ: {q.dlq_recovery}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Resilience Controls ({data.resilience?.length || 0})</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {data.resilience?.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{r.control}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${r.status === 'verified' || r.status === 'implemented' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.failure_addressed}</p>
              <p className="text-xs text-muted-foreground mt-1">Mechanism: {r.mechanism}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Deployment Profiles ({data.deployments?.length || 0})</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {data.deployments?.map(d => (
            <div key={d.id} className={`bg-card border rounded-lg p-3 ${d.is_active ? 'border-yellow-400' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{d.profile_name}</span>
                {d.is_active && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">ACTIVE</span>}
              </div>
              <p className="text-xs text-muted-foreground">Orchestrator: {d.orchestrator}</p>
              <p className="text-xs text-muted-foreground">Workers: {d.workers}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.use_case}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Interop Interfaces ({data.interops?.length || 0})</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {data.interops?.map(i => (
            <div key={i.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{i.interface}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${i.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{i.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{i.purpose}</p>
              <p className="text-xs text-muted-foreground mt-1">{i.reference_target}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegistriesTab({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-3">Account Registry ({data.accounts?.length || 0})</h3>
        <div className="space-y-1">
          {data.accounts?.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
              <span className="font-medium text-foreground text-sm w-32">{a.platform}</span>
              <span className="text-xs text-muted-foreground flex-1">{a.role}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${a.connection_state === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.connection_state}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Site Domain Registry ({data.domains?.length || 0})</h3>
        <div className="space-y-1">
          {data.domains?.map(d => (
            <div key={d.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
              <span className="font-mono text-sm text-foreground">{d.asset}</span>
              <span className="text-xs text-muted-foreground flex-1">{d.mission}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d.lifecycle}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Connector Registry ({data.connectors?.length || 0})</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {data.connectors?.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
              <span className="font-medium text-foreground text-sm flex-1">{c.connector}</span>
              <span className="text-xs text-muted-foreground">{c.category}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${c.status === 'authorized' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">Artifact Manifest ({data.artifacts?.length || 0})</h3>
        <div className="space-y-1">
          {data.artifacts?.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{a.artifact}</span>
              <span className="text-xs text-muted-foreground">{a.category}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${a.status === 'VERIFIED' || a.status === 'IMPORTED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'PASS') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'FAIL') return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === 'N/A') return <CheckCircle2 className="w-4 h-4 text-muted-foreground" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}