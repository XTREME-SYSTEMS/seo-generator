import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const checks = await base44.asServiceRole.entities.BenchmarkCheck.list('-created_date', 500);

    const mandatory = checks.filter(c => c.mandatory);
    const mandatoryPass = mandatory.filter(c => c.status === 'PASS');
    const mandatoryFail = mandatory.filter(c => c.status === 'FAIL');
    const mandatoryNotRun = mandatory.filter(c => c.status === 'NOT_RUN');
    const mandatoryNA = mandatory.filter(c => c.status === 'N/A');
    const optional = checks.filter(c => !c.mandatory);

    const totalChecks = checks.length;
    const totalPass = checks.filter(c => c.status === 'PASS').length;
    const totalFail = checks.filter(c => c.status === 'FAIL').length;
    const totalNotRun = checks.filter(c => c.status === 'NOT_RUN').length;

    // VERIFIED_100 contract: all mandatory checks must PASS or N/A with evidence
    const allMandatoryResolved = mandatory.every(c => c.status === 'PASS' || c.status === 'N/A');
    const noFails = totalFail === 0;
    const noNotRun = totalNotRun === 0;

    let completionStatus;
    if (totalChecks === 0) {
      completionStatus = 'UNBENCHMARKED';
    } else if (allMandatoryResolved && noFails && noNotRun) {
      completionStatus = 'VERIFIED_100';
    } else if (totalFail > 0) {
      completionStatus = 'FAIL';
    } else if (totalNotRun > 0) {
      completionStatus = 'INCOMPLETE';
    } else {
      completionStatus = 'PARTIAL';
    }

    const passRate = totalChecks > 0 ? Math.round((totalPass / totalChecks) * 100) : 0;
    const mandatoryPassRate = mandatory.length > 0 ? Math.round((mandatoryPass.length / mandatory.length) * 100) : 0;

    // Update validation score domain for benchmark constitution
    const validationScores = await base44.asServiceRole.entities.ValidationScore.filter({ domain: 'Benchmark constitution' });
    if (validationScores.length > 0) {
      const earnedScore = completionStatus === 'VERIFIED_100' ? validationScores[0].weight : Math.round((totalPass / totalChecks) * validationScores[0].weight);
      await base44.asServiceRole.entities.ValidationScore.update(validationScores[0].id, {
        status: completionStatus === 'VERIFIED_100' ? 'PASS' : (totalFail > 0 ? 'FAIL' : 'PENDING'),
        evidence: `${totalPass}/${totalChecks} checks pass. Mandatory: ${mandatoryPass.length}/${mandatory.length}. Status: ${completionStatus}`,
        earned_score: earnedScore,
        last_checked_at: new Date().toISOString(),
      });
    }

    // Create receipt
    await base44.asServiceRole.entities.Receipt.create({
      summary: `Benchmark constitution run: ${completionStatus} (${passRate}% pass rate, ${mandatoryPassRate}% mandatory)`,
      source: 'RunBenchmarkConstitution',
      occurred_at: new Date().toISOString(),
      proof_level: 1,
      evidence_url: null,
    });

    return Response.json({
      completionStatus,
      passRate,
      mandatoryPassRate,
      totalChecks,
      totalPass,
      totalFail,
      totalNotRun,
      mandatory: { total: mandatory.length, pass: mandatoryPass.length, fail: mandatoryFail.length, notRun: mandatoryNotRun.length, na: mandatoryNA.length },
      optional: { total: optional.length, pass: optional.filter(c => c.status === 'PASS').length },
      failedChecks: mandatoryFail.map(c => ({ id: c.benchmark_id, check: c.check, family: c.family })),
      notRunChecks: mandatoryNotRun.map(c => ({ id: c.benchmark_id, check: c.check, family: c.family })),
    });
  } catch (error) {
    console.error('RunBenchmarkConstitution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}