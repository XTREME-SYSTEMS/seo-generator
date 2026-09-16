import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Loader2, RefreshCw, AlertTriangle, Bug, FileSearch, CheckCircle2, XCircle } from 'lucide-react';

// Forensic audit report — produced from end-to-end analysis of the system.
// This is a read-only findings report organized by subsystem.
const FINDINGS_REPORT = [
  // SEO Engine
  { subsystem: 'SEO Engine', severity: 'P1', finding: '86 benchmark checks defined but 0 pass — all NOT_RUN', evidence: 'BenchmarkCheck entity has 86 records, all status NOT_RUN', fix: 'Run RunBenchmarkConstitution to execute the full suite and populate results' },
  { subsystem: 'SEO Engine', severity: 'P0', finding: 'Portfolio score is 15.3 — far below target of 100', evidence: 'UrlScoreboard shows portfolio score 15.3, 0/11 queries in top 3', fix: 'Continue ARE convergence loop; prioritize high-intent queries with striking-distance positions' },
  { subsystem: 'SEO Engine', severity: 'P2', finding: 'Validation pass rate is 0% — 500 treatments deployed with no measured impact', evidence: 'RankingProgress shows 500 treatments, 0% validation pass rate', fix: 'Review treatment quality; ensure treatments target real ranking gaps, not vanity changes' },
  { subsystem: 'SEO Engine', severity: 'P1', finding: 'GSC data missing for 3 properties (xtremepolishingsystems, nationalconcretepolishing, epoxyquotenearme)', evidence: 'Known issue — Search Console access not verified', fix: 'Verify ownership in GSC for these domains; re-sync via SyncSearchConsole' },

  // CloudBrowser
  { subsystem: 'CloudBrowser', severity: 'P0', finding: 'ACT/OBSERVE/AGENT AI primitives not implemented — browser is scripted only', evidence: 'CloudBrowser page lists these as roadmap; no natural-language browser control', fix: 'Implement ACT (NL→action), OBSERVE (element discovery), AGENT (bounded multi-step) primitives' },
  { subsystem: 'CloudBrowser', severity: 'P1', finding: 'Residential proxy not connected — Google blocks Railway datacenter IPs', evidence: 'Known issue; SERP scraping blocked at scale', fix: 'Connect a residential proxy provider or use GSC data for attribution instead' },
  { subsystem: 'CloudBrowser', severity: 'P1', finding: 'Context persistence not implemented — no logged-in session reuse', evidence: 'browser_context_create/use listed as roadmap', fix: 'Implement persistent browser contexts for directory submissions and social automation' },
  { subsystem: 'CloudBrowser', severity: 'P2', finding: 'No content deployment pipeline — generated content has no path to live sites', evidence: 'Gap analysis on CloudBrowser page', fix: 'Wire CloudBrowser to paste content into CMS (WordPress/Webflow/Vercel)' },

  // Vision Cortex
  { subsystem: 'Vision Cortex', severity: 'P2', finding: 'Vision Cortex orchestrator exists but shadow system not fully wired', evidence: 'Agent config exists; autonomous loop workflow exists but outputs unclear', fix: 'Define and measure Vision Cortex outputs — what decisions it makes and their impact' },
  { subsystem: 'Vision Cortex', severity: 'P3', finding: 'SystemDNA and SystemSelfReflection functions exist but may not be scheduled', evidence: 'No dedicated workflow found for SystemSelfReflection', fix: 'Add a scheduled workflow for daily self-reflection' },

  // NearMe
  { subsystem: 'NearMe', severity: 'P2', finding: '90 candidates generated, 18 available — but 0 converted to live sites', evidence: 'NearMeUrlFinder shows 0 pages generated for most candidates', fix: 'Wire domain purchase + site generation pipeline for available candidates' },
  { subsystem: 'NearMe', severity: 'P3', finding: 'Demand scores are AI-estimated, not measured from real search data', evidence: 'demand_score populated by LLM, not GSC', fix: 'Cross-reference with GSC impression data where available' },

  // Generator Hub
  { subsystem: 'Generator Hub', severity: 'P0', finding: 'Idea Generator was broken — results never displayed (res.data vs res mismatch)', evidence: 'FIXED: setResult(res.data || res)', fix: 'Fixed. Monitor for other generators with same pattern' },
  { subsystem: 'Generator Hub', severity: 'P2', finding: '13 generators but no unified output tracking — GeneratedAsset has 0 compliance scores', evidence: 'AssetPerformance shows avg compliance 0', fix: 'Add compliance scoring to each generator output' },

  // End-to-End Generator
  { subsystem: 'End-to-End Generator', severity: 'P1', finding: 'Pipeline is 36/240 steps done — 85% of niches not started', evidence: 'EndToEndGenerator page shows 23 niches at 0/8', fix: 'Continue autonomous loop; consider parallelizing niche processing' },
  { subsystem: 'End-to-End Generator', severity: 'P2', finding: 'Sequential pipeline execution risks timeouts on complex niches', evidence: 'Known issue — sequential 11-phase orchestrator exceeded timeouts', fix: 'Batch execution; use the existing refactored batching pattern' },

  // Universal Generator
  { subsystem: 'Universal Generator', severity: 'P1', finding: '14 forensic findings, 4 P0 — all open', evidence: 'ForensicFinding entity has 14 records, fix_status=open', fix: 'Address P0 findings first; assign owners and track to resolution' },
  { subsystem: 'Universal Generator', severity: 'P2', finding: '129 system variables but resolution confidence unknown', evidence: 'SystemVariable entity — resolved_value/resolved_source may be empty', fix: 'Run ResolveVariables to populate resolved values and confidence' },

  // Mission Control
  { subsystem: 'Mission Control', severity: 'P1', finding: 'Portfolio value $106.7M but 0 live sites — all in queue', evidence: 'MissionControl shows 0 live sites, 5 queued', fix: 'Execute mass production pipeline to deploy queued sites' },
  { subsystem: 'Mission Control', severity: 'P2', finding: '2,250 city pages target but 0 deployed', evidence: 'City Pages Target 2,250, Live Sites 0', fix: 'Deploy programmatic city pages to Vercel' },

  // AGI Swarm
  { subsystem: 'AGI Swarm', severity: 'P2', finding: '6 agents listed as online but 0 swarm active on live sites', evidence: 'AgiSwarm shows 0 live sites under swarm management', fix: 'Deploy sites first, then activate swarm management' },
  { subsystem: 'AGI Swarm', severity: 'P3', finding: 'Multi-Platform Social Sync and Weekly Digest are queued, not active', evidence: 'AgiSwarm page shows these as queued', fix: 'Activate once social connectors are connected' },

  // Stripe
  { subsystem: 'Stripe', severity: 'P0', finding: 'Stripe account unclaimed — test mode only, no real payments', evidence: 'Stripe status: unclaimed', fix: 'Claim account in Dashboard > Integrations; provide live API keys' },
  { subsystem: 'Stripe', severity: 'P1', finding: 'Webhook signing secret misaligned — requires clearing and re-registering', evidence: 'Known issue', fix: 'Delete STRIPE_WEBHOOK_SECRET, re-register endpoint, store new secret' },

  // Connectors
  { subsystem: 'Connectors', severity: 'P1', finding: 'No social media connectors (Facebook, Instagram, TikTok, YouTube)', evidence: 'Not in authorized connectors list', fix: 'Connect social platforms for MultiPlatformSocialSync workflow' },
  { subsystem: 'Connectors', severity: 'P1', finding: 'No Google Business Profile connector', evidence: 'Not in authorized connectors', fix: 'Connect GBP for local SEO automation' },
  { subsystem: 'Connectors', severity: 'P2', finding: 'HubSpot registered but not authorized', evidence: 'In workspace connectors but not in authorized list', fix: 'Authorize HubSpot if needed, or remove if unused' },

  // Workflows
  { subsystem: 'Workflows', severity: 'P2', finding: '37 workflows — potential overlap and credit consumption', evidence: '37 workflow files in base44/workflows/', fix: 'Audit for redundancy; consolidate overlapping loops' },
  { subsystem: 'Workflows', severity: 'P1', finding: 'Integration credits were exhausted — may recur with 37 active workflows', evidence: 'Known issue — credits exhausted until 2026-09-12', fix: 'Monitor credit usage; pause non-essential workflows' },

  // Infrastructure
  { subsystem: 'Infrastructure', severity: 'P2', finding: 'Vercel cron runner has 0 crons registered — workflows not migrated', evidence: 'Provisioning page shows 0 crons', fix: 'Migrate scheduled workflows to Vercel crons for reliability' },
  { subsystem: 'Infrastructure', severity: 'P3', finding: 'Google Drive, Docs, Sheets, Calendar, Tasks not connected', evidence: 'Provisioning page shows these as Not Connected', fix: 'Connect if needed for content generation and scheduling' },
];

