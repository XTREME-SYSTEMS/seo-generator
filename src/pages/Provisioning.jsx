import React, { useState, useEffect, useCallback } from 'react';
import {
  Server, Brain, Database, HardDrive, FileText, Table2,
  Calendar, ListTodo, Mail, Cloud, Zap, CheckCircle2, XCircle,
  Loader2, RefreshCw, Plug, ArrowRight, Activity, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const CONNECTOR_META = {
  supabase: { name: 'Supabase', icon: Database, color: 'text-emerald-500', desc: 'PostgreSQL database & data sync' },
  drive: { name: 'Google Drive', icon: HardDrive, color: 'text-sky-500', desc: 'File storage & exports' },
  docs: { name: 'Google Docs', icon: FileText, color: 'text-blue-500', desc: 'Content document generation' },
  sheets: { name: 'Google Sheets', icon: Table2, color: 'text-green-500', desc: 'Spreadsheet data export' },
  calendar: { name: 'Google Calendar', icon: Calendar, color: 'text-rose-500', desc: 'SEO task scheduling' },
  tasks: { name: 'Google Tasks', icon: ListTodo, color: 'text-amber-500', desc: 'Task creation from suggestions' },
  gmail: { name: 'Gmail', icon: Mail, color: 'text-purple-500', desc: 'Email reports & notifications' },
};

function StatusBadge({ connected }) {
  return connected ? (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected
    </span>
  ) : (
    <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
      <span className="h-2 w-2 rounded-full bg-red-400" /> Not Connected
    </span>
  );
}

function IntegrationCard({ metaKey, connected, onTest, testing }) {
  const meta = CONNECTOR_META[metaKey];
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted`}>
            <Icon className={`h-5 w-5 ${meta.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{meta.name}</h3>
            <p className="text-xs text-muted-foreground">{meta.desc}</p>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>
      <Button
        onClick={onTest}
        disabled={testing}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
        {testing ? 'Testing...' : 'Test Connection'}
      </Button>
    </div>
  );
}

export default function Provisioning() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('ProvisioningManager', { action: 'status' });
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleTestConnector = async (connector) => {
    setTesting(connector);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke('ProvisioningManager', { action: 'test-connector', connector });
      setTestResult({ connector, ...res.data });
    } catch (err) {
      setTestResult({ connector, connected: false, error: err.message });
    }
    setTesting(null);
  };

  const handleTestAIGateway = async () => {
    setTesting('ai-gateway');
    setTestResult(null);
    try {
      const res = await base44.functions.invoke('ProvisioningManager', { action: 'test-ai-gateway' });
      setTestResult({ connector: 'ai-gateway', ...res.data });
    } catch (err) {
      setTestResult({ connector: 'ai-gateway', connected: false, error: err.message });
    }
    setTesting('ai-gateway');
    setTesting(null);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const vercel = status?.vercel || {};
  const aiGateway = status?.aiGateway || {};
  const connectors = status?.connectors || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Infrastructure Provisioning</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vercel infrastructure, AI Gateway, Supabase, and Google Workspace integrations.
          </p>
        </div>
        <Button onClick={loadStatus} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Vercel Infrastructure */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <Server className="h-4 w-4 text-primary" /> Vercel Infrastructure
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Project Status */}
          <div className="rounded-lg border border-border bg-accent/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Cloud className="h-4 w-4 text-sky-500" />
              <span className="text-sm font-medium text-foreground">Cron Runner Project</span>
            </div>
            {vercel.available ? (
              <>
                <p className="text-xs text-muted-foreground">{vercel.project?.name || 'seo-cron-runner'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status: <span className="font-medium text-emerald-600">{vercel.project?.ready || 'READY'}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Crons: <span className="font-medium text-foreground">{vercel.crons}</span> registered
                </p>
                {vercel.project?.url && (
                  <a href={`https://${vercel.project.url}`} target="_blank" rel="noreferrer"
                     className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                    {vercel.project.url} <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-red-500">Not configured</p>
            )}
          </div>

          {/* AI Gateway */}
          <div className="rounded-lg border border-border bg-accent/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Vercel AI Gateway</span>
            </div>
            <StatusBadge connected={aiGateway.available} />
            {aiGateway.available && (
              <p className="mt-2 text-xs text-muted-foreground">
                Models: <span className="font-medium text-foreground">{aiGateway.models}</span> available
              </p>
            )}
            <Button
              onClick={handleTestAIGateway}
              disabled={testing === 'ai-gateway'}
              variant="outline"
              size="sm"
              className="mt-3 w-full"
            >
              {testing === 'ai-gateway' ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
              {testing === 'ai-gateway' ? 'Testing...' : 'Test AI Gateway'}
            </Button>
          </div>

          {/* Cron Jobs Summary */}
          <div className="rounded-lg border border-border bg-accent/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">Cron Jobs</span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">{vercel.crons || 0}</p>
            <p className="text-xs text-muted-foreground">automated schedules running</p>
            <p className="mt-2 text-xs text-muted-foreground">
              All 31 workflows migrated from Base44 to Vercel Crons
            </p>
          </div>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div className={`rounded-xl border p-4 ${testResult.connected ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-start gap-3">
            {testResult.connected ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {testResult.connector}: {testResult.connected ? 'Connection successful' : 'Connection failed'}
              </p>
              {testResult.response && <p className="mt-1 text-xs text-muted-foreground">Response: {testResult.response}</p>}
              {testResult.error && <p className="mt-1 text-xs text-red-500">{testResult.error}</p>}
              {testResult.detail && <p className="mt-1 text-xs text-red-500">{testResult.detail}</p>}
              <Button onClick={() => setTestResult(null)} variant="ghost" size="sm" className="mt-2">Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      {/* Google Workspace & Supabase */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <Plug className="h-4 w-4 text-primary" /> Connected Services
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(CONNECTOR_META).map(([key, _meta]) => (
            <IntegrationCard
              key={key}
              metaKey={key}
              connected={connectors[key]?.connected}
              testing={testing === key}
              onTest={() => handleTestConnector(key)}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Button
            onClick={async () => {
              try {
                const rows = await base44.entities.AreSheetRow.list('-updated_date', 100);
                const data = [
                  ['URL', 'Query', 'Rank', 'Clicks', 'Impressions', 'Score'],
                  ...rows.map(r => [r.url, r.query, r.rank || '', r.clicks || 0, r.impressions || 0, r.score || 0]),
                ];
                const res = await base44.functions.invoke('GoogleWorkspaceSync', {
                  action: 'export-to-sheets',
                  data,
                  sheet_name: 'ARE Sheet Export ' + new Date().toLocaleDateString(),
                });
                setTestResult({ connector: 'sheets-export', connected: true, response: `Exported ${res.data?.updated_cells || 0} cells` });
              } catch (err) { setTestResult({ connector: 'sheets-export', connected: false, error: err.message }); }
            }}
            variant="outline"
            className="justify-start"
          >
            <Table2 className="mr-2 h-4 w-4 text-green-500" /> Export ARE Sheet to Google Sheets
          </Button>
          <Button
            onClick={async () => {
              try {
                const res = await base44.functions.invoke('SupabaseSync', { action: 'list-projects' });
                setTestResult({ connector: 'supabase-projects', connected: true, response: `Found ${res.data?.projects?.length || 0} projects` });
              } catch (err) { setTestResult({ connector: 'supabase-projects', connected: false, error: err.message }); }
            }}
            variant="outline"
            className="justify-start"
          >
            <Database className="mr-2 h-4 w-4 text-emerald-500" /> List Supabase Projects
          </Button>
          <Button
            onClick={async () => {
              try {
                const suggestions = await base44.entities.Suggestion.filter({ status: 'new' }, '-created_at', 10);
                for (const s of suggestions) {
                  await base44.functions.invoke('GoogleWorkspaceSync', {
                    action: 'create-task',
                    title: s.title,
                    notes: s.rationale || s.treatment || '',
                  });
                }
                setTestResult({ connector: 'tasks-create', connected: true, response: `Created ${suggestions.length} Google Tasks` });
              } catch (err) { setTestResult({ connector: 'tasks-create', connected: false, error: err.message }); }
            }}
            variant="outline"
            className="justify-start"
          >
            <ListTodo className="mr-2 h-4 w-4 text-amber-500" /> Create Google Tasks from Suggestions
          </Button>
        </div>
      </div>
    </div>
  );
}