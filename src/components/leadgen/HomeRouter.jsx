import React from 'react';
import Landing from '@/pages/marketing/Landing';
import LeadGenHome from '@/pages/leadgen/LeadGenHome';

// Domain-aware home router — renders LeadGenHome for lead-gen domains, Landing for everything else
export default function HomeRouter() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const leadGenDomains = ['leadgennearyou.com', 'www.leadgennearyou.com', 'leadgennearme.com', 'www.leadgennearme.com'];
  if (leadGenDomains.includes(hostname)) {
    return <LeadGenHome />;
  }
  return <Landing />;
}