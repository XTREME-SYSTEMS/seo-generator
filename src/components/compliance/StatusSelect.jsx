import React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  PASS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FIXED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NOT_RUN: 'bg-slate-50 text-slate-600 border-slate-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  FAIL: 'bg-red-50 text-red-700 border-red-200',
  BLOCKED: 'bg-red-50 text-red-700 border-red-200',
  'N/A': 'bg-slate-50 text-slate-500 border-slate-200',
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  MITIGATING: 'bg-amber-50 text-amber-700 border-amber-200',
  MITIGATED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-slate-50 text-slate-500 border-slate-200',
  ADOPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROPOSED: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  SUPERSEDED: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function StatusSelect({ value, options, onChange, disabled }) {
  return (
    <select
      value={value || options[0]}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'text-[11px] font-mono font-semibold uppercase tracking-wide rounded border px-1.5 py-1 cursor-pointer transition-colors',
        'focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50',
        TONES[value] || TONES.NOT_RUN
      )}
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-white text-slate-800">
          {o.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}