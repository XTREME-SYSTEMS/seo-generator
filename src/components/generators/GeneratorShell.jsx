import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function GeneratorShell({ icon: Icon, title, subtitle, prompt, setPrompt, industry, setIndustry, onGenerate, loading, children, placeholder }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder || "Describe what you want to generate..."}
          rows={4}
          className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none"
        />
        <div className="flex flex-wrap items-end gap-3 mt-4">
          {setIndustry && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted-foreground mb-1.5">Industry / Context (optional)</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. plumbing, SaaS, real estate"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
          )}
          <button
            onClick={onGenerate}
            disabled={loading || !prompt.trim()}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}