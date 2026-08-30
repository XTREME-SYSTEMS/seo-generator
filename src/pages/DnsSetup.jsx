import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/kit/PageHeader';
import Panel from '@/components/kit/Panel';
import { Input } from '@/components/ui/input';
import RecordGroup from '@/components/dns/RecordGroup';
import { buildRecordSet } from '@/lib/dnsRecords';

export default function DnsSetup() {
  const [domain, setDomain] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    base44.entities.Client.list().then((rows) => {
      setClients(rows);
      if (rows.length && !domain) setDomain(rows[0].domain || '');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => buildRecordSet(domain), [domain]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Platform"
        title="DNS Setup"
        description="The exact record set to add in GoDaddy so Google Workspace and your site both resolve. Values Google generates per-account are marked and must be pasted from your Admin console."
      />

      <Panel title="Domain">
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="font-mono"
        />
        {clients.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {clients.filter((c) => c.domain).map((c) => (
              <button
                key={c.id}
                onClick={() => setDomain(c.domain)}
                className={`rounded border px-2 py-1 font-mono text-[11px] ${
                  domain === c.domain
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {c.domain}
              </button>
            ))}
          </div>
        )}
      </Panel>

      {groups.map((g) => (
        <RecordGroup key={g.group} group={g} />
      ))}

      <Panel title="Where to add these">
        <ol className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <li>1. GoDaddy → My Products → your domain → DNS → Manage Zones.</li>
          <li>2. Delete any existing MX records that do not point to Google, then add the MX record above.</li>
          <li>3. Add each TXT, A and CNAME record exactly as shown. Do not merge two SPF records — keep only one.</li>
          <li>4. In Google Admin, click Verify (TXT) and Start authentication (DKIM) once the records are saved.</li>
          <li>5. Propagation is usually minutes, occasionally up to 48 hours.</li>
        </ol>
      </Panel>
    </div>
  );
}