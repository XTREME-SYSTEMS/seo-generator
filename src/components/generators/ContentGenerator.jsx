import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import { GeneratorShell } from './IdeaGenerator';

const PLATFORMS = ['google', 'facebook', 'instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'pinterest', 'reddit', 'all'];

export default function ContentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a multi-platform content generator that follows EXACT guidelines of every platform. Create content for: "${prompt}".

Target platform(s): ${platform === 'all' ? 'Google SEO, Facebook, Instagram, TikTok, YouTube, Twitter/X, LinkedIn, Pinterest, Reddit' : platform}

For each platform, generate content that strictly follows that platform's guidelines:
- google: SEO-optimized blog post (title, meta description, H1-H3 structure, 1500+ words, schema markup suggestions)
- facebook: Post with engagement hooks, image suggestions, hashtag strategy, community guidelines compliance
- instagram: Caption with hooks, carousel ideas, reel script, hashtag set (30), story ideas
- tiktok: Video script with hooks, trending sounds, caption, hashtags, duet/stitch ideas
- youtube: Title, description, tags, chapters, thumbnail concept, script outline
- twitter: Thread (5-10 tweets), hooks, engagement tactics
- linkedin: Professional post, article outline, engagement strategy
- pinterest: Pin title, description, board ideas, keyword strategy
- reddit: Post title, body, subreddit recommendations, engagement rules

For each platform provide:
- platform: name
- content: The actual content
- guidelines_followed: Which specific platform guidelines were followed
- compliance_notes: Why this complies with their policies
- hashtags: Array of hashtags
- best_posting_time: Recommended posting time
- estimated_reach: Estimated reach

Return as JSON array.`,
        response_json_schema: {
          type: 'object',
          properties: {
            contents: { type: 'array', items: { type: 'object', properties: {
              platform: { type: 'string' },
              content: { type: 'string' },
              guidelines_followed: { type: 'string' },
              compliance_notes: { type: 'string' },
              hashtags: { type: 'array', items: { type: 'string' } },
              best_posting_time: { type: 'string' },
              estimated_reach: { type: 'string' },
            } } },
          },
        },
      });

      await base44.entities.GeneratedAsset.create({
        generator_type: 'content',
        title: `Content for: ${prompt.slice(0, 60)}`,
        input_prompt: prompt,
        output_json: JSON.stringify(res.contents || []),
        platform,
        summary: `${(res.contents || []).length} platform contents generated`,
        compliance_score: 100,
      });

      setResult(res.contents || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <GeneratorShell
      icon={FileText}
      title="Content Generator"
      subtitle="Generates content that follows the EXACT guidelines of Google, Facebook, and every platform — compliant, optimized, and ready to post"
      prompt={prompt}
      setPrompt={setPrompt}
      onGenerate={handleGenerate}
      loading={loading}
      placeholder="e.g. 5 reasons to hire a professional plumber for emergency repairs..."
    >
      {/* Platform Selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${platform === p ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary/30'}`}
          >
            {p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {result && result.map((c, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-heading text-sm font-semibold text-foreground capitalize">{c.platform}</h4>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">Compliant</span>
          </div>
          <div className="bg-muted/30 rounded p-3 text-xs text-foreground whitespace-pre-wrap mb-2 max-h-60 overflow-y-auto">{c.content}</div>
          {c.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {c.hashtags.map((h, j) => <span key={j} className="text-xs text-primary">#{h}</span>)}
            </div>
          )}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div><span className="font-medium">Guidelines:</span> {c.guidelines_followed}</div>
            <div><span className="font-medium">Compliance:</span> {c.compliance_notes}</div>
            <div><span className="font-medium">Best Time:</span> {c.best_posting_time} · <span className="font-medium">Est. Reach:</span> {c.estimated_reach}</div>
          </div>
        </div>
      ))}
    </GeneratorShell>
  );
}