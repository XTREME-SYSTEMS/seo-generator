import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, DollarSign, Users, FileText, Loader2, Target } from 'lucide-react';
import UrlDiscoveryTab from '@/components/strategic/UrlDiscoveryTab';
import LandingPagesTab from '@/components/strategic/LandingPagesTab';
import BuyerProspectsTab from '@/components/strategic/BuyerProspectsTab';
import SalesPitchesTab from '@/components/strategic/SalesPitchesTab';

const TABS = [
  { id: 'discovery', label: 'URL Discovery', icon: Search },
  { id: 'landing', label: 'Landing Pages', icon: Target },
  { id: 'buyers', label: 'Buyer Prospects', icon: Users },
  { id: 'pitches', label: 'Sales Pitches', icon: FileText },
];

export default function StrategicURLFinder() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [urls, setUrls] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUrls: 0, totalValue: 0, totalBuyers: 0, pitchesGenerated: 0 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [urlList, buyerList] = await Promise.all([
        base44.entities.StrategicUrl.list('-estimated_site_value', 100),
        base44.entities.BuyerProspect.list('-created_date', 100),
      ]);
      setUrls(urlList);
      setBuyers(buyerList);
      const totalValue = urlList.reduce((sum, u) => sum + (u.estimated_site_value || 0), 0);
      const pitches = buyerList.filter(b => b.pitch_document).length;
      setStats({ totalUrls: urlList.length, totalValue, totalBuyers: buyerList.length, pitchesGenerated: pitches });
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Strategic URL Finder</h1>
            <p className="text-sm text-muted-foreground">Discover high-value URLs, generate programmatic landing pages, find buyers, and close sales</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox label="Strategic URLs" value={stats.totalUrls} icon={Search} />
        <StatBox label="Portfolio Value" value={`$${(stats.totalValue / 1000000).toFixed(1)}M`} icon={DollarSign} />
        <StatBox label="Buyer Prospects" value={stats.totalBuyers} icon={Users} />
        <StatBox label="Pitches Generated" value={stats.pitchesGenerated} icon={FileText} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-yellow-500 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {activeTab === 'discovery' && <UrlDiscoveryTab urls={urls} onRefresh={loadData} />}
          {activeTab === 'landing' && <LandingPagesTab urls={urls} onRefresh={loadData} />}
          {activeTab === 'buyers' && <BuyerProspectsTab urls={urls} buyers={buyers} onRefresh={loadData} />}
          {activeTab === 'pitches' && <SalesPitchesTab urls={urls} buyers={buyers} onRefresh={loadData} />}
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}