import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Mail, Search, Zap, Clock, ExternalLink, Copy, Server } from 'lucide-react';

export default function FallbackInfrastructure() {
  const [loading, setLoading] = useState(false);
  const [gscReport, setGscReport] = useState(null);
  const [emailTest, setEmailTest] = useState(null);
  const [llmTest, setLlmTest] = useState(null);
  const [copied, setCopied] = useState(null);

  const runGscCheck = async () => {
    setLoading(true);
    setGscReport(null);
    try {
      const res = await base44.functions.invoke('GscVerificationMonitor', { action: 'check_all' });
      setGscReport(res.data);
    } catch (err) {
      setGscReport({ error: err.message });
    }
    setLoading(false);
  };

  const attemptVerification = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('GscVerificationMonitor', { action: 'attempt_verification' });
      setGscReport(res.data);
    } catch (err) {
      setGscReport({ error: err.message });
    }
    setLoading(false);
  };

  const testEmail = async () => {
    setLoading(true);
    setEmailTest(null);
    try {
      const res = await base44.functions.invoke('DirectEmailSender', {
        to: 'test@example.com',
        subject: 'Fallback Infrastructure Test — Gmail Connector',
        text: 'This email was sent via the Gmail OAuth connector, bypassing Base44 SendEmail credits.',
        html: '<p>This email was sent via the <strong>Gmail OAuth connector</strong>, bypassing Base44 SendEmail credits.</p><p>Fallback infrastructure is working.</p>',
      });
      setEmailTest(res.data);
    } catch (err) {
      setEmailTest({ error: err.message });
    }
    setLoading(false);
  };

  const testLlm = async () => {
    setLoading(true);
    setLlmTest(null);
    try {
      const res = await base44.functions.invoke('VercelAIGateway', {
        prompt: 'Respond with exactly: "Vercel AI Gateway is operational and bypasses Base44 credits."',
        model: 'openai/gpt-4o-mini',
        max_tokens: 100,
      });
      setLlmTest(res.data);
    } catch (err) {
      setLlmTest({ error: err.message });
    }
    setLoading(false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Fallback Infrastructure</h1>
          <p className="text-sm text-muted-foreground">
            Alternative technology pathways that keep the system running without Base44 integration credits.
          </p>
        </div>

        {/* Status Banner */}
        <div className="mb-6 p-4 rounded-lg border-2 border-yellow-400 bg-yellow-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Base44 Integration Credits Exhausted</p>
              <p className="text-sm text-gray-700">
                Core integrations (InvokeLLM, SendEmail, GenerateImage, etc.) and all workflows are blocked until <strong>Sept 12, 2026</strong>.
                The alternatives below use different technology pathways and are <strong>not affected</strong> by this limitation.
              </p>
            </div>
          </div>
        </div>

        {/* Alternative Pathways Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* LLM Alternative */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="font-bold text-foreground">AI / LLM Generation</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Available Now</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Vercel AI Gateway</strong> — calls OpenAI models directly via your Vercel API token. Bypasses Base44 InvokeLLM entirely.
            </p>
            <div className="space-y-2">
              <button
                onClick={testLlm}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-medium rounded text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Test Vercel AI Gateway
              </button>
              {llmTest && (
                <div className={`p-3 rounded text-sm ${llmTest.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {llmTest.error ? `Error: ${llmTest.error}` : `✓ Response: ${llmTest.result?.substring(0, 100)}`}
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Function: <code className="bg-muted px-1.5 py-0.5 rounded">VercelAIGateway</code> — uses <code className="bg-muted px-1.5 py-0.5 rounded">VERCEL_API_TOKEN</code> secret
            </div>
          </div>

          {/* Email Alternative */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-foreground">Email Sending</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Available Now</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Gmail Connector Direct</strong> — sends email via Gmail OAuth token, calling the Gmail API directly. Bypasses Base44 SendEmail.
            </p>
            <div className="space-y-2">
              <button
                onClick={testEmail}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium rounded text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Test Gmail Direct Send
              </button>
              {emailTest && (
                <div className={`p-3 rounded text-sm ${emailTest.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {emailTest.error ? `Error: ${emailTest.error}` : `✓ Sent! Message ID: ${emailTest.message_id}`}
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Function: <code className="bg-muted px-1.5 py-0.5 rounded">DirectEmailSender</code> — uses <code className="bg-muted px-1.5 py-0.5 rounded">gmail</code> connector OAuth
            </div>
          </div>

          {/* GSC Verification */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-green-500" />
              <h2 className="font-bold text-foreground">GSC Verification Monitor</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Available Now</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Checks all GSC properties, identifies unverified/missing domains, and generates DNS TXT verification instructions.
            </p>
            <div className="space-y-2">
              <button
                onClick={runGscCheck}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-medium rounded text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Check GSC Status
              </button>
              {gscReport && !gscReport.error && (
                <button
                  onClick={attemptVerification}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-60 font-medium rounded text-sm"
                >
                  Attempt Auto-Verification
                </button>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Function: <code className="bg-muted px-1.5 py-0.5 rounded">GscVerificationMonitor</code> — uses <code className="bg-muted px-1.5 py-0.5 rounded">google_search_console</code> connector
            </div>
          </div>

          {/* External Cron */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-foreground">External Cron Jobs</h2>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Setup Required</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Since Base44 workflows are blocked, use external cron to call function endpoints on a schedule.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">Option 1: cron-job.org (free)</p>
              <div className="bg-muted p-2 rounded font-mono text-xs flex items-center justify-between">
                <span>https://seo-generator.base44.app/functions/SyncSearchConsole</span>
                <button onClick={() => copyToClipboard('https://seo-generator.base44.app/functions/SyncSearchConsole', 'cron1')} className="text-muted-foreground hover:text-foreground">
                  {copied === 'cron1' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="font-medium text-foreground mt-2">Option 2: GitHub Actions (free)</p>
              <p className="text-xs text-muted-foreground">Schedule a workflow that calls the endpoint with curl on a cron schedule.</p>
              <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-1">
                Set up at cron-job.org <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* GSC Report */}
        {gscReport && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-3">GSC Verification Report</h2>
            {gscReport.error ? (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{gscReport.error}</div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{gscReport.verified}</p>
                    <p className="text-xs text-green-700">Verified</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-600">{gscReport.unverified}</p>
                    <p className="text-xs text-yellow-700">Unverified</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-600">{gscReport.missing}</p>
                    <p className="text-xs text-red-700">Missing</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {gscReport.report?.map((item, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{item.domain}</h3>
                          <p className="text-xs text-muted-foreground">Known issue: {item.known_issue}</p>
                        </div>
                        <StatusBadge status={item.gsc_status} />
                      </div>
                      {item.verification_instructions && (
                        <div className="mt-3 p-3 bg-muted rounded text-sm">
                          <p className="font-medium mb-2 text-foreground">Verification Instructions (DNS TXT):</p>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                            {item.verification_instructions.method_dns_txt.steps.map((step, j) => (
                              <li key={j}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {gscReport.verification_attempts?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-foreground mb-2">Verification Attempts</h3>
                    {gscReport.verification_attempts.map((att, i) => (
                      <div key={i} className={`p-3 rounded text-sm mb-2 ${att.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <strong>{att.domain}</strong>: {att.message}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Architecture Summary */}
        <div className="border border-border rounded-lg p-5 bg-card">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Server className="w-5 h-5 text-muted-foreground" />
            Alternative Architecture Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Capability</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Base44 (Blocked)</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Alternative (Working)</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Technology</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 px-3">AI / LLM</td>
                  <td className="py-2 px-3 text-red-600">InvokeLLM</td>
                  <td className="py-2 px-3 text-green-600">VercelAIGateway</td>
                  <td className="py-2 px-3 text-xs">Vercel AI Gateway → OpenAI GPT-4o-mini</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3">Email</td>
                  <td className="py-2 px-3 text-red-600">SendEmail</td>
                  <td className="py-2 px-3 text-green-600">DirectEmailSender</td>
                  <td className="py-2 px-3 text-xs">Gmail OAuth Connector → Gmail API</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3">GSC Data</td>
                  <td className="py-2 px-3 text-red-600">N/A (connector-based)</td>
                  <td className="py-2 px-3 text-green-600">SyncSearchConsole</td>
                  <td className="py-2 px-3 text-xs">GSC OAuth Connector → Webmasters API</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3">Analytics</td>
                  <td className="py-2 px-3 text-red-600">N/A (connector-based)</td>
                  <td className="py-2 px-3 text-green-600">GoogleAnalyticsDashboard</td>
                  <td className="py-2 px-3 text-xs">GA OAuth Connector → GA4 API</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3">Scheduled Tasks</td>
                  <td className="py-2 px-3 text-red-600">Base44 Workflows</td>
                  <td className="py-2 px-3 text-green-600">External Cron</td>
                  <td className="py-2 px-3 text-xs">cron-job.org / GitHub Actions → Function URLs</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-3">Image Generation</td>
                  <td className="py-2 px-3 text-red-600">GenerateImage</td>
                  <td className="py-2 px-3 text-yellow-600">VercelAIGateway (DALL-E)</td>
                  <td className="py-2 px-3 text-xs">Vercel AI Gateway → OpenAI DALL-E</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">File Storage</td>
                  <td className="py-2 px-3 text-red-600">UploadPublicFile</td>
                  <td className="py-2 px-3 text-yellow-600">Vercel Blob (setup needed)</td>
                  <td className="py-2 px-3 text-xs">Vercel Blob API → direct fetch</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    verified: 'bg-green-100 text-green-700',
    verified_owner: 'bg-green-100 text-green-700',
    unverified: 'bg-yellow-100 text-yellow-700',
    missing: 'bg-red-100 text-red-700',
    restricted: 'bg-orange-100 text-orange-700',
  };
  const icons = {
    verified: <CheckCircle2 className="w-3 h-3" />,
    verified_owner: <CheckCircle2 className="w-3 h-3" />,
    unverified: <AlertCircle className="w-3 h-3" />,
    missing: <XCircle className="w-3 h-3" />,
    restricted: <AlertCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {icons[status]}
      {status}
    </span>
  );
}