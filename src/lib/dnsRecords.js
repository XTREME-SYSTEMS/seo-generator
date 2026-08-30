// Standard record set required for Google Workspace mail + domain verification,
// plus the records Base44/Vercel hosting needs. Values that Google generates
// per-account are flagged needs_input so they are never fabricated here.
export function buildRecordSet(domain) {
  const d = (domain || 'yourdomain.com').replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
  return [
    {
      group: 'Google Workspace verification',
      records: [
        {
          type: 'TXT',
          name: '@',
          value: 'google-site-verification=PASTE_TOKEN_FROM_GOOGLE_ADMIN',
          purpose: `Proves you own ${d} so Workspace and Search Console can be activated.`,
          needs_input: true,
        },
      ],
    },
    {
      group: 'Google Workspace mail (Gmail)',
      records: [
        { type: 'MX', name: '@', value: 'smtp.google.com', priority: 1, purpose: 'Routes all mail for the domain to Google Workspace.' },
        { type: 'TXT', name: '@', value: 'v=spf1 include:_spf.google.com ~all', purpose: 'SPF — authorizes Google to send mail as your domain.' },
        {
          type: 'TXT',
          name: 'google._domainkey',
          value: 'v=DKIM1; k=rsa; p=PASTE_DKIM_KEY_FROM_GOOGLE_ADMIN',
          purpose: 'DKIM — cryptographically signs outbound mail. Generate in Admin → Apps → Gmail → Authenticate email.',
          needs_input: true,
        },
        {
          type: 'TXT',
          name: '_dmarc',
          value: `v=DMARC1; p=none; rua=mailto:dmarc@${d}`,
          purpose: 'DMARC — starts in monitor mode so nothing is rejected while you verify alignment.',
        },
      ],
    },
    {
      group: 'Site hosting',
      records: [
        { type: 'A', name: '@', value: '76.76.21.21', purpose: 'Points the root domain at Vercel hosting.' },
        { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com', purpose: 'Points www at Vercel so both hostnames resolve.' },
      ],
    },
  ];
}