import React from 'react';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';

export default function GodModeButton({ onClick, status, disabled }) {
  const isRunning = status === 'running';
  const isDone = status === 'done';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRunning}
      className="relative group w-full max-w-2xl mx-auto block"
    >
      <div className={`absolute -inset-1 rounded-2xl blur-lg transition-all duration-500 ${
        isRunning ? 'bg-yellow-400/40 animate-pulse' : isDone ? 'bg-green-400/30' : 'bg-yellow-400/20 group-hover:bg-yellow-400/40'
      }`} />
      <div className={`relative rounded-2xl border-2 px-8 py-8 transition-all duration-300 ${
        isRunning
          ? 'border-yellow-400 bg-yellow-50'
          : isDone
          ? 'border-green-400 bg-green-50'
          : 'border-yellow-400 bg-white group-hover:scale-[1.02] group-hover:shadow-2xl'
      }`}>
        <div className="flex flex-col items-center gap-3">
          {isRunning ? (
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
          ) : isDone ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <Zap className="w-12 h-12 text-yellow-500 group-hover:scale-110 transition-transform" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isRunning ? 'EXECUTING GOD MODE...' : isDone ? 'GOD MODE COMPLETE' : 'EXECUTE GOD MODE'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRunning
                ? 'Running 100 parallel simulations, discovering golden eggs, benchmarking competitors...'
                : isDone
                ? 'All stages complete — review your results below'
                : 'One button runs the entire autonomous pipeline'}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}