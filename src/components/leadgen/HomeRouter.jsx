import React from 'react';
import Landing from '@/pages/marketing/Landing';
import LeadGenHome from '@/pages/leadgen/LeadGenHome';
import XpsHome from '@/pages/xps/XpsHome';
import { getDomainConfig } from '@/lib/leadGenDomains';

// Domain-aware home router — renders the correct site per domain, Landing for everything else
export default function HomeRouter() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const config = getDomainConfig(hostname);
  if (config) {
    if (config.domainType === 'store_locations') {
      return <XpsHome />;
    }
    return <LeadGenHome config={config} />;
  }
  return <Landing />;
}