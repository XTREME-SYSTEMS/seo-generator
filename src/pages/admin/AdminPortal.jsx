import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Tag, Brain, Users, Plus, Trash2, Copy, Loader2, CheckCircle2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function AdminPortal() {
  const [tab, setTab] = useState('overview');
  const [apiKeys, setApiKeys] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', percentOff: 20, duration: 'repeating', durationMonths: 1 });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const keys = await base44.entities.ApiKey.list();
        setApiKeys(keys);
        const { data } = await base44.functions.invoke('StripeCheckout', { path: 'list-promos' });
        setPromoCodes(data || []);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  const handleCreatePromo = async () => {
    if (!newPromo.code) return;
    setCreating(true);
    try {
      const { data } = await base44.functions.invoke('StripeCheckout', {
        path: 'create-promo',
        code: newPromo.code,
        percentOff: newPromo.percentOff,
        duration: newPromo.duration,
        durationMonths: newPromo.durationMonths,
      });
      setPromoCodes([...promoCodes, data]);
      setNewPromo({ code: '', percentOff: 20, duration: 'repeating', durationMonths: 1 });
      setShowCreatePromo(false);
    } catch (err) { alert('Error: ' + err.message); }
    setCreating(false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src={LOGO_URL} alt="Xtreme SEO" className="h-10 w-auto" />
          <div>
            <h1 className="font-heading text-2xl font-bold">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Manage your Xtreme SEO Optimizer system</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {[
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'api', label: 'API Keys', icon: KeyRound },
          { id: 'promos', label: 'Promo Codes', icon: Tag },
          { id: 'vision', label: 'Vision Cortex', icon: Brain },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Users', value: '—', icon: Users },
            { label: 'Active Subscriptions', value: '—', icon: CheckCircle2 },
            { label: 'API Keys', value: apiKeys.length, icon: KeyRound },
            { label: 'Promo Codes', value: promoCodes.length, icon: Tag },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="font-heading text-2xl font-bold">{s.value}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* API Keys */}
      {tab === 'api' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">API Keys</h2>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Generate Key</Button>
          </div>
          {apiKeys.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <KeyRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No API keys yet. Generate one to allow external access.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{key.label}</span>
                      <span className={`h-2 w-2 rounded-full ${key.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{key.key_prefix}••••••••</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyToClipboard(key.key_prefix, key.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                      {copied === key.id ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button className="rounded p-1.5 text-red-400 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
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
            <h2 className="font-heading text-lg font-semibold">Promo Codes</h2>
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
                    <option value="once">Once</option>
                    <option value="repeating">Repeating</option>
                    <option value="forever">Forever</option>
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
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No promo codes yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {promoCodes.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{p.code}</span>
                      <span className={`h-2 w-2 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.percentOff}% off · {p.duration} · {p.timesRedeemed || 0} redeemed
                    </p>
                  </div>
                  <button onClick={() => copyToClipboard(p.code, p.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                    {copied === p.id ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vision Cortex */}
      {tab === 'vision' && (
        <div className="max-w-2xl">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold">Vision Cortex Brain Connection</h2>
                <p className="text-sm text-muted-foreground">Connect your Vision Cortex brain to manage, operate, fix, heal, and sync this system.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Vision Cortex API Endpoint</label>
                <Input placeholder="https://vision-cortex.base44.app/functions/api" className="font-mono text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">API Key</label>
                <Input type="password" placeholder="••••••••••••" className="font-mono text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Power className="mr-2 h-4 w-4" /> Connect Vision Cortex
                </Button>
                <span className="text-xs text-muted-foreground">Status: Not connected</span>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-2 text-sm font-semibold">What Vision Cortex Does</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Full autonomous orchestration of all SEO agents</li>
                <li>• Auto-fixes and auto-heals system failures</li>
                <li>• Discovers new ranking methods and evolves the system</li>
                <li>• Manages all URLs, agents, and workflows</li>
                <li>• Full sync with the Vision Cortex brain site</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPortal;