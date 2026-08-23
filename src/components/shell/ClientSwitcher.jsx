import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/lib/TenantContext';

export default function ClientSwitcher() {
  const { clients, clientId, setClientId } = useTenant();
  if (!clients.length) return <span className="text-xs text-muted-foreground">No tenants</span>;
  return (
    <Select value={clientId} onValueChange={setClientId}>
      <SelectTrigger className="h-9 w-full border-border bg-secondary/60 text-xs">
        <SelectValue placeholder="Select tenant" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}