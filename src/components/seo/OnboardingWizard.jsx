import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Loader2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = [
  { key: 'basics', title: 'Tell us about your business' },
  { key: 'queries', title: 'What do you want to rank for?' },
  { key: 'competitors', title: 'Who are your top competitors?' },
  { key: 'goals', title: 'Goals & paid spend' }
];

const GOALS = [
  { value: 'rank_for_targets', label: 'Rank for my target queries', hint: 'Climb the SERP for the keywords you listed' },
  { value: 'beat_competitor', label: 'Beat a specific competitor', hint: 'Displace a rival from page one' },
  { value: 'replace_paid', label: 'Replace paid search spend', hint: 'Grow organic to offset ad costs' },
  { value: 'ai_visibility', label: 'Show up in AI answers', hint: 'Get cited by ChatGPT, Perplexity, AI Overviews' }
];

export default function OnboardingWizard({ onDone }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    industry: '',
    target_queries: '',
    competitors: [{ name: '', domain: '' }, { name: '', domain: '' }, { name: '', domain: '' }],
    goal: 'rank_for_targets',
    monthly_paid_spend: ''
  });

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function updateCompetitor(i, field, value) {
    setForm((f) => {
      const next = [...f.competitors];
      next[i] = { ...next[i], [field]: value };
      return { ...f, competitors: next };
    });
  }

  const queries = form.target_queries.split('\n').map((q) => q.trim()).filter(Boolean);
  const validCompetitors = form.competitors.filter((c) => c.name.trim());

  function canProceed() {
    if (step === 0) return form.name.trim() && form.industry.trim();
    if (step === 1) return queries.length >= 1;
    if (step === 2) return true; // competitors optional but encouraged
    return true;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('OnboardClient', {
        name: form.name,
        domain: form.domain,
        industry: form.industry,
        target_queries: queries,
        competitors: validCompetitors.map((c) => ({ name: c.name, domain: c.domain })),
        goal: form.goal,
        monthly_paid_spend: Number(form.monthly_paid_spend) || 0
      });
      onDone(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Zap className="h-4 w-4" /></div>
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">SEO Generator Onboarding</h1>
          <p className="text-xs text-muted-foreground">Answer a few questions and the generator runs autonomously in the background.</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-1.5">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/15 text-primary ring-1 ring-primary' : 'bg-muted text-muted-foreground'}`}>
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-1 font-heading text-base font-medium text-foreground">{STEPS[step].title}</h2>

        {step === 0 && (
          <div className="mt-4 space-y-4">
            <Field label="Business name *">
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Acme Roofing" className="input" />
            </Field>
            <Field label="Website domain">
              <input value={form.domain} onChange={(e) => update('domain', e.target.value)} placeholder="acmeroofing.com" className="input" />
            </Field>
            <Field label="Industry / sub-industry *" hint="The generator tailors every method to this.">
              <input value={form.industry} onChange={(e) => update('industry', e.target.value)} placeholder="roofing, residential construction" className="input" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4">
            <Field label="Target queries" hint="One per line. These become the exact keywords the system works to rank.">
              <textarea value={form.target_queries} onChange={(e) => update('target_queries', e.target.value)} rows={7} placeholder={"roof repair near me\nemergency roof leak\nmetal roof installation cost"} className="input font-mono text-xs" />
            </Field>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">{queries.length} query{queries.length === 1 ? '' : 's'} ready</p>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">Add up to three. The system builds a digital twin of each to find displacement angles.</p>
            {form.competitors.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c.name} onChange={(e) => updateCompetitor(i, 'name', e.target.value)} placeholder={`Competitor ${i + 1} name`} className="input flex-1" />
                <input value={c.domain} onChange={(e) => updateCompetitor(i, 'domain', e.target.value)} placeholder="competitor.com" className="input flex-1" />
              </div>
            ))}
            <p className="font-mono text-[10px] text-muted-foreground">{validCompetitors.length} competitor{validCompetitors.length === 1 ? '' : 's'} added</p>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-4">
            <Field label="Primary goal">
              <div className="grid gap-2">
                {GOALS.map((g) => (
                  <button key={g.value} type="button" onClick={() => update('goal', g.value)} className={`flex items-center justify-between rounded border px-3 py-2.5 text-left text-xs transition ${form.goal === g.value ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:border-primary/40'}`}>
                    <div><div className="font-medium text-foreground">{g.label}</div><div className="text-muted-foreground">{g.hint}</div></div>
                    {form.goal === g.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Current monthly paid search spend ($)" hint="Optional — powers the paid-organic replacement math.">
              <input type="number" value={form.monthly_paid_spend} onChange={(e) => update('monthly_paid_spend', e.target.value)} placeholder="5000" className="input" />
            </Field>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting} className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-40">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        {!isLast ? (
          <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {submitting ? 'Starting generator…' : 'Start generator'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}