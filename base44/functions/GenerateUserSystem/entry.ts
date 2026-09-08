import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// ─────────────────────────────────────────────────────────────────────────────
// GenerateUserSystem — The autonomous "generator" that takes a user's onboarding
// answers and automatically builds their ENTIRE system:
//
//   1. Client project record
//   2. AI Agent council (6 specialist agents)
//   3. URL targets (each URL registered for tracking)
//   4. Competitor records (for counter-strategy intelligence)
//   5. Opportunities (from target keywords)
//   6. Industry playbook (benchmark + target)
//   7. System config + agent config (persisted on OnboardingProfile)
//   8. Receipt documenting the generation
//
// After generation, the MasterOrchestrator's hourly heartbeat picks up the new
// client and begins autonomous cycles automatically — no manual steps needed.
//
// Invoke: base44.functions.invoke('GenerateUserSystem', { profile_id })
//   or   base44.functions.invoke('GenerateUserSystem', { ...onboardingFields })
// ─────────────────────────────────────────────────────────────────────────────

const AGENT_COUNCIL = [
  { name: 'Commander', specialty: 'Orchestrate all SEO phases and prioritize actions', discipline: 'governance', requires_approval: false },
  { name: 'Scout', specialty: 'Research competitors, discover ranking methods, scan for traction keywords', discipline: 'measurement', requires_approval: false },
  { name: 'Builder', specialty: 'Implement SEO changes, generate content, optimize on-page factors', discipline: 'content', requires_approval: false },
  { name: 'Healer', specialty: 'Fix errors, auto-heal failures, resolve technical SEO issues', discipline: 'technical', requires_approval: false },
  { name: 'Sentinel', specialty: 'Monitor rankings, detect anomalies, track competitor movements', discipline: 'measurement', requires_approval: false },
  { name: 'Validator', specialty: 'Verify ranking improvements, validate schema, audit deployments', discipline: 'governance', requires_approval: false },
];

