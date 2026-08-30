import React from 'react';

export default function FilterChips({ options, value, onChange, allLabel = 'All' }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
          !value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
        }`}
      >
        {allLabel}
      </button>
      {options.map((o) => {
        const key = typeof o === 'string' ? o : o.value;
        const text = typeof o === 'string' ? o : o.label;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(value === key ? '' : key)}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              value === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}