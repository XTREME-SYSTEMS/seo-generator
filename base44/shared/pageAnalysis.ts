// Shared page analysis function — extracts common SEO metrics from HTML.
// Used by ComputeIndustryBenchmarks, AnalyzeCompetitors, and other functions
// that need to quickly analyze a page's SEO signals.

export interface PageAnalysis {
  hasTitle: boolean;
  hasMetaDesc: boolean;
  hasCanonical: boolean;
  hasSchema: boolean;
  hasFAQ: boolean;
  hasLocalBusiness: boolean;
  hasService: boolean;
  hasH1: boolean;
  wordCount: number;
  h2Count: number;
  imgCount: number;
  imgsNoAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasCTA: boolean;
  hasForm: boolean;
  hasPhone: boolean;
  hasViewport: boolean;
  scriptCount: number;
  styleCount: number;
  seoScore: number;
}

export function analyzePage(html: string, hostname?: string): PageAnalysis {
  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
  const hasMetaDesc = /<meta[^>]+name=["']description["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasSchema = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const hasFAQ = /FAQPage/i.test(html);
  const hasLocalBusiness = /LocalBusiness/i.test(html);
  const hasService = /"Service"/i.test(html);
  const hasH1 = /<h1[^>]*>[^<]+<\/h1>/i.test(html);
  const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const imgCount = (html.match(/<img[^>]+src=/gi) || []).length;
  const imgsNoAlt = (html.match(/<img(?![^>]*\salt=)[^>]*src=/gi) || []).length;
  const internalLinks = (html.match(/href=["']\/[^"']*["']/gi) || []).length;
  const externalLinks = hostname
    ? (html.match(new RegExp(`href=["']https?://(?!${hostname.replace(/\./g, '\\.')})[^"']*["']`, 'gi')) || []).length
    : (html.match(/href=["']https?:\/\//gi) || []).length;
  const hasCTA = /(?:call|quote|estimate|book|contact|schedule|get started|free estimate)/i.test(html);
  const hasForm = /<form[^>]*>/i.test(html);
  const hasPhone = /tel:/i.test(html);
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
  const styleCount = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;

  const seoScore = Math.round(
    (hasTitle ? 15 : 0) + (hasMetaDesc ? 15 : 0) + (hasCanonical ? 10 : 0) +
    (hasSchema ? 20 : 0) + (hasFAQ ? 10 : 0) + (hasLocalBusiness ? 10 : 0) +
    (hasH1 ? 10 : 0) + (wordCount > 500 ? 10 : wordCount > 300 ? 5 : 0)
  );

  return {
    hasTitle, hasMetaDesc, hasCanonical, hasSchema, hasFAQ, hasLocalBusiness, hasService,
    hasH1, wordCount, h2Count, imgCount, imgsNoAlt, internalLinks, externalLinks,
    hasCTA, hasForm, hasPhone, hasViewport, scriptCount, styleCount, seoScore,
  };
}