function cleanDomain(url: string): string {
  return (url || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

function domainFromUrl(url: string): string {
  return cleanDomain(url).split('/')[0];
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();

    // ── Load profile (by id) or use inline fields ──
    let profile = null;
    if (body.profile_id) {
      profile = await svc.entities.OnboardingProfile.get(body.profile_id);
    }
    const p = profile || body;
    const clientId = p.client_id || body.client_id || null;

    // ── 1. Create Client project ──
    let client = null;
    if (!clientId) {
      const domain = domainFromUrl((p.urls || [])[0] || '');
      client = await svc.entities.Client.create({
        name: p.company_name || 'Untitled Business',
        domain,
        industry: p.industry || 'Other',
        status: 'non_production_pilot',
        monthly_paid_spend: Number(p.monthly_budget) || 0,
        spend_provenance: 'OPERATOR_ESTIMATE',
        revenue_provenance: 'UNKNOWN',
        notes: `Auto-generated from onboarding. Goal: ${p.desired_results || 'rank_for_targets'}. Service area: ${p.service_area || 'unknown'}. Target audience: ${p.target_audience || 'unknown'}.`,
      });
    } else {
      const existing = await svc.entities.Client.filter({ id: clientId });
      client = existing[0] || null;
    }

    const finalClientId = client?.id || clientId || user.id;

    // ── 2. Create AI Agent council ──
    const existingAgents = await svc.entities.Agent.filter({ name: { $in: AGENT_COUNCIL.map(a => a.name) } }).catch(() => []);
    const existingNames = new Set((existingAgents || []).map(a => a.name));
    const agentsToCreate = AGENT_COUNCIL.filter(a => !existingNames.has(a.name));
    let createdAgents = [];
    if (agentsToCreate.length > 0) {
      createdAgents = await svc.entities.Agent.bulkCreate(
        agentsToCreate.map(a => ({
          name: a.name,
          specialty: a.specialty,
          discipline: a.discipline,
          status: 'idle',
          requires_approval: a.requires_approval,
          methods: [],
        }))
      );
    }

    // ── 3. Create URL targets ──
    const urls = (p.urls || []).filter((u: string) => u && u.trim());
    const urlTargets = [];
    if (urls.length > 0) {
      for (const url of urls) {
        const clean = url.trim();
        const domain = domainFromUrl(clean);
        // Check if already exists
        const existing = await svc.entities.UrlTarget.filter({ url: clean, client_id: finalClientId }).catch(() => []);
        if (existing.length === 0) {
          const target = await svc.entities.UrlTarget.create({
            client_id: finalClientId,
            url: clean,
            domain,
            url_state: 'NEW_NO_HISTORY',
            index_state: 'UNOBSERVED',
            target_queries: p.target_keywords || [],
            clock_started_at: now,
            deploy_authorized: false,
          });
          urlTargets.push(target);
        }
      }
    }

    // ── 4. Create Competitor records ──
    const competitorUrls = (p.competitor_urls || []).filter((u: string) => u && u.trim());
    const competitors = [];
    if (competitorUrls.length > 0) {
      for (const compUrl of competitorUrls) {
        const clean = compUrl.trim();
        const domain = cleanDomain(clean);
        const existing = await svc.entities.Competitor.filter({ client_id: finalClientId, domain }).catch(() => []);
        if (existing.length === 0) {
          const comp = await svc.entities.Competitor.create({
            client_id: finalClientId,
            name: domain,
            domain,
            authority_provenance: 'UNKNOWN',
            twin_provenance: 'INFERRED',
            last_observed_at: now,
          });
          competitors.push(comp);
        }
      }
    }

    // ── 5. Create Opportunities from target keywords ──
    const keywords = (p.target_keywords || []).filter((k: string) => k && k.trim());
    const opportunities = [];
    if (keywords.length > 0) {
      for (const kw of keywords) {
        const existing = await svc.entities.Opportunity.filter({ client_id: finalClientId, query: kw.trim() }).catch(() => []);
        if (existing.length === 0) {
          const opp = await svc.entities.Opportunity.create({
            client_id: finalClientId,
            query: kw.trim(),
            intent: 'unknown',
            rank_provenance: 'UNKNOWN',
            volume_provenance: 'UNKNOWN',
            difficulty_provenance: 'UNKNOWN',
            cpc_provenance: 'UNKNOWN',
            router_decision: 'pending',
            fastpath_stage: 'none',
          });
          opportunities.push(opp);
        }
      }
    }

    // ── 6. Generate Industry Playbook (basic) ──
    const playbookExisting = await svc.entities.IndustryPlaybook.filter({ client_id: finalClientId, industry: p.industry }).catch(() => []);
    let playbook = null;
    if (playbookExisting.length === 0 && p.industry) {
      playbook = await svc.entities.IndustryPlaybook.create({
        client_id: finalClientId,
        industry: p.industry,
        sub_industry: p.sub_industry || '',
        benchmark_summary: `Reverse-engineered benchmark for ${p.industry} — to be populated by Scout agent.`,
        target_summary: `20%-better-than-benchmark target for ${p.industry} — to be computed after first competitor scan.`,
        competitor_strengths: [],
        competitor_failure_points: [],
        content_gaps: [],
        authority_gaps: [],
        surface_wins: [],
        norms: [],
        partner_authority_domains: [],
        partner_p_cross_boost: 0,
        provenance: 'MODELED',
        compiled_at: now,
      });
    }

    // ── 7. Generate system_config + agent_config ──
    const systemConfig = {
      client_id: finalClientId,
      industry: p.industry,
      sub_industry: p.sub_industry,
      service_area: p.service_area || 'local',
      target_audience: p.target_audience || '',
      current_monthly_traffic: p.current_monthly_traffic || 0,
      monthly_budget: p.monthly_budget || 0,
      urls: urls,
      competitors: competitorUrls,
      target_keywords: keywords,
      goals: p.desired_results,
      agents: AGENT_COUNCIL.map(a => ({ name: a.name, role: a.specialty, discipline: a.discipline, enabled: true })),
      autonomous_features: {
        competitor_intelligence: true,
        ai_search_visibility: true,
        content_generation: true,
        technical_seo_audit: true,
        ranking_monitoring: true,
        auto_healing: true,
        schema_validation: true,
        backlink_tracking: true,
      },
      generated_at: now,
    };

    // ── 8. Update OnboardingProfile ──
    if (profile) {
      await svc.entities.OnboardingProfile.update(profile.id, {
        system_config: JSON.stringify(systemConfig),
        agent_config: JSON.stringify(systemConfig.agents),
        status: 'completed',
        completed_at: now,
        google_search_console_connected: p.google_search_console_connected || false,
        google_analytics_connected: p.google_analytics_connected || false,
        current_monthly_traffic: p.current_monthly_traffic || 0,
      });
    }

    // ── 9. Create Receipt ──
    await svc.entities.Receipt.create({
      kind: 'ingestion',
      summary: `Generated full system for ${p.company_name || 'client'} (${p.industry}) — ${urls.length} URLs, ${competitors.length} competitors, ${keywords.length} keywords, 6 agents`,
      detail: JSON.stringify({
        client_id: finalClientId,
        agents: AGENT_COUNCIL.map(a => a.name),
        urls: urls.length,
        competitors: competitors.length,
        opportunities: opportunities.length,
        playbook: playbook ? 'created' : 'skipped',
      }, null, 2),
      source: 'GenerateUserSystem',
      provenance: 'MEASURED',
      occurred_at: now,
    });

    return Response.json({
      ok: true,
      client_id: finalClientId,
      client_name: p.company_name,
      agents_created: createdAgents.length,
      agents_total: AGENT_COUNCIL.length,
      url_targets: urlTargets.length,
      competitors: competitors.length,
      opportunities: opportunities.length,
      playbook: playbook ? 'created' : 'existing',
      system_config: systemConfig,
    });
  } catch (error) {
    console.error('[GenerateUserSystem] Error:', error.message);
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
}