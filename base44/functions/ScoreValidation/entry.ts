import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const scores = await base44.asServiceRole.entities.ValidationScore.list('-created_date', 100);

    const totalWeight = scores.reduce((sum, s) => sum + (s.weight || 0), 0);
    const earnedWeight = scores.reduce((sum, s) => {
      if (s.status === 'PASS') return sum + (s.weight || 0);
      if (s.status === 'PENDING') return sum + (s.earned_score || 0);
      return sum;
    }, 0);

    const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    const passCount = scores.filter(s => s.status === 'PASS').length;
    const pendingCount = scores.filter(s => s.status === 'PENDING').length;
    const failCount = scores.filter(s => s.status === 'FAIL').length;
    const blockedCount = scores.filter(s => s.status === 'BLOCKED').length;

    // No false green: if any mandatory domain is FAIL or BLOCKED, overall cannot be PASS
    const hasBlocking = failCount > 0 || blockedCount > 0;
    const completionStatus = hasBlocking ? 'BLOCKED' : (pendingCount === 0 && passCount === scores.length ? 'VERIFIED_100' : 'IN_PROGRESS');

    const domains = scores.map(s => ({
      domain: s.domain,
      weight: s.weight,
      status: s.status,
      evidence: s.evidence,
      earned: s.status === 'PASS' ? s.weight : (s.earned_score || 0),
      blocking_reason: s.blocking_reason,
      remediation: s.remediation,
    }));

    return Response.json({
      overallScore,
      totalWeight,
      earnedWeight,
      completionStatus,
      passCount,
      pendingCount,
      failCount,
      blockedCount,
      totalDomains: scores.length,
      domains,
    });
  } catch (error) {
    console.error('ScoreValidation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}