import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { executeDeepArchitecturePipeline, type PipelineInput } from '../../shared/deepArchitecture.ts';

// Deep Architecture Pipeline — the deterministic, autonomous, end-to-end generator.
// Takes a business name + template + city, then runs the full pipeline:
//   1. Brand Intelligence (competitor analysis, industry intel, financial, domains, names)
//   2. SEO/AEO Content Generation (Google-compliant copy)
//   3. Image Generation (parallel, template-driven)
//   4. Section Assembly (deterministic builder templates)
//   5. QA Gate (Google spec compliance scoring)
//   6. Self-Healing (auto-regenerate if QA fails)
//
// Invoke: base44.functions.invoke('DeepArchitecturePipeline', {
//   business_name: "Acme Epoxy",
//   template_id: "epoxy",
//   city: "Dallas, TX",
//   phone: "(555) 123-4567",
//   page_type: "landing" | "funnel"
// })

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { business_name, template_id, city, phone, page_type, industry } = body;

    if (!business_name || !String(business_name).trim()) {
      return Response.json({ error: 'business_name is required' }, { status: 400 });
    }
    if (!template_id) {
      return Response.json({ error: 'template_id is required (e.g. epoxy, roofing, hvac, plumbing, electrical, pest_control, landscaping, cleaning, general_contractor, restaurant)' }, { status: 400 });
    }

    const input: PipelineInput = {
      business_name: String(business_name).trim(),
      template_id: String(template_id).trim(),
      city: city ? String(city).trim() : '',
      phone: phone ? String(phone).trim() : '',
      page_type: page_type === 'funnel' ? 'funnel' : 'landing',
      industry: industry ? String(industry).trim() : '',
    };

    console.log(`[DeepArchitecturePipeline] Starting pipeline for ${input.business_name} (${input.template_id})`);

    const result = await executeDeepArchitecturePipeline(base44, input);

    // Store the generated asset
    try {
      await base44.asServiceRole.entities.GeneratedAsset.create({
        generator_type: 'programmatic_site',
        title: `${input.business_name} — ${input.city || 'Local'} ${input.template_id}`,
        input_prompt: JSON.stringify(input),
        output_json: JSON.stringify({
          sections: result.generated_site?.sections?.length || 0,
          qa_score: result.qa_score,
          overall_status: result.overall_status,
          brand_intelligence: !!result.brand_intelligence,
        }),
        summary: `${result.overall_status.toUpperCase()} — QA ${result.qa_score}/100 — ${result.generated_site?.sections?.length || 0} sections — ${result.stages.filter(s => s.status === 'completed').length}/${result.stages.length} stages passed`,
        tags: [input.template_id, input.city, input.page_type, 'deep_architecture'],
        compliance_score: result.qa_score,
        status: result.overall_status === 'success' ? 'generated' : 'archived',
      });
    } catch (e) { console.error('[DeepArchitecturePipeline] Failed to store asset:', e.message); }

    // Record receipt
    try {
      await base44.asServiceRole.entities.Receipt.create({
        kind: 'deep_architecture_pipeline',
        summary: `Deep Architecture pipeline for ${input.business_name}: ${result.overall_status} (QA ${result.qa_score}/100)`,
        detail: result.stages.map(s => `${s.name}: ${s.status} (${s.duration_ms || 0}ms)`).join('; '),
        source: 'DeepArchitecturePipeline',
        provenance: 'MEASURED',
        occurred_at: new Date().toISOString(),
      });
    } catch (e) { console.error('[DeepArchitecturePipeline] Failed to store receipt:', e.message); }

    return Response.json({
      ok: true,
      overall_status: result.overall_status,
      qa_score: result.qa_score,
      stages: result.stages,
      generated_site: result.generated_site,
      brand_intelligence: result.brand_intelligence,
      qa_checks: result.qa_checks,
      recommendations: result.recommendations,
    });
  } catch (error) {
    console.error('[DeepArchitecturePipeline] Fatal error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}