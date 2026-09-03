import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const now = new Date().toISOString();
    const results = [];

    // 1. Discovery: methods exist with sources
    const methods = await base44.asServiceRole.entities.RankingMethod.list('-discovered_at', 200);
    const withSource = methods.filter((m) => m.source_url);
    results.push({ suite: 'provenance', name: 'ranking_methods_have_sources', requirement: 'Discovered methods carry source URLs', status: methods.length > 0 && withSource.length >= methods.length * 0.5 ? 'pass' : 'fail', detail: `${withSource.length}/${methods.length} methods have source_url`, last_run_at: now });

    // 2. Algorithm monitor: research findings exist
    const findings = await base44.asServiceRole.entities.ResearchFinding.list('-observed_at', 50);
    results.push({ suite: 'provenance', name: 'algorithm_monitor_ran', requirement: 'Algorithm update monitor has produced research findings', status: findings.length > 0 ? 'pass' : 'fail', detail: `${findings.length} findings`, last_run_at: now });

    // 3. Attribution loop: at least one validated method
    const validated = methods.filter((m) => m.status === 'validated');
    results.push({ suite: 'approval_gates', name: 'attribution_loop_ran', requirement: 'Attribution loop has promoted methods to validated', status: validated.length > 0 ? 'pass' : 'blocked', detail: `${validated.length} validated methods`, last_run_at: now });

    // 4. Sprint planner: queued agent jobs exist
    const jobs = await base44.asServiceRole.entities.AgentJob.filter({ status: 'queued' });
    results.push({ suite: 'module_coverage', name: 'sprint_plan_exists', requirement: '7-day sprint has queued method applications', status: jobs.length > 0 ? 'pass' : 'blocked', detail: `${jobs.length} queued jobs`, last_run_at: now });

    // 5. Connectors authorized — inspect real OAuth connection state, not stale entity records
    let gscState = 'missing', ga4State = 'missing';
    try { const c = await base44.asServiceRole.connectors.getConnection('google_search_console'); if (c?.accessToken) gscState = 'authorized'; } catch {}
    try { const c = await base44.asServiceRole.connectors.getConnection('google_analytics'); if (c?.accessToken) ga4State = 'authorized'; } catch {}
    const connectors = await base44.asServiceRole.entities.ConnectorStatus.list();
    async function syncStatus(service, state) {
      const rec = connectors.find((c) => c.service === service);
      if (rec) { if (rec.state !== state) await base44.asServiceRole.entities.ConnectorStatus.update(rec.id, { state, last_sync_at: now }); }
      else await base44.asServiceRole.entities.ConnectorStatus.create({ service, state, purpose: service === 'google_search_console' ? 'Search Console data + indexing' : 'Analytics traffic', provides: [], last_sync_at: now });
    }
    await syncStatus('google_search_console', gscState);
    await syncStatus('google_analytics', ga4State);
    results.push({ suite: 'tenancy', name: 'gsc_authorized', requirement: 'Google Search Console connector authorized', status: gscState === 'authorized' ? 'pass' : 'fail', detail: gscState, last_run_at: now });
    results.push({ suite: 'tenancy', name: 'ga4_authorized', requirement: 'Google Analytics connector authorized', status: ga4State === 'authorized' ? 'pass' : 'fail', detail: ga4State, last_run_at: now });

    // 6. Data integrity: receipts exist
    const receipts = await base44.asServiceRole.entities.Receipt.list('-occurred_at', 50);
    results.push({ suite: 'data_integrity', name: 'receipts_logged', requirement: 'Proof receipts are being written', status: receipts.length > 0 ? 'pass' : 'fail', detail: `${receipts.length} receipts`, last_run_at: now });

    // 7. v2 contracts: pilot clients exist
    const clients = await base44.asServiceRole.entities.Client.list();
    results.push({ suite: 'v2_contracts', name: 'pilot_clients_seeded', requirement: 'At least one pilot client exists', status: clients.length > 0 ? 'pass' : 'fail', detail: `${clients.length} clients`, last_run_at: now });

    // Write all validation results
    await base44.asServiceRole.entities.ValidationTest.bulkCreate(results);

    const pass = results.filter((r) => r.status === 'pass').length;
    const fail = results.filter((r) => r.status === 'fail').length;
    const blocked = results.filter((r) => r.status === 'blocked').length;

    await base44.asServiceRole.entities.Receipt.create({
      kind: 'validation',
      summary: `System validation: ${pass} pass, ${fail} fail, ${blocked} blocked (${results.length} checks)`,
      detail: results.map((r) => `${r.name}=${r.status}`).join(', '),
      source: 'ValidateSystem',
      provenance: 'MEASURED',
      occurred_at: now
    });

    return Response.json({ total: results.length, pass, fail, blocked, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}