import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, Building2, Globe, Target, Brain, Sparkles, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

const INDUSTRIES = [
  'Epoxy Coatings & Flooring', 'Polished Concrete', 'Concrete Overlayment', 'Real Estate / Property Intelligence',
  'Home Services', 'Legal Services', 'Medical / Healthcare', 'E-commerce / Retail',
  'SaaS / Technology', 'Financial Services', 'Automotive', 'Restaurants & Hospitality',
  'Fitness & Wellness', 'Education', 'Construction', 'Manufacturing', 'Other',
];

const STEPS = [
  { id: 'contact', title: 'Contact', icon: Building2 },
  { id: 'business', title: 'Business', icon: Globe },
  { id: 'audience', title: 'Audience', icon: Users },
  { id: 'urls', title: 'URLs', icon: Target },
  { id: 'goals', title: 'Goals', icon: Sparkles },
  { id: 'competitors', title: 'Competitors', icon: Brain },
  { id: 'building', title: 'Building', icon: Loader2 },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [buildProgress, setBuildProgress] = useState([]);
  const [buildResult, setBuildResult] = useState(null);
  const [form, setForm] = useState({
    contact_name: '', contact_email: '', contact_phone: '',
    company_name: '', location_city: '', location_state: '', location_country: 'US',
    industry: '', sub_industry: '',
    service_area: 'local', target_audience: '', main_services: '',
    urls: [''], target_keywords: [],
    desired_results: '', monthly_budget: 500, current_monthly_traffic: 0,
    competitor_urls: [''],
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const updateUrl = (i, val) => { const urls = [...form.urls]; urls[i] = val; update('urls', urls); };
  const addUrl = () => update('urls', [...form.urls, '']);
  const updateCompetitor = (i, val) => { const urls = [...form.competitor_urls]; urls[i] = val; update('competitor_urls', urls); };
  const addCompetitor = () => update('competitor_urls', [...form.competitor_urls, '']);

  const canProceed = () => {
    switch (STEPS[step].id) {
      case 'contact': return form.contact_name && form.contact_email;
      case 'business': return form.company_name && form.industry;
      case 'audience': return form.target_audience && form.main_services;
      case 'urls': return form.urls.filter(u => u.trim()).length > 0;
      case 'goals': return form.desired_results;
      default: return true;
    }
  };

  const addProgress = (msg) => setBuildProgress(prev => [...prev, msg]);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      if (step === STEPS.length - 2) {
        // Building step — save profile and call the generator
        setSaving(true);
        try {
          const { data: user } = await base44.auth.me();
          addProgress('Saving your profile...');

          const profile = await base44.entities.OnboardingProfile.create({
            user_id: user.id,
            contact_name: form.contact_name,
            contact_email: form.contact_email,
            contact_phone: form.contact_phone,
            company_name: form.company_name,
            location_city: form.location_city,
            location_state: form.location_state,
            location_country: form.location_country,
            industry: form.industry,
            sub_industry: form.sub_industry,
            service_area: form.service_area,
            target_audience: form.target_audience,
            main_services: form.main_services,
            urls: form.urls.filter(u => u.trim()),
            target_keywords: form.target_keywords,
            competitor_urls: form.competitor_urls.filter(u => u.trim()),
            desired_results: form.desired_results,
            monthly_budget: form.monthly_budget,
            current_monthly_traffic: form.current_monthly_traffic,
            status: 'in_progress',
          });

          setStep(step + 1);

          // Call the backend generator
          addProgress('Creating your client project...');
          const { data: result } = await base44.functions.invoke('GenerateUserSystem', {
            profile_id: profile.id,
            ...form,
            urls: form.urls.filter(u => u.trim()),
            competitor_urls: form.competitor_urls.filter(u => u.trim()),
            target_keywords: form.target_keywords,
          });

          if (result?.ok) {
            addProgress(`Created ${result.agents_total} AI agents (Commander, Scout, Builder, Healer, Sentinel, Validator)...`);
            addProgress(`Registered ${result.url_targets} URL targets for tracking...`);
            addProgress(`Set up ${result.competitors} competitor intelligence profiles...`);
            addProgress(`Generated ${result.opportunities} keyword opportunities...`);
            addProgress(result.playbook === 'created' ? 'Generated industry playbook...' : 'Loaded existing industry playbook...');
            addProgress('System generation complete! Redirecting to your portal...');
            setBuildResult(result);
            setTimeout(() => navigate('/portal'), 2500);
          } else {
            addProgress('System generation complete!');
            setTimeout(() => navigate('/portal'), 1500);
          }
        } catch (err) {
          addProgress('Error: ' + err.message);
        }
        setSaving(false);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => step > 0 && setStep(step - 1);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src={LOGO_URL} alt="Xtreme SEO" className="mx-auto mb-4 h-16 w-auto" />
          <h1 className="font-heading text-2xl font-bold">Welcome to Xtreme SEO Optimizer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Answer a few questions and we'll automatically build your entire autonomous SEO system.</p>
        </div>

        {/* Progress */}
        <div className="mb-10 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                i <= step ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-border bg-muted'
              }`}>
                {i < step ? <CheckCircle2 className="h-5 w-5 text-[#B8860B]" /> : <s.icon className={`h-5 w-5 ${i === step ? 'text-[#B8860B]' : 'text-muted-foreground/40'}`} />}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? 'bg-[#FFD700]' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-xl border border-border bg-slate-50/50 p-6 sm:p-8">
          {STEPS[step].id === 'contact' && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Contact Information</h2>
              <p className="text-sm text-muted-foreground">So we can reach you with updates and reports.</p>
              <Input placeholder="Full Name" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} className="border-border bg-white" />
              <Input type="email" placeholder="Email Address" value={form.contact_email} onChange={e => update('contact_email', e.target.value)} className="border-border bg-white" />
              <Input placeholder="Phone Number" value={form.contact_phone} onChange={e => update('contact_phone', e.target.value)} className="border-border bg-white" />
            </div>
          )}

          {STEPS[step].id === 'business' && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Business Details</h2>
              <p className="text-sm text-muted-foreground">Tell us about your business so we can tailor the system.</p>
              <Input placeholder="Company Name" value={form.company_name} onChange={e => update('company_name', e.target.value)} className="border-border bg-white" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="City" value={form.location_city} onChange={e => update('location_city', e.target.value)} className="border-border bg-white" />
                <Input placeholder="State" value={form.location_state} onChange={e => update('location_state', e.target.value)} className="border-border bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-foreground/70">Industry</label>
                <select value={form.industry} onChange={e => update('industry', e.target.value)} className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground">
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <Input placeholder="Sub-Industry (e.g. Decorative Concrete, Residential)" value={form.sub_industry} onChange={e => update('sub_industry', e.target.value)} className="border-border bg-white" />
            </div>
          )}

          {STEPS[step].id === 'audience' && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Audience & Services</h2>
              <p className="text-sm text-muted-foreground">The more the system knows, the better it can optimize for your market.</p>
              <div>
                <label className="mb-1.5 block text-sm text-foreground/70">Service Area</label>
                <select value={form.service_area} onChange={e => update('service_area', e.target.value)} className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground">
                  <option value="local">Local (one city/region)</option>
                  <option value="regional">Regional (multiple states)</option>
                  <option value="national">National (entire country)</option>
                  <option value="international">International</option>
                </select>
              </div>
              <textarea
                placeholder="Who is your target audience? (e.g. Homeowners needing garage flooring, commercial property managers, general contractors...)"
                value={form.target_audience}
                onChange={e => update('target_audience', e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50"
              />
              <textarea
                placeholder="What are your main products or services? (e.g. Epoxy floor coating, concrete polishing, overlayment installation...)"
                value={form.main_services}
                onChange={e => update('main_services', e.target.value)}
                rows={3}
                className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50"
              />
              <div>
                <label className="mb-1.5 block text-sm text-foreground/70">Current Monthly Organic Traffic (visits)</label>
                <Input type="number" value={form.current_monthly_traffic} onChange={e => update('current_monthly_traffic', Number(e.target.value))} className="border-border bg-white" />
              </div>
            </div>
          )}

          {STEPS[step].id === 'urls' && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Your URLs</h2>
              <p className="text-sm text-muted-foreground">Enter the URLs you want to rank on the first page of Google.</p>
              {form.urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`https://example.com/page-${i + 1}`} value={url} onChange={e => updateUrl(i, e.target.value)} className="border-border bg-white" />
                  {i === form.urls.length - 1 && (
                    <Button onClick={addUrl} variant="outline" className="border-[#FFD700]/40 text-[#B8860B] hover:bg-[#FFD700]/10">Add</Button>
                  )}
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-sm text-foreground/70">Target Keywords (comma separated)</label>
                <Input placeholder="epoxy flooring, concrete polishing, ..." onChange={e => update('target_keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))} className="border-border bg-white" />
              </div>
            </div>
          )}

          {STEPS[step].id === 'goals' && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Your Goals</h2>
              <p className="text-sm text-muted-foreground">What do you want to achieve? The system will be built around your goals.</p>
              <textarea
                placeholder="e.g. Get all my service pages to the first page of Google for my target keywords. Increase organic traffic by 200%. Generate more leads from organic search."
                value={form.desired_results}
                onChange={e => update('desired_results', e.target.value)}
                rows={4}
                className="w-full rounded border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50"
              />
              <div>
                <label className="mb-1.5 block text-sm text-foreground/70">Monthly Budget ($)</label>
                <Input type="number" value={form.monthly_budget} onChange={e => update('monthly_budget', Number(e.target.value))} className="border-border bg-white" />
              </div>
            </div>
          )}

          {STEPS[step].id === 'competitors' && (
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">Competitor URLs</h2>
              <p className="text-sm text-muted-foreground">Enter your top competitors. The system will scrape and analyze them to build counter-strategies.</p>
              {form.competitor_urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`https://competitor-${i + 1}.com`} value={url} onChange={e => updateCompetitor(i, e.target.value)} className="border-border bg-white" />
                  {i === form.competitor_urls.length - 1 && (
                    <Button onClick={addCompetitor} variant="outline" className="border-[#FFD700]/40 text-[#B8860B] hover:bg-[#FFD700]/10">Add</Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {STEPS[step].id === 'building' && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#B8860B]" />
              <h2 className="font-heading text-xl font-semibold">Building Your System...</h2>
              <p className="mt-2 text-sm text-muted-foreground">AI is generating your entire autonomous SEO system from your answers.</p>
              <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
                {buildProgress.map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#B8860B]" />
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < STEPS.length - 1 && (
            <div className="mt-8 flex items-center justify-between">
              <Button onClick={handleBack} disabled={step === 0} variant="ghost" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;