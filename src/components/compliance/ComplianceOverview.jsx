import React from 'react';

const CARDS = [
  { key: 'gates', label: 'Google hard gates', icon: '🛡️', passLabel: 'PASS' },
  { key: 'qa', label: 'QA test matrix', icon: '🧪', passLabel: 'PASS' },
  { key: 'repairs', label: 'P0 repairs verified', icon: '🔧', passLabel: 'VERIFIED' },
  { key: 'acceptance', label: 'Acceptance checks', icon: '✅', passLabel: 'PASS' },
];

function Card({ label, icon, total, passed, blocked }) {
  const pct = total ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-bold text-foreground">{passed}</span>
        <span className="text-sm text-muted-foreground">/ {total}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{pct}% cleared</span>
        {blocked > 0 && <span className="text-red-600 font-semibold">{blocked} blocked</span>}
      </div>
    </div>
  );
}

export default function ComplianceOverview({ counts }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {CARDS.map((c) => (
          <Card key={c.key} label={c.label} icon={c.icon} {...counts[c.key]} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Mission</h3>
          <p className="text-sm text-foreground leading-relaxed">
            One industry-aware, visual-first website factory that builds 1 / 10 / 100 / 1,000 — and eventually 100,000 —
            separately legitimate client properties on the existing X1 execution fabric.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Mass generation never implies mass publication. Each site is gated individually against Google policy.
          </p>
        </div>

        <div className="border border-border rounded-lg bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Non-negotiables</h3>
          <ul className="space-y-1.5 text-[11px] text-foreground">
            <li>· Every PASS links to a real artifact or API readback — never a self-certified claim.</li>
            <li>· No index guarantee, ranking guarantee, or first-page promise by a date.</li>
            <li>· One canonical production host per site; previews stay noindex or protected.</li>
            <li>· City and location pages require verified local substance.</li>
            <li>· UNKNOWN or unrun is never scored as PASS.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}