import {
  Home, Building2, CircleDollarSign, Gauge, FlaskConical, LineChart, WalletCards, Trophy,
  ShieldCheck, Radar,   Sparkles, GitCompareArrows, Cpu, Search, BrainCircuit, Bot, Zap,
  Globe2, Network, Cable, Activity, KeyRound, Settings, Table2,
  FileCheck2, Server, Crosshair, Rocket, Target, Rows3, TrendingUp, Boxes, Compass, Repeat,
  ListChecks, ClipboardList, Plug, Wand2, BarChart3, BookMarked, Eye, CalendarDays,
} from 'lucide-react';

// Route paths + group structure mirror the Vite shell (src/components/Shell.tsx) exactly.
export const NAV_GROUPS = [
  {
    label: 'Ranking Engine',
    items: [
      { to: '/start', label: 'Start Here', icon: Rocket },
      { to: '/vision', label: 'The Vision', icon: Eye },
      { to: '/daily', label: 'Daily Results', icon: CalendarDays },
      { to: '/scoreboard', label: 'URL Scoreboard', icon: Target },
      { to: '/url-command', label: 'URL Command', icon: ClipboardList },
      { to: '/ranking-progress', label: 'Ranking Progress', icon: LineChart },
      { to: '/sheet', label: 'Ranking Sheet', icon: Rows3 },
      { to: '/workbook', label: 'URL Workbook', icon: Table2 },
      { to: '/simulator', label: 'Growth Simulator', icon: TrendingUp },
      { to: '/twin', label: 'Twin Optimizer', icon: Boxes },
      { to: '/strategy', label: 'SEO Strategy', icon: Compass },
      { to: '/loop', label: 'Loop Monitor', icon: Repeat },
    ],
  },
  {
    label: 'Command',
    items: [
      { to: '/', label: 'Executive', icon: Home },
      { to: '/algorithm-crack', label: 'Algorithm Crack', icon: Crosshair },
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
      { to: '/seo-generator', label: 'SEO Generator', icon: Zap },
      { to: '/models', label: 'Model Lab', icon: BrainCircuit },
      { to: '/agents', label: 'Agent Control', icon: Bot },
      { to: '/vision-cortex', label: 'Vision Cortex', icon: BrainCircuit },
      { to: '/capabilities', label: 'Capabilities', icon: ListChecks },
      { to: '/cloud-browser', label: 'CloudBrowser', icon: Globe2 },
      { to: '/implement', label: 'Universal Implementer', icon: Wand2 },
      { to: '/traction', label: 'Traction Scanner', icon: BarChart3 },
      { to: '/prompts', label: 'Prompt Library', icon: BookMarked },
    ],
  },
  {
    label: 'Platform',
    items: [
      { to: '/domains', label: 'Domains', icon: Globe2 },
      { to: '/indexing', label: 'Indexing', icon: FileCheck2 },
      { to: '/domain-manager', label: 'Domain Manager', icon: Server },
      { to: '/dns-setup', label: 'DNS Setup', icon: Cable },
      { to: '/infrastructure', label: 'Infrastructure', icon: Network },
      { to: '/connectors', label: 'Connectors', icon: Cable },
      { to: '/system-health', label: 'System Health', icon: Activity },
      { to: '/admin', label: 'Admin', icon: KeyRound },
      { to: '/ecosystem', label: 'Ecosystem API', icon: Plug },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const ALL_ROUTES = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.to));