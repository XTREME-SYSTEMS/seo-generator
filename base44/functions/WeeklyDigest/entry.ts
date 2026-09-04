import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// WeeklyDigest — generates a comprehensive performance report and emails it
// to the app admin. Summarizes: convergence progress, URLs at target, gaps
// fixed, capabilities implemented, methods discovered, system health, and
// next priorities. Runs every Monday at 8 AM ET.
//
// Invoke: base44.functions.invoke('WeeklyDigest', { email? })
// If email is omitted, sends to the first admin user's email.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const body = await req.json().catch(() => ({}));

    // ── GATHER WEEK'S DATA ──
    const [sheetRows, receipts, telemetry, reflections, methods, capabilities, fixAttempts, validations, gaps] = await Promise.all([
      svc.entities.AreSheetRow.list('-updated_date', 500).catch(() => []),
      svc.entities.Receipt.list('-occurred_at', 200).catch(() => []),
      svc.entities.RunTelemetry.list('-started_at', 100).catch(() => []),
      svc.entities.ReflectionRecord.list('-occurred_at', 50).catch(() => []),
      svc.entities.RankingMethod.list('-discovered_at', 50).catch(() => []),
      svc.entities.Capability.list('-impact_score', 100).catch(() => []),
      svc.entities.FixAttempt.list('-created_at', 100).catch(() => []),
      svc.entities.ValidationTest.list('-last_run_at', 50).catch(() => []),
      svc.entities.SystemGap.list('-logged_at', 30).catch(() => []),
    ]);

    // ── CALCULATE METRICS ──
    const totalUrls = sheetRows.length;
    const top5Urls = sheetRows.filter((r) => (r.avg_position || 999) <= 5).length;
    const top10Urls = sheetRows.filter((r) => (r.avg_position || 999) <= 10).length;
    const blockedRows = sheetRows.filter((r) => r.status === 'blocked').length;
    const goalMetRows = sheetRows.filter((r) => r.status === 'goal_met').length;
    const convergencePct = totalUrls > 0 ? Math.round((top5Urls / totalUrls) * 100) : 0;

    const weekReceipts = receipts.filter((r) => r.occurred_at && r.occurred_at >= weekAgo);
    const weekFixes = fixAttempts.filter((f) => f.created_at && f.created_at >= weekAgo);
    const successfulFixes = weekFixes.filter((f) => f.status === 'validated' || f.status === 'applied');
    const weekMethods = methods.filter((m) => m.discovered_at && m.discovered_at >= weekAgo);
    const implementedCaps = capabilities.filter((c) => c.status === 'implemented');
    const unimplementedCaps = capabilities.filter((c) => c.status !== 'implemented');
    const failingValidations = validations.filter((v) => v.status === 'fail');
    const openGaps = gaps.filter((g) => g.status === 'logged' || !g.status);

    // ── BUILD REPORT ──
    const report = {
      week_ending: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      convergence: {
        total_urls: totalUrls,
        top_5: top5Urls,
        top_10: top10Urls,
        convergence_pct: convergencePct,
        goal_met: goalMetRows,
        blocked: blockedRows,
      },
      activity: {
        actions_this_week: weekReceipts.length,
        fixes_attempted: weekFixes.length,
        fixes_successful: successfulFixes.length,
        methods_discovered: weekMethods.length,
        capabilities_implemented: implementedCaps.length,
        capabilities_remaining: unimplementedCaps.length,
      },
      health: {
        failing_validations: failingValidations.length,
        open_system_gaps: openGaps.length,
        recent_reflections: reflections.length,
      },
      top_priorities: [
        blockedRows > 0 ? `Unblock ${blockedRows} blocked URL rows` : null,
        unimplementedCaps.length > 0 ? `Implement ${unimplementedCaps.length} pending capabilities` : null,
        failingValidations.length > 0 ? `Fix ${failingValidations.length} failing validation tests` : null,
        openGaps.length > 0 ? `Resolve ${openGaps.length} open system gaps` : null,
        convergencePct < 100 ? `Drive ${totalUrls - top5Urls} URLs from current position to top-5` : null,
      ].filter(Boolean),
    };

    // ── BUILD EMAIL ──
    const emailBody = `
# Search Dominance OS — Weekly Digest
**Week ending ${report.week_ending}**

## 🎯 Convergence Progress
- **URLs at Top-5:** ${report.convergence.top_5} / ${report.convergence.total_urls} (${report.convergence.convergence_pct}%)
- **URLs on Page 1:** ${report.convergence.top_10}
- **Goals Met:** ${report.convergence.goal_met}
- **Blocked Rows:** ${report.convergence.blocked}

## ⚡ This Week's Activity
- **Actions Taken:** ${report.activity.actions_this_week}
- **Fixes Attempted:** ${report.activity.fixes_attempted}
- **Fixes Successful:** ${report.activity.fixes_successful}
- **Methods Discovered:** ${report.activity.methods_discovered}
- **Capabilities Implemented:** ${report.activity.capabilities_implemented}
- **Capabilities Remaining:** ${report.activity.capabilities_remaining}

## 🏥 System Health
- **Failing Validations:** ${report.health.failing_validations}
- **Open System Gaps:** ${report.health.open_system_gaps}
- **Recent Reflections:** ${report.health.recent_reflections}

## 📋 Top Priorities for Next Week
${report.top_priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---
This report was generated autonomously by the Vision Cortex Orchestrator.
The system is running 24/7 with 8 scheduled workflows.
`.trim();

    // ── SEND EMAIL ──
    let email = body.email;
    if (!email && user) email = user.email;
    if (!email) {
      const admins = await svc.entities.User.list().catch(() => []);
      const admin = admins.find((u) => u.role === 'admin');
      email = admin?.email;
    }

    let emailSent = false;
    if (email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Search Dominance OS — Weekly Digest (${report.convergence.convergence_pct}% converged)`,
          body: emailBody,
        });
        emailSent = true;
      } catch (e) {
        console.error('[WeeklyDigest] Email failed:', e.message);
      }
    }

    // ── LOG ──
    await svc.entities.Receipt.create({
      kind: 'validation',
      summary: `WeeklyDigest: ${convergencePct}% convergence, ${weekReceipts.length} actions this week, email ${emailSent ? 'sent' : 'not sent'}`,
      detail: JSON.stringify(report, null, 2).slice(0, 8000),
      source: 'weekly_digest',
      provenance: 'MEASURED',
      occurred_at: now.toISOString(),
    });

    return Response.json({ ok: true, report, email_sent: emailSent, email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}