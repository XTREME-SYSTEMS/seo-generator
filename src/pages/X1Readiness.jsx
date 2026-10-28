import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, LayoutDashboard, ListChecks, FlaskConical, AlertTriangle, Gavel, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReadinessOverview from '@/components/x1/ReadinessOverview';
import TaskPanel from '@/components/x1/TaskPanel';
import CheckPanel from '@/components/x1/CheckPanel';
import RiskPanel from '@/components/x1/RiskPanel';
import DecisionPanel from '@/components/x1/DecisionPanel';
import WorkbookPanel from '@/components/compliance/WorkbookPanel';

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'checks', label: 'Test Ledger', icon: FlaskConical },
  { key: 'risks', label: 'Risks', icon: AlertTriangle },
  { key: 'decisions', label: 'Decisions', icon: Gavel },
  { key: 'sources', label: 'Sources & Artifacts', icon: FolderTree },
];

export default function X1Readiness() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [checks, setChecks] = useState([]);
  const [risks, setRisks] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [reference, setReference] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [t, c, r, d, ref] = await Promise.all([
          base44.entities.X1Task.list('task_id', 100),
          base44.entities.X1Check.list('check_id', 100),
          base44.entities.X1Risk.list('risk_id', 100),
          base44.entities.X1Decision.list('decision_id', 100),
          base44.entities.DominanceReference.filter({ sheet_group: 'X1 Cloud Browser' }, { sort: 'sheet_name', limit: 200 }),
        ]);
        if (!alive) return;
        setTasks(asArray(t));
        setChecks(asArray(c));
        setRisks(asArray(r));
        setDecisions(asArray(d));
        setReference(asArray(ref));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const setStatus = async (key, setter, id, status) => {
    await base44.entities[key].update(id, { status });
    setter((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
  };

  const counts = useMemo(() => {
    const highOpen = risks.filter((r) => r.status === 'OPEN' && ['HIGH', 'CRITICAL'].includes(r.severity));
    return {
      tasksTotal: tasks.length,
      tasksDone: tasks.filter((t) => t.status === 'PASS').length,
      checksTotal: checks.length,
      checksDone: checks.filter((c) => c.status === 'PASS').length,
      risksTotal: risks.length,
      risksOpen: risks.filter((r) => r.status === 'OPEN').length,
      decisionsTotal: decisions.length,
      decisionsAdopted: decisions.filter((d) => d.status === 'ADOPTED').length,
      highOpen,
    };
  }, [tasks, checks, risks, decisions]);

  const verdict = useMemo(() => {
    const stuck = tasks.filter((t) => ['BLOCKED', 'FAIL'].includes(t.status));
    const released = tasks.length > 0 && counts.tasksDone === tasks.length && counts.highOpen.length === 0;
    return {
      released,
      reason: released
        ? 'Every task has passed evidence and no high-severity risk is open.'
        : `${stuck.length} task${stuck.length === 1 ? '' : 's'} not passed · ${counts.highOpen.length} high-severity risk${counts.highOpen.length === 1 ? '' : 's'} open`,
      blockers: [
        ...stuck.map((t) => `${t.task_id} (${t.stage}) — ${t.task} [${t.status}]`),
        ...counts.highOpen.map((r) => `${r.risk_id} — ${r.risk} [${r.severity}]`),
      ].slice(0, 8),
    };
  }, [tasks, counts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center shrink-0">
          <FlaskConical className="w-5 h-5 text-background" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-heading text-xl font-bold text-foreground leading-tight">X1 Cloud Browser Readiness</h1>
          <p className="text-xs text-muted-foreground">
            Living ledger for the 987-file engine snapshot — tasks, tests, risks and decisions that must clear before release.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 bg-card mb-4">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors',
              tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-lg bg-card p-4">
        {tab === 'overview' && <ReadinessOverview counts={counts} verdict={verdict} blockers={verdict.blockers} />}
        {tab === 'tasks' && <TaskPanel items={tasks} onUpdate={(id, s) => setStatus('X1Task', setTasks, id, s)} />}
        {tab === 'checks' && <CheckPanel items={checks} onUpdate={(id, s) => setStatus('X1Check', setChecks, id, s)} />}
        {tab === 'risks' && <RiskPanel items={risks} onUpdate={(id, s) => setStatus('X1Risk', setRisks, id, s)} />}
        {tab === 'decisions' && <DecisionPanel items={decisions} onUpdate={(id, s) => setStatus('X1Decision', setDecisions, id, s)} />}
        {tab === 'sources' && <WorkbookPanel records={reference} />}
      </div>
    </div>
  );
}