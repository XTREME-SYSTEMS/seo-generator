import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Plus, Loader2, Zap, Globe, DollarSign, TrendingUp, Target,
  CheckCircle2, Clock, Rocket, Activity, RefreshCw, Filter,
} from 'lucide-react';

const NICHES = [
  'Plumbing', 'Water Damage Restoration', 'Roofing', 'HVAC', 'Electrical',
  'Locksmith', 'Pest Control', 'Tree Service', 'Concrete & Epoxy',
  'Fence Installation', 'Garage Door Repair', 'Solar Installation',
  'Foundation Repair', 'Mold Remediation', 'Septic Service',
  'Landscaping', 'Junk Removal', 'Window Replacement', 'Siding',
  'Gutter Cleaning', 'Carpet Cleaning', 'Air Duct Cleaning',
  'Chimney Repair', 'Deck Building', 'Driveway Paving',
  'Asphalt Repair', 'Pool Service', 'Fence Repair', 'Handyman',
  'Appliance Repair', 'Bathroom Remodeling', 'Kitchen Remodeling',
  'Painting', 'Drywall Repair', 'Insulation', 'Waterproofing',
  'Radon Mitigation', 'Well Drilling', 'Tree Removal',
  'Stump Grinding', 'Snow Removal', 'Power Washing', 'Deck Staining',
  'Fence Staining', 'Epoxy Flooring', 'Polished Concrete',
  'Masonry', 'Brick Repair', 'Stone Veneer',
];

