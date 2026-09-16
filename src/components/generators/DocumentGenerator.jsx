import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText } from 'lucide-react';
import GeneratorShell from './GeneratorShell';
import { TextBlock, TagList } from './WealthGenerator';

const DOC_TYPES = ['business_plan', 'pitch_deck', 'sop', 'proposal', 'contract', 'privacy_policy', 'terms_of_service', 'press_release', 'case_study', 'whitepaper', 'technical_spec', 'marketing_brief'];

export default function DocumentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [docType, setDocType] = useState('business_plan');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional ${docType.replace(/_/g, ' ')} document for: "${prompt}".

Create a complete, ready-to-use document with:
- title: Document title
- sections: Array of {heading, content} — full content for each section
- executive_summary: If applicable
- key_points: Array of key takeaways
- next_steps: Array of action items
- compliance_notes: Any legal/regulatory considerations

Make it comprehensive, professional, and immediately usable. Use proper formatting and structure.

Return as JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            sections: { type: 'array', items: { type: 'object', properties: {
              heading: { type: 'string' }, content: { type: 'string' },
            } } },
            executive_summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
            next_steps: { type: 'array', items: { type: 'string' } },
            compliance_notes: { type: 'string' },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'document',
        title: `${docType}: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res),
        summary: `${docType.replace(/_/g, ' ')} document generated`,
      });

      setResult(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!result) return;
    let text = `# ${result.title}\n\n`;
    if (result.executive_summary) text += `## Executive Summary\n\n${result.executive_summary}\n\n`;
    result.sections?.forEach(s => {
      text += `## ${s.heading}\n\n${s.content}\n\n`;
    });
    if (result.key_points?.length) {
      text += `## Key Points\n\n`;
      result.key_points.forEach(p => text += `- ${p}\n`);
    }
    if (result.next_steps?.length) {
      text += `\n## Next Steps\n\n`;
      result.next_steps.forEach(s => text += `- ${s}\n`);
    }
    if (result.compliance_notes) text += `\n## Compliance Notes\n\n${result.compliance_notes}\n`;

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GeneratorShell
      icon={FileText}
      title="Document Generator"
      subtitle="Generate professional business documents — plans, proposals, contracts, policies, specs, and more"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. A business plan for a NearMe plumbing lead generation service..."
    >
      {/* Doc Type Selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {DOC_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setDocType(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${docType === t ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary/30'}`}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground">{result.title}</h3>
            <button onClick={handleDownload} className="px-3 py-1.5 rounded-md bg-card border border-border text-xs font-medium hover:border-primary/30 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Download
            </button>
          </div>
          {result.executive_summary && <TextBlock title="Executive Summary" text={result.executive_summary} />}
          {result.sections?.map((s, i) => (
            <TextBlock key={i} title={s.heading} text={s.content} />
          ))}
          {result.key_points?.length > 0 && <TagList title="Key Points" items={result.key_points} />}
          {result.next_steps?.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Next Steps</h4>
              <ol className="space-y-1 text-xs text-foreground list-decimal pl-4">
                {result.next_steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}
          {result.compliance_notes && <TextBlock title="Compliance Notes" text={result.compliance_notes} />}
        </div>
      )}
    </GeneratorShell>
  );
}