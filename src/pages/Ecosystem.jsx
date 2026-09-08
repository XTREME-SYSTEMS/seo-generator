import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import { KeyRound, Loader2, Copy, Check, Trash2 } from 'lucide-react';

const ALL_SCOPES = ['read', 'fix', 'sync', 'audit', 'generate', 'deploy', 'monitor'];

const ENDPOINTS = [
  { action: 'list_capabilities', method: 'POST', desc: 'List every capability + status', scope: 'read' },
  { action: 'list_urls', method: 'POST', desc: 'List all URLs with scores + gaps', scope: 'read' },
  { action: 'get_url_gaps', method: 'POST', desc: 'Get asymmetries + fix attempts for a URL', scope: 'read', params: 'url' },
  { action: 'fix_url', method: 'POST', desc: 'Trigger AI fix engine (retry-until-resolved)', scope: 'fix', params: 'url, gap_id?' },
  { action: 'sync', method: 'POST', desc: 'Sync Google Search Console metrics', scope: 'sync' },
  { action: 'run_audit', method: 'POST', desc: 'Full site audit (content + structure)', scope: 'audit', params: 'url, depth?' },
  { action: 'run_technical_audit', method: 'POST', desc: 'Technical SEO audit (speed, schema, crawl)', scope: 'audit', params: 'url' },
  { action: 'generate_content', method: 'POST', desc: 'Generate SEO-optimized content for a URL', scope: 'generate', params: 'url, topic, keywords[]' },
  { action: 'generate_sitemap', method: 'POST', desc: 'Generate XML sitemap for a domain', scope: 'generate', params: 'domain' },
  { action: 'generate_copy', method: 'POST', desc: 'Generate title/meta copy variants', scope: 'generate', params: 'url, keyword' },
  { action: 'index_now', method: 'POST', desc: 'Ping IndexNow to force re-crawl', scope: 'deploy', params: 'urls[]' },
  { action: 'deploy_url', method: 'POST', desc: 'Deploy a specific treatment to a URL', scope: 'deploy', params: 'url, gap_id, treatment' },
  { action: 'get_rankings', method: 'POST', desc: 'Get SERP ranking measurements for a URL', scope: 'monitor', params: 'url' },
  { action: 'get_score_history', method: 'POST', desc: 'Get score progression snapshots for a URL', scope: 'monitor', params: 'url' },
  { action: 'detect_anomalies', method: 'POST', desc: 'Run anomaly detection on traffic/rankings', scope: 'monitor', params: 'url?, client_id?' },
];

export default function Ecosystem() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [scopes, setScopes] = useState(['read', 'fix', 'sync']); // default: core 3
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('EcosystemApi', { action: 'list_keys' });
      setKeys(res.keys || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadKeys(); }, []);

  async function createKey() {
    setCreating(true);
    try {
      const res = await base44.functions.invoke('EcosystemApi', { action: 'create_key', label: label || 'Ecosystem Key', scopes });
      setNewKey(res);
      setLabel('');
      await loadKeys();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id) {
    try {
      await base44.functions.invoke('EcosystemApi', { action: 'revoke_key', key_id: id });
      await loadKeys();
    } catch (e) { console.error(e); }
  }

  function copyKey() {
    navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ecosystem API"
        title="Share This System With Other Systems"
        description="Generate API keys to expose the SEO Generator's capabilities, URL data, gap analysis, and fix engine to external platforms, agencies, or white-label integrations."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="API Keys" subtitle={`${keys.length} active`}>
          {loading ? <Loading /> : (
            <div className="space-y-3">
              {newKey && (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-700 dark:bg-emerald-950/40">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Key created — copy now (shown once)</div>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-xs">{newKey.key}</code>
                    <button onClick={copyKey} className="rounded border border-border p-1.5 hover:bg-accent">
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                <input className="input" placeholder="Key label (e.g. Agency Portal)" value={label} onChange={(e) => setLabel(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {ALL_SCOPES.map((sc) => (
                    <label key={sc} className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={scopes.includes(sc)} onChange={(e) => setScopes(e.target.checked ? [...scopes, sc] : scopes.filter((s) => s !== sc))} />
                      {sc}
                    </label>
                  ))}
                </div>
                <button onClick={createKey} disabled={creating} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                  Generate API Key
                </button>
              </div>

              <div className="divide-y divide-border">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-xs font-medium text-foreground">{k.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{k.key_prefix}... · {(k.scopes || []).join(', ')}</div>
                    </div>
                    <button onClick={() => revoke(k.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="API Endpoints" subtitle="POST to /functions/EcosystemApi">
          <div className="space-y-3">
            {Object.entries(
              ENDPOINTS.reduce((acc, e) => {
                (acc[e.scope] = acc[e.scope] || []).push(e);
                return acc;
              }, {})
            ).map(([scope, eps]) => (
              <div key={scope}>
                <div className="mb-1.5 flex items-center gap-2">
                  <StatusPill tone={scope === 'read' ? 'idle' : scope === 'fix' ? 'warn' : scope === 'sync' ? 'info' : scope === 'audit' ? 'sim' : scope === 'generate' ? 'good' : scope === 'deploy' ? 'bad' : 'idle'}>{scope}</StatusPill>
                  <span className="text-[10px] text-muted-foreground">{eps.length} endpoint{eps.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5">
                  {eps.map((e) => (
                    <div key={e.action} className="rounded-md border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">{e.method}</code>
                        <span className="font-mono text-xs font-medium text-foreground">{e.action}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
                      {e.params && <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">params: {e.params}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-muted/40 p-3">
            <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
              curl -X POST https://seo-generator.base44.app/functions/EcosystemApi \<br />
              &nbsp;&nbsp;-H "x-api-key: sk_..." -H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-d '{"{"} "action": "list_urls" {"}"}'
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}