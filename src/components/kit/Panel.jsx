import React from 'react';

export default function Panel({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-border bg-card hairline ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate font-heading text-sm font-medium text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}