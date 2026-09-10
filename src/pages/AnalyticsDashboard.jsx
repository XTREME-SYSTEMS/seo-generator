import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Loader2, RefreshCw, Globe, Users, MousePointer, TrendingUp,
  AlertCircle, BarChart3, Activity, DollarSign, Zap, Eye,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProp, setSelectedProp] = useState(0);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('GoogleAnalyticsDashboard', {});
      setData(res.data);
      if (res.data?.error && !res.data.connected) {
        setError(res.data.error);
      }
    } catch (e) {
      setError(e.message || 'Failed to load analytics');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading Google Analytics data...</p>
        </div>
      </div>
    );
  }

  if (error && !data?.connected) {
    return (
      <div className="min-h-full bg-background p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-card rounded-xl border-2 border-yellow-400 p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-bold text-foreground mb-2">Google Analytics Not Connected</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <a href="/connectors" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg hover:opacity-90">
              <Globe className="w-4 h-4" /> Go to Connectors
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.properties || data.properties.length === 0) {
    return (
      <div className="min-h-full bg-background p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground mb-2">No GA4 Properties Found</h2>
            <p className="text-muted-foreground">{data?.message || 'Create a GA4 property in Google Analytics first, then refresh this page.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const prop = data.properties[selectedProp] || data.properties[0];
  const chartData = (prop?.dailyData || []).map(d => ({
    date: d.date.slice(4, 6) + '/' + d.date.slice(6, 8),
    sessions: d.sessions,
    users: d.users,
    pageViews: d.pageViews,
    conversions: d.conversions,
  }));

  const leadChart = (data.leadData || []).map(d => ({
    date: d.date.slice(5, 7) + '/' + d.date.slice(8, 10),
    leads: d.leads,
  }));

  return (
    <div className="min-h-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Google Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real traffic per site — see which sites are getting the most visitors and estimator usage
          </p>
        </div>
        <button onClick={loadAnalytics} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Globe} label="GA4 Properties" value={data.totals?.totalProperties || 0} />
        <StatCard icon={Users} label="Estimator Usage Today" value={data.totals?.leadsToday || 0} highlight />
        <StatCard icon={TrendingUp} label="Estimator Usage (30d)" value={data.totals?.totalLeads30d || 0} />
        <StatCard icon={Activity} label="Properties with Traffic" value={data.properties.filter(p => p.totals.sessions > 0).length} />
      </div>

      {/* Property Selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Select Property / Domain</label>
        <select
          value={selectedProp}
          onChange={e => setSelectedProp(parseInt(e.target.value))}
          className="input"
        >
          {data.properties.map((p, i) => (
            <option key={p.propertyId} value={i}>
              {p.displayName} ({p.propertyId}) — {p.totals.sessions.toLocaleString()} sessions
            </option>
          ))}
        </select>
      </div>

      {/* Property Stats */}
      {prop && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Sessions (30d)" value={prop.totals.sessions.toLocaleString()} />
            <StatCard icon={Users} label="Users (30d)" value={prop.totals.users.toLocaleString()} />
            <StatCard icon={MousePointer} label="Page Views (30d)" value={prop.totals.pageViews.toLocaleString()} />
            <StatCard icon={Zap} label="Conversions (30d)" value={prop.totals.conversions.toLocaleString()} highlight />
          </div>

          {/* Traffic Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Daily Traffic — {prop.displayName}
            </h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No traffic data for this property yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="sessions" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pageViews" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Hostname Breakdown */}
          {prop.hostnames && prop.hostnames.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> Traffic by Domain
              </h3>
              <div className="space-y-2">
                {prop.hostnames.map((h, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span className="font-mono text-sm text-foreground">{h.hostname}</span>
                    <div className="flex gap-6 text-sm">
                      <span className="text-muted-foreground">{h.sessions.toLocaleString()} sessions</span>
                      <span className="text-muted-foreground">{h.users.toLocaleString()} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Estimator / Lead Usage */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" /> Estimator / Lead Form Usage (Last 30 Days)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          How many people used the estimator / lead form each day across all sites
        </p>
        {leadChart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No lead form submissions yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={leadChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* All Properties Overview Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <h3 className="font-bold text-foreground p-4 border-b border-border flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" /> All Properties — Traffic Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent border-b border-border">
              <tr>
                <th className="text-left p-3 font-semibold text-muted-foreground">Property</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Sessions</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Users</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Page Views</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {data.properties.map((p, i) => (
                <tr key={p.propertyId} className={`border-b border-border hover:bg-accent/50 cursor-pointer ${i === selectedProp ? 'bg-primary/5' : ''}`} onClick={() => setSelectedProp(i)}>
                  <td className="p-3 font-medium text-foreground">{p.displayName}</td>
                  <td className="p-3 text-right text-muted-foreground">{p.totals.sessions.toLocaleString()}</td>
                  <td className="p-3 text-right text-muted-foreground">{p.totals.users.toLocaleString()}</td>
                  <td className="p-3 text-right text-muted-foreground">{p.totals.pageViews.toLocaleString()}</td>
                  <td className="p-3 text-right font-semibold text-primary">{p.totals.conversions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`bg-card rounded-xl border p-4 ${highlight ? 'border-primary border-2' : 'border-border'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}