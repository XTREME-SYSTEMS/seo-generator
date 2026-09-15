import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// Generates a complete, self-contained HTML landing page for a niche.
// Body: { niche, url_pattern?, strategic_url_id?, page_type? }

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { niche, url_pattern, strategic_url_id, page_type = 'landing' } = body;

    if (!niche) return Response.json({ error: 'niche is required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      add_context_from_internet: true,
      prompt: `Generate a complete, production-ready HTML landing page for a ${niche} business.

CRITICAL REQUIREMENTS:
- Return ONLY raw HTML — no markdown, no code fences, no explanations
- Start with <!DOCTYPE html> and end with </html>
- ALL CSS must be inline in a single <style> tag in the <head> — no external stylesheets
- NO external JavaScript dependencies — vanilla JS only if needed
- Mobile-responsive design (viewport meta tag, flexbox/grid layouts)
- Professional color scheme appropriate for ${niche}
- Fast loading, minimal DOM

SECTIONS (in order):
1. Sticky header with logo placeholder, nav links (Services, About, FAQ, Contact), and CTA button "Get Free Quote"
2. Hero section: compelling H1 headline, subheadline, primary CTA button, trust badge (e.g. "Licensed & Insured")
3. Services section: 3-4 service cards with icon (emoji), title, and description
4. Why Choose Us section: 3-4 benefit items with checkmark icons
5. Testimonials section: 3 customer reviews with star ratings
6. FAQ section: 5 questions and answers (accordion-style with <details> tags)
7. Contact section: form with name, phone, email, message fields and submit button
8. Footer: business name, phone, address placeholder, service area, copyright

SEO REQUIREMENTS:
- Proper <title> tag: "Professional ${niche} Services | Free Quotes"
- Meta description tag
- LocalBusiness JSON-LD schema with name, address, phone, areaServed
- FAQPage JSON-LD schema with all 5 Q&As
- BreadcrumbList JSON-LD schema
- Open Graph tags (og:title, og:description, og:type)

Return ONLY the HTML. No markdown code fences. No commentary.`
    });

    // Clean up — strip markdown code fences if the LLM added them
    let html = typeof result === 'string' ? result : (result.html || result.content || result.response || '');
    if (typeof html === 'object') html = JSON.stringify(html);
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    // Ensure it starts with DOCTYPE
    if (!html.toLowerCase().startsWith('<!doctype')) {
      const docStart = html.toLowerCase().indexOf('<html');
      if (docStart > 0) html = '<!DOCTYPE html>\n' + html.substring(docStart);
    }

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : `${niche} - Professional Services`;

    // Extract meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const metaDescription = descMatch ? descMatch[1] : '';

    // Upload HTML to public storage (entity fields can't hold large content)
    const fileName = `${niche.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-landing.html`;
    const file = new File([html], fileName, { type: 'text/html' });
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
    const htmlUrl = uploadResult.file_url;

    // Store the generated page with the file URL
    const page = await base44.asServiceRole.entities.GeneratedPage.create({
      niche,
      url_pattern: url_pattern || niche,
      strategic_url_id: strategic_url_id || '',
      page_title: pageTitle,
      page_type,
      html_url: htmlUrl,
      meta_description: metaDescription,
      status: 'generated'
    });

    // Create receipt
    await base44.asServiceRole.entities.Receipt.create({
      summary: `Generated ${page_type} landing page for ${niche}`,
      source: 'GenerateLandingPage',
      occurred_at: new Date().toISOString(),
      proof_level: 1
    });

    return Response.json({
      status: 'success',
      page_id: page.id,
      page_title: pageTitle,
      html_url: htmlUrl,
      html_length: html.length
    });
  } catch (error) {
    console.error('GenerateLandingPage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}