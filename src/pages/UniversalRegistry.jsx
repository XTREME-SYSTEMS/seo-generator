import React, { useState, useMemo, useEffect } from 'react';
import { Search, Boxes, FunctionSquare, Database, Workflow, FileCode, Bot, Filter } from 'lucide-react';

// Static inventory — pulled from the actual filesystem at build time.
// This is a read-only registry of every tool, template, capability, function, entity, and workflow.
const SUBSYSTEMS = {
  'SEO Engine': { functions: ['ValidateSystem', 'RunBenchmarkConstitution', 'AreAudit', 'AreBenchmark', 'AreReflect', 'AreSuggest', 'AreImplement', 'AreTwinOptimizer', 'FixEngine', 'GenerateRepairPlan', 'DetectAsymmetries', 'MethodAttribution', 'ScoreValidation', 'ValidationMesh', 'AutonomousConvergence', 'MasterOrchestrator'], entities: ['BenchmarkCheck', 'ValidationScore', 'ValidationTest', 'RankingMethod', 'RankingEvidence', 'RankingBrief', 'UrlScoreSnapshot', 'Asymmetry', 'FixAttempt', 'ReflectionRecord', 'ModelSnapshot', 'TwinMutation', 'UrlInventory', 'UrlTarget', 'Suggestion', 'AreSheetRow'], workflows: ['ARE Core Loop', 'ARE Self Reflection', 'Autonomous Ranking Loop', 'Non-Stop Convergence Loop', 'System Audit & Validation Loop', 'Console Crack Loop'] },
  'CloudBrowser': { functions: ['DispatchBrowserJob', 'ScrapeUrl', 'SeoCrawlSite', 'SiteAudit', 'TechnicalSeoAudit', 'SerpMeasurement', 'ExtractDesignDNA', 'DeepDiscoveryScan', 'ScoutTechNews', 'ScrapeBase44Apps', 'ScrapeIndustryKnowledge', 'ScrapeIndustryPricing'], entities: ['AgentJob', 'SerpMeasurement', 'SerpDigitalTwin', 'AIAnswerObservation', 'QueryFanoutNode', 'QueryFanoutEdge', 'ResearchFinding'], workflows: ['Browser Swarm Heartbeat', 'SERP Scraping Loop', 'Discovery & Research Loop'] },
  'Vision Cortex': { functions: ['VisionCortexOrchestrator', 'VisionCortexConnect', 'VisionCortexWatch', 'SystemDNA', 'SystemSelfReflection', 'EvolutionEngine', 'UniversalImplementer', 'AutonomousSystemImplementer'], entities: ['EvolutionIdea', 'SystemDiagnosis', 'SystemGap', 'TechnologyCapability', 'CompetitorDigitalTwin'], workflows: ['Autonomous Vision Cortex Loop'] },
  'NearMe': { functions: ['GenerateNearMeCandidates', 'CheckDomainAvailability', 'ResearchSearchDemand', 'DiscoverUltraHighSearchPhrases', 'GenerateLandingPage'], entities: ['NearMeCandidate', 'StrategicUrl', 'GeneratedPage', 'DomainCandidate'], workflows: [] },
  'Generator Hub': { functions: ['GenerateIdeas', 'ContentGenerator', 'GenerateCopyVariants', 'GenerateHeadlines', 'RewriteContentForSeo', 'KeywordCluster', 'GenerateIndustryPlaybook', 'GenerateUserSystem', 'GenerateSalesPitch', 'GenerateRankingMethods', 'GenerateSitemap', 'CroAudit', 'ScanSubmissionTargets', 'IngestComplianceRequirements', 'BatchSubmitToSites'], entities: ['GeneratedAsset', 'GeneratorType', 'SubmissionTarget', 'ComplianceRequirement', 'BatchSubmissionJob', 'PromptLibrary', 'IndustryPlaybook', 'PwaTemplate', 'FunnelDiscovery', 'BusinessConcept', 'FinancialIntelligence', 'MarketSimulation', 'DigitalDominancePlan'], workflows: ['Industry Playbook Generator', 'Content Generation Loop'] },
  'End-to-End Generator': { functions: ['EndToEndGenerator', 'DiscoverStrategicUrls', 'DiscoverTopPerformers', 'AnalyzeCompetitors', 'ComputeIndustryBenchmarks', 'DraftOutreach', 'TractionScanner', 'ResearchBestMethods'], entities: ['StrategicUrl', 'BuyerProspect', 'CompetitorBenchmark', 'Competitor', 'TractionKeyword', 'Opportunity', 'ReplacementOpportunity', 'Experiment'], workflows: ['Autonomous End-to-End Loop'] },
  'Universal Generator': { functions: ['RunBenchmarkConstitution', 'ResolveVariables', 'ValidationMesh', 'ScoreValidation', 'DiscoverCapabilities', 'SystemDNA', 'SystemSelfReflection'], entities: ['BenchmarkCheck', 'SystemVariable', 'ForensicFinding', 'BusinessConcept', 'WorkflowSpec', 'GeneratorType', 'DeploymentProfile', 'ResilienceControl', 'WorkerPool', 'QueueTopology', 'InteropInterface', 'ArtifactManifest', 'Capability'], workflows: ['Capability Implementation Loop'] },
  'Mission Control': { functions: ['MasterOrchestrator', 'SprintPlanner', 'DeliveryGuarantee', 'ProvisioningManager', 'WeeklyDigest', 'SendClientReports', 'NotifySeoUpdates', 'OnboardClient'], entities: ['MassProductionQueue', 'InfrastructureProject', 'Client', 'Lead', 'Subscription', 'OnboardingProfile', 'Approval', 'Receipt'], workflows: ['Autonomous SEO Generator', 'Weekly Client Report Email', 'Weekly Digest Loop', 'SEO Update Notifier'] },
  'AGI Swarm': { functions: ['AutoHealingEscalation', 'AnomalyDetection', 'PersistentMonitor', 'PredictiveRankingModel', 'EvolutionEngine', 'CompetitorWatchdog', 'BacklinkTracker', 'InternalLinkOptimizer', 'CrossDomainAuthorityBuilder', 'MultiPlatformSocialSync', 'SchemaValidator', 'AISearchVisibility', 'CoreWebVitalsMonitor', 'ABTestRunner', 'AlgorithmUpdateMonitor', 'GoogleBusinessProfileSync'], entities: ['AgentJob', 'RunTelemetry', 'Agent', 'Experiment', 'Prediction', 'HourlySearchMetric'], workflows: ['Autonomous Heartbeat', 'Auto-Healing Escalation Loop', 'Anomaly Detection Loop', 'Competitor Watchdog Loop', 'Backlink Tracker Loop', 'Internal Link Optimizer Loop', 'Cross-Domain Authority Builder Loop', 'Multi-Platform Social Sync Loop', 'Schema Validator Loop', 'AI Search Visibility Loop', 'Core Web Vitals Monitor Loop', 'Predictive Ranking Model Loop', 'Evolution Engine Loop', 'Persistent Monitor Loop', 'A-B Test Runner Loop', 'Google Business Profile Sync Loop'] },
  'Core Strategy': { functions: ['SystemDNA', 'DeliveryGuarantee', 'EcosystemApi'], entities: ['DigitalDominancePlan', 'AuthorityDeliverable', 'AccountRegistry', 'SiteDomainRegistry', 'EmailRegistry', 'RiskItem', 'RegistrantContact'], workflows: [] },
  'Stripe': { functions: ['StripeCheckout', 'StripeWebhook'], entities: ['Subscription', 'PromoCode', 'Client', 'ApiKey'], workflows: [] },
  'Connectors': { functions: ['GoogleWorkspaceSync', 'SyncSearchConsole', 'SearchConsoleIndex', 'GoogleAnalyticsDashboard', 'GscVerificationMonitor', 'SupabaseSync', 'DirectEmailSender', 'ManageApiKey', 'IndexNowPing', 'LeadGenIndexNow', 'LeadGenSitemap', 'SitemapIngestion', 'UrlInventorySync', 'GoogleBusinessProfileSync'], entities: ['ConnectorRegistry', 'ConnectorStatus', 'HourlySearchMetric'], workflows: ['GSC Sync & Sitemap Loop', 'Hourly GSC Sync'] },
  'Provisioning': { functions: ['ProvisioningManager', 'VercelDomains', 'VercelAIGateway'], entities: ['InfrastructureProject', 'AccountRegistry', 'SiteDomainRegistry'], workflows: [] },
  'Ecosystem': { functions: ['EcosystemApi', 'ManageApiKey'], entities: ['ApiKey', 'AccountRegistry'], workflows: [] },
  'Alpha Prime': { functions: ['RunBenchmarkConstitution', 'ValidateSystem', 'SecurityScan', 'FixEngine', 'AutoHealingEscalation', 'InternalLinkOptimizer', 'SyncSearchConsole'], entities: ['AgentJob', 'RunTelemetry', 'Receipt', 'BenchmarkCheck', 'ValidationScore', 'ForensicFinding'], workflows: ['Daily Full Audit & Sync', 'Daily Auto-Heal Loop', 'System Audit & Validation Loop'] },
};

