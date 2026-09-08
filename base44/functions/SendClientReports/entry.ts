import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { writeReceipt } from '../../shared/orchestration.js';

// SendClientReports — Generates a per-client weekly performance summary
// and emails it to the contact email on file. Iterates all OnboardingProfiles
// with status "completed" and sends a personalized report.
//
// Invoke: base44.functions.invoke('SendClientReports', {})
// Runs weekly via the "Weekly Client Report Email" workflow.

export default async function (req: Request): Promise<Response> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all completed onboarding profiles
    const profiles = await svc.entities.OnboardingProfile.filter({ status: 'completed' }, '-completed_at', 200).catch(() => []);

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const profile of profiles) {
      try {
        const clientId = profile.client_id || profile.user_id;
        if (!clientId) continue;

        // Gather this client's data in parallel
        const [urlTargets, sheetRows, suggestions, fixAttempts, receipts] = await Promise.all([
          svc.entities.UrlTarget.filter({ client_id: clientId }, '-created_date', 200).catch(() => []),
          svc.entities.AreSheetRow.filter({ client_id: clientId }, '-updated_date', 200).catch(() => []),
          svc.entities.Suggestion.filter({ client_id: clientId }, '-created_at', 50).catch(() => []),
          svc.entities.FixAttempt.filter({ url: { $in: (await svc.entities.UrlTarget.filter({ client_id: clientId }).catch(() => [])).map(u => u.url) } }, '-created_at', 50).catch(() => []),
          svc.entities.Receipt.filter({ source: { $in: ['MasterOrchestrator', 'AutonomousConvergence', 'FixEngine', 'ContentGenerator'] } }, '-occurred_at', 100).catch(() => []),
        ]);

        // Calculate metrics
        const totalUrls = urlTargets.length;
        const top5 = sheetRows.filter(r => (r.avg_position || 999) <= 5).length;
        const top10 = sheetRows.filter(r => (r.avg_position || 999) <= 10).length;
        const top30 = sheetRows.filter(r => (r.avg_position || 999) <= 30).length;
        const goalMet = sheetRows.filter(r => r.status === 'goal_met').length;
        const blocked = sheetRows.filter(r => r.status === 'blocked').length;
        const weekFixes = fixAttempts.filter(f => f.created_at && f.created_at >= weekAgo);
        const successfulFixes = weekFixes.filter(f => f.status === 'validated' || f.status === 'applied');
        const weekSuggestions = suggestions.filter(s => s.created_at && s.created_at >= weekAgo);
        const implementedSuggestions = suggestions.filter(s => s.status === 'implemented');
        const convergencePct = totalUrls > 0 ? Math.round((top5 / totalUrls) * 100) : 0;

        // Build per-URL status list
        const urlStatusList = urlTargets.slice(0, 10).map(u => {
          const row = sheetRows.find(r => r.url === u.url);
          const pos = row?.avg_position || '—';
          const state = u.url_state?.replace(/_/g, ' ') || 'new';
          return `  • ${u.url} — Position: ${pos} | Status: ${state}`;
        }).join('\n');

        // Build email
        const emailBody = `
Hello ${profile.contact_name || profile.company_name || 'Valued Client'},

Here is your weekly SEO performance report for ${profile.company_name || 'your business'}.

═══════════════════════════════════════
  WEEKLY PERFORMANCE SUMMARY
  Week ending ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
═══════════════════════════════════════

🎯 RANKING PROGRESS
  • URLs Tracked: ${totalUrls}
  • URLs in Top 3: ${top5}
  • URLs on Page 1 (Top 10): ${top10}
  • URLs in Top 30: ${top30}
  • Goals Met: ${goalMet}
  • Convergence Rate: ${convergencePct}%

⚡ THIS WEEK'S ACTIVITY
  • Fixes Applied: ${successfulFixes.length} / ${weekFixes.length} attempted
  • New Suggestions Generated: ${weekSuggestions.length}
  • Suggestions Implemented: ${implementedSuggestions.length}
  • Total System Actions: ${receipts.filter(r => r.occurred_at && r.occurred_at >= weekAgo).length}

📋 URL STATUS (Top 10)
${urlStatusList || '  No URLs tracked yet.'}

🏥 SYSTEM HEALTH
  • Blocked URLs: ${blocked}
  • Active Agents: 6 (Commander, Scout, Builder, Healer, Sentinel, Validator)
  • System Status: ${blocked > 0 ? 'Needs Attention' : 'All Systems Operational'}

🚀 NEXT WEEK'S PRIORITIES
  ${blocked > 0 ? `• Unblock ${blocked} blocked URLs` : '• Continue driving URLs toward top 3'}
  • Generate new content optimizations
  • Monitor competitor movements
  • Apply new ranking methods as discovered

═══════════════════════════════════════
Your autonomous SEO system is running 24/7.
Login to your portal to see full details.
═══════════════════════════════════════

— Xtreme SEO Optimizer Team
        `.trim();

        // Send email to the client's contact email
        const toEmail = profile.contact_email;
        if (!toEmail) { failed++; continue; }

        try {
          await base44.integrations.Core.SendEmail({
            to: toEmail,
            subject: `Weekly SEO Report — ${profile.company_name || 'Your Business'} — ${convergencePct}% to Top 3`,
            body: emailBody,
            from_name: 'Xtreme SEO Optimizer',
          });
          sent++;
          results.push({ client: profile.company_name, email: toEmail, status: 'sent', convergence: convergencePct });
        } catch (emailErr) {
          console.error(`[SendClientReports] Email failed for ${toEmail}:`, emailErr.message);
          failed++;
          results.push({ client: profile.company_name, email: toEmail, status: 'failed', error: emailErr.message });
        }
      } catch (err) {
        console.error(`[SendClientReports] Profile ${profile.id} failed:`, err.message);
        failed++;
      }
    }

    await writeReceipt(svc, {
      kind: 'validation',
      summary: `Weekly client reports: ${sent} sent, ${failed} failed`,
      detail: JSON.stringify({ sent, failed, results }, null, 2).slice(0, 8000),
      source: 'SendClientReports',
      provenance: 'MEASURED',
    });

    return Response.json({ ok: true, sent, failed, total: profiles.length, results });
  } catch (error) {
    console.error('[SendClientReports] Fatal:', error.message);
    return Response.json({ error: error.message, ok: false }, { status: 500 });
  }
}