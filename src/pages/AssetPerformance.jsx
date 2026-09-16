import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Loader2, BarChart3, Target, Award, Activity, RefreshCw } from 'lucide-react';

const GEN_LABELS = {
  idea: 'Idea', wealth_strategy: 'Wealth', content: 'Content', reverse_engineer: 'Reverse Eng.',
  document: 'Document', programmatic_site: 'Programmatic', funnel_idea: 'Funnel', problem_solution: 'Problem/Sol.',
  elite_scan: 'Elite Scan', ai_company_data: 'AI Company',
};
const GEN_COLORS = ['#FFD700', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#84cc16', '#a855f7'];
const STATUS_COLORS = { generated: '#3b82f6', reviewed: '#f59e0b', approved: '#10b981', deployed: '#FFD700', archived: '#94a3b8' };

export default function AssetPerformance() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.GeneratedAsset.list('-created_date', 500);
      setAssets(rows || []);
    } catch (e) { setToast({ type: 'error', msg: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => filter === 'all' ? assets : assets.filter(a => a.generator_type === filter), [assets, filter]);

  const byType = useMemo(() => {
    const map = {};
    filtered.forEach(a => { map[a.generator_type] = (map[a.generator_type] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: GEN_LABELS[k] || k, value: v, key: k }));
  }, [filtered]);

  const avgScoreByType = useMemo(() => {
    const map = {};
    filtered.forEach(a => {
      if (!map[a.generator_type]) map[a.generator_type] = { sum: 0, count: 0 };
      map[a.generator_type].sum += a.compliance_score || 0;
      map[a.generator_type].count++;
    });
    return Object.entries(map).map(([k, v]) => ({ name: GEN_LABELS[k] || k, score: Math.round(v.sum / v.count), count: v.count }));
  }, [filtered]);

  const byStatus = useMemo(() => {
    const map = {};
    filtered.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: k, value: v }));
  }, [filtered]);

  const overTime = useMemo(() => {
    const map = {};
    filtered.forEach(a => {
      const d = (a.created_date || '').slice(0, 10);
      if (!d) return;
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort().slice(-30).map(([d, v]) => ({ date: d.slice(5), count: v }));
  }, [filtered]);

  const topAssets = useMemo(() => [...filtered].sort((a, b) => (b.compliance_score || 0) - (a.compliance_score || 0)).slice(0, 10), [filtered]);

  const stats = useMemo(() => ({
    total: filtered.length,
    avgScore: filtered.length ? Math.round(filtered.reduce((s, a) => s + (a.compliance_score || 0), 0) / filtered.length) : 0,
    deployed: filtered.filter(a => a.status === 'deployed').length,
    approved: filtered.filter(a => a.status === 'approved' || a.status === 'deployed').length,
  }), [filtered]);

  const genTypes = useMemo(() => ['all', ...new Set(assets.map(a => a.generator_type))], [assets]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Asset Performance Dashboard</h1>
              <p className="text-xs text-muted-foreground">Which generators and strategies are driving the most visibility</p>
            </div>
          </div>
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Assets" value={stats.total} icon={BarChart3} />
          <StatCard label="Avg Compliance" value={`${stats.avgScore}/100`} icon={Target} highlight={stats.avgScore >= 75} />
          <StatCard label="Approved" value={stats.approved} icon={Award} />
          <StatCard label="Deployed" value={stats.deployed} icon={Activity} highlight={stats.deployed > 0} />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-muted-foreground">Filter by generator:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/40">
            {genTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'All Generators' : (GEN_LABELS[t] || t)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">No generated assets yet. Use the Generator Hub to create assets.</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Assets by Generator Type" subtitle="Volume per strategy">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FFD700" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Avg Compliance Score by Generator" subtitle="Quality per strategy">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={avgScoreByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Status Distribution" subtitle="Pipeline stage breakdown">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {byStatus.map((s, i) => <Cell key={i} fill={STATUS_COLORS[s.name] || '#999'} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Asset Generation Over Time" subtitle="Last 30 days">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={overTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> Top Performing Assets
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4">Asset</th><th className="py-2 pr-4">Generator</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Score</th><th className="py-2 pr-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAssets.map(a => (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 pr-4 font-medium text-foreground max-w-xs truncate">{a.title}</td>
                        <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{GEN_LABELS[a.generator_type] || a.generator_type}</span></td>
                        <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded text-[10px]" style={{ background: (STATUS_COLORS[a.status] || '#999') + '20', color: STATUS_COLORS[a.status] || '#999' }}>{a.status}</span></td>
                        <td className="py-2 pr-4 font-semibold tabular">{a.compliance_score || 0}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{(a.created_date || '').slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg border text-sm z-50 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`} onClick={() => setToast(null)}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`bg-card border rounded-lg p-4 ${highlight ? 'border-green-200' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? 'text-green-600' : 'text-muted-foreground'}`} />
      </div>
      <p className={`text-2xl font-semibold tabular ${highlight ? 'text-green-600' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      {children}
    </div>
  );
}