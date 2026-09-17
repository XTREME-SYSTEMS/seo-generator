import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, X, Search, FolderOpen, FileCode, Database, Workflow, Bot, Layers, Save, Download, Upload, RefreshCw, Building2, Users, Mail, Star, Globe, Factory, Smartphone, Network, Brain, Target, Shield, Crown, Rocket, Sparkles, Wrench, ScrollText, Radar, MessageSquare, Eye, EyeOff, Boxes, Cpu, Code2,   KeyRound, Share2, MapPin, PhoneCall, BookOpen, Gauge, Activity, BarChart3, Package, Zap, DollarSign, Heart, ListOrdered, Database as DbIcon, Settings as SettingsIcon, LayoutDashboard, KanbanSquare, TrendingUp, Calendar, Home, Briefcase } from 'lucide-react';

// ── Full forensic inventory of the epoxyquotenearme5.zip system ──
// Each section is a module the user can check/uncheck to decide what to port.

const SECTIONS = [
  {
    group: 'Admin — Core Operations',
    color: 'blue',
    items: [
      { id: 'admin_dashboard', label: 'Dashboard / Command Center', icon: LayoutDashboard, desc: 'Real-time lead pipeline, today/week stats, conversion rate, pipeline value, funnel drop-off, CWV widget, location leaderboard' },
      { id: 'admin_leads', label: 'Leads Table', icon: Users, desc: 'Full lead list with filters: ZIP, status, system, timeline, source, salesperson, date. Sortable, searchable.' },
      { id: 'admin_lead_detail', label: 'Lead Detail Page', icon: FileCode, desc: 'Single lead view: full profile, estimate breakdown, status timeline, notes, status changes, appointment booking' },
      { id: 'admin_pipeline', label: 'Pipeline Kanban', icon: KanbanSquare, desc: 'Drag-and-drop pipeline board with 10 stages: NEW ESTIMATE → CONTACT ATTEMPTED → CONSULTATION BOOKED → COMPLETED → IN-HOME → PROPOSAL SENT → WON/LOST/NURTURE' },
      { id: 'admin_emails', label: 'Email Log Monitor', icon: Mail, desc: 'Email send logs, delivery status, template tracking, resend capability' },
      { id: 'admin_reviews', label: 'Review Request System', icon: Star, desc: 'Auto-send review requests to WON leads, track email logs, manage review funnel' },
      { id: 'admin_settings', label: 'Settings Page', icon: SettingsIcon, desc: 'Business settings: systems/pricing, timelines, salespeople, service areas, business info, toggle features' },
      { id: 'admin_competitors', label: 'Competitor Intelligence', icon: Radar, desc: 'Competitor insights dashboard: scrape competitors, track strengths/weaknesses, pricing models, backlinks' },
      { id: 'admin_analytics', label: 'Analytics Dashboard', icon: BarChart3, desc: 'Google Analytics traffic data, visitor metrics, conversion tracking, GA integration' },
      { id: 'admin_location_perf', label: 'Location Performance', icon: MapPin, desc: 'Per-city performance metrics: leads by location, conversion by city, top performing areas' },
    ],
  },
  {
    group: 'Admin — SEO & Content',
    color: 'green',
    items: [
      { id: 'admin_google_seo', label: 'Google SEO Manager', icon: Globe, desc: 'Google Search Console integration, SEO route management, content seeding, indexing, auto-verifier, setup wizard' },
      { id: 'admin_seo_factory', label: 'SEO Page Factory', icon: Factory, desc: 'Generate SEO pages for service×location combinations, manage templates, bulk publish, live URL preview' },
      { id: 'admin_seo_generator', label: 'SEO Content Generator', icon: TrendingUp, desc: 'AI-powered SEO content generation for pages, meta tags, schema markup' },
      { id: 'admin_seo_simulator', label: 'SEO/AEO Simulator', icon: Sparkles, desc: 'Simulate SEO and AEO performance, amplify modules, content modules, local modules, score dashboard' },
      { id: 'admin_url_strategy', label: 'URL Strategy', icon: Globe, desc: 'Strategic URL planning, keyword-to-URL mapping, URL inventory management' },
      { id: 'admin_site_health', label: 'Site Health Monitor', icon: Heart, desc: 'Monitor site uptime, Core Web Vitals, technical SEO health, alerting' },
      { id: 'admin_national_launch', label: 'National Launch', icon: Rocket, desc: 'Multi-city launch coordinator: deploy sites across cities, manage rollout schedule' },
    ],
  },
  {
    group: 'Admin — Funnel & Lead Gen',
    color: 'amber',
    items: [
      { id: 'funnel_page', label: 'Multi-Step Funnel', icon: Zap, desc: '7-step quote funnel: welcome → address → condition → visualizer → contact → scrape → results. AI floor visualizer, concept before/after, branded estimate PDF, auto-email' },
      { id: 'funnel_estimator', label: 'Estimator Wizard', icon: Target, desc: 'Step-by-step estimator: address, condition, system, size, timeline, photo, contact. Multi-step with progress tracking' },
      { id: 'funnel_visualizer', label: 'Floor Visualizer', icon: Sparkles, desc: 'AI-powered floor visualizer: photo upload, color picker, flake color chart, before/after, result visualizer' },
      { id: 'funnel_results', label: 'Results & Booking', icon: Check, desc: 'Estimate results page with bid PDF, booking flow, calendar scheduling' },
      { id: 'admin_lead_scraper', label: 'Lead Scraper & Outreach', icon: Radar, desc: 'Scrape leads from sources, agent panel for outreach, leads table with selection and bulk actions' },
      { id: 'admin_review_req', label: 'Review Request Automation', icon: Star, desc: 'Automated review request emails to won customers, template management, tracking' },
    ],
  },
  {
    group: 'Admin — Website & App Factory',
    color: 'purple',
    items: [
      { id: 'admin_website_factory', label: 'Website Factory', icon: Factory, desc: 'Create and manage website templates, city-specific configs, live URL mapping, bulk deploy' },
      { id: 'admin_app_factory', label: 'App Factory (PWA)', icon: Smartphone, desc: 'Generate PWA apps from templates, manifest.json builder, download as zip, app build management' },
      { id: 'admin_rebrand_studio', label: 'Rebrand Studio', icon: Sparkles, desc: 'Bulk rebrand: city generator, bulk publish panel, logo/colors/content per city' },
      { id: 'admin_website_empire', label: 'Website Empire', icon: Crown, desc: 'Multi-site empire management: domain strategy, site templates, deployment tracking' },
      { id: 'admin_website_queue', label: 'Site Queue', icon: ListOrdered, desc: 'Queue of websites to build, build status tracking, deployment pipeline' },
      { id: 'admin_code_studio', label: 'Code Studio', icon: Code2, desc: 'AI code editor: chat + editor + preview, code block manager, section editor, dynamic page renderer' },
    ],
  },
  {
    group: 'Admin — AI & Automation',
    color: 'pink',
    items: [
      { id: 'admin_alpha_prime', label: 'Alpha Prime Control', icon: Crown, desc: 'Autonomous AI orchestrator: recommendations, chat, source truth panel, control center, shadow browser/codex integration' },
      { id: 'admin_fleet', label: 'Fleet Dashboard', icon: Layers, desc: 'Multi-system fleet management: websites, SaaS, PWAs, communications. Heartbeat monitoring, system status' },
      { id: 'admin_swarm', label: 'Swarm Command', icon: Network, desc: 'AI agent swarm: 10 agents (orchestrator, lead, SEO, social, comms, reputation, site factory, system operator), task dispatch, health checks' },
      { id: 'admin_shadow', label: 'Shadow AI', icon: EyeOff, desc: 'Autonomous browsing AI: shadow chat, cloud browser control, codex (code execution)' },
      { id: 'admin_vision_cortex', label: 'Vision Cortex', icon: Eye, desc: 'Visual AI strategy: visual analysis, comparison, autonomous visual optimization' },
      { id: 'admin_operator', label: 'AI System Operator', icon: Bot, desc: 'Conversational AI operator: natural language commands, swarm delegation, system status reports, mass site production' },
      { id: 'admin_voice_assistant', label: 'AI Voice Assistant', icon: PhoneCall, desc: 'Voice-based AI assistant for hands-free system operation, voice sessions, Xtreme Comms integration' },
      { id: 'admin_agent_builder', label: 'Agent Builder', icon: Bot, desc: 'Build custom AI agents: persona, tools, permissions, system prompts' },
    ],
  },
  {
    group: 'Admin — Intelligence & Strategy',
    color: 'indigo',
    items: [
      { id: 'admin_intelligence', label: 'Intelligence Hub', icon: Brain, desc: 'Central intelligence dashboard: market data, competitor insights, industry trends, financial intelligence' },
      { id: 'admin_crystal_ball', label: 'Trade Crystal Ball', icon: Sparkles, desc: 'Predictive analytics: contractor simulation, market predictions, revenue forecasting' },
      { id: 'admin_contractor_sim', label: 'Contractor Simulation', icon: Users, desc: 'Simulate contractor business: archetypes, visitor simulation, Google sync, market modeling' },
      { id: 'admin_vision_strategy', label: 'Vision Strategy', icon: Target, desc: 'Strategic vision planning: goal setting, roadmap, competitive positioning' },
      { id: 'admin_domain_rush', label: 'Domain Gold Rush', icon: Crown, desc: 'Domain acquisition strategy: find available domains, keyword+city patterns, SEO value scoring' },
      { id: 'admin_rag', label: 'RAG Engine', icon: DbIcon, desc: 'Retrieval-augmented generation: knowledge base, document ingestion, semantic search' },
      { id: 'admin_graph', label: 'Knowledge Graph', icon: Workflow, desc: 'Knowledge graph console: entity relationships, data connections, graph queries' },
    ],
  },
  {
    group: 'Admin — System & Platform',
    color: 'slate',
    items: [
      { id: 'admin_system_map', label: 'System Map', icon: Boxes, desc: 'Visual map of entire system: all pages, functions, entities, connections. Navigation hub' },
      { id: 'admin_system_blueprint', label: 'System Blueprint', icon: Building2, desc: 'Architecture documentation: 9 tabs (Architecture, Stack, Agents, Data, Functions, Workflows, Integrations, Migration, Build Queue)' },
      { id: 'admin_system_health', label: 'System Health', icon: Gauge, desc: 'System health monitoring: uptime, error rates, component status, alerts' },
      { id: 'admin_platform', label: 'Platform Settings', icon: Cpu, desc: 'Platform-level config: integrations, API keys, environment, deployment profiles' },
      { id: 'admin_sop', label: 'SOP & Memory System', icon: ScrollText, desc: 'Standard Operating Procedures: SOP library, execution logs, AI memory, category filtering' },
      { id: 'admin_workflows', label: 'Autonomous Workflows', icon: Workflow, desc: '16 automated workflows: lead follow-up, SEO optimizer, competitor scanner, social autopilot, swarm autopilot, etc.' },
      { id: 'admin_playbooks', label: 'Playbook Library', icon: BookOpen, desc: 'Industry playbooks: pre-built strategies, templates, best practices per industry' },
      { id: 'admin_api_keys', label: 'API Key Manager', icon: KeyRound, desc: 'Manage API keys for external services: create, revoke, track usage' },
      { id: 'admin_client_packages', label: 'Client Packages', icon: Package, desc: 'Service package management: pricing tiers, feature sets, client deliverables' },
      { id: 'admin_tool_manager', label: 'App Tool Manager', icon: Wrench, desc: 'Manage tools in the customer app: add/remove/reorder tools, toggle visibility, set editions' },
      { id: 'admin_tool_hub', label: 'Tool Hub', icon: Layers, desc: 'Customer-facing tool hub: visualizer, estimator, color charts, gallery' },
    ],
  },
  {
    group: 'Admin — Social & Comms',
    color: 'rose',
    items: [
      { id: 'admin_social_studio', label: 'Social Studio', icon: Share2, desc: 'Social media management: post creation, scheduling, multi-platform (FB, IG, TikTok), content themes, calendar' },
      { id: 'admin_xtreme_comms', label: 'Xtreme Comms', icon: MessageSquare, desc: 'Communication hub: agents tab, voice sessions, test lab, multi-channel messaging' },
    ],
  },
  {
    group: 'Customer Portal',
    color: 'teal',
    items: [
      { id: 'portal_dashboard', label: 'Portal Dashboard', icon: LayoutDashboard, desc: 'Customer-facing dashboard: project status, timeline, next steps, key metrics' },
      { id: 'portal_timeline', label: 'Project Timeline', icon: Calendar, desc: 'Visual project timeline: milestones, progress updates, photos, completion tracking' },
      { id: 'portal_maintenance', label: 'Maintenance Portal', icon: Wrench, desc: 'Maintenance plan management: schedule, history, warranty tracking, care instructions' },
      { id: 'portal_messages', label: 'Messages', icon: MessageSquare, desc: 'Customer-business messaging: chat interface, file sharing, read receipts' },
      { id: 'portal_schedule', label: 'Schedule', icon: Sparkles, desc: 'Appointment scheduling: book consultations, reminders, calendar integration' },
      { id: 'portal_ai_chat', label: 'AI Chat Assistant', icon: Bot, desc: 'Customer-facing AI chat: answer questions, project status, maintenance tips' },
    ],
  },
  {
    group: 'Contractor App (Mobile PWA)',
    color: 'orange',
    items: [
      { id: 'contractor_home', label: 'Contractor Home', icon: Home, desc: 'Mobile home dashboard: today\'s leads, active projects, quick actions, stats' },
      { id: 'contractor_projects', label: 'Projects', icon: Briefcase, desc: 'Project list: active, completed, pending. Project details, status updates' },
      { id: 'contractor_leads', label: 'Leads', icon: Users, desc: 'Lead management on mobile: accept/reject, contact, schedule, convert to project' },
      { id: 'contractor_inbox', label: 'Inbox', icon: MessageSquare, desc: 'Message inbox: customer messages, team chat, notifications' },
      { id: 'contractor_more', label: 'More / Settings', icon: SettingsIcon, desc: 'Additional tools, settings, profile, visualizer access' },
      { id: 'contractor_bid', label: 'Bid Generator', icon: FileCode, desc: 'On-site bid generation: measurement, system selection, pricing, PDF proposal, e-signature' },
      { id: 'contractor_visualizer', label: 'Contractor Visualizer', icon: Sparkles, desc: 'Mobile floor visualizer: photo upload, color selection, before/after, share with customer' },
    ],
  },
  {
    group: 'Backend Functions (80 total)',
    color: 'cyan',
    items: [
      { id: 'fn_lead_engine', label: 'Daily Lead Engine', icon: Zap, desc: 'Daily lead processing: scoring, assignment, follow-up scheduling, CRM sync' },
      { id: 'fn_book_estimate', label: 'Book Estimate', icon: Calendar, desc: 'Estimate booking: calendar integration, time slot selection, confirmation' },
      { id: 'fn_enrich_lead', label: 'Lead Enrichment', icon: Users, desc: 'Enrich leads with property data, distance calculations, scoring' },
      { id: 'fn_emails', label: 'Email Automation', icon: Mail, desc: 'sendEstimateEmail, sendFollowUpEmail, sendReviewRequest — automated email sequences' },
      { id: 'fn_seo', label: 'SEO Functions', icon: TrendingUp, desc: 'generateSeoPage, generateSitemap, generateRss, optimizeSeo, pingIndexNow, submitToIndexers' },
      { id: 'fn_google', label: 'Google Integration', icon: Globe, desc: 'googleVerifierConnectUrl, googleVerifierExchange, verifySearchConsole, pullSearchConsoleData, googleAnalytics, googleWorkspaceSync' },
      { id: 'fn_company_intel', label: 'Company Intelligence', icon: Brain, desc: 'companyIntel, scanCompetitors, tradeCrystalBall — market and competitor research' },
      { id: 'fn_swarm', label: 'Swarm Orchestration', icon: Network, desc: 'swarmOrchestrator, syncWorkflowToSwarm, syncFleetSystemState — agent swarm coordination' },
      { id: 'fn_alpha_prime', label: 'Alpha Prime Functions', icon: Crown, desc: 'alphaPrimeAudit, alphaPrimeHeartbeat, alphaPrimeOptimizationCycle, alphaPrimeRepairFactory, alphaPrimeBenchmarkGenerator' },
      { id: 'fn_social', label: 'Social Studio Functions', icon: Share2, desc: 'socialStudio, syncContentCalendar — social media posting and scheduling' },
      { id: 'fn_voice', label: 'Voice Assistant', icon: PhoneCall, desc: 'voiceAssistant, xtremeComms — AI voice and communication' },
      { id: 'fn_payments', label: 'Payments', icon: DollarSign, desc: 'create-checkout, payments-webhook — Stripe checkout and webhook handling' },
      { id: 'fn_property', label: 'Property Lookup', icon: MapPin, desc: 'propertyLookup, calculateDistanceTo100 — property data and distance calculations' },
      { id: 'fn_rebrand', label: 'Rebrand & Deploy', icon: Rocket, desc: 'rebrandStudio, vercelDeploy, vercelAiGateway — site rebranding and deployment' },
      { id: 'fn_supabase', label: 'Supabase Integration', icon: Database, desc: 'supabaseUpload, supabaseMigrationDeploy, supabaseConcurrencyTest — Supabase control plane' },
    ],
  },
  {
    group: 'Workflows (16 total)',
    color: 'violet',
    items: [
      { id: 'wf_lead_followup', label: 'Lead Follow-Up Workflows', icon: Mail, desc: 'Immediate Lead Follow-Up, Lead Follow-Up, Review Request — automated email sequences' },
      { id: 'wf_seo', label: 'SEO Workflows', icon: TrendingUp, desc: 'SEO Optimizer, SEO Update Notifier, Sitemap Auto-Update — automated SEO management' },
      { id: 'wf_swarm', label: 'Swarm Workflows', icon: Network, desc: 'Swarm Autopilot, Autonomous Sprint Supervisor, Alpha Prime Completion Sprint — autonomous agent operations' },
      { id: 'wf_social', label: 'Social Autopilot', icon: Share2, desc: 'Social Media Autopilot — automated social posting and engagement' },
      { id: 'wf_competitor', label: 'Competitor Scanner', icon: Radar, desc: 'Automated competitor monitoring and intelligence gathering' },
      { id: 'wf_dominance', label: 'Digital Dominance Compiler', icon: Crown, desc: 'XTREME Digital Dominance Compiler — multi-platform submission automation' },
      { id: 'wf_questionnaire', label: 'Questionnaire Enforcement', icon: Shield, desc: 'Automated questionnaire compliance checking and enforcement' },
      { id: 'wf_fleet', label: 'Fleet Heartbeat', icon: Activity, desc: 'Fleet Alpha Prime Heartbeat — system health monitoring and auto-healing' },
    ],
  },
  {
    group: 'AI Agents (10 total)',
    color: 'fuchsia',
    items: [
      { id: 'agent_orchestrator', label: 'Swarm Orchestrator', icon: Network, desc: 'Master coordinator — monitors all agents, dispatches tasks, runs health checks' },
      { id: 'agent_lead', label: 'Lead Orchestrator', icon: Users, desc: 'Lead pipeline — scoring, follow-ups, CRM sync, consultation booking' },
      { id: 'agent_seo', label: 'SEO Manager', icon: TrendingUp, desc: 'Location sites — page generation, indexing, ranking optimization' },
      { id: 'agent_social', label: 'Social Manager', icon: Share2, desc: 'Facebook engine — 3x daily posts, scheduling, engagement tracking' },
      { id: 'agent_comms', label: 'Comms Manager', icon: MessageSquare, desc: 'Communications — email, SMS, voice, review requests' },
      { id: 'agent_reputation', label: 'Reputation Manager', icon: Star, desc: 'Reviews and reputation — monitoring, response, amplification' },
      { id: 'agent_site_factory', label: 'Site Factory Manager', icon: Factory, desc: 'Website building — template generation, deployment, rebranding' },
      { id: 'agent_system_op', label: 'System Operator', icon: Bot, desc: 'System health — monitoring, healing, optimization, security' },
      { id: 'agent_alpha_prime', label: 'Alpha Prime Orchestrator', icon: Crown, desc: 'Top-level autonomous decision engine — strategy, goals, self-reflection' },
      { id: 'agent_shadow', label: 'Shadow Agent', icon: EyeOff, desc: 'Autonomous browsing — web scraping, form filling, browser automation' },
    ],
  },
  {
    group: 'Entities (77 total — key ones)',
    color: 'lime',
    items: [
      { id: 'ent_lead', label: 'Lead Entity', icon: Users, desc: 'Core lead record: name, email, phone, address, zip, system, timeline, estimate range, status, salesperson, source, score, photos' },
      { id: 'ent_appointment', label: 'Appointment Entity', icon: Calendar, desc: 'Booked appointments: type (phone/in-home), date, time, lead reference, status' },
      { id: 'ent_funnel_event', label: 'Funnel Event Entity', icon: Zap, desc: 'Funnel tracking events: page_view, funnel_started, address_entered, color_selected, contact_entered, proposal_sent, won, lost' },
      { id: 'ent_client_project', label: 'Client Project Entity', icon: Briefcase, desc: 'Active projects: project details, timeline, status, assigned team, updates' },
      { id: 'ent_project_update', label: 'Project Update Entity', icon: Activity, desc: 'Project timeline updates: milestones, photos, notes, completion status' },
      { id: 'ent_email_log', label: 'Email Log Entity', icon: Mail, desc: 'Email send records: recipient, subject, template, status, timestamp' },
      { id: 'ent_app_settings', label: 'App Settings Entity', icon: SettingsIcon, desc: 'Business configuration: systems, pricing, timelines, salespeople, service areas' },
      { id: 'ent_website_template', label: 'Website Template Entity', icon: Globe, desc: 'Website templates: city config, domain, branding, deployment status' },
      { id: 'ent_competitor_insight', label: 'Competitor Insight Entity', icon: Radar, desc: 'Competitor data: name, URL, strengths, weaknesses, pricing, services' },
      { id: 'ent_social_post', label: 'Social Post Entity', icon: Share2, desc: 'Social media posts: platform, content, theme, schedule, status, engagement' },
      { id: 'ent_sop', label: 'SOP Entity', icon: ScrollText, desc: 'Standard Operating Procedures: category, content, version, execution logs' },
      { id: 'ent_swarm_task', label: 'Swarm Task Entity', icon: Network, desc: 'Agent tasks: agent, type, status, payload, result, timestamps' },
      { id: 'ent_review_rating', label: 'Rating Entity', icon: Star, desc: 'Customer reviews: rating, comment, lead reference, platform' },
      { id: 'ent_maintenance', label: 'Maintenance Plan Entity', icon: Wrench, desc: 'Maintenance plans: schedule, history, warranty, care instructions' },
      { id: 'ent_marketplace', label: 'Marketplace Listing Entity', icon: Package, desc: 'Lead marketplace: listings for sale, acquisition, bidding' },
    ],
  },
];

