import React, { useEffect, useState } from 'react';
import { Globe, Plus, Loader2, Trash2, ChevronDown, ChevronRight, Server } from 'lucide-react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import Loading from '@/components/kit/Loading';
import EmptyState from '@/components/kit/EmptyState';
import { base44 } from '@/api/base44Client';

export default function VercelDomains() {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [project, setProject] = useState('');

  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [dnsCache, setDnsCache] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    base44.functions.invoke('VercelDomains', { action: 'list_projects' })
      .then((res) => { setProjects(res.data.projects || []); if (res.data.projects?.[0]) setProject(res.data.projects[0].id); })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  async function loadDomains() {
    if (!project) return;
    setLoadingDomains(true);
    try {
      const res = await base44.functions.invoke('VercelDomains', { action: 'list_domains', project_id: project });
      setDomains(res.data.domains || []);
    } catch (e) { setDomains([]); }
    finally { setLoadingDomains(false); }
  }

  useEffect(() => { if (project) loadDomains(); }, [project]);

  async function addDomain() {
    if (!newDomain || !project) return;
    setAdding(true); setMsg(null);
    try {
      const res = await base44.functions.invoke('VercelDomains', { action: 'add_domain', project_id: project, name: newDomain });
      if (res.data.error) { setMsg({ error: res.data.error }); }
      else { setMsg({ ok: `${newDomain} attached to project — configure DNS below` }); setNewDomain(''); loadDomains(); }
    } catch (e) { setMsg({ error: e.message }); }
    finally { setAdding(false); }
  }

  async function removeDomain(name) {
    if (!confirm(`Remove ${name} from the project?`)) return;
    try {
      await base44.functions.invoke('VercelDomains', { action: 'remove_domain', project_id: project, name });
      loadDomains();
    } catch (e) { setMsg({ error: e.message }); }
  }

  async function toggleDomain(name) {
    setExpanded((s) => ({ ...s, [name]: !s[name] }));
    if (!dnsCache[name]) {
      const res = await base44.functions.invoke('VercelDomains', { action: 'get_domain', project_id: project, name });
      setDnsCache((c) => ({ ...c, [name]: res.data.domain }));
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Vercel" title="Domain manager"
        description="Attach domains you own to a Vercel project, view the DNS / verification records to point them at your deployment, and remove them. Vercel doesn't sell domains — purchase yours from a registrar (Namecheap, Porkbun, GoDaddy, Squarespace), then attach it here to deploy." />

      <Panel title="Vercel project" subtitle="From your Vercel account (API token)">
        {loadingProjects ? <Loading label="Loading projects" /> : projects.length === 0 ? <EmptyState icon={Server} title="No projects found" description="Set VERCEL_API_TOKEN in Settings → Secrets and ensure a project exists." /> : (
          <select value={project} onChange={(e) => setProject(e.target.value)} className="w-full rounded border border-input bg-background px-3 py-2 text-sm">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </Panel>

      {msg && <div className={`mt-4 rounded border px-4 py-2.5 text-xs ${msg.error ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-primary/40 bg-primary/10 text-foreground'}`}>{msg.error || msg.ok}</div>}

      <Panel title="Domains on project" subtitle={`${domains.length} attached`} className="mt-6"
        right={
          <div className="flex gap-1.5">
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="yourdomain.com" className="w-40 rounded border border-input bg-background px-2 py-1 text-xs" />
            <button onClick={addDomain} disabled={adding || !newDomain} className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}Add
            </button>
          </div>
        }>
        {loadingDomains ? <Loading label="Loading domains" /> : domains.length === 0 ? <EmptyState icon={Globe} title="No domains attached" description="Add a domain above to attach it to this Vercel project." /> : (
          <ul className="space-y-2">
            {domains.map((d) => (
              <li key={d.name} className="rounded border border-border/70">
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <button onClick={() => toggleDomain(d.name)} className="flex min-w-0 items-center gap-2 text-left">
                    {expanded[d.name] ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <span className="truncate text-sm text-foreground">{d.name}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill tone={d.verified ? 'good' : 'warn'}>{d.verified ? 'verified' : 'pending verification'}</StatusPill>
                    <button onClick={() => removeDomain(d.name)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {expanded[d.name] && dnsCache[d.name] && (
                  <div className="border-t border-border/60 px-3 py-3 text-xs">
                    <DnsBlock label="Verification" records={dnsCache[d.name].verification ? [dnsCache[d.name].verification] : []} />
                    <DnsBlock label="A records (point to Vercel)" records={(dnsCache[d.name].record || dnsCache[d.name].config?.dnsRecords || []).filter((r) => !r.type || r.type === 'A' || r.type === 'CNAME')} />
                    <p className="mt-2 text-muted-foreground">Add these records at your domain's DNS provider, then Vercel verifies automatically and issues an SSL certificate.</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function DnsBlock({ label, records }) {
  if (!records || records.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 space-y-0.5">
        {records.map((r, i) => (
          <div key={i} className="font-mono text-[11px] text-foreground/90">
            {r.type ? `${r.type}  ` : ''}{r.name || r.value || JSON.stringify(r)}
          </div>
        ))}
      </div>
    </div>
  );
}