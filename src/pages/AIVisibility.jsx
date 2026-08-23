import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Provenance from '@/components/kit/Provenance';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { useTenantData } from '@/lib/useTenantData';
import { useGlobalData } from '@/lib/useTenantData';

export default function AIVisibility() {
  const { rows: observations, loading } = useTenantData('AIAnswerObservation', {}, '-observed_at');
  const { rows: connectors } = useGlobalData('ConnectorStatus');
  const provider = connectors.find((c) => c.service === 'AI Visibility Provider');
  const authorized = provider?.state === 'authorized';

  return (
    <div>
      <PageHeader
        eyebrow="AI Visibility"
        title="Multi-engine answer observation"
        description="Measured prompt/citation/source/sentiment history across AI engines. Until an authorized provider is connected, observations are UNAUTHORIZED — never substituted with LLM guesses."
        actions={
          <StatusPill tone={authorized ? 'good' : 'bad'}>
            {authorized ? 'Provider authorized' : 'Provider authorization required'}
          </StatusPill>
        }
      />
      {!authorized && (
        <Panel className="mb-4" title="No measured AI visibility yet">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Live AI visibility must come from an authorized provider/browser observation with timestamps and provenance.
              Do not add fake AI-search metrics. Connect the AI Visibility Provider to begin measured observation.
            </p>
          </div>
        </Panel>
      )}
      <Panel title="Observation ledger" subtitle="Engine-separated history">
        {loading ? <Loading /> : observations.length === 0 ? (
          <EmptyState icon={Sparkles} title="No observations" description="Authorize the AI Visibility Provider to record measured observations." />
        ) : (
          <ul className="space-y-3">
            {observations.map((o) => (
              <li key={o.id} className="rounded border border-border/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-xs text-foreground">{o.engine}</span>
                  <Provenance value={o.provenance} />
                </div>
                <div className="mt-1.5 truncate text-sm text-foreground">{o.prompt}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                  <span>cited: {o.cited ? 'yes' : 'no'}</span>
                  <span>·</span>
                  <span>sentiment: {o.sentiment}</span>
                  <span>·</span>
                  <span>{(o.competitors_cited || []).length} competitors cited</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}