const SEVERITY_TONE = { P0: 'bg-red-100 text-red-700 border-red-200', P1: 'bg-amber-100 text-amber-700 border-amber-200', P2: 'bg-blue-100 text-blue-700 border-blue-200', P3: 'bg-slate-100 text-slate-600 border-slate-200' };

export default function ForensicAudit() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.ForensicFinding.list('-created_date', 200).catch(() => []);
      setFindings(rows || []);
    } catch { /* non-critical */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Merge DB findings with the static report
  const allFindings = [
    ...FINDINGS_REPORT.map((f, i) => ({ ...f, id: `report-${i}`, source: 'audit' })),
    ...findings.map(f => ({ subsystem: 'ForensicFinding DB', severity: f.severity, finding: f.finding, evidence: f.evidence, fix: f.required_correction, fix_status: f.fix_status, id: f.id, source: 'db' })),
  ];

  const filtered = allFindings.filter(f => {
    if (filter !== 'all' && f.severity !== filter) return false;
    if (subFilter !== 'all' && f.subsystem !== subFilter) return false;
    return true;
  });

  const subsystems = [...new Set(allFindings.map(f => f.subsystem))].sort();
  const counts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  allFindings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Forensic Audit — End-to-End Findings</h1>
              <p className="text-xs text-muted-foreground">Read-only analysis of every subsystem, page, function, workflow, and entity — with severity and fixes</p>
            </div>
          </div>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload DB Findings
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {['P0', 'P1', 'P2', 'P3'].map(s => (
            <div key={s} className={`bg-card border rounded-lg p-4 ${s === 'P0' ? 'border-red-200' : s === 'P1' ? 'border-amber-200' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{s} Findings</span>
                {s === 'P0' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : s === 'P1' ? <Bug className="w-4 h-4 text-amber-500" /> : <FileSearch className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className={`text-2xl font-semibold tabular ${s === 'P0' ? 'text-red-600' : s === 'P1' ? 'text-amber-600' : 'text-foreground'}`}>{counts[s]}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
            <option value="all">All Severities</option>
            <option value="P0">P0 — Critical</option>
            <option value="P1">P1 — High</option>
            <option value="P2">P2 — Medium</option>
            <option value="P3">P3 — Low</option>
          </select>
          <select value={subFilter} onChange={(e) => setSubFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
            <option value="all">All Subsystems</option>
            {subsystems.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} findings</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(f => (
              <div key={f.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${SEVERITY_TONE[f.severity]}`}>{f.severity}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{f.subsystem}</span>
                      {f.fix_status && <span className={`text-[9px] px-1.5 py-0.5 rounded ${f.fix_status === 'fixed' || f.fix_status === 'verified' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{f.fix_status}</span>}
                    </div>
                    <div className="text-sm font-medium text-foreground mb-1">{f.finding}</div>
                    {f.evidence && <div className="text-xs text-muted-foreground"><span className="font-medium">Evidence:</span> {f.evidence}</div>}
                    {f.fix && <div className="text-xs text-green-700 mt-1"><span className="font-medium">Fix:</span> {f.fix}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prioritized Rebuild Plan */}
        <div className="mt-8 bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Prioritized Rebuild Plan</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li><span className="font-mono text-primary font-bold">1.</span> <span className="text-foreground font-medium">Fix P0s:</span> Claim Stripe, fix webhook secret, implement CloudBrowser AI primitives, run benchmark constitution</li>
            <li><span className="font-mono text-primary font-bold">2.</span> <span className="text-foreground font-medium">Deploy sites:</span> Execute mass production queue → Vercel → activate AGI swarm</li>
            <li><span className="font-mono text-primary font-bold">3.</span> <span className="text-foreground font-medium">Connect missing connectors:</span> Social media, Google Business Profile</li>
            <li><span className="font-mono text-primary font-bold">4.</span> <span className="text-foreground font-medium">Migrate workflows to Vercel crons</span> for reliability</li>
            <li><span className="font-mono text-primary font-bold">5.</span> <span className="text-foreground font-medium">Continue ARE convergence loop</span> to drive portfolio score from 15 → 100</li>
            <li><span className="font-mono text-primary font-bold">6.</span> <span className="text-foreground font-medium">Add compliance scoring</span> to all generator outputs</li>
            <li><span className="font-mono text-primary font-bold">7.</span> <span className="text-foreground font-medium">Consolidate redundant workflows</span> to reduce credit consumption</li>
          </ol>
        </div>
      </div>
    </div>
  );
}