import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenant } from '@/lib/TenantContext';
import { Building2, Globe, DollarSign, Briefcase, Layers } from 'lucide-react';

const STATUS_STYLES = {
  non_production_pilot: 'bg-blue-100 text-blue-700',
  shadow: 'bg-amber-100 text-amber-700',
  production: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  non_production_pilot: 'Pilot',
  shadow: 'Shadow',
  production: 'Production',
};

export default function ClientSwitcher() {
  const { clients, clientId, setClientId } = useTenant();
  const [open, setOpen] = useState(false);

  if (!clients.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Building2 className="w-3.5 h-3.5" />
        No tenants
      </div>
    );
  }

  const current = clients.find((c) => c.id === clientId);

  return (
    <Select value={clientId} onValueChange={(v) => { setClientId(v); setOpen(false); }} open={open} onOpenChange={setOpen}>
      <SelectTrigger className="h-auto min-h-9 w-full border-border bg-secondary/60 text-xs py-1.5">
        <SelectValue placeholder="Select tenant" />
      </SelectTrigger>
      <SelectContent className="max-h-[400px] min-w-[300px]">
        {/* Summary header */}
        <div className="px-2 py-1.5 border-b border-border mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <Layers className="w-3 h-3" />
          {clients.length} tenants
        </div>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id} className="text-xs py-2">
            <div className="flex flex-col gap-0.5 w-full">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">{c.name}</span>
                {c.status && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[c.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                )}
              </div>
              {(c.domain || c.industry || c.monthly_paid_spend) && (
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {c.domain && (
                    <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                      <Globe className="w-2.5 h-2.5 shrink-0" />
                      {c.domain}
                    </span>
                  )}
                  {c.industry && (
                    <span className="flex items-center gap-0.5 truncate max-w-[100px]">
                      <Briefcase className="w-2.5 h-2.5 shrink-0" />
                      {c.industry}
                    </span>
                  )}
                  {c.monthly_paid_spend > 0 && (
                    <span className="flex items-center gap-0.5 shrink-0">
                      <DollarSign className="w-2.5 h-2.5" />
                      {(c.monthly_paid_spend / 1000).toFixed(1)}k/mo
                    </span>
                  )}
                </div>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}