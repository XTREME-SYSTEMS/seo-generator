import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { Button } from '@/components/ui/button';
import { RefreshCw, Rows3 } from 'lucide-react';
import WorkbookSummary from '@/components/workbook/WorkbookSummary';
import WorkbookFilters from '@/components/workbook/WorkbookFilters';
import WorkbookTable from '@/components/workbook/WorkbookTable';

export default function UrlWorkbook() {
  const [rows, setRows] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [filters, setFilters] = useState({ q: '', domain: '', page_type: '', funnel_stage: '' });

  const load = async () => {
    const data = await base44.entities.UrlInventory.list('-impressions_28d', 2000);
    setRows(data);
  };
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    setSyncNote('');
    try {
      const res = await base44.functions.invoke('UrlInventorySync', {});
      const errs = (res.data.properties || []).filter((p) => p.error);
      setSyncNote(
        `Synced ${res.data.total_urls} URLs from Search Console.` +
        (errs.length ? ` ${errs.length} propert${errs.length === 1 ? 'y' : 'ies'} lack verified access: ${errs.map((e) => e.domain).join(', ')}.` : '')
      );
      await load();
    } catch (e) {
      setSyncNote(`Sync failed: ${e.message}`);
    }
    setSyncing(false);
  };

  const onStatusChange = async (row, field, value) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)));
    await base44.entities.UrlInventory.update(row.id, { [field]: value });
  };

  const domains = useMemo(() => [...new Set((rows || []).map((r) => r.domain).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (filters.domain && r.domain !== filters.domain) return false;
      if (filters.page_type && r.page_type !== filters.page_type) return false;
      if (filters.funnel_stage && r.funnel_stage !== filters.funnel_stage) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!(r.url || '').toLowerCase().includes(q) && !(r.top_query || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  if (!rows) return <Loading label="Loading URL workbook…" />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Intelligence"
        title="URL Workbook"
        description="Every URL from Search Console, organized by pillar/cluster architecture, funnel stage, intent, and SEO / AEO / AI-search readiness."
        actions={
          <Button onClick={sync} disabled={syncing} size="sm">
            <RefreshCw className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync from Search Console'}
          </Button>
        }
      />
      {syncNote && <p className="text-xs text-muted-foreground">{syncNote}</p>}
      <WorkbookSummary rows={filtered} />
      <Panel title={`URLs (${filtered.length})`} right={<WorkbookFilters filters={filters} setFilters={setFilters} domains={domains} />}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Rows3}
            title="No URLs yet"
            description="Run a Search Console sync to pull every URL Google knows about across your verified properties."
          />
        ) : (
          <WorkbookTable rows={filtered} onStatusChange={onStatusChange} />
        )}
      </Panel>
    </div>
  );
}