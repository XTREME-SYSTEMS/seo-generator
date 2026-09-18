import React from 'react';
import { Sparkles, Rocket, Zap, Brain, Globe, Server } from 'lucide-react';

const CATEGORY_ICONS = {
  AI: Brain,
  SEO: Globe,
  Automation: Zap,
  Infrastructure: Server,
  Data: Server,
  Browser: Globe,
  Content: Rocket,
};

export default function GoldenEggsPanel({ goldenEggs, techAccelerators }) {
  if ((!goldenEggs || goldenEggs.length === 0) && (!techAccelerators || techAccelerators.length === 0)) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Golden Eggs */}
      {goldenEggs && goldenEggs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-foreground">Technological Golden Eggs</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{goldenEggs.length} found</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {goldenEggs.map((egg, i) => {
              const Icon = CATEGORY_ICONS[egg.category] || Sparkles;
              return (
                <div key={i} className="border border-border/50 rounded-lg p-3 hover:border-yellow-400 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-yellow-500 shrink-0" />
                      <h4 className="font-semibold text-sm text-foreground">{egg.name}</h4>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold shrink-0">
                      {egg.estimated_speed_multiplier}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{egg.impact}</p>
                  <p className="text-xs text-foreground/70">{egg.how_it_works}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-muted-foreground">Category: <strong className="text-foreground">{egg.category}</strong></span>
                    <span className="text-muted-foreground">Difficulty: <strong className={egg.adoption_difficulty === 'easy' ? 'text-green-600' : egg.adoption_difficulty === 'medium' ? 'text-yellow-600' : 'text-red-500'}>{egg.adoption_difficulty}</strong></span>
                    {egg.url && egg.url !== '#' && (
                      <a href={egg.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Learn more →</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech Accelerators */}
      {techAccelerators && techAccelerators.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-foreground">Tech Accelerators — Unfair Advantages</h3>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {techAccelerators.map((acc, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-3 hover:border-yellow-400 transition-colors">
                <h4 className="font-semibold text-sm text-foreground mb-1">{acc.name}</h4>
                <p className="text-xs text-yellow-600 font-medium mb-1">{acc.impact}</p>
                <p className="text-xs text-muted-foreground mb-1">{acc.how_it_works}</p>
                <p className="text-xs text-green-600"><strong>Advantage:</strong> {acc.advantage}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}