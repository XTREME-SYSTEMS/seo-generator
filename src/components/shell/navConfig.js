import {
  Home, Building2, CircleDollarSign, Gauge, FlaskConical, LineChart, WalletCards, Trophy,
  ShieldCheck, Radar, Sparkles, GitCompareArrows, Cpu, Search, BrainCircuit, Bot,
  Globe2, Network, Cable, Activity, KeyRound, Settings,
} from 'lucide-react';

// Route paths + group structure mirror the Vite shell (src/components/Shell.tsx) exactly.
export const NAV_GROUPS = [
  {
    label: 'Command',
    items: [
      { to: '/', label: 'Executive', icon: Home },
      { to: '/clients', label: 'Clients', icon: Building2 },
      { to: '/money-map', label: 'Search Money Map', icon: CircleDollarSign },
      { to: '/fastpaths', label: 'Page-One FastPaths', icon: Gauge },
    ],
  },
  {
    label: 'Proof',
    items: [
      { to: '/experiments', label: 'Experiment Lab', icon: FlaskConical },
      { to: '/paid-organic', label: 'Paid + Organic', icon: LineChart },
      { to: '/financial', label: 'Financial Intelligence', icon: WalletCards },
      { to: '/replacement', label: 'Spend Replacement', icon: Trophy },
      { to: '/proof', label: 'Proof Vault', icon: ShieldCheck },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/competitors', label: 'Competitors', icon: Radar },
      { to: '/ai-visibility', label: 'AI Visibility', icon: Sparkles },
      { to: '/competitive-parity', label: 'Competitive Parity', icon: GitCompareArrows },
      { to: '/technology-radar', label: 'Technology Radar', icon: Cpu },
      { to: '/research', label: 'Research Lab', icon: Search },
      { to: '/models', label: 'Model Lab', icon: BrainCircuit },
      { to: '/agents', label: 'Agent Control', icon: Bot },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/domains', label: 'Domains', icon: Globe2 },
      { to: '/infrastructure', label: 'Infrastructure', icon: Network },
      { to: '/connectors', label: 'Connectors', icon: Cable },
      { to: '/system-health', label: 'System Health', icon: Activity },
      { to: '/admin', label: 'Admin', icon: KeyRound },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const ALL_ROUTES = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to));