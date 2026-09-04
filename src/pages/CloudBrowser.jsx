import React, { useMemo, useState } from 'react';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import StatusPill from '@/components/kit/StatusPill';
import { useGlobalData } from '@/lib/useTenantData';
import { CheckCircle2, XCircle, AlertCircle, Globe, MousePointer, Eye, FileText, Shield, Cpu, Zap, Network } from 'lucide-react';

// ── CloudBrowser MCP Tools (from MCP_SURFACE.md) ──
const MCP_TOOLS = [
  { name: 'browser_start', desc: 'Create a new browser session with viewport, proxy, geolocation, captcha solver', status: 'implemented' },
  { name: 'browser_end', desc: 'Terminate a browser session and release resources', status: 'implemented' },
  { name: 'browser_navigate', desc: 'Navigate to a URL with captcha auto-solve and redirect handling', status: 'implemented' },
  { name: 'browser_act', desc: 'Execute a browser action (click, type, fill, scroll, evaluate, etc.)', status: 'implemented' },
  { name: 'browser_observe', desc: 'List actionable elements on the page with selectors and confidence', status: 'roadmap' },
  { name: 'browser_extract', desc: 'AI-powered structured data extraction with schema validation', status: 'implemented' },
  { name: 'browser_screenshot', desc: 'Capture a screenshot of the current page or element', status: 'implemented' },
  { name: 'browser_list_tabs', desc: 'List all open browser tabs in a session', status: 'implemented' },
  { name: 'browser_switch_tab', desc: 'Switch the active tab in a session', status: 'implemented' },
  { name: 'browser_context_create', desc: 'Create a persistent browser context (cookies, storage)', status: 'roadmap' },
  { name: 'browser_context_use', desc: 'Attach a persistent context to a session', status: 'roadmap' },
  { name: 'browser_artifact_get', desc: 'Download a captured artifact (screenshot, PDF, video)', status: 'available' },
];

// ── Browser Actions (40+ from server.js) ──
const BROWSER_ACTIONS = {
  'Navigation': [
    { name: 'goto', desc: 'Navigate to a URL', status: 'implemented' },
    { name: 'back', desc: 'Go back in browser history', status: 'implemented' },
    { name: 'forward', desc: 'Go forward in browser history', status: 'implemented' },
    { name: 'reload', desc: 'Reload the current page', status: 'implemented' },
  ],
  'Waiting & Timing': [
    { name: 'wait_for_selector', desc: 'Wait for an element to appear', status: 'implemented' },
    { name: 'wait_for_load_state', desc: 'Wait for network idle / DOMContentLoaded', status: 'implemented' },
    { name: 'wait_for_timeout', desc: 'Wait for a fixed duration', status: 'implemented' },
  ],
  'Interaction': [
    { name: 'click', desc: 'Click an element', status: 'implemented' },
    { name: 'hover', desc: 'Hover over an element', status: 'implemented' },
    { name: 'type', desc: 'Type text into an input (keystroke by keystroke)', status: 'implemented' },
    { name: 'fill', desc: 'Fill an input field instantly', status: 'implemented' },
    { name: 'press', desc: 'Press a keyboard key', status: 'implemented' },
    { name: 'select_option', desc: 'Select an option from a dropdown', status: 'implemented' },
    { name: 'scroll', desc: 'Scroll the page or element', status: 'implemented' },
    { name: 'drag_and_drop', desc: 'Drag an element and drop it on another', status: 'implemented' },
  ],
  'File & Dialog': [
    { name: 'upload_file', desc: 'Upload a file to a file input', status: 'implemented' },
    { name: 'download', desc: 'Download a file from the page', status: 'implemented' },
    { name: 'handle_dialog', desc: 'Accept or dismiss a JavaScript dialog (alert, confirm)', status: 'implemented' },
  ],
  'Tabs & Frames': [
    { name: 'new_tab', desc: 'Open a new browser tab', status: 'implemented' },
    { name: 'switch_tab', desc: 'Switch to another tab', status: 'implemented' },
    { name: 'close_tab', desc: 'Close a tab', status: 'implemented' },
    { name: 'frame_switch', desc: 'Switch to an iframe context', status: 'implemented' },
  ],
  'Data Extraction': [
    { name: 'extract_text', desc: 'Extract text content from elements', status: 'implemented' },
    { name: 'extract_html', desc: 'Extract raw HTML from elements', status: 'implemented' },
    { name: 'extract_attribute', desc: 'Extract element attributes (href, src, data-*)', status: 'implemented' },
    { name: 'extract_table', desc: 'Extract table data as structured rows', status: 'implemented' },
    { name: 'extract_json', desc: 'Extract JSON-LD or embedded JSON data', status: 'implemented' },
    { name: 'ai_extract', desc: 'AI-powered extraction: natural language + schema → structured data', status: 'implemented' },
    { name: 'evaluate', desc: 'Execute arbitrary JavaScript in the page context', status: 'implemented' },
  ],
  'Capture & State': [
    { name: 'screenshot', desc: 'Capture a screenshot (full page, element, or viewport)', status: 'implemented' },
    { name: 'pdf', desc: 'Generate a PDF of the page', status: 'implemented' },
    { name: 'set_cookies', desc: 'Set cookies on the browser', status: 'implemented' },
    { name: 'import_cookies', desc: 'Import cookies from an external source', status: 'implemented' },
    { name: 'export_cookies', desc: 'Export current session cookies', status: 'implemented' },
    { name: 'set_headers', desc: 'Set custom HTTP headers for requests', status: 'implemented' },
    { name: 'set_local_storage', desc: 'Set localStorage entries', status: 'implemented' },
    { name: 'capture_response', desc: 'Capture a specific network response', status: 'implemented' },
    { name: 'save_state', desc: 'Save the full browser state (cookies, storage, history)', status: 'implemented' },
    { name: 'restore_state', desc: 'Restore a previously saved browser state', status: 'implemented' },
  ],
  'Advanced': [
    { name: 'solve_captcha', desc: 'Auto-solve reCAPTCHA v2, hCaptcha, or Cloudflare Turnstile', status: 'implemented' },
    { name: 'mock_response', desc: 'Mock a network response for testing', status: 'implemented' },
    { name: 'crawl', desc: 'Crawl a site: follow links, extract data from multiple pages', status: 'implemented' },
    { name: 'paginate', desc: 'Auto-paginate through results (next button, infinite scroll, URL pattern)', status: 'implemented' },
  ],
};

