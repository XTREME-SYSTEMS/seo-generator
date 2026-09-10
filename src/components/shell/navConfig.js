import {
  Home, Activity, Target, TrendingUp, Gauge, Compass,
  Building2, Plug, Settings, CalendarDays, DollarSign, Briefcase,
} from 'lucide-react';

// Simplified nav — only what the admin needs to see at a high level.
// All other pages remain accessible via direct URL or in-page links.
export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Executive', icon: Home },
      { to: '/core-strategy', label: 'Core Strategy', icon: Briefcase },
      { to: '/daily', label: 'Daily Results', icon: CalendarDays },
      { to: '/system-health', label: 'System Health', icon: Activity },
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
      { to: '/ecosystem', label: 'Ecosystem API', icon: Plug },
      { to: '/system', label: 'System Management', icon: Settings },
      { to: '/provisioning', label: 'Provisioning', icon: Plug },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const ALL_ROUTES = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to));