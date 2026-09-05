import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// ExtractDesignDNA — fetches a competitor URL and extracts the "design DNA":
// color palette, font pairing, layout structure, image style, CTA patterns.
// Uses LLM to analyze the HTML + CSS and produce a structured design brief.
//
// Invoke: base44.functions.invoke('ExtractDesignDNA', { url })
// Returns: { ok, designDNA }

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const url = String(body.url || '').trim();
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    let parsed;
    try { parsed = new URL(url); } catch { return Response.json({ error: 'Invalid URL' }, { status: 400 }); }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let resp;
    try {
      resp = await fetch(url, { headers: { 'User-Agent': 'SEOGenerator-DesignDNA/1.0' }, redirect: 'follow', signal: controller.signal });
    } catch (e) {
      clearTimeout(timeout);
      return Response.json({ error: 'Fetch failed: ' + (e?.message || 'unknown') }, { status: 502 });
    }
    clearTimeout(timeout);
    const html = await resp.text();

    // Extract design signals
    const colors = new Set();
    const colorMatches = html.match(/(?:color|background|background-color|border-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))/gi) || [];
    for (const c of colorMatches) {
      const m = c.match(/(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))/i);
      if (m) colors.add(m[1]);
    }

    const fonts = new Set();
    const fontMatches = html.match(/font-family\s*:\s*([^;"}]+)/gi) || [];
    for (const f of fontMatches) {
      const m = f.match(/font-family\s*:\s*([^;"}]+)/i);
      if (m) fonts.add(m[1].trim());
    }

    const hasHero = /<section[^>]*(?:hero|banner|jumbotron)/i.test(html) || /class=["'][^"']*hero/i.test(html);
    const hasGrid = /display\s*:\s*grid/i.test(html) || /class=["'][^"']*grid/i.test(html);
    const hasFlex = /display\s*:\s*flex/i.test(html) || /class=["'][^"']*flex/i.test(html);
    const hasCards = /class=["'][^"']*card/i.test(html);
    const hasVideo = /<video[^>]*>/i.test(html);
    const hasAnimation = /animation|transition|@keyframes/i.test(html);
    const hasSticky = /position\s*:\s*sticky/i.test(html);
    const imageCount = (html.match(/<img[^>]+src=/gi) || []).length;
    const svgCount = (html.match(/<svg/i) || []).length;
    const buttonCount = (html.match(/<button[^>]*>/gi) || []).length;

    const prompt = `You are a design analyst. Analyze the following design signals from a competitor website and produce a structured design DNA brief.

URL: ${url}
Extracted colors: ${[...colors].slice(0, 20).join(', ')}
Extracted fonts: ${[...fonts].slice(0, 10).join(', ') || 'none found in inline CSS'}
Layout signals: hero=${hasHero}, grid=${hasGrid}, flex=${hasFlex}, cards=${hasCards}, video=${hasVideo}, animation=${hasAnimation}, sticky=${hasSticky}
Images: ${imageCount}, SVGs: ${svgCount}, Buttons: ${buttonCount}

Produce a design DNA brief:
1. color_palette (array of hex colors with role labels: primary, secondary, accent, background, text)
2. font_pairing (heading_font, body_font)
3. layout_style (single-column, multi-column, grid, card-based, hero+features, etc.)
4. visual_style (minimal, bold, corporate, playful, luxury, etc.)
5. cta_style (button shape, color, placement)
6. image_strategy (hero image, gallery, illustrations, stock photos, etc.)
7. design_strengths (what they do well visually)
8. design_weaknesses (what they do poorly)

Output strict JSON.`;

    const schema = {
      type: 'object',
      properties: {
        color_palette: { type: 'array', items: { type: 'object', properties: { hex: { type: 'string' }, role: { type: 'string' } } } },
        font_pairing: { type: 'object', properties: { heading_font: { type: 'string' }, body_font: { type: 'string' } } },
        layout_style: { type: 'string' },
        visual_style: { type: 'string' },
        cta_style: { type: 'string' },
        image_strategy: { type: 'string' },
        design_strengths: { type: 'array', items: { type: 'string' } },
        design_weaknesses: { type: 'array', items: { type: 'string' } },
      },
    };

    const llmRes = await svc.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
    const data = llmRes?.data ?? llmRes;

    return Response.json({
      ok: true,
      url,
      designDNA: data,
      rawSignals: {
        colors: [...colors].slice(0, 20),
        fonts: [...fonts].slice(0, 10),
        hasHero, hasGrid, hasFlex, hasCards, hasVideo, hasAnimation, hasSticky,
        imageCount, svgCount, buttonCount,
      },
      extractedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}