// ── AI-Native Primitives (from AI_BROWSER_LAYER.md) ──
const AI_PRIMITIVES = [
  { name: 'ACT', icon: MousePointer, desc: 'Natural language → validated browser action. "Click the login button" → { action: click, selector: #login-btn, confidence: 0.95 }. LLM proposes; deterministic runtime executes.', status: 'roadmap' },
  { name: 'OBSERVE', icon: Eye, desc: 'Discover actionable elements on a page. Returns structured { selector, tag, text, role, bounds, confidence } for every interactive element.', status: 'roadmap' },
  { name: 'EXTRACT', icon: FileText, desc: 'Natural language + JSON schema → structured data. "Extract all product prices" → { data, confidence, evidence }. Already partially implemented as ai_extract.', status: 'implemented' },
  { name: 'AGENT', icon: Cpu, desc: 'Goal → bounded multi-step execution. "Log in and download the invoice" → autonomous loop with step/time/cost budgets, domain allowlists, and approval gates.', status: 'roadmap' },
];

// ── Session Features ──
const SESSION_FEATURES = [
  { name: 'Custom Viewport', desc: 'Any screen size (mobile, tablet, desktop)', status: 'implemented' },
  { name: 'User Agent Spoofing', desc: 'Any UA string for device/browser emulation', status: 'implemented' },
  { name: 'Locale & Timezone', desc: 'Geographically accurate browsing', status: 'implemented' },
  { name: 'Geolocation Spoofing', desc: 'GPS coordinates for local search testing', status: 'implemented' },
  { name: 'Residential Proxy', desc: 'Route through residential IPs to avoid blocks', status: 'available' },
  { name: 'Captcha Auto-Solve', desc: 'reCAPTCHA v2, hCaptcha, Turnstile self-solvers', status: 'implemented' },
  { name: 'Session Pooling', desc: 'Warm pool of pre-started sessions for instant use', status: 'implemented' },
  { name: 'Cookie/Storage Import', desc: 'Resume authenticated sessions from saved state', status: 'implemented' },
  { name: 'Video Recording', desc: 'Record session for debugging and evidence', status: 'implemented' },
  { name: 'CDP Access', desc: 'Chrome DevTools Protocol for advanced control', status: 'implemented' },
  { name: 'Resource Blocking', desc: 'Block images, fonts, media for speed', status: 'implemented' },
  { name: 'Custom Headers', desc: 'Set Accept-Language, DNT, custom headers', status: 'implemented' },
  { name: 'Session Sharing', desc: 'Share a live session with another user', status: 'implemented' },
  { name: 'Keepalive', desc: 'Extend session beyond default timeout', status: 'implemented' },
  { name: 'Human Behavior Sim', desc: 'Fingerprint randomizer + human-like mouse/typing', status: 'implemented' },
  { name: 'Multi-Tab Browsing', desc: 'Open, switch, and close tabs within a session', status: 'implemented' },
];

