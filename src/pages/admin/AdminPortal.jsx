import React, { useState, useEffect } from 'react';
import { KeyRound, Tag, Brain, Users, Plus, Trash2, Copy, Loader2, CheckCircle2, Power, Edit3, X, Shield, CheckCircle2 as Check, AlertCircle, Activity, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

const LEVEL_LABELS = { read: 'Read Only', write: 'Read + Write', admin: 'Full Admin' };
const LEVEL_COLORS = { read: 'text-sky-600 bg-sky-50', write: 'text-amber-600 bg-amber-50', admin: 'text-rose-600 bg-rose-50' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function HealthRow({ label, status }) {
  const ok = status === 'active' || status === 'connected' || status === 'pass';
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {ok ? <Check className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className={`text-xs font-medium capitalize ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{status}</span>
    </div>
  );
}

function AdminPortal() {
  const [tab, setTab] = useState('overview');
  const [apiKeys, setApiKeys] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', percentOff: 20, duration: 'repeating', durationMonths: 1 });
  const [newKey, setNewKey] = useState({ label: '', level: 'read' });
  const [creating, setCreating] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copied, setCopied] = useState(null);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [editingKey, setEditingKey] = useState(null);
  const [vcStatus, setVcStatus] = useState(null);
  const [vcForm, setVcForm] = useState({ endpoint: '', apiKey: '' });
  const [vcSaving, setVcSaving] = useState(false);
  const [vcTesting, setVcTesting] = useState(false);
  const [vcMessage, setVcMessage] = useState(null);

  async function loadData() {
    try {
      const { data: keyData } = await base44.functions.invoke('ManageApiKey', { action: 'list' });
      setApiKeys(keyData?.keys || []);
      const { data: promoData } = await base44.functions.invoke('StripeCheckout', { path: 'list-promos' });
      setPromoCodes(promoData || []);
      const subs = await base44.entities.Subscription.list();
      setSubscriptions(subs);
      const { data: vcData } = await base44.functions.invoke('VisionCortexConnect', { action: 'status' });
      setVcStatus(vcData);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { loadData(); }, []);

  const handleCreateKey = async () => {
    if (!newKey.label) return;
    setCreatingKey(true);
    try {
      const { data } = await base44.functions.invoke('ManageApiKey', { action: 'generate', label: newKey.label, level: newKey.level });
      setGeneratedKey(data);
      setNewKey({ label: '', level: 'read' });
      setShowCreateKey(false);
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
    setCreatingKey(false);
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try { await base44.functions.invoke('ManageApiKey', { action: 'revoke', id }); loadData(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  const handleUpdateKey = async () => {
    if (!editingKey) return;
    try {
      await base44.functions.invoke('ManageApiKey', { action: 'update', id: editingKey.id, label: editingKey.label, level: editingKey.level });
      setEditingKey(null); loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleCreatePromo = async () => {
    if (!newPromo.code) return;
    setCreating(true);
    try {
      const { data } = await base44.functions.invoke('StripeCheckout', { path: 'create-promo', code: newPromo.code, percentOff: newPromo.percentOff, duration: newPromo.duration, durationMonths: newPromo.durationMonths });
      setPromoCodes([...promoCodes, data]);
      setNewPromo({ code: '', percentOff: 20, duration: 'repeating', durationMonths: 1 });
      setShowCreatePromo(false);
    } catch (err) { alert('Error: ' + err.message); }
    setCreating(false);
  };

  const handleTogglePromo = async (promoId, active) => {
    try { await base44.functions.invoke('StripeCheckout', { path: 'toggle-promo', promoId, active: !active }); loadData(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  const copyToClipboard = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };

  const handleVcSave = async () => {
    if (!vcForm.endpoint || !vcForm.apiKey) return;
    setVcSaving(true); setVcMessage(null);
    try {
      const { data } = await base44.functions.invoke('VisionCortexConnect', { action: 'save', endpoint: vcForm.endpoint, apiKey: vcForm.apiKey });
      setVcMessage({ type: data.connected ? 'success' : 'warn', text: data.detail || (data.connected ? 'Connected' : 'Saved but connection failed') });
      loadData();
    } catch (err) { setVcMessage({ type: 'error', text: err.message }); }
    setVcSaving(false);
  };

  const handleVcTest = async () => {
    if (!vcForm.endpoint || !vcForm.apiKey) return;
    setVcTesting(true); setVcMessage(null);
    try {
      const { data } = await base44.functions.invoke('VisionCortexConnect', { action: 'test', endpoint: vcForm.endpoint, apiKey: vcForm.apiKey });
      setVcMessage({ type: data.ok ? 'success' : 'error', text: data.detail });
    } catch (err) { setVcMessage({ type: 'error', text: err.message }); }
    setVcTesting(false);
  };

  const handleVcDisconnect = async () => {
    if (!confirm('Disconnect Vision Cortex?')) return;
    try { await base44.functions.invoke('VisionCortexConnect', { action: 'disconnect' }); setVcForm({ endpoint: '', apiKey: '' }); setVcMessage({ type: 'success', text: 'Disconnected' }); loadData(); }
    catch (err) { setVcMessage({ type: 'error', text: err.message }); }
  };

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const planCounts = activeSubs.reduce((acc, s) => { acc[s.plan] = (acc[s.plan] || 0) + 1; return acc; }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">System Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage API keys, promo codes, client subscriptions, and integrations.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'api', label: 'API Keys', icon: KeyRound },
          { id: 'promos', label: 'Promo Codes', icon: Tag },
          { id: 'clients', label: 'Clients', icon: Users },
          { id: 'vision', label: 'Vision Cortex', icon: Brain },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard icon={Users} label="Active Subs" value={activeSubs.length} color="text-emerald-500" />
            <StatCard icon={KeyRound} label="API Keys" value={apiKeys.filter(k => k.status === 'active').length} color="text-primary" />
            <StatCard icon={Tag} label="Promo Codes" value={promoCodes.filter(p => p.active).length} color="text-primary" />
            <StatCard icon={DollarSign} label="Total Clients" value={subscriptions.length} color="text-sky-500" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" /> System Health
            </h2>
            <div className="space-y-2">
              <HealthRow label="Stripe Payments" status="active" />
              <HealthRow label="Google Search Console" status="connected" />
              <HealthRow label="Google Analytics" status="connected" />
              <HealthRow label="Vision Cortex" status={vcStatus?.connected ? 'connected' : 'pending'} />
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      {tab === 'api' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold">API Keys</h2>
              <p className="text-xs text-muted-foreground">Generate keys for external integrations</p>
            </div>
            <Button onClick={() => setShowCreateKey(!showCreateKey)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Generate Key
            </Button>
          </div>

          {generatedKey && (
            <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-emerald-800">API Key Generated — Copy Now!</h3>
                  <p className="mb-2 text-xs text-emerald-700">This is the only time the full key will be shown.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-xs text-foreground border border-emerald-200 overflow-x-auto">{generatedKey.api_key}</code>
                    <Button size="sm" onClick={() => copyToClipboard(generatedKey.api_key, 'generated')} className="bg-emerald-600 text-white hover:bg-emerald-700">
                      {copied === 'generated' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setGeneratedKey(null)} className="mt-2 text-emerald-700">Dismiss</Button>
                </div>
              </div>
            </div>
          )}

          {showCreateKey && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Label</label>
                  <Input value={newKey.label} onChange={e => setNewKey({ ...newKey, label: e.target.value })} placeholder="Production Server" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Access Level</label>
                  <select value={newKey.level} onChange={e => setNewKey({ ...newKey, level: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                    <option value="read">Read Only</option>
                    <option value="write">Read + Write</option>
                    <option value="admin">Full Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={handleCreateKey} disabled={creatingKey || !newKey.label} className="bg-primary text-primary-foreground">
                  {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                </Button>
                <Button onClick={() => setShowCreateKey(false)} variant="ghost">Cancel</Button>
              </div>
            </div>
          )}

          {apiKeys.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <KeyRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No API keys yet. Generate one to allow external access.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className={`rounded-lg border bg-card px-4 py-3 ${key.status === 'revoked' ? 'border-red-200 opacity-60' : 'border-border'}`}>
                  {editingKey?.id === key.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editingKey.label} onChange={e => setEditingKey({ ...editingKey, label: e.target.value })} className="flex-1" />
                      <select value={editingKey.level} onChange={e => setEditingKey({ ...editingKey, level: e.target.value })} className="rounded border border-input bg-background px-2 py-2 text-sm">
                        <option value="read">Read</option><option value="write">Write</option><option value="admin">Admin</option>
                      </select>
                      <Button size="sm" onClick={handleUpdateKey} className="bg-primary text-primary-foreground">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{key.label}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${LEVEL_COLORS[key.level] || LEVEL_COLORS.read}`}>{LEVEL_LABELS[key.level] || key.level}</span>
                          <span className={`h-2 w-2 rounded-full ${key.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        </div>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">{key.key_prefix}••••••••</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {key.status === 'active' && (
                          <>
                            <button onClick={() => setEditingKey(key)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => handleRevokeKey(key.id)} className="rounded p-1.5 text-red-400 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promo Codes */}
      {tab === 'promos' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold">Promo Codes</h2>
              <p className="text-xs text-muted-foreground">Create and manage discount codes</p>
            </div>
            <Button onClick={() => setShowCreatePromo(!showCreatePromo)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Create Promo
            </Button>
          </div>

          {showCreatePromo && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Code</label>
                  <Input value={newPromo.code} onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Percent Off</label>
                  <Input type="number" value={newPromo.percentOff} onChange={e => setNewPromo({ ...newPromo, percentOff: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Duration</label>
                  <select value={newPromo.duration} onChange={e => setNewPromo({ ...newPromo, duration: e.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
                    <option value="once">Once</option><option value="repeating">Repeating (N months)</option><option value="forever">Forever</option>
                  </select>
                </div>
                {newPromo.duration === 'repeating' && (
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Months</label>
                    <Input type="number" value={newPromo.durationMonths} onChange={e => setNewPromo({ ...newPromo, durationMonths: Number(e.target.value) })} />
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={handleCreatePromo} disabled={creating || !newPromo.code} className="bg-primary text-primary-foreground">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
                <Button onClick={() => setShowCreatePromo(false)} variant="ghost">Cancel</Button>
              </div>
            </div>
          )}

          {promoCodes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No promo codes yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {promoCodes.map(p => (
                <div key={p.id} className={`flex items-center justify-between rounded-lg border bg-card px-4 py-3 ${p.active ? 'border-border' : 'border-red-200 opacity-60'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{p.code}</span>
                      <span className={`h-2 w-2 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.percentOff}% off · {p.duration} · {p.timesRedeemed || 0} redeemed</p>
                  </div>
                  <button onClick={() => handleTogglePromo(p.id, p.active)} className="rounded p-1.5 text-muted-foreground hover:bg-muted"><Power className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clients */}
      {tab === 'clients' && (
        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold">Client Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscriptions.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s.customer_email || 'Unknown'}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium capitalize ${s.status === 'active' ? 'bg-emerald-50 text-emerald-600' : s.status === 'past_due' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{s.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground"><span className="capitalize">{s.plan}</span> plan · {s.url_limit >= 9999 ? 'Unlimited' : s.url_limit} URLs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Renews</p>
                    <p className="text-sm font-medium">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vision Cortex */}
      {tab === 'vision' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-lg font-semibold">Vision Cortex Connection</h2>
                <p className="text-sm text-muted-foreground">Connect your Vision Cortex brain to manage and sync this system.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${vcStatus?.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-xs font-medium text-muted-foreground">{vcStatus?.connected ? 'Connected' : 'Not connected'}</span>
              </div>
            </div>

            {vcMessage && (
              <div className={`mb-4 rounded-lg border p-3 text-sm ${vcMessage.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : vcMessage.type === 'warn' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
                {vcMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">API Endpoint</label>
                <Input value={vcForm.endpoint} onChange={e => setVcForm({ ...vcForm, endpoint: e.target.value })} placeholder="https://vision-cortex.base44.app/functions/api" className="font-mono text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">API Key</label>
                <Input type="password" value={vcForm.apiKey} onChange={e => setVcForm({ ...vcForm, apiKey: e.target.value })} placeholder="xsk_••••••••" className="font-mono text-sm" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleVcSave} disabled={vcSaving || !vcForm.endpoint || !vcForm.apiKey} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {vcSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                  {vcStatus?.connected ? 'Update' : 'Connect'}
                </Button>
                <Button onClick={handleVcTest} disabled={vcTesting || !vcForm.endpoint || !vcForm.apiKey} variant="outline">
                  {vcTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Test'}
                </Button>
                {vcStatus?.connected && (
                  <Button onClick={handleVcDisconnect} variant="ghost" className="text-red-500 hover:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" /> Disconnect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPortal;