import { useCallback, useRef, useState } from 'react';
import { invokeAI, AI_STATUS } from '@/lib/ai';

/**
 * Drives one AI action through the explicit interface states the app requires:
 * IDLE -> RUNNING -> COMPLETE | FAILED | BLOCKED.
 * A second call while one is in flight is refused, so a double click can never
 * become a second paid request.
 */
export default function useAI() {
  const [status, setStatus] = useState(AI_STATUS.IDLE);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const busy = useRef(false);

  const run = useCallback(async (options) => {
    if (busy.current) return { skipped: true, reason: 'A request is already running.' };
    busy.current = true;
    setStatus(AI_STATUS.RUNNING);
    setError(null);
    try {
      const result = await invokeAI(options);
      setData(result.data);
      setMeta(result.meta);
      setStatus(AI_STATUS.COMPLETE);
      return result;
    } catch (err) {
      setError(err?.message || 'AI request failed');
      setMeta(err?.model ? { actual_model: err.model, status: 'FAILED' } : null);
      setStatus(err?.code === 'AI_BLOCKED' ? AI_STATUS.BLOCKED : AI_STATUS.FAILED);
      return { error: err };
    } finally {
      busy.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(AI_STATUS.IDLE);
    setData(null);
    setError(null);
    setMeta(null);
  }, []);

  return {
    status,
    data,
    error,
    meta,
    run,
    reset,
    isRunning: status === AI_STATUS.RUNNING,
    isBlocked: status === AI_STATUS.BLOCKED,
    isFailed: status === AI_STATUS.FAILED,
  };
}