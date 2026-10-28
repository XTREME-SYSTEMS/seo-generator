import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, ShieldCheck, ShieldAlert, ServerCrash, Server, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATE_STYLE = {
  HEALTHY: { tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: ShieldCheck },
  DEGRADED: { tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: ShieldAlert },
  UNREACHABLE: { tone: 'text-red-700 bg-red-50 border-red-200', icon: ServerCrash },
  MISCONFIGURED: { tone: 'text-purple-700 bg-purple-50 border-purple-200', icon: Server },
};

const fmtTime = (iso) => {
  if (!iso) return '—';
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
};

export default function AttestationPanel({ records, onRefreshed }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  const latest = useMemo(() => {
    const byLabel = {};
    for (const r of records) {
      if (!byLabel[r.engine_label]) byLabel[r.engine_label] = r;
    }
    return Object.values(byLabel);
  }, [records]);

  const run = async () => {
    setRunning(true);
    setMessage('');
    try {
      const res = await base44.functions.invoke('EngineAttestation', { force: true });
      const data = res.data || {};
      if (data.error) setMessage(data.error);
      else setMessage(`Overall: ${data.overall} · ${data.created} receipt${data.created === 1 ? '' : 's'} written`);
      await onRefreshed?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunning(false);
    }
  };

  const stale = latest.length > 0 && latest.every((r) => Date.now() - new Date(r.checked_at).getTime() > 30 * 60 * 1000);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <h3 className="text-sm font-bold text-foreground">Live engine attestation</h3>
          <p className="text-xs text-muted-foreground">
            Machine-generated proof the deployed engine answers — replaces hand-typed "NOT RUN".
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold disabled:opacity-60"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Attest now
        </button>
      </div>

      {message && <div className="text-xs px-3 py-2 rounded-md border border-border bg-muted text-foreground">{message}</div>}

      {stale && (
        <div className="text-xs px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800">
          No attestation in the last 30 minutes — heartbeat is stale. Staleness is the warning sign that a stale container is still serving traffic.
        </div>
      )}

      {latest.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <Hash className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No attestation receipts yet. Run one to prove the engine is live.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {latest.map((r) => {
            const style = STATE_STYLE[r.state] || STATE_STYLE.UNREACHABLE;
            const Icon = style.icon;
            return (
              <div key={r.engine_label} className={cn('border rounded-lg p-3', style.tone)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wide">{r.engine_label}</span>
                  <span className="text-[10px] font-semibold ml-auto">{r.state}</span>
                </div>
                <p className="text-[11px] font-mono truncate opacity-90">{r.host || 'unconfigured'}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px] opacity-90">
                  <span>HTTP <strong>{r.http_status || '—'}</strong></span>
                  <span>Latency <strong>{r.latency_ms != null ? `${r.latency_ms}ms` : '—'}</strong></span>
                  <span>Liveness <strong>{r.liveness_ok ? 'ok' : 'fail'}</strong></span>
                  <span>Readiness <strong>{r.readiness_ok ? 'ok' : 'fail'}</strong></span>
                  <span>Pool <strong>{r.pool_size != null ? `${r.pool_size}/${r.pool_capacity || '?'}` : '—'}</strong></span>
                  <span>STT <strong>{r.stt_available === true ? 'on' : r.stt_available === false ? 'off' : 'unknown'}</strong></span>
                  <span className="col-span-2">SHA <strong className="font-mono">{r.git_sha ? r.git_sha.slice(0, 12) : 'unreported'}</strong></span>
                  <span className="col-span-2">Checked <strong>{fmtTime(r.checked_at)}</strong></span>
                </div>
                {r.findings?.length > 0 && (
                  <ul className="mt-2 pt-2 border-t border-current/20 space-y-1">
                    {r.findings.map((f, i) => (
                      <li key={i} className="text-[11px] leading-snug">• {f}</li>
                    ))}
                  </ul>
                )}
                {r.receipt_hash && (
                  <p className="mt-2 pt-2 border-t border-current/20 text-[10px] font-mono truncate opacity-70">
                    receipt {r.receipt_hash.slice(0, 24)}…
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}