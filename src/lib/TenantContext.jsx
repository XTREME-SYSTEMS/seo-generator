import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const TenantContext = createContext({ clients: [], client: null, clientId: '', setClientId: () => {}, loading: true });

export function TenantProvider({ children }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientIdState] = useState(() => localStorage.getItem('sdos_client_id') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Client.list('created_date').then((rows) => {
      setClients(rows);
      setClientIdState((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows[0]?.id || ''));
      setLoading(false);
    });
  }, []);

  const setClientId = (id) => {
    localStorage.setItem('sdos_client_id', id);
    setClientIdState(id);
  };

  const client = clients.find((c) => c.id === clientId) || null;
  return (
    <TenantContext.Provider value={{ clients, client, clientId, setClientId, loading, setClients }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);