const TYPE_ICONS = { functions: FunctionSquare, entities: Database, workflows: Workflow, pages: FileCode, agents: Bot };

export default function UniversalRegistry() {
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allItems = useMemo(() => {
    const items = [];
    Object.entries(SUBSYSTEMS).forEach(([sub, data]) => {
      Object.entries(data).forEach(([type, list]) => {
        if (!TYPE_ICONS[type]) return;
        list.forEach(name => items.push({ subsystem: sub, type, name }));
      });
    });
    return items;
  }, []);

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (subFilter !== 'all' && item.subsystem !== subFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.subsystem.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allItems, search, subFilter, typeFilter]);

  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach(i => { (m[i.subsystem] ||= { functions: [], entities: [], workflows: [] }); m[i.subsystem][i.type].push(i.name); });
    return m;
  }, [filtered]);

  const counts = useMemo(() => {
    const c = { functions: 0, entities: 0, workflows: 0 };
    allItems.forEach(i => { if (c[i.type] !== undefined) c[i.type]++; });
    return { ...c, subsystems: Object.keys(SUBSYSTEMS).length, total: allItems.length };
  }, [allItems]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Universal Registry</h1>
            <p className="text-xs text-muted-foreground">Every tool, template, capability, function, entity, and workflow — dissected by subsystem</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatTile label="Subsystems" value={counts.subsystems} icon={Boxes} />
          <StatTile label="Functions" value={counts.functions} icon={FunctionSquare} />
          <StatTile label="Entities" value={counts.entities} icon={Database} />
          <StatTile label="Workflows" value={counts.workflows} icon={Workflow} />
          <StatTile label="Total Items" value={counts.total} icon={Filter} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" placeholder="Search tools, functions, entities..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={subFilter} onChange={(e) => setSubFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
            <option value="all">All Subsystems</option>
            {Object.keys(SUBSYSTEMS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
            <option value="all">All Types</option>
            <option value="functions">Functions</option>
            <option value="entities">Entities</option>
            <option value="workflows">Workflows</option>
          </select>
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([sub, data]) => (
            <div key={sub} className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {sub}
                <span className="text-xs text-muted-foreground font-normal ml-auto">{(data.functions?.length || 0) + (data.entities?.length || 0) + (data.workflows?.length || 0)} items</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {['functions', 'entities', 'workflows'].map(type => {
                  const Icon = TYPE_ICONS[type];
                  const list = data[type] || [];
                  if (list.length === 0) return null;
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        <Icon className="w-3 h-3" /> {type} ({list.length})
                      </div>
                      <div className="space-y-0.5">
                        {list.map(name => <div key={name} className="text-xs font-mono text-foreground py-0.5 px-2 rounded hover:bg-muted/50 truncate">{name}</div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && <div className="text-center py-20 text-sm text-muted-foreground">No items match your filters.</div>}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">{label}</span><Icon className="w-4 h-4 text-muted-foreground" /></div><p className="text-2xl font-semibold tabular text-foreground">{value}</p></div>;
}