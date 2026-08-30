import React, { useState } from 'react';
import { Compass, Loader2, RefreshCw, Link2 } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import EmptyState from '@/components/kit/EmptyState';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import SuggestionLightbulb from '@/components/are/SuggestionLightbulb';
import { Button } from '@/components/ui/button';
import { useTenantData } from '@/lib/useTenantData';
import { useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';

const DELIVERABLE_TONE = { live: 'good', verified: 'good', in_progress: 'info', requested: 'info', identified: 'idle', declined: 'bad' };

function List({ title, items }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{title}</div>
      <ul className="mt-2 space-y-1.5">
        {items.map((i, idx) => (
          <li key={idx} className="flex gap-2 text-sm leading-relaxed text-foreground">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SeoStrategy() {
  const { clientId, client } = useTenant();
  const { rows: playbooks, loading, reload } = useTenantData('IndustryPlaybook', {}, '-compiled_at');
  const { rows: deliverables, reload: reloadDeliverables } = useTenantData('AuthorityDeliverable', {}, '-created_date');
  const [busy, setBusy] = useState(false);

  const playbook = playbooks[0];

  const recompile = async () => {
    if (!clientId) return;
    setBusy(true);
    try {
      await base44.functions.invoke('AreBenchmark', {
        client_id: clientId,
        industry: client?.industry || '',
        partner_domains: playbook?.partner_authority_domains || [],
      });
      reload(); reloadDeliverables();
    } finally { setBusy(false); }
  };

  const advance = async (d, status) => {
    await base44.entities.AuthorityDeliverable.update(d.id, { status });
    reloadDeliverables();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Industry intelligence"
        title="SEO Strategy"
        description="What it currently takes to hold top 3 in your vertical, reverse-engineered from the leaders — plus the target set 20% beyond that benchmark."
        actions={(
          <Button variant="outline" size="sm" onClick={recompile} disabled={busy || !clientId}>
            {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Recompile benchmark
          </Button>
        )}
      />

      {!loading && !playbook && (
        <EmptyState icon={Compass} title="No playbook compiled yet" description="Run Start Here, or recompile the benchmark for this client." />
      )}

      {playbook && (
        <div className="space-y-6">
          <Panel title="Combined benchmark" subtitle={`${playbook.industry}${playbook.sub_industry ? ` / ${playbook.sub_industry}` : ''}`} right={<Provenance value={playbook.provenance} />}>
            <p className="text-sm leading-relaxed text-foreground">{playbook.benchmark_summary || '—'}</p>
            {playbook.target_summary && (
              <div className="mt-5 rounded border border-primary/30 bg-primary/5 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">Target — 20% beyond the benchmark</div>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">{playbook.target_summary}</p>
              </div>
            )}
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Competitor strengths"><List title="What the leaders do well" items={playbook.competitor_strengths} /></Panel>
            <Panel title="Competitor failure points"><List title="Where they are beatable" items={playbook.competitor_failure_points} /></Panel>
            <Panel title="Content gaps"><List title="Unanswered in this vertical" items={playbook.content_gaps} /></Panel>
            <Panel title="Authority gaps"><List title="Link and entity deficits" items={playbook.authority_gaps} /></Panel>
            <Panel title="Surface wins"><List title="Local pack · organic · AI overview" items={playbook.surface_wins} /></Panel>
            <Panel title="Industry norms"><List title="What normal looks like here" items={playbook.norms} /></Panel>
          </div>

          <Panel
            title="Authority deliverables"
            subtitle="Earned, contextual links only — tracked as concrete work items"
            right={playbook.partner_p_cross_boost > 0 && (
              <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                +{Math.round(playbook.partner_p_cross_boost * 100)}% modeled p_cross
              </span>
            )}
          >
            {!deliverables.length && <p className="text-xs text-muted-foreground">No deliverables identified yet.</p>}
            <ul className="space-y-3">
              {deliverables.map((d) => (
                <li key={d.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-heading text-[13px] font-medium text-foreground">
                        <Link2 className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{d.partner_domain}</span>
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{d.deliverable}</p>
                    </div>
                    <StatusPill tone={DELIVERABLE_TONE[d.status] || 'idle'}>{d.status}</StatusPill>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                    <span>{d.asset_type}</span>
                    <span className="text-primary">+{Math.round((d.modeled_p_cross_boost || 0) * 100)}% p_cross</span>
                    {d.target_url && <span className="truncate">→ {d.target_url}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['requested', 'in_progress', 'live', 'verified'].map((s) => (
                      <Button key={s} size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => advance(d, s)} disabled={d.status === s}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <SuggestionLightbulb surface="strategy" />
    </div>
  );
}