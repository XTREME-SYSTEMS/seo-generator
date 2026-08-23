import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Circle, ArrowRight } from 'lucide-react';

export default function GettingStarted({ clientsCount, methodsCount, connectorStatuses }) {
  const gscConnected = connectorStatuses.some((c) => c.service?.toLowerCase().includes('search console') && c.state === 'authorized');
  const gaConnected = connectorStatuses.some((c) => c.service?.toLowerCase().includes('analytics') && c.state === 'authorized');

  const steps = [
    {
      done: clientsCount > 0,
      label: 'Onboard your clients',
      detail: clientsCount > 0 ? `${clientsCount} client${clientsCount > 1 ? 's' : ''} active` : 'Add your first client project',
      link: '/seo-generator',
    },
    {
      done: true,
      label: 'Seed target queries (all 50 states)',
      detail: '200+ location queries per client',
    },
    {
      done: methodsCount > 0,
      label: 'Discover ranking methods',
      detail: methodsCount > 0 ? `${methodsCount} AI-discovered strategies` : 'Run the research engine',
      link: '/seo-generator',
    },
    {
      done: gscConnected,
      label: 'Connect Google Search Console',
      detail: gscConnected ? 'Connected \u2014 real rank data flowing' : 'Enables real ranking measurements',
      link: '/connectors',
    },
    {
      done: gaConnected,
      label: 'Connect Google Analytics',
      detail: gaConnected ? 'Connected \u2014 traffic data flowing' : 'Enables traffic attribution',
      link: '/connectors',
    },
    {
      done: false,
      label: 'Set up live rank tracking',
      detail: 'Track SERP positions automatically',
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">Getting started</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{completed} of {steps.length} steps complete</p>
        </div>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ul className="space-y-3">
        {steps.map((step, i) => (
          <li key={i}>
            {step.link && !step.done ? (
              <Link to={step.link} className="group flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground group-hover:text-primary">{step.label}</p>
                  <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                </div>
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ) : (
              <div className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                  <p className="text-[11px] text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}