// Shared HTML utility functions for SEO audit/discovery functions.
// Pure functions — no Deno.serve, no side effects.

export function extractMeta(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? m[1] : null;
}

export function extractAll(html: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const regex = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = regex.exec(html)) !== null) out.push(m[1] || m[0]);
  return out;
}

export function safeUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function fetchWithTimeout(
  url: string,
  userAgent: string,
  timeoutMs = 12000
): Promise<{ resp: Response; html: string; finalUrl: URL } | { error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const html = await resp.text();
    let finalUrl: URL;
    try { finalUrl = new URL(resp.url || url); } catch { finalUrl = new URL(url); }
    return { resp, html, finalUrl };
  } catch (e: any) {
    clearTimeout(timeout);
    return { error: 'Fetch failed: ' + (e?.message || 'unknown') };
  }
}