// ── Gaps: what's possible but not yet wired ──
const GAPS = [
  { gap: 'ACT primitive not implemented', impact: 'critical', desc: 'Natural language → browser action would let AI agents control the browser without manual selectors. Currently requires hand-coded selectors for every step.' },
  { gap: 'AGENT primitive not implemented', impact: 'critical', desc: 'Goal-based autonomous browsing would let the system "sign up to every site" without pre-scripting each site. The bounded loop (step/cost/time budgets) is designed but not built.' },
  { gap: 'OBSERVE primitive not implemented', impact: 'high', desc: 'Element discovery would enable adaptive scraping that survives UI changes. Currently brittle to layout changes.' },
  { gap: 'Residential proxy not connected', impact: 'high', desc: 'Google blocks datacenter IPs. Residential proxy is supported by the engine but no proxy provider is connected. Blocks SERP scraping at scale.' },
  { gap: 'Context persistence (context_create/use)', impact: 'high', desc: 'Persistent browser contexts would let the system maintain logged-in sessions across runs — critical for social media automation and directory submissions.' },
  { gap: 'MCP gateway not exposed', impact: 'medium', desc: 'The MCP surface is designed but not deployed as a public endpoint. Would allow ChatGPT/Claude to control the browser directly.' },
  { gap: 'No social media connectors', impact: 'high', desc: 'Facebook, Instagram, TikTok, YouTube are not connected. CloudBrowser could automate posting/scheduling but no OAuth connectors exist.' },
  { gap: 'No Google Business connector', impact: 'high', desc: 'Google Business Profile API not connected. Cannot automate listing management, review responses, or post scheduling.' },
  { gap: 'No domain registrar API', impact: 'medium', desc: 'Cannot purchase domains through the system. Domain identification exists but buying requires manual registrar interaction.' },
  { gap: 'No content deployment pipeline', impact: 'high', desc: 'Content generator produces content but no pipeline to deploy it to live sites (WordPress, Webflow, Vercel). CloudBrowser could paste into CMS but not wired.' },
  { gap: 'No backlink outreach automation', impact: 'medium', desc: 'CloudBrowser could fill out guest post forms and send outreach emails, but no workflow is built for this.' },
  { gap: 'No review monitoring loop', impact: 'medium', desc: 'CloudBrowser could monitor review sites and draft responses, but no scheduled workflow exists.' },
];

const STATUS_TONE = { implemented: 'good', available: 'info', roadmap: 'idle', gap: 'bad' };
const IMPACT_TONE = { critical: 'bad', high: 'warn', medium: 'info', low: 'idle' };

