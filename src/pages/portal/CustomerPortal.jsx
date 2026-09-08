import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Target, Bot, Zap, ArrowRight, Globe, CheckCircle2, Activity, Award, AlertCircle, Loader2, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [urls, setUrls] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);
  const [scoreSnapshots, setScoreSnapshots] = useState([]);
  const [fixAttempts, setFixAttempts] = useState([]);
  const [auditScore, setAuditScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: u } = await base44.auth.me();
        setUser(u);
        const subs = await base44.entities.Subscription.filter({ user_id: u.id });
        if (subs.length > 0) setSubscription(subs[0]);
        const profiles = await base44.entities.OnboardingProfile.filter({ user_id: u.id });
        if (profiles.length > 0) setOnboarding(profiles[0]);
        const clientId = profiles[0]?.client_id || u.id;
        const targets = await base44.entities.UrlTarget.filter({ client_id: clientId });
        setUrls(targets);
        const rows = await base44.entities.AreSheetRow.filter({ client_id: clientId }, '-updated_date', 200).catch(() => []);
        setSheetRows(rows);
        const snapshots = await base44.entities.UrlScoreSnapshot.filter({ client_id: clientId }, '-captured_at', 100).catch(() => []);
        setScoreSnapshots(snapshots);
        const fixes = await base44.entities.FixAttempt.list('-created_at', 50).catch(() => []);
        setFixAttempts(fixes);
        // Get audit score from DeliveryGuarantee
        try {
          const { data: audit } = await base44.functions.invoke('DeliveryGuarantee', {});
          if (audit?.ok) setAuditScore(audit.delivery_score);
        } catch {}
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" /></div>;
  }

  // Redirect to onboarding if not completed
  if (!onboarding || onboarding.status !== 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md text-center">
          <img src={LOGO_URL} alt="Xtreme SEO" className="mx-auto mb-6 h-16 w-auto" />
          <h1 className="mb-3 font-heading text-2xl font-bold text-foreground">Complete Your Onboarding</h1>
          <p className="mb-6 text-sm text-muted-foreground">Let's set up your autonomous SEO system. It only takes a few minutes.</p>
          <Button onClick={() => navigate('/portal/onboarding')} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">
            Start Onboarding <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalUrls = urls.length;
  const top5 = sheetRows.filter(r => (r.avg_position || 999) <= 5).length;
  const top10 = sheetRows.filter(r => (r.avg_position || 999) <= 10).length;
  const top30 = sheetRows.filter(r => (r.avg_position || 999) <= 30).length;
  const avgPosition = sheetRows.length > 0
    ? Math.round(sheetRows.reduce((sum, r) => sum + (r.avg_position || 0), 0) / sheetRows.filter(r => r.avg_position).length * 10) / 10
    : null;
  const totalClicks = sheetRows.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalImpressions = sheetRows.reduce((sum, r) => sum + (r.impressions || 0), 0);
  const convergencePct = totalUrls > 0 ? Math.round((top5 / totalUrls) * 100) : 0;

  // Build ranking chart data from score snapshots
  const chartData = scoreSnapshots
    .slice(0, 30)
    .reverse()
    .map(s => ({
      date: s.captured_at ? new Date(s.captured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      score: s.score || 0,
      position: s.avg_position || null,
    }));

  // Active tasks from sheet rows
  const activeTasks = sheetRows
    .filter(r => r.status === 'open' || r.status === 'queued' || r.status === 'deployed')
    .slice(0, 10);

  const taskStatusColor = {
    open: 'bg-blue-50 text-blue-600',
    queued: 'bg-amber-50 text-amber-600',
    deployed: 'bg-purple-50 text-purple-600',
    validated: 'bg-emerald-50 text-emerald-600',
    blocked: 'bg-red-50 text-red-600',
    goal_met: 'bg-emerald-100 text-emerald-700',
    rolled_back: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Portal Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
            <span className="hidden font-heading text-sm font-bold sm:block">PORTAL</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/portal/urls" className="text-sm text-muted-foreground hover:text-[#B8860B]">My URLs</Link>
            <Link to="/portal/agents" className="text-sm text-muted-foreground hover:text-[#B8860B]">Agents</Link>
            <Link to="/portal/settings" className="text-sm text-muted-foreground hover:text-[#B8860B]">Settings</Link>
            <Button onClick={() => base44.auth.logout()} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Welcome back, {user?.full_name || 'there'}</h1>
          <p className="mt-1 text-muted-foreground">Your autonomous SEO system is running 24/7 for {onboarding?.company_name || 'your business'}.</p>
        </div>

        {/* Audit Score Banner */}
        {auditScore !== null && (
          <div className="mb-8 flex items-center gap-4 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/[0.05] p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD700]/10">
              <Award className="h-8 w-8 text-[#B8860B]" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-semibold">System Audit Score</h2>
              <p className="text-sm text-muted-foreground">Delivery guarantee compliance — measured against every promised capability</p>
            </div>
            <div className="text-right">
              <div className={`font-heading text-3xl font-bold ${auditScore >= 80 ? 'text-emerald-600' : auditScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{auditScore}%</div>
              <p className="text-xs text-muted-foreground">{auditScore >= 80 ? 'Excellent' : auditScore >= 50 ? 'Building Up' : 'Initializing'}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'URLs Tracked', value: totalUrls, icon: Target, color: 'text-[#B8860B]' },
            { label: 'Top 5 Rankings', value: top5, icon: Award, color: 'text-emerald-600' },
            { label: 'Page 1 (Top 10)', value: top10, icon: TrendingUp, color: 'text-sky-600' },
            { label: 'Avg Position', value: avgPosition || '—', icon: Activity, color: 'text-[#B8860B]' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="font-heading text-2xl font-bold">{s.value}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Top 30', value: top30 },
            { label: 'Convergence', value: `${convergencePct}%` },
            { label: 'Clicks (28d)', value: totalClicks.toLocaleString() },
            { label: 'Impressions', value: totalImpressions.toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-white p-3 text-center">
              <div className="font-heading text-xl font-bold text-foreground">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ranking Progress Chart */}
        <div className="mb-8 rounded-xl border border-border bg-slate-50/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold">Ranking Progress Over Time</h2>
              <p className="text-xs text-muted-foreground">Score progression (0-100 = progress toward top 3)</p>
            </div>
            <Activity className="h-5 w-5 text-[#B8860B]" />
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[#FFD700]/50" />
                Collecting ranking data... Check back after the next heartbeat cycle.
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#FFD700" strokeWidth={2} dot={{ fill: '#FFD700', r: 3 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Two-column: URLs + Active Tasks */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* URLs */}
          <div className="rounded-xl border border-border bg-slate-50/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Your Domains</h2>
              <Link to="/portal/urls">
                <Button size="sm" variant="ghost" className="text-[#B8860B] hover:bg-[#FFD700]/10">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
              </Link>
            </div>
            {urls.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No URLs tracked yet.</p>
            ) : (
              <div className="space-y-2">
                {urls.slice(0, 6).map((url) => {
                  const row = sheetRows.find(r => r.url === url.url);
                  const pos = row?.avg_position;
                  return (
                    <div key={url.id} className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-4 w-4 shrink-0 text-[#B8860B]/60" />
                        <span className="truncate text-sm">{url.url}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pos && <span className="font-mono text-xs text-muted-foreground">#{pos}</span>}
                        <span className="rounded-full bg-[#FFD700]/10 px-2 py-0.5 text-[10px] font-medium text-[#B8860B]">{(url.url_state || 'new').replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Optimization Tasks */}
          <div className="rounded-xl border border-border bg-slate-50/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Active Optimization Tasks</h2>
              <Clock className="h-5 w-5 text-[#B8860B]" />
            </div>
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm text-muted-foreground">All tasks complete. System is monitoring for new opportunities.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between rounded-lg border border-border bg-white px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium text-foreground">{task.url}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.gap_type || 'SEO'} gap · {task.recommended_treatment || 'Optimizing...'}
                      </p>
                    </div>
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${taskStatusColor[task.status] || 'bg-gray-100 text-gray-600'}`}>
                      {task.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agent Activity */}
        <div className="rounded-xl border border-border bg-slate-50/50 p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Recent Agent Activity</h2>
          {fixAttempts.length === 0 ? (
            <div className="py-6 text-center">
              <Bot className="mx-auto mb-2 h-8 w-8 text-[#B8860B]/40" />
              <p className="text-sm text-muted-foreground">Agents are initializing. Activity will appear here after the first heartbeat cycle.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fixAttempts.slice(0, 5).map((f, i) => (
                <div key={f.id || i} className="flex items-start gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  {f.status === 'validated' || f.status === 'applied' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : f.status === 'failed' ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  ) : (
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#B8860B]">{f.approach || 'Healer'}</span>
                      <span className="text-xs text-muted-foreground/50">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.diagnosis || f.treatment || `Fixing ${f.url}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerPortal;