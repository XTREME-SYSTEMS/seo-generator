import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Search, Database, Radar, Layers, Workflow,
  Building2, Users, FileSearch, ShieldCheck, TrendingUp,
  Globe, Cpu, Target, AlertTriangle, CheckCircle2, ArrowRight,
  Briefcase, Eye, Zap, LineChart, Award, Lock, Network, Download,
} from 'lucide-react';

export default function CoreStrategy() {
  const [activePillar, setActivePillar] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Executive Summary */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4" />
            <span>CONFIDENTIAL — EXECUTIVE BRIEFING</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Core System Strategy
            <span className="block text-yellow-400 text-2xl md:text-3xl mt-2">
              Building the Most Valuable Digital Asset Portfolio in America
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed mb-8">
            We are building a marketing agency that creates ultra-high-value websites
            using proprietary AI to reverse-engineer Google's algorithm, identify the
            businesses people search for most in emergencies and high-desire moments,
            and capture data that is nearly impossible for anyone else to get.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Technology Pillars" value="3" sub="CloudBrowser · PropertyIntel · FaultLine" />
            <StatBox label="Data Pipeline" value="7-Stage" sub="Discovery → Dissect" />
            <StatBox label="Attorney Pipeline" value="1M+" sub="Potential clients" />
            <StatBox label="Competitive Moat" value="AI-Native" sub="Old-school competitors can't replicate" />
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="py-16 px-6 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <SectionHeader number="01" title="The Vision" />
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">What We're Building</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                A marketing agency that doesn't just build websites — it builds
                <strong className="text-gray-900"> ultra-high-value digital assets</strong> targeting
                the exact moments people are most desperate, most willing to spend, and
                most likely to Google something immediately.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Emergency plumbing at 2 AM. A lawyer after a car accident. An insurance
                quote after a flood. These are the searches where the person on the other
                end will pay anything, and the business on our end will pay us a fortune
                for the lead.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Why We Win</h3>
              <div className="space-y-3">
                <WinPoint icon={Cpu} text="AI reverse-engineers Google's algorithm to find ranking gaps competitors can't see" />
                <WinPoint icon={Radar} text="We identify high-value niches before anyone else knows they exist" />
                <WinPoint icon={Database} text="We acquire data that is nearly impossible to get — and make it actionable" />
                <WinPoint icon={Lock} text="Old-school competitors don't have AI, can't use it, and can't catch up" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Technology Pillars */}
      <section className="py-16 px-6 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <SectionHeader number="02" title="Three Technology Pillars" />
          <p className="text-gray-600 mt-4 max-w-3xl">
            These are the proprietary systems that form the foundation of everything we build.
            Each one solves a problem that most people — especially older, non-technical people —
            cannot solve on their own.
          </p>

          {/* Pillar Selector */}
          <div className="flex flex-wrap gap-3 mt-8 mb-8">
            {PILLARS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setActivePillar(i)}
                className={`px-5 py-3 rounded-lg font-medium text-sm transition-all ${
                  activePillar === i
                    ? 'bg-yellow-400 text-gray-900 shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-yellow-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <p.icon className="w-4 h-4" /> {p.name}
                </span>
              </button>
            ))}
          </div>

          {/* Active Pillar Detail */}
          <div className="bg-white rounded-xl border-2 border-yellow-400 shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                {(() => { const Icon = PILLARS[activePillar].icon; return <Icon className="w-7 h-7 text-gray-900" />; })()}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{PILLARS[activePillar].name}</h3>
                <p className="text-gray-500 text-sm">{PILLARS[activePillar].tagline}</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg">
              {PILLARS[activePillar].description}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {PILLARS[activePillar].capabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                  <CheckCircle2 className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{cap.title}</p>
                    <p className="text-sm text-gray-500">{cap.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">Live Domain:</p>
              <p className="text-yellow-600 font-mono text-sm">{PILLARS[activePillar].domain}</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Data Pipeline */}
      <section className="py-16 px-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <SectionHeader number="03" title="The Data Pipeline" />
          <p className="text-gray-600 mt-4 max-w-3xl">
            My personal work. This is how I take raw, chaotic, impossible-to-get data and
            turn it into the highest-value intelligence available — the kind that makes
            people who've been in business for 30 years come to me.
          </p>

          <div className="mt-10">
            <div className="grid md:grid-cols-7 gap-2">
              {PIPELINE.map((stage, i) => (
                <div key={stage.name} className="relative">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <stage.icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{stage.name}</h4>
                    <p className="text-xs text-gray-500">{stage.desc}</p>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-2 w-4 h-4 text-gray-300 -translate-y-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 bg-gray-900 text-white rounded-xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-400" /> The Output
            </h3>
            <p className="text-gray-300 leading-relaxed">
              The pipeline doesn't just find data. It finds the <strong className="text-yellow-400">highest-value,
              most difficult-to-obtain data</strong> that most people — especially older,
              non-technical people — cannot access, cannot parse, and cannot use.
              That's what makes it worth a fortune.
            </p>
          </div>
        </div>
      </section>

      {/* The Attorney Case Study */}
      <section className="py-16 px-6 bg-gradient-to-b from-yellow-50 to-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>ACTIVE OPPORTUNITY — 1,000,000+ POTENTIAL CLIENTS</span>
          </div>
          <SectionHeader number="04" title="The Attorney Use Case" />
          <p className="text-gray-600 mt-4 max-w-3xl text-lg">
            An attorney receives property lists from the government. She must find the
            owners of those properties. If she can't find the owners, she has to track
            down the heirs. She told me she has access to about a million potential
            customers — and she likes me because I've been building businesses since I was 20.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            {/* The Problem */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> The Problem She Has
              </h3>
              <div className="space-y-3">
                <ProblemPoint text="Government hands her a list of properties with incomplete owner data" />
                <ProblemPoint text="Many owners are deceased, moved, or impossible to find through normal channels" />
                <ProblemPoint text="She must find heirs — which requires obituary searches, probate records, social security death index, public records across dozens of sources" />
                <ProblemPoint text="This is manual, slow, expensive, and most people can't do it at scale" />
                <ProblemPoint text="She needs documented proof of due diligence for every search (legal requirement)" />
              </div>
            </div>

            {/* The Solution */}
            <div className="bg-gray-900 text-white rounded-xl p-8 shadow-lg">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" /> What I Can Build For Her
              </h3>
              <div className="space-y-3">
                <SolutionPoint text="Upload government property lists — system automatically parses and normalizes them" />
                <SolutionPoint text="CloudBrowser searches tax assessor databases, property appraiser sites, and public records across all 50 states" />
                <SolutionPoint text="When owner is deceased, automatically traces heirs via obituaries, probate court records, SSDI, and social media" />
                <SolutionPoint text="Enriches every record with phone, email, and last-known address" />
                <SolutionPoint text="Generates a documented due-diligence report for every property — court-ready proof of search" />
                <SolutionPoint text="Dashboard tracks each property through the pipeline: Unsearched → Owner Found → Heir Traced → Contacted → Closed" />
              </div>
            </div>
          </div>

          {/* The Systems */}
          <div className="mt-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Systems I Can Build To Assist This Attorney</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {ATTORNEY_SYSTEMS.map((sys, i) => (
                <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-yellow-400 transition-colors">
                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center mb-3">
                    <sys.icon className="w-5 h-5 text-gray-900" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{sys.name}</h4>
                  <p className="text-sm text-gray-500">{sys.desc}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-semibold text-yellow-600">{sys.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters Now */}
      <section className="py-16 px-6 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          <SectionHeader number="05" title="Why This Matters Right Now" />
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Old-School People Want AI</h3>
              <p className="text-sm text-gray-500">
                Attorneys, contractors, real estate pros — they're hearing about AI everywhere
                but can't use it themselves. They'll pay for someone who can.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">The Data Is Hard To Get</h3>
              <p className="text-sm text-gray-500">
                Government records, probate filings, property data — it's scattered, unstructured,
                and requires browser automation to scrape at scale. Most people can't do it.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">The Money Is Real</h3>
              <p className="text-sm text-gray-500">
                Property heir tracing, emergency lead-gen, high-value legal leads —
                each one is worth hundreds to thousands of dollars per match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            The Bottom Line
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            We have the browser, the property intelligence system, the fault-line audit engine,
            and the data pipeline. We have a million-potential-client attorney who wants to work with us.
            The technology is built. The opportunity is now.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/strategic-urls" className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-lg hover:bg-yellow-500 transition-colors">
              <Target className="w-5 h-5" /> View Strategic URL Portfolio
            </Link>
            <Link to="/cloud-browser" className="inline-flex items-center gap-2 bg-gray-800 text-white font-bold px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
              <Globe className="w-5 h-5" /> CloudBrowser Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Data ---

const PILLARS = [
  {
    name: 'CloudBrowser',
    icon: Globe,
    tagline: 'The Loud Browser — autonomous web scraping at scale',
    domain: 'cloud-browser.base44.app',
    description:
      'A cloud-based browser automation engine that can navigate any website, fill forms, solve captchas, scrape data, and extract information that normal APIs cannot reach. It powers every data acquisition task across all our systems.',
    capabilities: [
      { title: 'Autonomous Navigation', detail: 'Navigates complex, JS-heavy sites that block normal scrapers' },
      { title: 'Captcha Solving', detail: 'Handles reCAPTCHA, hCaptcha, and custom challenges automatically' },
      { title: 'Multi-State Scraping', detail: 'Searches tax assessor and public records sites across all 50 states' },
      { title: 'Session Persistence', detail: 'Maintains login sessions and handles multi-step workflows' },
    ],
  },
  {
    name: 'HiddenPropertyIntel',
    icon: Building2,
    tagline: 'Property owner & heir intelligence system',
    domain: 'hiddenpropertyintel.com',
    description:
      'A system that takes a list of properties — from a government source, an attorney, or an investor — and finds who owns them, how to reach them, and if they are deceased, who the heirs are. This is the system the attorney needs.',
    capabilities: [
      { title: 'Owner Identification', detail: 'Cross-references tax records, deeds, and appraiser databases' },
      { title: 'Heir Tracing', detail: 'Obituaries, probate records, SSDI, social media, family trees' },
      { title: 'Contact Enrichment', detail: 'Finds phone, email, and last-known address for owners and heirs' },
      { title: 'Due Diligence Reports', detail: 'Court-ready documentation of every search attempt' },
    ],
  },
  {
    name: 'FaultLine',
    icon: Radar,
    tagline: 'System audit engine — finding the cracks nobody else sees',
    domain: 'fault-line audit system',
    description:
      'An audit system designed to find fault lines — the leaks, gaps, and hidden opportunities in systems, niches, and markets. It identifies the places where value is hiding and where competitors are weakest. This is how we find the ultra-high-value targets.',
    capabilities: [
      { title: 'Gap Detection', detail: 'Finds ranking gaps, data gaps, and authority gaps in any niche' },
      { title: 'Competitor Weakness Mapping', detail: 'Identifies exactly where competitors are vulnerable' },
      { title: 'Niche Opportunity Scoring', detail: 'Scores niches by revenue potential, difficulty, and scalability' },
      { title: 'System Leak Auditing', detail: 'Finds inefficiencies in any business process or data pipeline' },
    ],
  },
];

const PIPELINE = [
  { name: 'Discovery', icon: Search, desc: 'Find the data sources nobody else knows about' },
  { name: 'Acquisition', icon: Download, desc: 'Pull the data using CloudBrowser automation' },
  { name: 'Ingest', icon: Database, desc: 'Load raw, messy data from any format' },
  { name: 'Parse', icon: FileSearch, desc: 'Extract structure from chaos — PDFs, HTML, scans' },
  { name: 'Normalize', icon: Layers, desc: 'Standardize into clean, searchable records' },
  { name: 'Enrich', icon: Zap, desc: 'Add context — phone, email, relatives, status' },
  { name: 'Dissect', icon: Radar, desc: 'Identify the highest-value records and patterns' },
];

const ATTORNEY_SYSTEMS = [
  {
    icon: FileSearch,
    name: 'Property List Ingestion',
    desc: 'Upload any government property list (CSV, PDF, Excel). System automatically parses, normalizes, and queues every property for processing.',
    value: 'Saves 40+ hours of manual data entry per list',
  },
  {
    icon: Building2,
    name: 'Owner Identification Engine',
    desc: 'CloudBrowser searches tax assessor databases, property appraiser sites, deed records, and public records across all 50 states to identify current owners.',
    value: 'Finds owners in minutes, not weeks',
  },
  {
    icon: Users,
    name: 'Heir Tracing System',
    desc: 'When an owner is deceased or unreachable, automatically traces heirs via obituaries, probate court records, Social Security Death Index, and social media.',
    value: 'Solves the hardest part of the attorney job',
  },
  {
    icon: Zap,
    name: 'Contact Enrichment',
    desc: 'For every identified owner or heir, finds current phone number, email address, and physical address using people-search databases.',
    value: 'Turns a name into a reachable contact',
  },
  {
    icon: ShieldCheck,
    name: 'Due Diligence Documentation',
    desc: 'Generates a court-ready report documenting every search attempt, source checked, and result found for each property.',
    value: 'Legal compliance — proof of effort for every case',
  },
  {
    icon: LineChart,
    name: 'Case Management Dashboard',
    desc: 'Track every property through the pipeline: Unsearched → Owner Found → Heir Traced → Contacted → Closed. See stats, success rates, and revenue per case.',
    value: 'Run the entire practice from one screen',
  },
];

// --- Components ---

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
      <p className="text-3xl font-bold text-yellow-400">{value}</p>
      <p className="text-sm font-semibold text-white mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-5xl font-bold text-yellow-400/30 font-mono">{number}</span>
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function WinPoint({ icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-900" />
      </div>
      <p className="text-gray-600 text-sm pt-1">{text}</p>
    </div>
  );
}

function ProblemPoint({ text }) {
  return (
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

function SolutionPoint({ text }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
      <p className="text-sm text-gray-300">{text}</p>
    </div>
  );
}