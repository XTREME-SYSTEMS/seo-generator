import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Target, Bot, Zap, ArrowRight, Activity, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [urls, setUrls] = useState([]);
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
        const targets = await base44.entities.UrlTarget.filter({ client_id: u.id });
        setUrls(targets);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFD700] border-t-transparent" /></div>;
  }

  // Redirect to onboarding if not completed
  if (!onboarding || onboarding.status !== 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6 text-white">
        <div className="max-w-md text-center">
          <img src={LOGO_URL} alt="Xtreme SEO" className="mx-auto mb-6 h-16 w-auto" />
          <h1 className="mb-3 font-heading text-2xl font-bold">Complete Your Onboarding</h1>
          <p className="mb-6 text-sm text-white/50">Let's set up your autonomous SEO system. It only takes a few minutes.</p>
          <Button onClick={() => navigate('/portal/onboarding')} className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">
            Start Onboarding <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Portal Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
            <span className="hidden font-heading text-sm font-bold sm:block">PORTAL</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/portal/urls" className="text-sm text-white/60 hover:text-[#FFD700]">My URLs</Link>
            <Link to="/portal/agents" className="text-sm text-white/60 hover:text-[#FFD700]">Agents</Link>
            <Link to="/portal/settings" className="text-sm text-white/60 hover:text-[#FFD700]">Settings</Link>
            <Button onClick={() => base44.auth.logout()} variant="ghost" size="sm" className="text-white/50 hover:text-white">Sign Out</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Welcome back, {user?.full_name || 'there'}</h1>
          <p className="mt-1 text-white/50">Your autonomous SEO system is running 24/7.</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'URLs Tracked', value: urls.length, icon: Target, color: 'text-[#FFD700]' },
            { label: 'Active Agents', value: '6', icon: Bot, color: 'text-emerald-400' },
            { label: 'Avg Position', value: '—', icon: TrendingUp, color: 'text-sky-400' },
            { label: 'Plan', value: subscription?.plan || 'starter', icon: Zap, color: 'text-[#FFD700]' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="font-heading text-2xl font-bold">{s.value}</span>
              </div>
              <p className="mt-2 text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* URLs */}
        <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Your URLs</h2>
            <Link to="/portal/urls">
              <Button size="sm" variant="ghost" className="text-[#FFD700] hover:bg-[#FFD700]/10">View All <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </Link>
          </div>
          {urls.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No URLs yet. Complete onboarding to add URLs.</p>
          ) : (
            <div className="space-y-2">
              {urls.slice(0, 5).map((url) => (
                <div key={url.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-[#FFD700]/60" />
                    <span className="truncate text-sm">{url.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#FFD700]/10 px-2 py-0.5 text-[10px] font-medium text-[#FFD700]">{url.url_state?.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Activity */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Agent Activity Today</h2>
          <div className="space-y-3">
            {[
              { agent: 'Scout', action: 'Researched 3 new ranking methods for your industry', time: '2h ago', status: 'done' },
              { agent: 'Builder', action: 'Generated optimized meta tags for 2 URLs', time: '4h ago', status: 'done' },
              { agent: 'Sentinel', action: 'Detected ranking improvement on 1 URL (+3 positions)', time: '6h ago', status: 'done' },
              { agent: 'Healer', action: 'Fixed schema markup error on 1 URL', time: '8h ago', status: 'done' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFD700]">{a.agent}</span>
                    <span className="text-xs text-white/30">{a.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/60">{a.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerPortal;