import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useTenant } from '@/lib/TenantContext';

// Tenant isolation: every client-owned query is filtered by client_id, never listed globally.
export function useTenantData(entityName, extraFilter = {}, sort = '-created_date') {
  const { clientId, loading: tenantLoading } = useTenant();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const filterKey = JSON.stringify(extraFilter);

  useEffect(() => {
    if (tenantLoading) return;
    if (!clientId) { setRows([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    base44.entities[entityName]
      .filter({ client_id: clientId, ...JSON.parse(filterKey) }, sort, 500)
      .then((res) => { if (!cancelled) { setRows(res); setLoading(false); } });
    return () => { cancelled = true; };
  }, [entityName, clientId, filterKey, sort, tenantLoading, reloadKey]);

  return { rows, loading, clientId, reload: () => setReloadKey((k) => k + 1) };
}

export function useGlobalData(entityName, sort = '-created_date') {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities[entityName].list(sort, 500).then((res) => {
      if (!cancelled) { setRows(res); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [entityName, sort, reloadKey]);

  return { rows, loading, reload: () => setReloadKey((k) => k + 1) };
}