import React, { useEffect, useState } from 'react';
import { UserRound, Loader2, Check } from 'lucide-react';
import Panel from '@/components/kit/Panel';
import Loading from '@/components/kit/Loading';
import { base44 } from '@/api/base44Client';

const FIELDS = [
  { key: 'firstName', label: 'First name', half: true },
  { key: 'lastName', label: 'Last name', half: true },
  { key: 'email', label: 'Email', half: true, type: 'email' },
  { key: 'phone', label: 'Phone', half: true },
  { key: 'companyName', label: 'Company (optional)', half: true },
  { key: 'address1', label: 'Address line 1', half: false },
  { key: 'address2', label: 'Address line 2 (optional)', half: false },
  { key: 'city', label: 'City', half: true },
  { key: 'state', label: 'State / Province', half: true },
  { key: 'zip', label: 'ZIP / Postal code', half: true },
  { key: 'country', label: 'Country (ISO code)', half: true },
];

export default function RegistrantContactPanel() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: 'Default', country: 'US' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    base44.entities.RegistrantContact.list()
      .then((rows) => {
        if (rows[0]) {
          setRecord(rows[0]);
          setForm({ ...rows[0] });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(k, v) { setForm((s) => ({ ...s, [k]: v })); }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const payload = {
        label: form.label || 'Default',
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country || 'US',
      };
      let saved;
      if (record?.id) {
        saved = await base44.entities.RegistrantContact.update(record.id, payload);
      } else {
        saved = await base44.entities.RegistrantContact.create(payload);
        setRecord(saved);
      }
      setForm({ ...saved });
      setMsg({ ok: 'Contact info saved — it will be used for every domain purchase.' });
    } catch (e) {
      setMsg({ error: e.message || 'Failed to save contact info' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Registrant contact" subtitle="Saved once, reused for every domain purchase"
      right={<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{record ? 'saved' : 'not set'}</span>}>
      {loading ? <Loading label="Loading contact" /> : (
        <>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Vercel requires registrant contact info to buy a domain. Fill this in once and the Buy flow will use it automatically — no need to re-enter it each time.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
                <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{f.label}</span>
                <input
                  value={form[f.key] || ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  type={f.type || 'text'}
                  className="w-full rounded border border-input bg-background px-2.5 py-1.5 text-sm"
                />
              </label>
            ))}
          </div>
          {msg && (
            <div className={`mt-4 rounded border px-3 py-2 text-xs ${msg.error ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-primary/40 bg-primary/10 text-foreground'}`}>
              {msg.error || msg.ok}
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {record ? 'Update contact info' : 'Save contact info'}
          </button>
        </>
      )}
    </Panel>
  );
}