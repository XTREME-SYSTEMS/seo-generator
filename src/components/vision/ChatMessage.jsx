import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Loader2, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Circle, color: 'text-muted-foreground', label: 'Pending' },
  running: { icon: Loader2, color: 'text-sky-500', label: 'Running', spin: true },
  in_progress: { icon: Loader2, color: 'text-sky-500', label: 'In Progress', spin: true },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Success' },
  failed: { icon: AlertTriangle, color: 'text-red-500', label: 'Failed' },
  error: { icon: AlertTriangle, color: 'text-red-500', label: 'Error' },
};

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isFailed = status === 'failed' || status === 'error';

  // Parse results
  let parsedResults = toolCall.results;
  if (typeof parsedResults === 'string') {
    try { parsedResults = JSON.parse(parsedResults); } catch {}
  }
  const resultIsError = typeof parsedResults === 'object' && parsedResults?.error;
  const effectivelyFailed = isFailed || resultIsError || (typeof parsedResults === 'string' && /error|failed/i.test(parsedResults));

  // Parse arguments
  let parsedArgs = toolCall.arguments_string;
  if (typeof parsedArgs === 'string') {
    try { parsedArgs = JSON.parse(parsedArgs); } catch {}
  }

  // Honor display_projection
  const proj = toolCall.display_projection;
  const hideDetails = proj?.hide_details && proj?.details_redacted;

  return (
    <div className="mt-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left"
      >
        {expanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${effectivelyFailed ? 'text-red-500' : config.color} ${config.spin ? 'animate-spin' : ''}`} />
        <span className="font-mono font-medium text-foreground">{toolCall.name || 'function'}</span>
        <span className={`ml-auto text-[10px] ${effectivelyFailed ? 'text-red-500' : 'text-muted-foreground'}`}>
          {proj?.hide_details ? (effectivelyFailed ? proj.error_label : config.label) : config.label}
        </span>
      </button>
      {!hideDetails && expanded && (
        <div className="mt-2 space-y-2 pl-5">
          {parsedArgs && Object.keys(parsedArgs).length > 0 && (
            <div>
              <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Parameters</div>
              <pre className="overflow-x-auto rounded bg-background p-2 text-[10px] text-foreground">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Result</div>
              <pre className={`overflow-x-auto rounded bg-background p-2 text-[10px] ${effectivelyFailed ? 'text-red-500' : 'text-foreground'}`}>
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'text-right' : 'text-left'}`}>
        {message.content && (
          isUser ? (
            <div className="inline-block rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground">
              {message.content}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card px-3.5 py-2.5">
              <ReactMarkdown className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre_code]:bg-muted [&_pre_code]:p-2 [&_pre_code]:text-xs">
                {message.content}
              </ReactMarkdown>
            </div>
          )
        )}
        {message.tool_calls?.map((tc, idx) => (
          <ToolCallDisplay key={idx} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}