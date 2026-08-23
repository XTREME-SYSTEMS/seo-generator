import React from 'react';

export function Table({ columns, children }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-border bg-muted/30">
            {columns.map((c) => (
              <th key={c} className="px-5 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }) {
  return <tr className="border-b border-border/60 transition-colors hover:bg-muted/20">{children}</tr>;
}

export function Cell({ children, className = '' }) {
  return <td className={`px-5 py-3 align-middle ${className}`}>{children}</td>;
}