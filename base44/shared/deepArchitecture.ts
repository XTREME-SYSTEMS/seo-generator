// Deep Architecture Pipeline — deterministic, autonomous, end-to-end orchestrator.
// Combines brand intelligence, SEO/AEO content generation, image generation,
// section assembly, QA gating, and self-healing into a single deterministic pipeline.
// Ported and unified from xtremeaibuilder3 templates.

import { getTemplate, buildCopyPrompt, assembleSections, CONTENT_SCHEMA, GALLERY_COUNT } from "./builderTemplates.ts";
import { runFullBrandIntelligence } from "./brandIntelligence.js";
import { validateUrl } from "./ssrfProtection.js";

export interface PipelineInput {
  business_name: string;
  template_id: string;
  city?: string;
  phone?: string;
  page_type?: "landing" | "funnel";
  industry?: string;
}

export interface PipelineStage {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  result?: any;
  error?: string;
}

export interface PipelineResult {
  input: PipelineInput;
  stages: PipelineStage[];
  overall_status: "success" | "partial" | "failed";
  generated_site: {
    sections: any[];
    images: { hero?: string; gallery: string[] };
    seo: any;
    phone?: string;
  } | null;
  brand_intelligence: any;
  qa_score: number;
  qa_checks: Record<string, { pass: boolean; detail: string }>;
  recommendations: string[];
}

// ── QA Gate: validate the generated site against Google specs ──
function runQAGate(copy: any, sections: any[], images: any, seo: any): { score: number; checks: Record<string, { pass: boolean; detail: string }> } {
  const checks: Record<string, { pass: boolean; detail: string }> = {};

  // Content renders — hero headline exists
  checks.contentRenders = {
    pass: !!(copy?.hero?.headline && copy?.hero?.headline.length > 10),
    detail: copy?.hero?.headline ? `Hero: "${copy.hero.headline.slice(0, 50)}..."` : "No hero headline",
  };

  // CTAs wired
  checks.ctasWired = {
    pass: !!(copy?.hero?.cta && sections.some(s => s.type === "cta")),
    detail: `CTA: ${copy?.hero?.cta || "missing"}`,
  };

  // Schema validates — SEO meta present
  checks.schemaValidates = {
    pass: !!(seo?.meta_title && seo?.meta_description && seo?.focus_keywords?.length),
    detail: `meta_title: ${seo?.meta_title ? "present" : "missing"}, keywords: ${seo?.focus_keywords?.length || 0}`,
  };

  // Services present
  checks.servicesPresent = {
    pass: !!(copy?.services?.length >= 3),
    detail: `${copy?.services?.length || 0} services`,
  };

  // Process steps present
  checks.processPresent = {
    pass: !!(copy?.process?.length >= 3),
    detail: `${copy?.process?.length || 0} process steps`,
  };

  // FAQ or funnel steps present (AEO optimization)
  checks.aeoOptimized = {
    pass: !!(copy?.faq?.length >= 3 || copy?.funnel_steps?.length >= 3),
    detail: `faq: ${copy?.faq?.length || 0}, funnel: ${copy?.funnel_steps?.length || 0}`,
  };

  // Images generated
  checks.imagesGenerated = {
    pass: !!(images?.hero && images?.gallery?.length >= GALLERY_COUNT),
    detail: `hero: ${images?.hero ? "yes" : "no"}, gallery: ${images?.gallery?.length || 0}/${GALLERY_COUNT}`,
  };

  // Trust badges present (E-E-A-T signal)
  checks.trustSignals = {
    pass: !!(copy?.trust_badges?.length >= 3),
    detail: `${copy?.trust_badges?.length || 0} trust badges`,
  };

  // Testimonial present (E-E-A-T: Experience signal)
  checks.testimonialPresent = {
    pass: !!(copy?.testimonial?.quote && copy?.testimonial?.author),
    detail: copy?.testimonial?.author ? `By ${copy.testimonial.author}` : "missing",
  };

  // Meta title length (Google spec: under 60 chars)
  checks.metaTitleLength = {
    pass: !!(seo?.meta_title && seo.meta_title.length <= 60),
    detail: `${seo?.meta_title?.length || 0} chars (max 60)`,
  };

  // Meta description length (Google spec: under 155 chars)
  checks.metaDescriptionLength = {
    pass: !!(seo?.meta_description && seo.meta_description.length <= 155),
    detail: `${seo?.meta_description?.length || 0} chars (max 155)`,
  };

  const passed = Object.values(checks).filter(c => c.pass).length;
  const total = Object.keys(checks).length;
  const score = Math.round((passed / total) * 100);

  return { score, checks };
}

