import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Globe, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

function PortalSettings() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: u } = await base44.auth.me();
        setUser(u);
        const subs = await base44.entities.Subscription.filter({ user_id: u.id });
        if (subs.length > 0) setSubscription(subs[0]);
        const conn = await base44.entities.ConnectorStatus.list();
        setConnectors(conn);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  const handleSyncGSC = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('SyncSearchConsole', {});
    } catch (err) { console.error(err); }
    setSyncing(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO" className="h-8 w-auto" />
            <Link to="/portal" className="hidden font-heading text-sm font-bold sm:block hover:text-[#FFD700]">PORTAL</Link>
          </div>
          <Link to="/portal"><Button size="sm" variant="ghost" className="text-white/50 hover:text-white">Back to Dashboard</Button></Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 font-heading text-3xl font-bold">Settings</h1>

        {/* Subscription */}
        <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Subscription</h2>
          {subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Plan</span>
                <span className="rounded-full bg-[#FFD700]/10 px-3 py-0.5 text-sm font-semibold capitalize text-[#FFD700]">{subscription.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Status</span>
                <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> {subscription.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">URLs</span>
                <span className="text-sm">{subscription.urls_used} / {subscription.url_limit >= 9999 ? '∞' : subscription.url_limit}</span>
              </div>
              {subscription.upgrades?.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Upgrades</span>
                  <span className="text-sm">{subscription.upgrades.length} active</span>
                </div>
              )}
              <Link to="/pricing">
                <Button variant="outline" className="mt-2 w-full border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10">Manage Subscription</Button>
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-white/50">No active subscription.</p>
              <Link to="/pricing"><Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">View Plans</Button></Link>
            </div>
          )}
        </div>

        {/* Integrations */}
        <div className="mb-6 rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Integrations</h2>
          <div className="space-y-3">
            {/* Google Search Console */}
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Search className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Google Search Console</h4>
                  <p className="text-xs text-white/40">Track rankings, impressions, clicks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSyncGSC} disabled={syncing} size="sm" variant="outline" className="border-white/10 text-white/70 hover:bg-white/5">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
                <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>
              </div>
            </div>

            {/* Google Analytics */}
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Globe className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Google Analytics</h4>
                  <p className="text-xs text-white/40">Traffic and conversion data</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>
            </div>

            {/* Facebook */}
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Facebook</h4>
                  <p className="text-xs text-white/40">Social media tracking</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10">Connect</Button>
            </div>

            {/* Instagram */}
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                  <Globe className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Instagram</h4>
                  <p className="text-xs text-white/40">Social media tracking</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10">Connect</Button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Name</span>
              <span className="text-sm">{user?.full_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Email</span>
              <span className="text-sm">{user?.email || '—'}</span>
            </div>
            <Button onClick={() => base44.auth.logout()} variant="outline" className="mt-2 w-full border-red-500/30 text-red-400 hover:bg-red-500/10">Sign Out</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalSettings;