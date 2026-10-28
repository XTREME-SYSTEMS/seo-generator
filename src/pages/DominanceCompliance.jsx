import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, LayoutDashboard, ShieldCheck, FlaskConical, Wrench, ClipboardCheck, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import ComplianceOverview from '@/components/compliance/ComplianceOverview';
import GatePanel from '@/components/compliance/GatePanel';
import QaPanel from '@/components/compliance/QaPanel';
import RepairPanel from '@/components/compliance/RepairPanel';
import AcceptancePanel from '@/components/compliance/AcceptancePanel';
import WorkbookPanel from '@/components/compliance/WorkbookPanel';

const asArray = (res) => (Array.isArray(res) ? res : res?.items || []);

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'gates', label: 'Google Gates', icon: ShieldCheck },
  { key: 'qa', label: 'QA Matrix', icon: FlaskConical },
  { key: 'repairs', label: 'P0 Repairs', icon: Wrench },
  { key: 'acceptance', label: 'Acceptance', icon: ClipboardCheck },
  { key: 'workbook', label: 'Workbook', icon: BookOpen },
];

export default function DominanceCompliance() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [gates, setGates] = useState([]);
  const [qa, setQa] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [acceptance, setAcceptance] = useState([]);
  const [reference, setReference] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [g, t, r, a, ref] = await Promise.all([
          base44.entities.DominanceGate.list('-gate_id', 200),
          base44.entities.DominanceQaTest.list('test_id', 300),
          base44.entities.DominanceRepair.list('repair_id', 200),
          base44.entities.DominanceAcceptance.list('item_id', 200),
          base44.entities.DominanceReference.list('sheet_name', 600),
        ]);
        if (!alive) return;
        setGates(asArray(g));
        setQa(asArray(t));
        setRepairs(asArray(r));
        setAcceptance(asArray(a));
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = (arr) => (q ? arr.filter((row) => JSON.stringify(row).toLowerCase().includes(q)) : arr);
    return { gates: f(gates), qa: f(qa), repairs: f(repairs), acceptance: f(acceptance) };
  }, [query, gates, qa, repairs, acceptance]);

  const counts = useMemo(() => {
    const tally = (arr, passStates, blockState) => ({
      total: arr.length,
      passed: arr.filter((r) => passStates.includes(r.status)).length,
      blocked: blockState ? arr.filter((r) => r.status === blockState).length : 0,
    });
    return {
      gates: tally(gates, ['PASS'], 'BLOCKED'),
      qa: tally(qa, ['PASS'], 'BLOCKED'),
      repairs: tally(repairs, ['VERIFIED', 'FIXED'], 'BLOCKED'),
      acceptance: tally(acceptance, ['PASS'], 'BLOCKED'),
    };
  }, [gates, qa, repairs, acceptance]);

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
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h1 className="font-heading text-xl font-bold text-foreground leading-tight">Digital Dominance Compliance Center</h1>
          <p className="text-xs text-muted-foreground">
            Live operational layer for the handoff and Vercel compliance workbooks — gates, QA, repairs and acceptance.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 bg-card">
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
        {tab !== 'overview' && tab !== 'workbook' && (
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this register..."
              className="input pl-8 py-1.5 text-xs"
            />
          </div>
        )}
      </div>

      <div className="border border-border rounded-lg bg-card p-4">
        {tab === 'overview' && <ComplianceOverview counts={counts} />}
        {tab === 'gates' && <GatePanel items={filtered.gates} onUpdate={(id, s) => setStatus('DominanceGate', setGates, id, s)} />}
        {tab === 'qa' && <QaPanel items={filtered.qa} onUpdate={(id, s) => setStatus('DominanceQaTest', setQa, id, s)} />}
        {tab === 'repairs' && <RepairPanel items={filtered.repairs} onUpdate={(id, s) => setStatus('DominanceRepair', setRepairs, id, s)} />}
        {tab === 'acceptance' && <AcceptancePanel items={filtered.acceptance} onUpdate={(id, s) => setStatus('DominanceAcceptance', setAcceptance, id, s)} />}
        {tab === 'workbook' && <WorkbookPanel records={reference} />}
      </div>
    </div>
  );
}