import React from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function About() {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground mb-6">
          About Xtreme SEO Optimizer
        </h1>
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Xtreme SEO Optimizer is an enterprise-grade, autonomous AI marketing orchestration platform that automates SEO, AEO (Answer Engine Optimization), and AI search performance for businesses of all sizes. The platform combines real-time Google Search Console data integration, competitor intelligence, and a multi-agent AI swarm to continuously monitor, analyze, and improve search rankings without manual intervention.
          </p>
          <p>
            It is designed for marketing agencies, local service businesses, and enterprise teams who need to dominate search results and AI-generated answers across Google, ChatGPT, Perplexity, and other emerging AI search engines. The system features programmatic SEO at massive scale, generating hundreds of location-specific landing pages, industry-specific content playbooks, and automated technical SEO audits.
          </p>
          <p>
            Built by the Xtreme SEO team, the platform leverages proof-level data labeling, evidence-based ranking methods, and a delivery guarantee framework to ensure measurable, auditable results. Whether you need to rank a single domain or manage a portfolio of lead-generation websites, Xtreme SEO Optimizer provides the intelligence, automation, and scalability to win in modern search.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}