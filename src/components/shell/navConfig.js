import {
  Home, Activity, Target, TrendingUp, Gauge, Compass,
  Building2, Plug, Settings, CalendarDays, DollarSign, Briefcase,
  BarChart3, Rocket, Bot, Zap, Boxes, Search, Globe, Crown, Sparkles,
} from 'lucide-react';
// Rocket already imported above

// Simplified nav — only what the admin needs to see at a high level.
// All other pages remain accessible via direct URL or in-page links.
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/end-to-end', label: 'End-to-End Generator', icon: Rocket },
      { to: '/universal-generator', label: 'Universal Generator', icon: Boxes },
      { to: '/mission-control', label: 'Mission Control', icon: Zap },
      { to: '/admin', label: 'Executive', icon: Home },
      { to: '/core-strategy', label: 'Core Strategy', icon: Briefcase },
      { to: '/analytics-dashboard', label: 'Analytics', icon: BarChart3 },
      { to: '/mass-production', label: 'Mass Production', icon: Rocket },
      { to: '/agi-swarm', label: 'AGI Swarm', icon: Bot },
      { to: '/daily', label: 'Daily Results', icon: CalendarDays },
      { to: '/system-health', label: 'System Health', icon: Activity },
      { to: '/fallback', label: 'Fallback Infra', icon: Activity },
    ],
  },
  {
    label: 'Rankings',
    items: [
      { to: '/scoreboard', label: 'URL Scoreboard', icon: Target },
      { to: '/ranking-progress', label: 'Ranking Progress', icon: TrendingUp },
      { to: '/fastpaths', label: 'Fast Paths', icon: Gauge },
      { to: '/strategy', label: 'SEO Strategy', icon: Compass },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/clients', label: 'Clients', icon: Building2 },
      { to: '/strategic-urls', label: 'Strategic URL Finder', icon: DollarSign },
      { to: '/nearme-strategy', label: 'NearMe Strategy', icon: Crown },
      { to: '/generator-hub', label: 'Generator Hub', icon: Sparkles },
      { to: '/nearme-finder', label: 'NearMe Intelligence', icon: Search },
      { to: '/base44-apps', label: 'Base44 App Inventory', icon: Globe },
      { to: '/ecosystem', label: 'Ecosystem API', icon: Plug },
      { to: '/system', label: 'System Management', icon: Settings },
      { to: '/provisioning', label: 'Provisioning', icon: Plug },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const ALL_ROUTES = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to));