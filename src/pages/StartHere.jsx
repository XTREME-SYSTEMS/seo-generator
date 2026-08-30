import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTenant } from '@/lib/TenantContext';

const INDUSTRIES = [
  'Concrete polishing / epoxy flooring', 'Home services', 'Legal', 'Medical / dental',
  'Roofing', 'HVAC / plumbing', 'B2B SaaS', 'E-commerce', 'Professional services', 'Other',
];

const STEPS = ['Business', 'Market', 'Queries', 'Assets'];

function Choice({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function StartHere() {
  const navigate = useNavigate();
  const { setClientId } = useTenant();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    name: '', domain: '', industry: '', subIndustry: '', serviceArea: '',
    queries: '', competitors: '', partners: '', urls: '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const lines = (v) => v.split('\n').map((s) => s.trim()).filter(Boolean);

  const submit = async () => {
    setBusy(true);
    try {
      const client = await base44.entities.Client.create({
        name: form.name,
        domain: form.domain,
        industry: [form.industry, form.subIndustry].filter(Boolean).join(' / '),
        status: 'non_production_pilot',
        notes: form.serviceArea ? `Service area: ${form.serviceArea}` : '',
      });
      setClientId(client.id);

      const queries = lines(form.queries);
      const urls = lines(form.urls);
      const domain = form.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      if (urls.length) {
        await base44.entities.UrlTarget.bulkCreate(urls.map((url) => ({
          client_id: client.id,
          url,
          domain,
          gsc_property: domain ? `sc-domain:${domain}` : '',
          url_state: 'NEW_NO_HISTORY',
          target_queries: queries,
          index_state: 'UNOBSERVED',
          clock_started_at: new Date().toISOString(),
        })));
      }

      const res = await base44.functions.invoke('AreBenchmark', {
        client_id: client.id,
        industry: form.industry,
        sub_industry: form.subIndustry,
        service_area: form.serviceArea,
        queries,
        competitors: lines(form.competitors),
        partner_domains: lines(form.partners),
      });

      await base44.functions.invoke('AreReflect', { client_id: client.id });
      setDone({ client, benchmark: res.data });
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div>
        <PageHeader eyebrow="Onboarding complete" title="The engine is running" description="Your assets are registered and the 15-minute loop has picked them up." />
        <Panel title={done.client.name} subtitle={done.client.domain}>
          <div className="mb-5 flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" />
            {done.benchmark?.competitors_seeded || 0} competitors seeded · {done.benchmark?.deliverables || 0} authority deliverables identified
          </div>
          {done.benchmark?.benchmark?.benchmark_summary && (
            <div className="mb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Combined benchmark of the current top 3</div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{done.benchmark.benchmark.benchmark_summary}</p>
            </div>
          )}
          {done.benchmark?.benchmark?.target_summary && (
            <div className="mb-5 rounded border border-primary/30 bg-primary/5 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">Your target — 20% beyond the benchmark</div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{done.benchmark.benchmark.target_summary}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/scoreboard')}>Open scoreboard</Button>
            <Button variant="outline" onClick={() => navigate('/sheet')}>Open ranking sheet</Button>
            <Button variant="outline" onClick={() => navigate('/strategy')}>View strategy</Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Start here"
        title="Set up the engine"
        description="Four short steps. Everything you enter compounds the engine's knowledge of your vertical and is used to reverse-engineer what it takes to hold top 3."
      />

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] ${
              i === step ? 'border-primary bg-primary text-primary-foreground' : i < step ? 'border-primary/40 text-primary' : 'border-border text-muted-foreground'
            }`}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`hidden text-xs sm:inline ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border" />}
          </div>
        ))}
      </div>

      <Panel title={STEPS[step]}>
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Business name"><Input value={form.name} onChange={set('name')} placeholder="Acme Concrete Polishing" /></Field>
            <Field label="Primary domain" hint="Used to build the Search Console property and match measured data."><Input value={form.domain} onChange={set('domain')} placeholder="example.com" /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Industry">
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((i) => <Choice key={i} label={i} active={form.industry === i} onClick={() => setForm({ ...form, industry: i })} />)}
              </div>
            </Field>
            <Field label="Sub-industry / specialty" hint="The narrower the better — it sharpens the benchmark."><Input value={form.subIndustry} onChange={set('subIndustry')} placeholder="Garage floor epoxy coatings" /></Field>
            <Field label="Service area"><Input value={form.serviceArea} onChange={set('serviceArea')} placeholder="Tampa, FL + 40 mile radius" /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="Money queries" hint="One per line. These are the queries the engine drives to top 3.">
              <Textarea rows={5} value={form.queries} onChange={set('queries')} placeholder={'epoxy garage floor tampa\nconcrete polishing near me'} />
            </Field>
            <Field label="Known competitors" hint="One domain per line. Leave blank and the engine will identify them.">
              <Textarea rows={4} value={form.competitors} onChange={set('competitors')} placeholder="competitor.com" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Field label="URL assets" hint="One URL per line. Every URL here enters the 15-minute loop.">
              <Textarea rows={5} value={form.urls} onChange={set('urls')} placeholder={'https://example.com/\nhttps://example.com/epoxy-garage-floors'} />
            </Field>
            <Field label="Partner / authority domains" hint="Manufacturers, franchisors or partners who could legitimately link to you — modeled as an authority advantage and tracked as a deliverable.">
              <Textarea rows={3} value={form.partners} onChange={set('partners')} placeholder="xtremepolishingsystems.com" />
            </Field>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || busy}>
            <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !form.name}>
              Next <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={busy || !form.name}>
              {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Rocket className="mr-2 h-3.5 w-3.5" />}
              Launch the engine
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}