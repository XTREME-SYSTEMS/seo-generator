import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, ShieldAlert } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { TenantProvider, useTenant } from '@/lib/TenantContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

function TopBar({ onOpen }) {
  const { client } = useTenant();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onOpen} className="rounded p-1.5 text-muted-foreground hover:bg-muted lg:hidden"><Menu className="h-4 w-4" /></button>
        <div className="flex min-w-0 items-center gap-2 truncate font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="truncate">Shadow mode · no paid-media or production mutations · {client ? client.name : 'no tenant'}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => base44.auth.logout()}>Sign out</Button>
      </div>
    </header>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <TenantProvider>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block"><div className="sticky top-0 h-screen"><Sidebar /></div></div>
        {open && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
            <div className="relative z-10 h-full"><Sidebar onNavigate={() => setOpen(false)} /></div>
            <button className="relative z-10 m-3 self-start rounded bg-card p-2 text-foreground" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <TopBar onOpen={() => setOpen(true)} />
          <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10"><Outlet /></main>
        </div>
      </div>
    </TenantProvider>
  );
}