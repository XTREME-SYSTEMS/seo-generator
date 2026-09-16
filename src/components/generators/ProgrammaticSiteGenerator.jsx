import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, LayoutTemplate, Code, Copy, Check } from 'lucide-react';
import { GeneratorShell } from './IdeaGenerator';

export default function ProgrammaticSiteGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a complete programmatic Google Sites template for: "${prompt}".

Create a full HTML template for a programmatic SEO site that generates city-level landing pages. Include:

1. site_config: JSON config with {domain, niche, cities_count, page_types, color_scheme, font}
2. html_template: A complete HTML template with dynamic placeholders for {city}, {niche}, {service}, {phone}, {business_name}
3. css_styles: Complete CSS for the template (responsive, modern, SEO-optimized)
4. schema_markup: JSON-LD LocalBusiness schema template
5. url_structure: The URL pattern (e.g. /{state}/{city}/{service})
6. page_types: Array of {type, template_purpose, fields}
7. seo_meta: Meta tags template (title, description, OG tags)
8. content_blocks: Reusable content blocks with placeholders
9. robots_txt: Robots.txt content
10. sitemap_config: Sitemap generation config

Make it production-ready for Google Sites or any static host. Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            site_config: { type: 'string' },
            html_template: { type: 'string' },
            css_styles: { type: 'string' },
            schema_markup: { type: 'string' },
            url_structure: { type: 'string' },
            page_types: { type: 'array', items: { type: 'object', properties: {
              type: { type: 'string' }, template_purpose: { type: 'string' }, fields: { type: 'string' },
            } } },
            seo_meta: { type: 'string' },
            content_blocks: { type: 'array', items: { type: 'string' } },
            robots_txt: { type: 'string' },
            sitemap_config: { type: 'string' },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'programmatic_site',
        title: `Site template: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: 'Programmatic site template generated',
      });

      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GeneratorShell
      icon={LayoutTemplate}
      title="Programmatic Google Site Generator"
      subtitle="Generate a complete programmatic SEO site template with HTML, CSS, schema markup, and city-level page generation"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. A plumbing lead gen site with 450 city pages, blue/white theme, quote form..."
    >
      {result && (
        <div className="space-y-4">
          {/* Config */}
          <CodeBlock title="Site Config (JSON)" code={result.site_config} onCopy={() => copyToClipboard(result.site_config, 'config')} copied={copied === 'config'} />

          {/* URL Structure */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading text-sm font-semibold text-foreground mb-2">URL Structure</h4>
            <code className="text-xs text-primary font-mono">{result.url_structure}</code>
          </div>

          {/* Page Types */}
          {result.page_types?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Page Types</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.page_types.map((p, i) => (
                  <div key={i} className="border border-border rounded p-2 text-xs">
                    <div className="font-medium text-foreground">{p.type}</div>
                    <div className="text-muted-foreground">{p.template_purpose}</div>
                    <div className="text-primary mt-1">Fields: {p.fields}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HTML Template */}
          <CodeBlock title="HTML Template" code={result.html_template} onCopy={() => copyToClipboard(result.html_template, 'html')} copied={copied === 'html'} maxH="max-h-96" />

          {/* CSS */}
          <CodeBlock title="CSS Styles" code={result.css_styles} onCopy={() => copyToClipboard(result.css_styles, 'css')} copied={copied === 'css'} maxH="max-h-96" />

          {/* Schema */}
          <CodeBlock title="Schema Markup (JSON-LD)" code={result.schema_markup} onCopy={() => copyToClipboard(result.schema_markup, 'schema')} copied={copied === 'schema'} />

          {/* SEO Meta */}
          <CodeBlock title="SEO Meta Tags" code={result.seo_meta} onCopy={() => copyToClipboard(result.seo_meta, 'meta')} copied={copied === 'meta'} />

          {/* Content Blocks */}
          {result.content_blocks?.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Content Blocks</h4>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                {result.content_blocks.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}

          {/* Robots.txt */}
          <CodeBlock title="robots.txt" code={result.robots_txt} onCopy={() => copyToClipboard(result.robots_txt, 'robots')} copied={copied === 'robots'} />

          {/* Sitemap Config */}
          <CodeBlock title="Sitemap Config" code={result.sitemap_config} onCopy={() => copyToClipboard(result.sitemap_config, 'sitemap')} copied={copied === 'sitemap'} />
        </div>
      )}
    </GeneratorShell>
  );
}

function CodeBlock({ title, code, onCopy, copied, maxH = 'max-h-60' }) {
  if (!code) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-heading text-sm font-semibold text-foreground">{title}</h4>
        <button onClick={onCopy} className="px-2 py-1 rounded text-xs bg-muted/30 hover:bg-muted/50 flex items-center gap-1">
          {copied ? <><Check className="w-3 h-3 text-emerald-600" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className={`bg-muted/20 rounded p-3 text-xs font-mono text-foreground overflow-x-auto ${maxH} overflow-y-auto`}><code>{code}</code></pre>
    </div>
  );
}