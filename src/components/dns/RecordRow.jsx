import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function RecordRow({ record }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(record.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex shrink-0 items-center gap-2 sm:w-40">
        <span className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {record.type}
        </span>
        <span className="truncate font-mono text-xs text-foreground">{record.name}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-all font-mono text-xs text-foreground">{record.value}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{record.purpose}</p>
        {record.needs_input && (
          <p className="mt-1 text-[11px] font-medium text-amber-600">
            Replace with the value shown in your Google Admin console.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:justify-end">
        {record.priority != null && (
          <span className="font-mono text-[11px] text-muted-foreground">prio {record.priority}</span>
        )}
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}