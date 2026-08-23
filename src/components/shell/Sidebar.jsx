import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from './navConfig';
import ClientSwitcher from './ClientSwitcher';

export default function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="font-heading text-sm font-semibold tracking-tight text-foreground">SEARCH DOMINANCE OS</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Shadow Mode · V2</div>
      </div>
      <div className="border-b border-sidebar-border px-4 py-3">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tenant</div>
        <ClientSwitcher />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">{group.label}</div>
            {group.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link key={item.to} to={item.to} onClick={onNavigate}
                  className={`group mb-0.5 flex items-center gap-2.5 rounded px-2 py-1.5 text-[13px] transition-all duration-200 ${active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`}>
                  <item.icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}