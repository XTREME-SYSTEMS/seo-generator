import React, { useMemo, useState } from 'react';
import { Gauge, RotateCcw } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import ProjectionChart from '@/components/are/ProjectionChart';
import ModuleSliders from '@/components/are/ModuleSliders';
import SuggestionLightbulb from '@/components/are/SuggestionLightbulb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { projectCurve, daysToTarget, defaultValues, compositeEffort } from '@/lib/projection';
import { useTenantData } from '@/lib/useTenantData';

export default function GrowthSimulator() {
  const { rows: sheet } = useTenantData('AreSheetRow', {}, '-priority_score');
  const { rows: playbooks } = useTenantData('IndustryPlaybook', {}, '-compiled_at');

  const [url, setUrl] = useState('');
  const [currentRank, setCurrentRank] = useState(45);
  const [targetRank, setTargetRank] = useState(3);
  const [difficulty, setDifficulty] = useState(50);
  const [values, setValues] = useState(defaultValues);

  const partnerBoost = playbooks[0]?.partner_p_cross_boost || 0;
  const curve = useMemo(
    () => projectCurve({ currentRank, targetRank, values, difficulty: difficulty / 100, partnerBoost }),
    [currentRank, targetRank, values, difficulty, partnerBoost],
  );
  const eta = daysToTarget(curve, targetRank);
  const effort = Math.round(compositeEffort(values) * 100);
  const endRank = curve[curve.length - 1]?.rank;

  const loadFromSheet = (row) => {
    setUrl(row.url);
    setCurrentRank(row.rank || 101);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Modeled projection"
        title="Growth Simulator"
        description="Set a starting position and a target, then move the strategy sliders to see the projected climb. Every number here is modeled — never a measurement."
        actions={<Button variant="ghost" size="sm" onClick={() => setValues(defaultValues())}><RotateCcw className="mr-2 h-3.5 w-3.5" />Reset modules</Button>}
      />

      <div className="mb-6 flex items-center gap-2">
        <Provenance value="MODELED" />
        <span className="text-xs text-muted-foreground">Projections are modeled from module accrual curves, not measured outcomes.</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panel title="Projected climb" subtitle="Rank over 1 · 3 · 7 · 15 · 30 · 45 · 60 · 90 days">
            <ProjectionChart curve={curve} targetRank={targetRank} />
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Days to target', value: eta ? `${eta}d` : '> 90d' },
                { label: 'Rank at D90', value: `#${endRank}` },
                { label: 'Score at D90', value: curve[curve.length - 1]?.score },
                { label: 'Effort index', value: `${effort}%` },
              ].map((m) => (
                <div key={m.label}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">{m.label}</div>
                  <div className="mt-1 font-heading text-lg font-semibold tabular text-foreground">{m.value}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Inputs">
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Current rank</label>
                  <Input type="number" min="1" max="101" value={currentRank} onChange={(e) => setCurrentRank(Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Target rank</label>
                  <Input type="number" min="1" max="20" value={targetRank} onChange={(e) => setTargetRank(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Query difficulty</label>
                  <span className="font-mono text-[11px] tabular text-muted-foreground">{difficulty}</span>
                </div>
                <Slider value={[difficulty]} min={5} max={95} step={5} onValueChange={([v]) => setDifficulty(v)} />
              </div>
              {partnerBoost > 0 && (
                <p className="rounded border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  Partner authority advantage applied: <span className="font-mono text-primary">+{Math.round(partnerBoost * 100)}%</span> to modeled boundary-crossing probability.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="Strategy modules" subtitle="Proven = T0/T1 anchored · experimental carries a confidence haircut">
            <ModuleSliders values={values} onChange={setValues} />
          </Panel>

          <Panel title="Load from sheet" subtitle="Start from a real measured position">
            {!sheet.length && <p className="text-xs text-muted-foreground">No sheet rows yet.</p>}
            <ul className="space-y-1.5">
              {sheet.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => loadFromSheet(r)}
                    className="w-full rounded border border-border px-3 py-2 text-left transition-colors hover:border-primary/40"
                  >
                    <span className="block truncate text-xs text-foreground">{r.query}</span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">
                      {r.rank ? `#${r.rank}` : 'unranked'} · {r.url}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <SuggestionLightbulb surface="simulator" />
    </div>
  );
}