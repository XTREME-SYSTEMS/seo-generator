import React, { useState } from 'react';
import {
  Lightbulb, DollarSign, Radar, Send, FileCheck, FileText,
  RefreshCw, LayoutTemplate, Filter, Shield, Eye, Bot, Sparkles,
} from 'lucide-react';
import IdeaGenerator from '@/components/generators/IdeaGenerator';
import WealthGenerator from '@/components/generators/WealthGenerator';
import DigitalScanner from '@/components/generators/DigitalScanner';
import BatchSubmitter from '@/components/generators/BatchSubmitter';
import ComplianceIngester from '@/components/generators/ComplianceIngester';
import ContentGenerator from '@/components/generators/ContentGenerator';
import ReverseEngineer from '@/components/generators/ReverseEngineer';
import DocumentGenerator from '@/components/generators/DocumentGenerator';
import ProgrammaticSiteGenerator from '@/components/generators/ProgrammaticSiteGenerator';
import FunnelIdeaGenerator from '@/components/generators/FunnelIdeaGenerator';
import ProblemSolution from '@/components/generators/ProblemSolution';
import EliteScanner from '@/components/generators/EliteScanner';
import AICompanyFollower from '@/components/generators/AICompanyFollower';

const TABS = [
  { id: 'idea', label: 'Idea Generator', icon: Lightbulb, group: 'Generate' },
  { id: 'wealth', label: 'Digital Wealth', icon: DollarSign, group: 'Generate' },
  { id: 'funnel', label: 'Funnel Ideas', icon: Filter, group: 'Generate' },
  { id: 'problem', label: 'Problem/Solution', icon: Sparkles, group: 'Generate' },
  { id: 'scanner', label: 'Digital Scanner', icon: Radar, group: 'Dominate' },
  { id: 'ingester', label: 'Compliance Ingester', icon: FileCheck, group: 'Dominate' },
  { id: 'submitter', label: 'Batch Submitter', icon: Send, group: 'Dominate' },
  { id: 'content', label: 'Content Generator', icon: FileText, group: 'Create' },
  { id: 'reverse', label: 'Reverse Engineer', icon: RefreshCw, group: 'Create' },
  { id: 'document', label: 'Document Generator', icon: FileText, group: 'Create' },
  { id: 'site', label: 'Programmatic Site', icon: LayoutTemplate, group: 'Create' },
  { id: 'elite', label: 'Elite Scanner', icon: Shield, group: 'Intelligence' },
  { id: 'ai-follow', label: 'AI Company Follower', icon: Bot, group: 'Intelligence' },
];

const GROUPS = ['Generate', 'Dominate', 'Create', 'Intelligence'];

export default function GeneratorHub() {
  const [tab, setTab] = useState('idea');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Generator Hub</h1>
            <p className="text-xs text-muted-foreground">13 generators for ideas, wealth, dominance, content, and intelligence</p>
          </div>
        </div>

        {/* Tab Navigation by Group */}
        <div className="space-y-1 mb-6">
          {GROUPS.map(group => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2 py-1">{group}</div>
              <div className="flex flex-wrap gap-1">
                {TABS.filter(t => t.group === group).map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                        tab === t.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:border-primary/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {tab === 'idea' && <IdeaGenerator />}
          {tab === 'wealth' && <WealthGenerator />}
          {tab === 'funnel' && <FunnelIdeaGenerator />}
          {tab === 'problem' && <ProblemSolution />}
          {tab === 'scanner' && <DigitalScanner />}
          {tab === 'ingester' && <ComplianceIngester />}
          {tab === 'submitter' && <BatchSubmitter />}
          {tab === 'content' && <ContentGenerator />}
          {tab === 'reverse' && <ReverseEngineer />}
          {tab === 'document' && <DocumentGenerator />}
          {tab === 'site' && <ProgrammaticSiteGenerator />}
          {tab === 'elite' && <EliteScanner />}
          {tab === 'ai-follow' && <AICompanyFollower />}
        </div>
      </div>
    </div>
  );
}