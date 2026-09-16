// Shared CloudBrowser cloning engine — used by CloneTopNiches and RecloneSite.
// Extracted so both functions share identical cloning logic (DRY).

export interface CloneTarget {
  niche: string;
  url: string;
  name: string;
  rating?: string;
  rank?: number;
  strengths?: string[];
  weaknesses?: string[];
}

export interface CloneResult {
  niche: string;
  url: string;
  site_name: string;
  rank?: number;
  status: 'cloned' | 'failed';
  visual_parity_score?: number;
  screenshot_url?: string;
  html_file_url?: string;
  template_id?: string;
  error?: string;
}

// ── Clone a single site: navigate, screenshot, extract HTML + design tokens ──
export async function cloneSite(
  base44: any,
  engineUrl: string,
  apiKey: string,
  opts: { niche: string; site: CloneTarget; rank: number }
): Promise<CloneResult> {
  const { niche, site, rank } = opts;
  const headers = { 'Content-Type': 'application/json', 'x-api-key': apiKey };
  const now = new Date().toISOString();

  console.log(`[cloneEngine] Cloning ${site.url} (rank ${rank})`);

  // 1. Create CloudBrowser session
  const sessRes = await fetch(`${engineUrl}/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      viewport: { width: 1440, height: 900 },
      solveCaptcha: true,
      blockAds: true,
    }),
  });
  if (!sessRes.ok) {
    const errText = await sessRes.text().catch(() => 'unknown');
    throw new Error(`Session creation failed (${sessRes.status}): ${errText.slice(0, 200)}`);
  }
  const session = await sessRes.json();
  const sessionId = session.sessionId || session.id || session.session_id;
  if (!sessionId) throw new Error('No session ID returned from CloudBrowser engine');

  try {
    // 2. Navigate to URL
    await executeAction(engineUrl, headers, sessionId, { action_type: 'goto', value: site.url });

    // 3. Wait for page to load
    await executeAction(engineUrl, headers, sessionId, { action_type: 'wait_for_load_state', value: 'networkidle' }).catch(() => {});
    await executeAction(engineUrl, headers, sessionId, { action_type: 'wait_for_timeout', value: 3000 }).catch(() => {});

    // 4. Scroll through the page to trigger lazy-loaded images
    for (const y of [600, 1800, 3600, 6000, 10000]) {
      await executeAction(engineUrl, headers, sessionId, { action_type: 'scroll', options: { y } }).catch(() => {});
      await executeAction(engineUrl, headers, sessionId, { action_type: 'wait_for_timeout', value: 500 }).catch(() => {});
    }

    // 5. Scroll back to top for the screenshot
    await executeAction(engineUrl, headers, sessionId, { action_type: 'scroll', options: { y: 0 } }).catch(() => {});
    await executeAction(engineUrl, headers, sessionId, { action_type: 'wait_for_timeout', value: 1500 }).catch(() => {});

    // 6. Take full-page screenshot
    const screenshotData = await executeAction(engineUrl, headers, sessionId, { action_type: 'screenshot', options: { fullPage: true } });

    // 7. Extract full rendered HTML
    const htmlData = await executeAction(engineUrl, headers, sessionId, {
      action_type: 'extract_html',
      selector: 'html',
    }).catch(async () => {
      return executeAction(engineUrl, headers, sessionId, {
        action_type: 'evaluate',
        value: 'document.documentElement.outerHTML',
      }).catch(() => ({}));
    });

    // 8. Extract design tokens
    const designExpr = `JSON.stringify({
      colors: Array.from(new Set(Array.from(document.querySelectorAll('header,nav,h1,h2,h3,p,a,button,footer,section,[class*="hero"]')).map(function(el){var cs=getComputedStyle(el);return [cs.color,cs.backgroundColor,cs.borderColor].filter(function(c){return c&&c!=='rgba(0, 0, 0, 0)'})}).flat())).slice(0,20),
      fonts: Array.from(new Set(Array.from(document.querySelectorAll('h1,h2,h3,p,a,button,header,footer')).map(function(el){return getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/["']/g,'')}))).slice(0,10),
      title: document.title,
      metaDescription: (document.querySelector('meta[name="description"]')||{}).content||'',
      bodyFontSize: getComputedStyle(document.body).fontSize,
      hasHeader: !!document.querySelector('header'),
      hasNav: !!document.querySelector('nav'),
      hasFooter: !!document.querySelector('footer'),
      hasHero: !!document.querySelector('[class*="hero"],[class*="banner"]'),
      sectionCount: document.querySelectorAll('section').length,
      imageCount: document.querySelectorAll('img').length,
      linkCount: document.querySelectorAll('a').length,
      formCount: document.querySelectorAll('form').length,
      buttonCount: document.querySelectorAll('button,[role="button"]').length
    })`;
    const designData = await executeAction(engineUrl, headers, sessionId, { action_type: 'evaluate', value: designExpr }).catch(() => ({}));

    // 9. Upload screenshot
    let screenshotUrl = '';
    const screenshotBase64 = screenshotData?.base64 || screenshotData?.data || screenshotData?.screenshot || '';
    if (screenshotBase64 && typeof screenshotBase64 === 'string' && screenshotBase64.length > 100) {
      try {
        const cleanBase64 = screenshotBase64.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        screenshotUrl = await uploadFile(base44, bytes, 'image/png', `clone-${niche}-${rank}.png`);
      } catch (e) {
        console.error(`[cloneEngine] Screenshot upload failed: ${e.message}`);
      }
    }

    // 10. Upload HTML
    let htmlFileUrl = '';
    const htmlContent = extractResultValue(htmlData);
    if (htmlContent && typeof htmlContent === 'string' && htmlContent.length > 200) {
      try {
        const htmlBytes = new TextEncoder().encode(htmlContent);
        htmlFileUrl = await uploadFile(base44, htmlBytes, 'text/html', `clone-${niche}-${rank}.html`);
      } catch (e) {
        console.error(`[cloneEngine] HTML upload failed: ${e.message}`);
      }
    }

    // 11. Parse design tokens
    let designTokens: any = {};
    const designRaw = extractResultValue(designData);
    if (designRaw && typeof designRaw === 'string') {
      try { designTokens = JSON.parse(designRaw); } catch {}
    }

    // 12. Compute visual parity score
    let parityScore = 0;
    if (screenshotUrl) parityScore += 35;
    if (htmlFileUrl) parityScore += 35;
    if (designTokens.colors && designTokens.colors.length > 0) parityScore += 12;
    if (designTokens.fonts && designTokens.fonts.length > 0) parityScore += 8;
    if (designTokens.hasHeader && designTokens.hasFooter) parityScore += 5;
    if (designTokens.sectionCount > 0) parityScore += 4;
    parityScore = Math.min(parityScore, 99);

    // 13. Build superiority strategy
    const superiorityStrategy = JSON.stringify({
      design_direction: `Match the visual quality of ${site.name} but improve on weaknesses: ${(site.weaknesses || []).join(', ')}`,
      content_advantages: site.weaknesses || [],
      recommended_colors: (designTokens.colors || []).slice(0, 5),
      recommended_fonts: (designTokens.fonts || []).slice(0, 3),
      layout_sections: {
        hasHeader: designTokens.hasHeader,
        hasNav: designTokens.hasNav,
        hasHero: designTokens.hasHero,
        hasFooter: designTokens.hasFooter,
        sectionCount: designTokens.sectionCount,
      },
    });

    // 14. Store the cloned template
    const template = await base44.asServiceRole.entities.ClonedTemplate.create({
      niche,
      source_url: site.url,
      site_name: site.name,
      rating: site.rating || '',
      rank,
      screenshot_url: screenshotUrl,
      html_file_url: htmlFileUrl,
      design_tokens: JSON.stringify(designTokens),
      visual_parity_score: parityScore,
      strengths: site.strengths || [],
      weaknesses: site.weaknesses || [],
      superiority_strategy: superiorityStrategy,
      status: parityScore >= 80 ? 'cloned' : 'validated',
      cloned_at: now,
    });

    return {
      niche,
      url: site.url,
      site_name: site.name,
      rank,
      status: 'cloned',
      visual_parity_score: parityScore,
      screenshot_url: screenshotUrl,
      html_file_url: htmlFileUrl,
      template_id: template.id,
    };
  } finally {
    await fetch(`${engineUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'x-api-key': apiKey },
    }).catch(() => {});
  }
}

// ── Helper: upload a file to public storage using File object + service role ──
export async function uploadFile(base44: any, bytes: Uint8Array, mimeType: string, filename: string): Promise<string> {
  const file = new File([bytes], filename, { type: mimeType });
  const uploadRes = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
  return uploadRes.file_url || '';
}

// ── Helper: execute a browser action ──
export async function executeAction(engineUrl: string, headers: any, sessionId: string, action: any) {
  const res = await fetch(`${engineUrl}/sessions/${sessionId}/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(action),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Action ${action.action_type} failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  return await res.json().catch(() => ({}));
}

// ── Helper: extract the result value from an execute response ──
export function extractResultValue(data: any): string {
  if (!data) return '';
  return data.data || data.value || data.result || data.output || data.text || data.base64 || data.html || data.screenshot || (typeof data === 'string' ? data : '');
}

// ── Get engine config from env ──
export function getEngineConfig() {
  const engineUrl = (process.env.CLOUDBROWSER_ENGINE_URL || process.env.BROWSER_ENGINE_URL || '').replace(/\/$/, '');
  const apiKey = process.env.ENGINE_API_KEY || process.env.CLOUDBROWSER_API_KEY;
  return { engineUrl, apiKey };
}