// ── Main pipeline executor ──
export async function executeDeepArchitecturePipeline(base44: any, input: PipelineInput): Promise<PipelineResult> {
  const stages: PipelineStage[] = [];
  const template = getTemplate(input.template_id);
  const ctx = {
    businessName: input.business_name,
    city: input.city || "",
    phone: input.phone || "",
    pageType: input.page_type === "funnel" ? "funnel" : "landing",
  };

  // Stage 1: Brand Intelligence (competitor analysis, industry intel, financial, domains, names)
  const stage1: PipelineStage = { name: "Brand Intelligence", status: "running", started_at: new Date().toISOString() };
  stages.push(stage1);
  let brandIntel = null;
  try {
    brandIntel = await runFullBrandIntelligence(base44, {
      industry: input.industry || template.label,
      city: input.city,
      strategy: ctx.pageType,
    });
    stage1.status = "completed";
    stage1.completed_at = new Date().toISOString();
    stage1.duration_ms = Date.now() - new Date(stage1.started_at).getTime();
    stage1.result = {
      industry: !!brandIntel.industry,
      competitors: brandIntel.competitors?.competitors?.length || 0,
      financial: !!brandIntel.financial,
      domains: brandIntel.domains?.domains?.length || 0,
      names: brandIntel.names?.names?.length || 0,
    };
  } catch (err) {
    stage1.status = "failed";
    stage1.error = err.message;
    stage1.completed_at = new Date().toISOString();
  }

  // Stage 2: SEO/AEO Content Generation
  const stage2: PipelineStage = { name: "SEO/AEO Content Generation", status: "running", started_at: new Date().toISOString() };
  stages.push(stage2);
  let copy: any = null;
  try {
    const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildCopyPrompt(template, ctx),
      response_json_schema: CONTENT_SCHEMA,
    });
    copy = llmRes?.data ?? llmRes;
    if (!copy?.hero) throw new Error("AI did not return valid content");
    stage2.status = "completed";
    stage2.completed_at = new Date().toISOString();
    stage2.duration_ms = Date.now() - new Date(stage2.started_at).getTime();
    stage2.result = { hero: copy.hero?.headline, services: copy.services?.length, faq: copy.faq?.length };
  } catch (err) {
    stage2.status = "failed";
    stage2.error = err.message;
    stage2.completed_at = new Date().toISOString();
  }

  // Stage 3: Image Generation (parallel)
  const stage3: PipelineStage = { name: "Image Generation", status: "running", started_at: new Date().toISOString() };
  stages.push(stage3);
  let images: { hero?: string; gallery: string[] } = { gallery: [] };
  try {
    const imgConfig = template.images(ctx);
    const imageCalls = [
      base44.asServiceRole.integrations.Core.GenerateImage({ prompt: imgConfig.hero }),
      ...imgConfig.gallery.map((p: string) => base44.asServiceRole.integrations.Core.GenerateImage({ prompt: p })),
    ];
    const imageResults = await Promise.allSettled(imageCalls);
    images.hero = imageResults[0].status === "fulfilled" ? imageResults[0].value?.url : undefined;
    images.gallery = imageResults.slice(1)
      .filter((r: any) => r.status === "fulfilled" && r.value?.url)
      .map((r: any) => r.value.url);
    stage3.status = "completed";
    stage3.completed_at = new Date().toISOString();
    stage3.duration_ms = Date.now() - new Date(stage3.started_at).getTime();
    stage3.result = { hero: !!images.hero, gallery: images.gallery.length };
  } catch (err) {
    stage3.status = "failed";
    stage3.error = err.message;
    stage3.completed_at = new Date().toISOString();
  }

  // Stage 4: Section Assembly (deterministic)
  const stage4: PipelineStage = { name: "Section Assembly", status: "running", started_at: new Date().toISOString() };
  stages.push(stage4);
  let sections: any[] = [];
  try {
    if (!copy) throw new Error("No content to assemble");
    sections = assembleSections(copy, ctx, template);
    stage4.status = "completed";
    stage4.completed_at = new Date().toISOString();
    stage4.duration_ms = Date.now() - new Date(stage4.started_at).getTime();
    stage4.result = { sections: sections.length, types: sections.map(s => s.type) };
  } catch (err) {
    stage4.status = "failed";
    stage4.error = err.message;
    stage4.completed_at = new Date().toISOString();
  }

  // Stage 5: QA Gate (Google spec compliance)
  const stage5: PipelineStage = { name: "QA Gate (Google Compliance)", status: "running", started_at: new Date().toISOString() };
  stages.push(stage5);
  let qaScore = 0;
  let qaChecks: Record<string, { pass: boolean; detail: string }> = {};
  try {
    const qa = runQAGate(copy, sections, images, copy?.seo || {});
    qaScore = qa.score;
    qaChecks = qa.checks;
    stage5.status = qaScore >= 80 ? "completed" : "failed";
    stage5.completed_at = new Date().toISOString();
    stage5.duration_ms = Date.now() - new Date(stage5.started_at).getTime();
    stage5.result = { score: qaScore, passed: Object.values(qaChecks).filter(c => c.pass).length, total: Object.keys(qaChecks).length };
  } catch (err) {
    stage5.status = "failed";
    stage5.error = err.message;
    stage5.completed_at = new Date().toISOString();
  }

  // Stage 6: Self-Healing (if QA failed, attempt regeneration)
  const stage6: PipelineStage = { name: "Self-Healing", status: "pending", started_at: new Date().toISOString() };
  stages.push(stage6);
  if (qaScore < 80 && qaScore > 0) {
    stage6.status = "running";
    try {
      // Retry content generation with more explicit instructions
      const retryRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildCopyPrompt(template, ctx) + "\n\nIMPORTANT: Your previous response was missing required fields. Ensure ALL fields are present: hero, trust_badges (4), services (3-4), process (3-4), gallery_captions (3), testimonial, faq (3) or funnel_steps (3), and seo with meta_title (under 60 chars), meta_description (under 155 chars), and focus_keywords (5).",
        response_json_schema: CONTENT_SCHEMA,
      });
      const retryCopy = retryRes?.data ?? retryRes;
      if (retryCopy?.hero) {
        copy = { ...copy, ...retryCopy };
        sections = assembleSections(copy, ctx, template);
        const qaRetry = runQAGate(copy, sections, images, copy?.seo || {});
        qaScore = qaRetry.score;
        qaChecks = qaRetry.checks;
      }
      stage6.status = "completed";
      stage6.completed_at = new Date().toISOString();
      stage6.duration_ms = Date.now() - new Date(stage6.started_at).getTime();
      stage6.result = { healed: true, newScore: qaScore };
    } catch (err) {
      stage6.status = "failed";
      stage6.error = err.message;
      stage6.completed_at = new Date().toISOString();
    }
  } else {
    stage6.status = "completed";
    stage6.completed_at = new Date().toISOString();
    stage6.result = { healed: false, reason: "QA already passing" };
  }

  // Determine overall status
  const failedStages = stages.filter(s => s.status === "failed" && s.name !== "Self-Healing");
  const overall_status: PipelineResult["overall_status"] = failedStages.length === 0 && qaScore >= 80
    ? "success"
    : failedStages.length <= 2 && sections.length > 0
    ? "partial"
    : "failed";

  // Recommendations
  const recommendations: string[] = [];
  if (qaScore < 100) {
    const failedChecks = Object.entries(qaChecks).filter(([, v]) => !v.pass);
    for (const [check, detail] of failedChecks) {
      recommendations.push(`Fix ${check}: ${detail.detail}`);
    }
  }
  if (brandIntel?.competitors?.topSitesToClone?.length) {
    recommendations.push(`Clone top competitor: ${brandIntel.competitors.topSitesToClone[0].url}`);
  }
  if (brandIntel?.domains?.domains?.length) {
    recommendations.push(`Register domain: ${brandIntel.domains.domains[0].name}`);
  }

  return {
    input,
    stages,
    overall_status,
    generated_site: sections.length > 0 ? {
      sections,
      images,
      seo: copy?.seo || {},
      phone: input.phone,
    } : null,
    brand_intelligence: brandIntel,
    qa_score: qaScore,
    qa_checks: qaChecks,
    recommendations,
  };
}