import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, User, Search, ShieldCheck, FileText, Sparkles, Brain, Eye, Zap, Bot, TrendingUp, AlertTriangle, CheckCircle2, UserCheck, Lock } from 'lucide-react';

const ONBOARDING_STEPS = [
  { key: 'personality', label: 'Personality Type', type: 'select', options: ['Analytical', 'Creative', 'Strategic', 'Hands-on', 'Visionary', 'Pragmatic'] },
  { key: 'riskTolerance', label: 'Risk Tolerance', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive', 'Extreme'] },
  { key: 'budget', label: 'Investment Budget ($)', type: 'number', placeholder: '10000' },
  { key: 'businessExperience', label: 'Business Experience', type: 'select', options: ['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { key: 'techExperience', label: 'Technology Experience', type: 'select', options: ['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { key: 'aiExperience', label: 'AI Experience', type: 'select', options: ['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { key: 'marketingExperience', label: 'Marketing & Sales Experience', type: 'select', options: ['None', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] },
  { key: 'intuition', label: 'Human Intuition Capabilities', type: 'select', options: ['Low', 'Medium', 'High', 'Exceptional'] },
  { key: 'communication', label: 'Communication Style', type: 'select', options: ['Direct', 'Collaborative', 'Analytical', 'Persuasive', 'Reserved'] },
  { key: 'teamwork', label: 'Teamwork Preference', type: 'select', options: ['Solo', 'Small Team', 'Large Team', 'Hybrid'] },
  { key: 'dailyFlow', label: 'Daily Typical Life Flow', type: 'text', placeholder: 'Describe your typical day...' },
  { key: 'timeAvailability', label: 'Time Availability (hrs/week)', type: 'number', placeholder: '20' },
  { key: 'dedication', label: 'Dedication Level', type: 'select', options: ['Casual', 'Part-time', 'Committed', 'All-in'] },
  { key: 'financialDesire', label: 'Financial Desire', type: 'text', placeholder: '$50K/month' },
  { key: 'autonomyDesire', label: 'Automation & AI Autonomy Desire', type: 'select', options: ['Low', 'Medium', 'High', 'Full Autonomy'] },
  { key: 'existingAccounts', label: 'Existing Accounts (email, social, etc.)', type: 'text', placeholder: 'email@example.com, @instagram, etc.' },
  { key: 'email', label: 'Primary Email', type: 'text', placeholder: 'your@email.com' },
  { key: 'fullCapabilities', label: 'Allow system to use full maximum capabilities?', type: 'select', options: ['Yes - Full Access', 'Partial', 'No'] },
];

export default function LiveSimulator() {
  const [step, setStep] = useState(0); // 0=onboarding, 1=tos, 2=persona, 3=skiptrace, 4=recommend
  const [onboardingData, setOnboardingData] = useState({});
  const [personaName, setPersonaName] = useState('');
  const [agreedToTOS, setAgreedToTOS] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState(null);
  const [skipTrace, setSkipTrace] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  function updateField(key, value) {
    setOnboardingData(prev => ({ ...prev, [key]: value }));
  }

  async function generatePersona() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('LiveSimulatorPersona', {
        action: 'generate_persona',
        personaName,
        onboardingData,
      });
      setPersona((res.data || res).persona);
      setStep(2);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function runSkipTrace() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('LiveSimulatorPersona', {
        action: 'skip_trace',
        onboardingData: { ...onboardingData, fullName: persona?.name || personaName },
        agreedToTOS,
        digitalSignature,
      });
      const data = res.data || res;
      setSkipTrace(data);
      setStep(3);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function getRecommendations() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('LiveSimulatorPersona', {
        action: 'auto_recommend',
        persona,
        skipTraceAnalysis: skipTrace?.analysis,
        onboardingData,
      });
      setRecommendations((res.data || res).recommendations);
      setStep(4);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Operational Simulator</h1>
          <p className="text-sm text-muted-foreground">Persona generation • Skip trace • Strategic opportunity discovery</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {['Onboarding', 'Agreement', 'Persona', 'Skip Trace', 'Recommendations'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= i ? 'bg-yellow-400 text-gray-900' : 'bg-muted text-muted-foreground'
            }`}>{i + 1}</div>
            <span className={`text-xs ${step >= i ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
            {i < 4 && <div className={`w-8 h-0.5 ${step > i ? 'bg-yellow-400' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Onboarding */}
      {step === 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-lg font-bold text-foreground mb-1">Onboarding Questionnaire</h2>
          <p className="text-sm text-muted-foreground mb-4">Tell us about yourself so the system can build your personalized strategy.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">Persona Name (leave blank to auto-generate)</label>
              <input value={personaName} onChange={(e) => setPersonaName(e.target.value)} placeholder="Auto-generate a name" className="input" />
            </div>
            {ONBOARDING_STEPS.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-foreground mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select value={onboardingData[field.key] || ''} onChange={(e) => updateField(field.key, e.target.value)} className="input">
                    <option value="">Select...</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={onboardingData[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="input"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"
          >
            Continue to Agreement <ShieldCheck className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: TOS & Agreement */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-bold text-foreground">Terms of Service & Privacy Agreement</h2>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 mb-4 max-h-[300px] overflow-y-auto text-sm text-muted-foreground space-y-3">
            <p><strong className="text-foreground">1. Data Usage Authorization:</strong> You authorize the system to perform advanced skip tracing, digital background checks, and web scraping using CloudBrowser technology to gather publicly available information about your digital footprint.</p>
            <p><strong className="text-foreground">2. Privacy Policy:</strong> All gathered data is used solely for strategic analysis and opportunity identification. Data is stored securely and never shared with third parties.</p>
            <p><strong className="text-foreground">3. Search & Utilization Agreement:</strong> You agree to allow the system to search, scrape, and utilize publicly available information about you across the internet, social media, public records, and digital platforms.</p>
            <p><strong className="text-foreground">4. Full Capability Authorization:</strong> If you selected "Full Access," the system may utilize its maximum capabilities including: autonomous web scraping, competitor analysis, market research, AI-powered strategy generation, and automated execution across all connected integrations.</p>
            <p><strong className="text-foreground">5. Digital Signature:</strong> By signing below, you legally agree to all terms and authorize the system to proceed with full data gathering and analysis.</p>
          </div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={agreedToTOS} onChange={(e) => setAgreedToTOS(e.target.checked)} className="w-4 h-4 accent-yellow-500" />
            <span className="text-sm text-foreground">I agree to the Terms of Service, Privacy Policy, and Search Authorization</span>
          </label>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-foreground mb-1">Digital Signature</label>
            <input
              value={digitalSignature}
              onChange={(e) => setDigitalSignature(e.target.value)}
              placeholder="Type your full name as digital signature"
              className="input"
              style={{ fontFamily: 'cursive, serif', fontSize: '1.1rem' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-lg text-sm font-medium">Back</button>
            <button
              onClick={generatePersona}
              disabled={!agreedToTOS || !digitalSignature || loading}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              {loading ? 'Generating Persona...' : 'Generate Persona & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Persona Generated */}
      {step === 2 && persona && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-foreground">Generated Persona: {persona.name}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div><span className="text-xs text-muted-foreground">Age</span><p className="font-semibold">{persona.age}</p></div>
              <div><span className="text-xs text-muted-foreground">Location</span><p className="font-semibold">{persona.location}</p></div>
              <div><span className="text-xs text-muted-foreground">Starting Capital</span><p className="font-semibold">${persona.startingCapital?.toLocaleString()}</p></div>
            </div>
            <div className="mb-3">
              <span className="text-xs font-semibold text-foreground">Background</span>
              <p className="text-sm text-muted-foreground mt-1">{persona.background}</p>
            </div>
            <div className="mb-3">
              <span className="text-xs font-semibold text-foreground">Digital Footprint</span>
              <p className="text-sm text-muted-foreground mt-1">{persona.digitalFootprint}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-3">
              <div>
                <span className="text-xs font-semibold text-green-700">Strengths</span>
                <ul className="mt-1 space-y-1">{persona.strengths?.map((s, i) => <li key={i} className="text-xs text-green-600 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5" />{s}</li>)}</ul>
              </div>
              <div>
                <span className="text-xs font-semibold text-red-700">Weaknesses</span>
                <ul className="mt-1 space-y-1">{persona.weaknesses?.map((s, i) => <li key={i} className="text-xs text-red-600 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5" />{s}</li>)}</ul>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-xs font-semibold text-yellow-800">Recommended Strategy</span>
              <p className="text-sm text-yellow-900 mt-1">{persona.recommendedStrategy}</p>
            </div>
            <div className="mt-3">
              <span className="text-xs font-semibold text-foreground">Projected Path</span>
              <p className="text-sm text-muted-foreground mt-1">{persona.projectedPath}</p>
            </div>
          </div>
          <button
            onClick={runSkipTrace}
            disabled={loading}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Running Skip Trace...' : 'Run Skip Trace & Background Dig'}
          </button>
        </div>
      )}

      {/* Step 3: Skip Trace Results */}
      {step === 3 && skipTrace && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-foreground">Skip Trace & Background Analysis</h2>
            </div>
            {skipTrace.analysis && (
              <>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-foreground">Digital Profile</span>
                  <p className="text-sm text-muted-foreground mt-1">{skipTrace.analysis.digitalProfile}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-red-700">Gaps Identified</span>
                    <ul className="mt-1 space-y-1">{skipTrace.analysis.gaps?.map((g, i) => <li key={i} className="text-xs text-red-600 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5" />{g}</li>)}</ul>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-orange-700">Potential Failures</span>
                    <ul className="mt-1 space-y-1">{skipTrace.analysis.potentialFailures?.map((f, i) => <li key={i} className="text-xs text-orange-600 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5" />{f}</li>)}</ul>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-green-700">Achievements Found</span>
                  <ul className="mt-1 space-y-1">{skipTrace.analysis.achievements?.map((a, i) => <li key={i} className="text-xs text-green-600 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5" />{a}</li>)}</ul>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-purple-700">Strategic Opportunities</span>
                  <ul className="mt-1 space-y-1">{skipTrace.analysis.strategicOpportunities?.map((o, i) => <li key={i} className="text-xs text-purple-600 flex items-start gap-1"><Sparkles className="w-3 h-3 mt-0.5" />{o}</li>)}</ul>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-indigo-700">Invisible Capabilities</span>
                  <ul className="mt-1 space-y-1">{skipTrace.analysis.invisibleCapabilities?.map((c, i) => <li key={i} className="text-xs text-indigo-600 flex items-start gap-1"><Eye className="w-3 h-3 mt-0.5" />{c}</li>)}</ul>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-yellow-700">Least-Known Valuable Opportunities</span>
                  <ul className="mt-1 space-y-1">{skipTrace.analysis.leastKnownOpportunities?.map((o, i) => <li key={i} className="text-xs text-yellow-700 flex items-start gap-1"><TrendingUp className="w-3 h-3 mt-0.5" />{o}</li>)}</ul>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg mb-4">
                  <span className="text-xs font-semibold text-purple-900">Unfathomable Results (if strategy followed exactly)</span>
                  <p className="text-sm text-purple-800 mt-1">{skipTrace.analysis.unfathomableResults}</p>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-blue-700">Elite Strategies (unknown to 99.9%)</span>
                  <ul className="mt-1 space-y-1">{skipTrace.analysis.eliteStrategies?.map((s, i) => <li key={i} className="text-xs text-blue-600 flex items-start gap-1"><Brain className="w-3 h-3 mt-0.5" />{s}</li>)}</ul>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-green-700">Recommended Niches</span>
                  <div className="flex flex-wrap gap-2 mt-1">{skipTrace.analysis.recommendedNiches?.map((n, i) => <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{n}</span>)}</div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-xs font-semibold text-yellow-800">Full Autonomy Path</span>
                  <p className="text-sm text-yellow-900 mt-1">{skipTrace.analysis.fullAutonomyPath}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={getRecommendations}
            disabled={loading}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating Recommendations...' : 'Generate Auto Recommendations'}
          </button>
        </div>
      )}

      {/* Step 4: Recommendations */}
      {step === 4 && recommendations && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-bold text-foreground">Ultimate Strategy</h2>
            </div>
            <p className="text-sm text-foreground">{recommendations.ultimateStrategy}</p>
          </div>

          {recommendations.topOpportunities && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Top Opportunities</h3>
              <div className="space-y-2">
                {recommendations.topOpportunities.map((opp, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{opp.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{opp.potentialROI}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opp.description}</p>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>Difficulty: {opp.difficulty}</span>
                      <span>Timeline: {opp.timeToResults}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.eliteNiches && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Elite Niches</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {recommendations.eliteNiches.map((n, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground">{n.niche}</span>
                      <span className="text-xs text-yellow-600">{n.marketSize}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{n.why}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Competition: {n.competition}</span>
                      <span>Automation: {n.automationPotential}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.fullAutonomyBlueprint && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Full Autonomy Blueprint</h3>
              <div className="space-y-2">
                {Object.entries(recommendations.fullAutonomyBlueprint).map(([phase, desc]) => (
                  <div key={phase} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 text-gray-900 text-xs font-bold flex items-center justify-center shrink-0">{phase.replace('phase', '')}</div>
                    <p className="text-sm text-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.projectedResults && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Projected Results Timeline</h3>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(recommendations.projectedResults).map(([period, val]) => (
                  <div key={period} className="text-center">
                    <div className="text-xs text-muted-foreground capitalize">{period}</div>
                    <div className="text-lg font-bold text-green-600">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.integrationStack && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Integration Stack</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.integrationStack.map((int, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 font-medium">{int}</span>
                ))}
              </div>
            </div>
          )}

          {recommendations.agentTeam && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Agent Team</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.agentTeam.map((agent, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-medium flex items-center gap-1">
                    <Bot className="w-3 h-3" /> {agent}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}