const COLOR_MAP = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-green-200 bg-green-50 text-green-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  pink: 'border-pink-200 bg-pink-50 text-pink-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  teal: 'border-teal-200 bg-teal-50 text-teal-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  fuchsia: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  lime: 'border-lime-200 bg-lime-50 text-lime-700',
};

export default function ArchitecturePage() {
  const [checked, setChecked] = useState({});
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);

  // Load saved selections from entity
  useEffect(() => {
    (async () => {
      try {
        const records = await base44.entities.SystemVariable.filter({ variable_key: 'architecture_selections' }, '-created_date', 1);
        if (records?.[0]?.resolved_value) {
          setChecked(JSON.parse(records[0].resolved_value));
        }
      } catch {}
    })();
  }, []);

  const allItems = SECTIONS.flatMap(s => s.items.map(i => ({ ...i, group: s.group, color: s.color })));
  const filtered = search
    ? allItems.filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase()))
    : null;

  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleGroup = (group) => {
    const groupItems = SECTIONS.find(s => s.group === group).items;
    const allChecked = groupItems.every(i => checked[i.id]);
    const newChecked = { ...checked };
    groupItems.forEach(i => { newChecked[i.id] = !allChecked; });
    setChecked(newChecked);
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalCount = allItems.length;

  const save = async () => {
    try {
      const existing = await base44.entities.SystemVariable.filter({ variable_key: 'architecture_selections' }, '-created_date', 1);
      const data = { variable_key: 'architecture_selections', group: 'ui', type: 'object', default_value: JSON.stringify(checked), resolved_value: JSON.stringify(checked), purpose: 'Selected modules to port into the new unified admin system' };
      if (existing?.[0]) {
        await base44.entities.SystemVariable.update(existing[0].id, data);
      } else {
        await base44.entities.SystemVariable.create(data);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
  };

  const exportSelections = () => {
    const blob = new Blob([JSON.stringify(checked, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'architecture-selections.json'; a.click();
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Architecture Page — Sandbox Editor</h1>
          <p className="text-sm text-muted-foreground">Forensic audit of epoxyquotenearme5.zip — check off the modules you want to port into the new unified admin</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <span className="text-xs text-muted-foreground">Selected: </span>
          <span className="text-lg font-bold text-foreground">{checkedCount}</span>
          <span className="text-xs text-muted-foreground"> / {totalCount}</span>
        </div>
        <button onClick={save} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Selections</>}
        </button>
        <button onClick={exportSelections} className="bg-card border border-border hover:border-yellow-400 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search modules by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full input pl-10"
        />
      </div>

      {/* Content */}
      {filtered ? (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground mb-2">Search Results ({filtered.length})</h2>
          {filtered.map(item => (
            <CheckRow key={item.id} item={item} color={item.color} checked={!!checked[item.id]} onToggle={() => toggle(item.id)} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map(section => {
            const groupChecked = section.items.filter(i => checked[i.id]).length;
            const allChecked = groupChecked === section.items.length;
            return (
              <div key={section.group}>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => toggleGroup(section.group)}
                    className={`text-xs font-bold px-2 py-1 rounded border ${COLOR_MAP[section.color]} flex items-center gap-1.5`}
                  >
                    {allChecked ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {allChecked ? 'All Selected' : groupChecked > 0 ? `${groupChecked}/${section.items.length}` : 'Select All'}
                  </button>
                  <h2 className="text-lg font-bold text-foreground">{section.group}</h2>
                  <span className="text-xs text-muted-foreground">({section.items.length} modules)</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {section.items.map(item => (
                    <CheckRow key={item.id} item={item} color={section.color} checked={!!checked[item.id]} onToggle={() => toggle(item.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Audit Summary</h3>
        <div className="grid sm:grid-cols-4 gap-3 text-sm">
          <div><span className="text-muted-foreground">Admin Pages:</span> <strong className="text-foreground">56</strong></div>
          <div><span className="text-muted-foreground">Components:</span> <strong className="text-foreground">160+</strong></div>
          <div><span className="text-muted-foreground">Backend Functions:</span> <strong className="text-foreground">80</strong></div>
          <div><span className="text-muted-foreground">Workflows:</span> <strong className="text-foreground">16</strong></div>
          <div><span className="text-muted-foreground">AI Agents:</span> <strong className="text-foreground">10</strong></div>
          <div><span className="text-muted-foreground">Entities:</span> <strong className="text-foreground">77</strong></div>
          <div><span className="text-muted-foreground">Customer Portal Tabs:</span> <strong className="text-foreground">6</strong></div>
          <div><span className="text-muted-foreground">Contractor App Tabs:</span> <strong className="text-foreground">7</strong></div>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ item, color, checked, onToggle }) {
  const Icon = item.icon || FileCode;
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? COLOR_MAP[color] : 'border-border bg-card hover:border-yellow-400'}`}
    >
      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-yellow-400 border-yellow-400' : 'border-slate-300'}`}>
        {checked && <Check className="w-3.5 h-3.5 text-gray-900" />}
      </div>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${checked ? '' : 'text-muted-foreground'}`} />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{item.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
      </div>
    </div>
  );
}