const STATUSES = ['queued', 'generating', 'deploying', 'live', 'monitoring', 'optimizing', 'paused'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export default function MassProduction() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newItem, setNewItem] = useState({
    niche: '',
    url_pattern: '',
    primary_keyword: '',
    keyword_category: 'near_you',
    priority: 'high',
    target_cities_count: 450,
    lead_value: 35,
    estimated_monthly_leads: 200,
  });

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const items = await base44.entities.MassProductionQueue.list('-created_date', 100);
      setQueue(items || []);
    } catch (e) {
      setQueue([]);
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.niche || !newItem.url_pattern) return;
    try {
      const estRevenue = newItem.lead_value * newItem.estimated_monthly_leads;
      await base44.entities.MassProductionQueue.create({
        ...newItem,
        estimated_monthly_revenue: estRevenue,
        status: 'queued',
      });
      setNewItem({
        niche: '', url_pattern: '', primary_keyword: '',
        keyword_category: 'near_you', priority: 'high',
        target_cities_count: 450, lead_value: 35, estimated_monthly_leads: 200,
      });
      setShowAdd(false);
      loadQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = filter === 'all' ? queue : queue.filter(q => q.status === filter);

  const stats = {
    total: queue.length,
    queued: queue.filter(q => q.status === 'queued').length,
    live: queue.filter(q => q.status === 'live').length,
    monitoring: queue.filter(q => q.status === 'monitoring' || q.status === 'optimizing').length,
    estRevenue: queue.reduce((sum, q) => sum + (q.estimated_monthly_revenue || 0), 0),
  };

  return (
    <div className="min-h-full bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="w-7 h-7 text-primary" /> Mass Production Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Queue high-value near-you / near-me websites for mass production — 300+ sites in minutes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadQueue} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent text-sm font-medium">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-bold">
            <Plus className="w-4 h-4" /> Add to Queue
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Target} label="Total Queued" value={stats.total} />
        <StatCard icon={Clock} label="In Queue" value={stats.queued} />
        <StatCard icon={Globe} label="Live Sites" value={stats.live} />
        <StatCard icon={Activity} label="Under Swarm" value={stats.monitoring} />
        <StatCard icon={DollarSign} label="Est. Monthly Rev" value={`$${(stats.estRevenue / 1000).toFixed(1)}k`} />
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-card rounded-xl border-2 border-primary p-6 space-y-4">
          <h3 className="font-bold text-foreground">Add New Site to Production Queue</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Niche *</label>
              <select
                value={newItem.niche}
                onChange={e => setNewItem({ ...newItem, niche: e.target.value, primary_keyword: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                className="input mt-1"
                required
              >
                <option value="">Select a niche...</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">URL Pattern *</label>
              <input
                type="text"
                value={newItem.url_pattern}
                onChange={e => setNewItem({ ...newItem, url_pattern: e.target.value })}
                placeholder="plumbingnearme.com"
                className="input mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Primary Keyword</label>
              <input
                type="text"
                value={newItem.primary_keyword}
                onChange={e => setNewItem({ ...newItem, primary_keyword: e.target.value })}
                placeholder="plumber near me"
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Keyword Category</label>
              <select
                value={newItem.keyword_category}
                onChange={e => setNewItem({ ...newItem, keyword_category: e.target.value })}
                className="input mt-1"
              >
                <option value="near_you">Near You</option>
                <option value="near_me">Near Me</option>
                <option value="emergency">Emergency</option>
                <option value="service">Service</option>
                <option value="local">Local</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <select
                value={newItem.priority}
                onChange={e => setNewItem({ ...newItem, priority: e.target.value })}
                className="input mt-1"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Target Cities Count</label>
              <input
                type="number"
                value={newItem.target_cities_count}
                onChange={e => setNewItem({ ...newItem, target_cities_count: parseInt(e.target.value) || 450 })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lead Value ($)</label>
              <input
                type="number"
                value={newItem.lead_value}
                onChange={e => setNewItem({ ...newItem, lead_value: parseFloat(e.target.value) || 0 })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Est. Monthly Leads</label>
              <input
                type="number"
                value={newItem.estimated_monthly_leads}
                onChange={e => setNewItem({ ...newItem, estimated_monthly_leads: parseInt(e.target.value) || 0 })}
                className="input mt-1"
              />
            </div>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-sm text-foreground">
            <strong>Estimated Monthly Revenue:</strong> ${(newItem.lead_value * newItem.estimated_monthly_leads).toLocaleString()}
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg hover:opacity-90">
            Add to Production Queue
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-accent'}`}
        >
          All ({queue.length})
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-accent'}`}
          >
            {s} ({queue.filter(q => q.status === s).length})
          </button>
        ))}
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No sites in queue yet. Add your first high-value niche above.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Niche</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Domain</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Priority</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Cities</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Lead Value</th>
                  <th className="text-right p-3 font-semibold text-muted-foreground">Est. Revenue/mo</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">Swarm</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground">GA</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-accent/50">
                    <td className="p-3 font-medium text-foreground">{item.niche}</td>
                    <td className="p-3 text-primary font-mono text-xs">{item.url_pattern}</td>
                    <td className="p-3"><StatusPill status={item.status} /></td>
                    <td className="p-3"><PriorityPill priority={item.priority} /></td>
                    <td className="p-3 text-right text-muted-foreground">{item.target_cities_count || 0}</td>
                    <td className="p-3 text-right text-muted-foreground">${item.lead_value || 0}</td>
                    <td className="p-3 text-right font-semibold text-foreground">${(item.estimated_monthly_revenue || 0).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {item.autonomous_swarm_active ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.ga_connected ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy Note */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/30 p-6">
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Production Strategy
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each queued site goes through the full 20-stage autonomous pipeline: envision → strategize →
          architect → engineer → build → validate → optimize → launch → sync → track → audit → analyze →
          monitor → fix → heal → harden → optimize → enhance → evolve → grow. The AGI Swarm then
          manages each site 24/7, while Google Analytics tracks real traffic and lead form usage.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    queued: 'bg-gray-100 text-gray-600',
    generating: 'bg-yellow-100 text-yellow-700',
    deploying: 'bg-blue-100 text-blue-700',
    live: 'bg-green-100 text-green-700',
    monitoring: 'bg-indigo-100 text-indigo-700',
    optimizing: 'bg-purple-100 text-purple-700',
    paused: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.queued}`}>{status}</span>;
}

function PriorityPill({ priority }) {
  const colors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-500',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[priority] || colors.medium}`}>{priority}</span>;
}