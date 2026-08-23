import React from 'react';

const TONES = {
  good: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  info: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  bad: 'bg-red-500/10 text-red-300 border-red-500/30',
  idle: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  sim: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
};

export default function StatusPill({ children, tone = 'idle' }) {
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${TONES[tone] || TONES.idle}`}>{children}</span>;
}