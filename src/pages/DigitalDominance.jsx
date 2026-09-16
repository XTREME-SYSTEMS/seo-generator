import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Rocket, Globe, Shield, CheckCircle2, XCircle, Search, Zap, Target, TrendingUp, Building2, Star, ExternalLink, Crown, Layers, AlertCircle } from 'lucide-react';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/lib/dominanceCategories';

const STORAGE_KEY = 'digital_dominance_profile';

const DEFAULT_PROFILE = {
  name: '', url: '', description: '', phone: '', email: '',
  address: '', city: '', state: '', zip: '', category: '',
  services: '', hours: '', logo_url: '',
};

export default function DigitalDominance() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [selectedCategories, setSelectedCategories] = useState(ALL_CATEGORIES);
  const [phase, setPhase] = useState('form');
  const [jobId, setJobId] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [targets, setTargets] = useState([]);
  const [error, setError] = useState('');
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setProfile(JSON.parse(saved)); } catch {} }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await base44.functions.invoke('DigitalDominanceGenerator', { action: 'status', job_id: jobId });
      setJobStatus(res.data || res);
      const allTargets = await base44.entities.SubmissionTarget.list('-created_date', 200);
      setTargets(allTargets);
    } catch (e) { console.error(e); }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [jobId, pollStatus]);

  function saveProfile() { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); }

  function toggleCategory(cat) {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }

  async function launchDominance() {
    if (!profile.name || !profile.url) { setError('Business name and website URL are required'); return; }
    saveProfile();
    setDiscovering(true);
    setError('');
    setProgressMsg('Discovering submission targets across the internet...');
    try {
      const res = await base44.functions.invoke('DigitalDominanceGenerator', {
        action: 'discover',
        business_profile: profile,
        categories: selectedCategories,
      });
      const data = res.data || res;
      setJobId(data.job_id);
      setProgressMsg(`Found ${data.total_targets} targets. Starting automated submissions...`);
      setPhase('dashboard');
      setSubmitting(true);
      await submitNextBatch(data.job_id);
    } catch (e) { setError(e.message); }
    finally { setDiscovering(false); }
  }

  async function submitNextBatch(id) {
    setSubmitting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('DigitalDominanceGenerator', {
        action: 'submit', job_id: id || jobId, batch_size: 5,
      });
      const data = res.data || res;
      setProgressMsg(`Batch: ${data.submitted_this_batch} submitted, ${data.failed_this_batch} failed. Total: ${data.total_submitted}/${data.total_targets}`);
      await pollStatus();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  const job = jobStatus?.job;
  const byCategory = jobStatus?.by_category || {};
  const remaining = job?.remaining || 0;
  const allDone = job && remaining === 0;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
          <Crown className="w-6 h-6 text-gray-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Digital Dominance Generator</h1>
          <p className="text-sm text-muted-foreground">Enter your info once — flood every directory, review site, and platform across the internet</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {phase === 'form' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-yellow-500" /> Business Profile
              </h2>
              <p className="text-xs text-muted-foreground mb-4">Fill this out once. We'll use it for every submission across every platform.</p>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Business Name *" value={profile.name} onChange={v => setProfile({ ...profile, name: v })} placeholder="Acme Plumbing" />
                <Field label="Website URL *" value={profile.url} onChange={v => setProfile({ ...profile, url: v })} placeholder="https://acmeplumbing.com" />
                <Field label="Phone" value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} placeholder="555-123-4567" />
                <Field label="Email" value={profile.email} onChange={v => setProfile({ ...profile, email: v })} placeholder="info@acme.com" />
                <Field label="Category / Industry" value={profile.category} onChange={v => setProfile({ ...profile, category: v })} placeholder="Plumbing" />
                <Field label="Logo URL" value={profile.logo_url} onChange={v => setProfile({ ...profile, logo_url: v })} placeholder="https://..." />
                <Field label="Address" value={profile.address} onChange={v => setProfile({ ...profile, address: v })} placeholder="123 Main St" />
                <div className="grid grid-cols-3 gap-2">
                  <Field label="City" value={profile.city} onChange={v => setProfile({ ...profile, city: v })} placeholder="Anytown" />
                  <Field label="State" value={profile.state} onChange={v => setProfile({ ...profile, state: v })} placeholder="CA" />
                  <Field label="Zip" value={profile.zip} onChange={v => setProfile({ ...profile, zip: v })} placeholder="90210" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <textarea value={profile.description} onChange={e => setProfile({ ...profile, description: e.target.value })} placeholder="Professional plumbing services..." rows={3} className="w-full input" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Services (comma-separated)</label>
                  <textarea value={profile.services} onChange={e => setProfile({ ...profile, services: e.target.value })} placeholder="Plumbing repair, water heater installation, drain cleaning" rows={2} className="w-full input" />
                </div>
                <Field label="Business Hours" value={profile.hours} onChange={v => setProfile({ ...profile, hours: v })} placeholder="Mon-Fri 8am-6pm" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-yellow-500" /> Target Categories
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Select which types of platforms to submit to.</p>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${selectedCategories.includes(cat) ? 'bg-yellow-400 text-gray-900 border-yellow-400' : 'bg-card text-muted-foreground border-border hover:border-yellow-400'}`}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-5 text-gray-900">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Rocket className="w-5 h-5" /> Launch Digital Dominance</h2>
              <p className="text-sm mb-4 text-gray-800">Discovers every submission target across the internet and uses your CloudBrowser swarm to automatically submit your business info to each one.</p>
              <button onClick={launchDominance} disabled={discovering || !profile.name || !profile.url}
                className="w-full bg-gray-900 text-yellow-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {discovering ? <><Loader2 className="w-5 h-5 animate-spin" /> Discovering...</> : <><Zap className="w-5 h-5" /> Launch Dominance</>}
              </button>
              {progressMsg && <p className="text-xs text-gray-700 mt-3">{progressMsg}</p>}
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold text-foreground mb-2">How it works</h3>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><span className="font-bold text-yellow-500">1.</span> Fill out your business profile once</li>
                <li className="flex gap-2"><span className="font-bold text-yellow-500">2.</span> We discover 80+ submission targets</li>
                <li className="flex gap-2"><span className="font-bold text-yellow-500">3.</span> LLM finds niche-specific directories</li>
                <li className="flex gap-2"><span className="font-bold text-yellow-500">4.</span> CloudBrowser fills forms + submits</li>
                <li className="flex gap-2"><span className="font-bold text-yellow-500">5.</span> Track progress in real-time</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Total Targets" value={job?.total_targets || 0} icon={Target} color="text-blue-600" />
            <StatCard label="Submitted" value={job?.submitted || 0} icon={CheckCircle2} color="text-green-600" />
            <StatCard label="Failed" value={job?.failed || 0} icon={XCircle} color="text-red-600" />
            <StatCard label="Remaining" value={remaining} icon={Loader2} color="text-yellow-600" />
            <StatCard label="Status" value={job?.status || 'queued'} icon={Zap} color="text-purple-600" />
          </div>

          {job && job.total_targets > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(((job.submitted + job.failed) / job.total_targets) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(job.submitted / job.total_targets) * 100}%` }} />
                <div className="h-full bg-red-400 transition-all" style={{ width: `${(job.failed / job.total_targets) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {progressMsg && <span className="text-sm text-muted-foreground flex-1">{progressMsg}</span>}
            {!allDone && (
              <button onClick={() => submitNextBatch()} disabled={submitting}
                className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-gray-900 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Rocket className="w-4 h-4" /> Submit Next Batch</>}
              </button>
            )}
            {allDone && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4" /> All targets processed!</div>}
            <button onClick={() => { setPhase('form'); setJobId(null); setJobStatus(null); }} className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">← Back to Profile</button>
          </div>

          {Object.keys(byCategory).length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">By Category</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(byCategory).map(([cat, s]) => (
                  <div key={cat} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="text-xs text-muted-foreground">{s.total}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-green-600">{s.submitted} done</span>
                      <span className="text-red-600">{s.failed} fail</span>
                      <span className="text-yellow-600">{s.identified} pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Submission Targets</h3>
              <span className="text-xs text-muted-foreground ml-auto">{targets.length} total</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {targets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No targets yet. Launch dominance to discover them.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Site</th>
                      <th className="px-4 py-2 font-medium">Category</th>
                      <th className="px-4 py-2 font-medium">DA</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map(t => (
                      <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-2">
                          <div className="font-medium text-foreground">{t.site_name}</div>
                          <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> {t.url?.slice(0, 40)}...
                          </a>
                        </td>
                        <td className="px-4 py-2 text-xs">{CATEGORY_LABELS[t.category] || t.category}</td>
                        <td className="px-4 py-2 text-xs">{t.domain_authority || '-'}</td>
                        <td className="px-4 py-2"><StatusBadge status={t.submission_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full input" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    identified: 'bg-yellow-100 text-yellow-700', submitted: 'bg-blue-100 text-blue-700',
    verified: 'bg-green-100 text-green-700', listed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700', rejected: 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>{status || 'identified'}</span>;
}