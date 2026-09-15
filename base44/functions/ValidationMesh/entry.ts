import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// Validation Mesh — centralized cross-validation engine that checks
// 108 system variables + 60+ workflow specs against performance targets
// to ensure 100% compliance.
//
// Body: { scope?: "full" | "variables" | "workflows" | "benchmarks" | "cross_validate" }
//
// The mesh checks:
// 1. VARIABLE COMPLIANCE: each SystemVariable has resolved_value, confidence, impact_domains
// 2. WORKFLOW COMPLIANCE: each WorkflowSpec has mapped_function, status, KPI, idempotency_key
// 3. BENCHMARK COMPLIANCE: each BenchmarkCheck has status PASS or N/A with evidence
// 4. CROSS-VALIDATION: variables referenced by workflows are resolved; functions mapped to workflows exist
// 5. PERFORMANCE TARGETS: each domain has a target score; mesh checks if earned score meets target
// 6. 100% COMPLIANCE: all mandatory checks must PASS, all variables resolved, all workflows active

const PERFORMANCE_TARGETS = {
  variable_resolution: { target: 100, weight: 15, description: 'All 108 system variables resolved with confidence' },
  workflow_activation: { target: 100, weight: 15, description: 'All workflow specs mapped to active functions' },
  benchmark_pass_rate: { target: 100, weight: 20, description: 'All mandatory benchmark checks PASS' },
  forensic_remediation: { target: 100, weight: 15, description: 'All P0/P1 forensic findings fixed' },
  connector_health: { target: 90, weight: 10, description: '90% of connectors authorized and verified' },
  evidence_freshness: { target: 100, weight: 10, description: 'All evidence within max-age window' },
  google_compliance: { target: 100, weight: 10, description: 'Google guidelines compliance verified' },
  security_posture: { target: 100, weight: 5, description: 'Security scan passes, RLS enforced' },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const scope = body.scope || 'full';

    // Load all data
    const [variables, workflows, benchmarks, validationScores, forensics, connectors] = await Promise.all([
      base44.asServiceRole.entities.SystemVariable.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.WorkflowSpec.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.BenchmarkCheck.list('-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.ValidationScore.list('-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.ForensicFinding.list('-created_date', 100).catch(() => []),
      base44.asServiceRole.entities.ConnectorRegistry.list('-created_date', 50).catch(() => []),
    ]);

    const results = {
      timestamp: new Date().toISOString(),
      totals: {
        variables: variables.length,
        workflows: workflows.length,
        benchmarks: benchmarks.length,
        validation_scores: validationScores.length,
        forensics: forensics.length,
        connectors: connectors.length,
      },
    };

    // ── 1. VARIABLE COMPLIANCE ─────────────────────────────────────────
    if (scope === 'full' || scope === 'variables') {
      const total = variables.length;
      const resolved = variables.filter(v => v.resolved_value || v.default_value).length;
      const highConfidence = variables.filter(v => v.confidence === 'high').length;
      const withImpactDomains = variables.filter(v => v.impact_domains && v.impact_domains.length > 0).length;
      const requiresApproval = variables.filter(v => v.requires_approval).length;
      const assumptions = variables.filter(v => v.is_assumption).length;

      const targetCount = 108;
      const coveragePct = Math.round((total / targetCount) * 100);
      const resolutionPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
      const confidencePct = total > 0 ? Math.round((highConfidence / total) * 100) : 0;
      const impactPct = total > 0 ? Math.round((withImpactDomains / total) * 100) : 0;

      const complianceScore = Math.round((resolutionPct * 0.4 + confidencePct * 0.3 + impactPct * 0.2 + coveragePct * 0.1));

      const failedVariables = variables
        .filter(v => !v.resolved_value && !v.default_value)
        .map(v => ({ key: v.variable_key, group: v.group, issue: 'unresolved' }))
        .concat(variables.filter(v => !v.impact_domains || v.impact_domains.length === 0).map(v => ({ key: v.variable_key, group: v.group, issue: 'no_impact_domains' })));

      results.variable_compliance = {
        total,
        target_count: targetCount,
        coverage_pct: coveragePct,
        resolved,
        resolution_pct: resolutionPct,
        high_confidence: highConfidence,
        confidence_pct: confidencePct,
        with_impact_domains: withImpactDomains,
        impact_pct: impactPct,
        requires_approval: requiresApproval,
        assumptions,
        compliance_score: complianceScore,
        target_met: complianceScore >= PERFORMANCE_TARGETS.variable_resolution.target,
        failed: failedVariables.slice(0, 20),
        failed_count: failedVariables.length,
      };
    }

    // ── 2. WORKFLOW COMPLIANCE ─────────────────────────────────────────
    if (scope === 'full' || scope === 'workflows') {
      const total = workflows.length;
      const withMappedFunction = workflows.filter(w => w.mapped_function).length;
      const active = workflows.filter(w => w.status === 'active').length;
      const specified = workflows.filter(w => w.status === 'specified').length;
      const withKpi = workflows.filter(w => w.kpi).length;
      const withIdempotency = workflows.filter(w => w.idempotency_key).length;
      const withRetry = workflows.filter(w => w.retry_behavior).length;
      const withDeadLetter = workflows.filter(w => w.dead_letter).length;
      const withHumanGate = workflows.filter(w => w.human_gate).length;

      const targetCount = 60;
      const coveragePct = Math.round((total / targetCount) * 100);
      const activationPct = total > 0 ? Math.round((active / total) * 100) : 0;
      const mappingPct = total > 0 ? Math.round((withMappedFunction / total) * 100) : 0;
      const kpiPct = total > 0 ? Math.round((withKpi / total) * 100) : 0;
      const idempotencyPct = total > 0 ? Math.round((withIdempotency / total) * 100) : 0;

      const complianceScore = Math.round((activationPct * 0.3 + mappingPct * 0.25 + kpiPct * 0.2 + idempotencyPct * 0.15 + coveragePct * 0.1));

      const failedWorkflows = workflows
        .filter(w => !w.mapped_function && w.status !== 'specified')
        .map(w => ({ id: w.workflow_id, name: w.name, issue: 'no_mapped_function' }))
        .concat(workflows.filter(w => !w.kpi).map(w => ({ id: w.workflow_id, name: w.name, issue: 'no_kpi' })))
        .concat(workflows.filter(w => !w.idempotency_key).map(w => ({ id: w.workflow_id, name: w.name, issue: 'no_idempotency_key' })));

      results.workflow_compliance = {
        total,
        target_count: targetCount,
        coverage_pct: coveragePct,
        active,
        specified,
        with_mapped_function: withMappedFunction,
        mapping_pct: mappingPct,
        with_kpi: withKpi,
        kpi_pct: kpiPct,
        with_idempotency: withIdempotency,
        idempotency_pct: idempotencyPct,
        with_retry: withRetry,
        with_dead_letter: withDeadLetter,
        with_human_gate: withHumanGate,
        activation_pct: activationPct,
        compliance_score: complianceScore,
        target_met: complianceScore >= PERFORMANCE_TARGETS.workflow_activation.target,
        failed: failedWorkflows.slice(0, 20),
        failed_count: failedWorkflows.length,
      };
    }

    // ── 3. BENCHMARK COMPLIANCE ───────────────────────────────────────
    if (scope === 'full' || scope === 'benchmarks') {
      const total = benchmarks.length;
      const mandatory = benchmarks.filter(b => b.mandatory);
      const mandatoryPass = mandatory.filter(b => b.status === 'PASS');
      const mandatoryFail = mandatory.filter(b => b.status === 'FAIL');
      const mandatoryNotRun = mandatory.filter(b => b.status === 'NOT_RUN');
      const mandatoryNA = mandatory.filter(b => b.status === 'N/A');
      const withEvidence = benchmarks.filter(b => b.evidence_url || b.evidence_required === false);

      const targetCount = 143;
      const coveragePct = Math.round((total / targetCount) * 100);
      const passPct = mandatory.length > 0 ? Math.round((mandatoryPass.length / mandatory.length) * 100) : 0;
      const evidencePct = total > 0 ? Math.round((withEvidence.length / total) * 100) : 0;

      const complianceScore = Math.round((passPct * 0.5 + evidencePct * 0.3 + coveragePct * 0.2));

      results.benchmark_compliance = {
        total,
        target_count: targetCount,
        coverage_pct: coveragePct,
        mandatory_total: mandatory.length,
        mandatory_pass: mandatoryPass.length,
        mandatory_fail: mandatoryFail.length,
        mandatory_not_run: mandatoryNotRun.length,
        mandatory_na: mandatoryNA.length,
        pass_pct: passPct,
        with_evidence: withEvidence.length,
        evidence_pct: evidencePct,
        compliance_score: complianceScore,
        target_met: complianceScore >= PERFORMANCE_TARGETS.benchmark_pass_rate.target,
        failed_benchmarks: mandatoryFail.map(b => ({ id: b.benchmark_id, check: b.check, family: b.family })),
        not_run_benchmarks: mandatoryNotRun.slice(0, 10).map(b => ({ id: b.benchmark_id, check: b.check, family: b.family })),
      };
    }

    // ── 4. CROSS-VALIDATION ───────────────────────────────────────────
    if (scope === 'full' || scope === 'cross_validate') {
      const existingFunctions = [
        'DiscoverStrategicUrls', 'ContentGenerator', 'SyncSearchConsole', 'SerpMeasurement',
        'RunBenchmarkConstitution', 'ResolveVariables', 'ScoreValidation', 'AutoHealingEscalation',
        'TractionScanner', 'KeywordCluster', 'TechnicalSeoAudit', 'GenerateIndustryPlaybook',
        'EndToEndGenerator', 'VisionCortexOrchestrator', 'MasterOrchestrator', 'AutonomousConvergence',
        'BacklinkTracker', 'AISearchVisibility', 'CoreWebVitalsMonitor', 'SchemaValidator',
        'InternalLinkOptimizer', 'CrossDomainAuthorityBuilder', 'AnomalyDetection',
        'PredictiveRankingModel', 'ABTestRunner', 'EvolutionEngine', 'CompetitorWatchdog',
        'GoogleBusinessProfileSync', 'MultiPlatformSocialSync', 'AlgorithmUpdateMonitor',
        'PersistentMonitor', 'SeoCrawlSite', 'SiteAudit', 'GenerateSitemap', 'IndexNowPing',
        'LeadGenSitemap', 'LeadGenIndexNow', 'SearchConsoleIndex', 'GscVerificationMonitor',
        'ScrapeUrl', 'ScrapeIndustryKnowledge', 'ScrapeIndustryPricing', 'DiscoverTopPerformers',
        'AnalyzeCompetitors', 'ComputeIndustryBenchmarks', 'ResearchBestMethods',
        'DraftOutreach', 'GenerateHeadlines', 'RewriteContentForSeo', 'GenerateCopyVariants',
        'GenerateRepairPlan', 'ExtractDesignDNA', 'SystemDNA', 'SystemSelfReflection',
        'UniversalImplementer', 'AutonomousSystemImplementer', 'DeliveryGuarantee',
        'WeeklyDigest', 'SendClientReports', 'NotifySeoUpdates', 'ValidateSystem',
        'SecurityScan', 'ProvisioningManager', 'VercelAIGateway', 'VercelDomains',
        'GoogleWorkspaceSync', 'SupabaseSync', 'GoogleAnalyticsDashboard', 'EcosystemApi',
        'ManageApiKey', 'OnboardClient', 'StripeCheckout', 'StripeWebhook',
        'CaptureLead', 'GenerateSalesPitch', 'GenerateRankingMethods', 'SprintPlanner',
        'MethodAttribution', 'BulkProcess', 'FixEngine', 'DeepDiscoveryScan',
        'DiscoverCapabilities', 'VisionCortexConnect', 'VisionCortexWatch',
        'AreAudit', 'AreBenchmark', 'AreImplement', 'AreReflect', 'AreSuggest',
        'AreTwinOptimizer', 'DetectAsymmetries', 'ScoutTechNews', 'UrlInventorySync',
        'SitemapIngestion', 'CroAudit', 'GenerateUserSystem', 'DirectEmailSender',
      ];

      // Check workflows with mapped functions that don't exist
      const orphanedWorkflows = workflows.filter(w => w.mapped_function && !existingFunctions.includes(w.mapped_function));

      // Check variables referenced by workflows (via data_source, connector, db_entity fields)
      const variableKeys = new Set(variables.map(v => v.variable_key));
      const unresolvedInWorkflows = workflows.filter(w => {
        // Check if workflow references variables that don't exist
        const refs = [w.data_source, w.connector, w.db_entity].filter(Boolean).join(' ');
        return refs && !variableKeys.has(refs) && refs !== 'See source registry';
      });

      // Check validation score domains against performance targets
      const targetDomains = Object.keys(PERFORMANCE_TARGETS);
      const scoreByDomain = {};
      for (const vs of validationScores) {
        scoreByDomain[vs.domain] = vs;
      }

      const targetCompliance = targetDomains.map(domain => {
        const target = PERFORMANCE_TARGETS[domain];
        const score = scoreByDomain[domain];
        const earned = score ? (score.status === 'PASS' ? target.weight : (score.earned_score || 0)) : 0;
        const status = score ? score.status : 'MISSING';
        const met = earned >= target.weight * (target.target / 100);
        return {
          domain,
          target: target.target,
          weight: target.weight,
          earned,
          status,
          met,
          description: target.description,
          evidence: score?.evidence || 'No evidence',
          remediation: score?.remediation || `Achieve ${target.target}% compliance`,
        };
      });

      const targetsMet = targetCompliance.filter(t => t.met).length;
      const totalTargets = targetCompliance.length;
      const targetCompliancePct = Math.round((targetsMet / totalTargets) * 100);

      results.cross_validation = {
        existing_functions_count: existingFunctions.length,
        orphaned_workflows: orphanedWorkflows.map(w => ({ id: w.workflow_id, name: w.name, mapped_function: w.mapped_function })),
        orphaned_count: orphanedWorkflows.length,
        unresolved_workflow_refs: unresolvedInWorkflows.length,
        target_compliance: targetCompliance,
        targets_met: targetsMet,
        total_targets: totalTargets,
        target_compliance_pct: targetCompliancePct,
      };
    }

    // ── 5. FORENSIC REMEDIATION STATUS ────────────────────────────────
    if (scope === 'full') {
      const p0 = forensics.filter(f => f.severity === 'P0');
      const p1 = forensics.filter(f => f.severity === 'P1');
      const p0Open = p0.filter(f => f.fix_status === 'open' || f.fix_status === 'in_progress');
      const p1Open = p1.filter(f => f.fix_status === 'open' || f.fix_status === 'in_progress');
      const fixed = forensics.filter(f => f.fix_status === 'fixed' || f.fix_status === 'verified');
      const remediationPct = forensics.length > 0 ? Math.round((fixed.length / forensics.length) * 100) : 0;

      results.forensic_remediation = {
        total: forensics.length,
        p0_total: p0.length,
        p0_open: p0Open.length,
        p1_total: p1.length,
        p1_open: p1Open.length,
        fixed: fixed.length,
        remediation_pct: remediationPct,
        target_met: remediationPct >= PERFORMANCE_TARGETS.forensic_remediation.target,
        open_p0: p0Open.map(f => ({ id: f.finding_id, finding: f.finding.substring(0, 100), status: f.fix_status })),
      };
    }

    // ── 6. CONNECTOR HEALTH ───────────────────────────────────────────
    if (scope === 'full') {
      const authorized = connectors.filter(c => c.status === 'authorized');
      const pending = connectors.filter(c => c.status === 'pending');
      const failed = connectors.filter(c => c.status === 'failed');
      const healthPct = connectors.length > 0 ? Math.round((authorized.length / connectors.length) * 100) : 0;

      results.connector_health = {
        total: connectors.length,
        authorized: authorized.length,
        pending: pending.length,
        failed: failed.length,
        health_pct: healthPct,
        target_met: healthPct >= PERFORMANCE_TARGETS.connector_health.target,
        pending_connectors: pending.map(c => c.connector),
      };
    }

    // ── 7. OVERALL COMPLIANCE SCORE ───────────────────────────────────
    if (scope === 'full') {
      const scores = [];
      if (results.variable_compliance) scores.push({ domain: 'variable_resolution', score: results.variable_compliance.compliance_score, weight: PERFORMANCE_TARGETS.variable_resolution.weight });
      if (results.workflow_compliance) scores.push({ domain: 'workflow_activation', score: results.workflow_compliance.compliance_score, weight: PERFORMANCE_TARGETS.workflow_activation.weight });
      if (results.benchmark_compliance) scores.push({ domain: 'benchmark_pass_rate', score: results.benchmark_compliance.compliance_score, weight: PERFORMANCE_TARGETS.benchmark_pass_rate.weight });
      if (results.forensic_remediation) scores.push({ domain: 'forensic_remediation', score: results.forensic_remediation.remediation_pct, weight: PERFORMANCE_TARGETS.forensic_remediation.weight });
      if (results.connector_health) scores.push({ domain: 'connector_health', score: results.connector_health.health_pct, weight: PERFORMANCE_TARGETS.connector_health.weight });

      const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
      const earnedWeight = scores.reduce((sum, s) => sum + (s.score * s.weight / 100), 0);
      const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

      const allTargetsMet = scores.every(s => s.score >= PERFORMANCE_TARGETS[s.domain].target);

      results.overall = {
        score: overallScore,
        target: 100,
        status: allTargetsMet ? 'VERIFIED_100' : (overallScore >= 80 ? 'IN_PROGRESS' : 'NON_COMPLIANT'),
        all_targets_met: allTargetsMet,
        domains: scores,
        gap_to_100: 100 - overallScore,
      };

      // Update validation score for the mesh
      const meshScores = await base44.asServiceRole.entities.ValidationScore.filter({ domain: 'Validation mesh' });
      if (meshScores.length > 0) {
        await base44.asServiceRole.entities.ValidationScore.update(meshScores[0].id, {
          status: allTargetsMet ? 'PASS' : 'PENDING',
          evidence: `Overall: ${overallScore}/100. Variables: ${results.variable_compliance?.compliance_score || 0}%, Workflows: ${results.workflow_compliance?.compliance_score || 0}%, Benchmarks: ${results.benchmark_compliance?.compliance_score || 0}%, Forensics: ${results.forensic_remediation?.remediation_pct || 0}%`,
          earned_score: Math.round((overallScore / 100) * 15),
          last_checked_at: new Date().toISOString(),
        });
      } else {
        await base44.asServiceRole.entities.ValidationScore.create({
          domain: 'Validation mesh',
          weight: 15,
          status: allTargetsMet ? 'PASS' : 'PENDING',
          evidence: `Overall: ${overallScore}/100`,
          earned_score: Math.round((overallScore / 100) * 15),
          last_checked_at: new Date().toISOString(),
          remediation: allTargetsMet ? 'All targets met' : 'Close gaps in variable resolution, workflow activation, and benchmark pass rate',
        });
      }

      // Create receipt
      await base44.asServiceRole.entities.Receipt.create({
        summary: `Validation mesh run: ${overallScore}/100 (${allTargetsMet ? 'VERIFIED_100' : 'IN_PROGRESS'})`,
        source: 'ValidationMesh',
        occurred_at: new Date().toISOString(),
        proof_level: 2,
      });
    }

    return Response.json(results);
  } catch (error) {
    console.error('ValidationMesh error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}