import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Target, ArrowRight, Globe, CheckCircle2, Activity, Clock, Bot, Zap, Settings, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

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

function QuickAction({ to, icon: Icon, label, desc, accent }) {
  return (
    <Link to={to} className={`group rounded-xl border p-5 transition-colors ${accent ? 'border-primary/30 bg-primary/5 hover:border-primary/50' : 'border-border bg-card hover:border-primary/30'}`}>
      <Icon className={`mb-2 h-6 w-6 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
      <h3 className="mb-1 font-medium text-foreground">{label}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
      <span className="mt-2 flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
        Open <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [urls, setUrls] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);
  const [fixAttempts, setFixAttempts] = useState([]);
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
        const fixes = await base44.entities.FixAttempt.list('-created_at', 5).catch(() => []);
        setFixAttempts(fixes);
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" /></div>;
  }

  const onboardingComplete = onboarding?.status === 'completed';

  // Onboarding not complete — show progressive setup screen
  if (!onboardingComplete) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
              <span className="hidden font-heading text-sm font-bold sm:block">PORTAL</span>
            </div>
            <Button onClick={() => base44.auth.logout()} variant="ghost" size="sm" className="text-muted-foreground">Sign Out</Button>
          </div>
        </nav>
        <div className="flex min-h-[80vh] items-center justify-center p-6">
          <div className="max-w-md text-center">
            <img src={LOGO_URL} alt="Xtreme SEO" className="mx-auto mb-6 h-16 w-auto" />
            <h1 className="mb-3 font-heading text-2xl font-bold text-foreground">Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋</h1>
            <p className="mb-6 text-sm text-muted-foreground">Let's set up your autonomous SEO system. It only takes a few minutes — answer a few questions about your business and we'll handle the rest.</p>
            <Button onClick={() => navigate('/portal/onboarding')} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">
              Start Setup <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate simple metrics
  const totalUrls = urls.length;
  const top5 = sheetRows.filter(r => (r.avg_position || 999) <= 5).length;
  const top10 = sheetRows.filter(r => (r.avg_position || 999) <= 10).length;
  const totalClicks = sheetRows.reduce((sum, r) => sum + (r.clicks || 0), 0);

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
            <span className="hidden font-heading text-sm font-bold sm:block">PORTAL</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/portal/urls" className="text-sm text-muted-foreground hover:text-[#B8860B]">My URLs</Link>
            <Link to="/portal/agents" className="text-sm text-muted-foreground hover:text-[#B8860B]">Agents</Link>
            <Link to="/portal/settings" className="text-sm text-muted-foreground hover:text-[#B8860B]">Settings</Link>
            <Button onClick={() => base44.auth.logout()} variant="ghost" size="sm" className="text-muted-foreground">Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your autonomous SEO system is running 24/7 for {onboarding?.company_name || 'your business'}.
          </p>
        </div>

        {/* Status banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="flex h-3 w-3 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-800">System is active and optimizing</p>
            <p className="text-xs text-emerald-600">Agents are working in the background — check back daily for new results.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Target} label="URLs Tracked" value={totalUrls} color="text-[#B8860B]" />
          <StatCard icon={Award} label="Top 5" value={top5} color="text-emerald-500" />
          <StatCard icon={TrendingUp} label="Page 1" value={top10} color="text-sky-500" />
          <StatCard icon={Activity} label="Clicks (28d)" value={totalClicks.toLocaleString()} color="text-[#B8860B]" />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <QuickAction to="/portal/urls" icon={Globe} label="My URLs" desc="View and manage your tracked domains" accent />
            <QuickAction to="/portal/agents" icon={Bot} label="AI Agents" desc="See what your agents are working on" />
            <QuickAction to="/portal/settings" icon={Settings} label="Settings" desc="Manage your account and preferences" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-[#B8860B]" /> Recent Agent Activity
          </h2>
          {fixAttempts.length === 0 ? (
            <div className="py-6 text-center">
              <Bot className="mx-auto mb-2 h-8 w-8 text-[#B8860B]/30" />
              <p className="text-sm text-muted-foreground">Agents are initializing. Activity will appear here after the first cycle.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fixAttempts.map((f, i) => (
                <div key={f.id || i} className="flex items-start gap-3 border-l-2 border-[#FFD700]/30 pl-3">
                  {f.status === 'validated' || f.status === 'applied' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : f.status === 'failed' ? (
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  ) : (
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{f.diagnosis || f.treatment || `Optimizing ${f.url}`}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {f.created_at ? new Date(f.created_at).toLocaleDateString() : ''} · {f.approach || 'Agent'}
                    </p>
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