export default function CloudBrowser() {
  const { rows: capabilities, loading } = useGlobalData('Capability', '-impact_score');
  const [tab, setTab] = useState('mcp');

  const implementedCount = useMemo(() => capabilities.filter((c) => c.status === 'implemented').length, [capabilities]);
  const availableCount = useMemo(() => capabilities.filter((c) => c.status === 'available').length, [capabilities]);
  const roadmapCount = useMemo(() => capabilities.filter((c) => c.status === 'roadmap').length, [capabilities]);

  const totalActions = Object.values(BROWSER_ACTIONS).flat().length;
  const implementedActions = Object.values(BROWSER_ACTIONS).flat().filter((a) => a.status === 'implemented').length;

  return (
    <div>
      <PageHeader
        eyebrow="CloudBrowser Control"
        title="Full Capability Inventory & Gap Analysis"
        description="Every capability the CloudBrowser fleet possesses, every capability technically possible, and every gap between the two. This is the technological map of what the system can do — and what it must do next."
      />

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="MCP Tools" value={`${MCP_TOOLS.filter((t) => t.status === 'implemented').length}/${MCP_TOOLS.length}`} tone="good" />
        <StatTile label="Browser Actions" value={`${implementedActions}/${totalActions}`} tone="good" />
        <StatTile label="AI Primitives" value={`${AI_PRIMITIVES.filter((p) => p.status === 'implemented').length}/${AI_PRIMITIVES.length}`} tone="warn" />
        <StatTile label="Session Features" value={`${SESSION_FEATURES.filter((f) => f.status === 'implemented').length}/${SESSION_FEATURES.length}`} tone="good" />
        <StatTile label="System Capabilities" value={`${implementedCount}/${capabilities.length || '?'}`} tone="info" />
        <StatTile label="Open Gaps" value={GAPS.length} tone="bad" />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {[
          ['mcp', 'MCP Tools', Globe],
          ['actions', 'Browser Actions', MousePointer],
          ['ai', 'AI Primitives', Cpu],
          ['sessions', 'Session Features', Network],
          ['system', 'System Capabilities', Zap],
          ['gaps', 'Gap Analysis', AlertCircle],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* MCP Tools */}
      {tab === 'mcp' && (
        <Panel title="MCP Tool Surface" subtitle="The Model Context Protocol tools exposed to AI clients">
          <div className="divide-y divide-border">
            {MCP_TOOLS.map((t) => (
              <div key={t.name} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-medium text-foreground">{t.name}</code>
                    <StatusPill tone={STATUS_TONE[t.status]}>{t.status}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Browser Actions */}
      {tab === 'actions' && (
        <div className="space-y-4">
          {Object.entries(BROWSER_ACTIONS).map(([category, actions]) => (
            <Panel key={category} title={category} subtitle={`${actions.filter((a) => a.status === 'implemented').length}/${actions.length} implemented`}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {actions.map((a) => (
                  <div key={a.name} className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5">
                    {a.status === 'implemented' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0">
                      <code className="font-mono text-xs font-medium text-foreground">{a.name}</code>
                      <p className="text-[11px] leading-snug text-muted-foreground">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* AI Primitives */}
      {tab === 'ai' && (
        <Panel title="AI-Native Browser Primitives" subtitle="The four primitives that make the browser intelligent — not just scripted">
          <div className="grid gap-4 sm:grid-cols-2">
            {AI_PRIMITIVES.map((p) => (
              <div key={p.name} className="rounded-lg border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-heading text-sm font-semibold text-foreground">{p.name}</div>
                    <StatusPill tone={STATUS_TONE[p.status]}>{p.status}</StatusPill>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Session Features */}
      {tab === 'sessions' && (
        <Panel title="Session Features" subtitle="Capabilities of each browser session">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SESSION_FEATURES.map((f) => (
              <div key={f.name} className="flex items-start gap-2 rounded-md border border-border bg-card p-2.5">
                {f.status === 'implemented' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : f.status === 'available' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-medium text-foreground">{f.name}</span>
                    <StatusPill tone={STATUS_TONE[f.status]}>{f.status}</StatusPill>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* System Capabilities */}
      {tab === 'system' && (
        <Panel title="System Capabilities" subtitle={`${implementedCount} implemented · ${availableCount} available · ${roadmapCount} roadmap`}>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="divide-y divide-border">
              {capabilities.slice(0, 50).map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-sm font-medium text-foreground">{c.name}</span>
                      <StatusPill tone={STATUS_TONE[c.status]}>{c.status.replace('_', ' ')}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-xs font-medium text-foreground">{c.impact_score || 0}</div>
                    <div className="text-[10px] text-muted-foreground">impact</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Gap Analysis */}
      {tab === 'gaps' && (
        <Panel title="Gap Analysis" subtitle="What's technically possible but not yet wired">
          <div className="space-y-3">
            {GAPS.map((g, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 font-mono text-[10px] font-bold text-destructive">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-medium text-foreground">{g.gap}</span>
                    <StatusPill tone={IMPACT_TONE[g.impact]}>{g.impact}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const colors = { good: 'text-emerald-600', info: 'text-blue-600', warn: 'text-amber-600', bad: 'text-rose-600', idle: 'text-muted-foreground' };
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className={`font-heading text-2xl font-semibold ${colors[tone]}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}