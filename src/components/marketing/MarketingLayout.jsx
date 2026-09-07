import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://media.base44.com/images/public/6a8aaecf2642e595c591a5dc/f3a5caad5_LOGO.png';

export default function MarketingLayout({ children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Xtreme SEO Optimizer" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <div className="font-heading text-sm font-bold tracking-tight">XTREME SEO</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FFD700]/70">Optimizer</div>
            </div>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm text-white/70 hover:text-[#FFD700] transition-colors">Home</Link>
            <Link to="/pricing" className="text-sm text-white/70 hover:text-[#FFD700] transition-colors">Pricing</Link>
            <Link to="/services" className="text-sm text-white/70 hover:text-[#FFD700] transition-colors">Services</Link>
            <Link to="/portal" className="text-sm text-white/70 hover:text-[#FFD700] transition-colors">Portal</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/5">Sign In</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">Get Started</Button>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded p-1.5 text-white/70 hover:bg-white/5 md:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-white/5 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3">
              <Link to="/" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/pricing" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link to="/services" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Services</Link>
              <Link to="/portal" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Portal</Link>
              <Link to="/login" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Sign In</Link>
            </div>
          </div>
        )}
      </nav>
      {children}
      <footer className="border-t border-white/5 bg-[#0a0a0a] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-6">
            <img src={LOGO_URL} alt="Xtreme SEO Optimizer" className="h-14 w-auto" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FFD700]/60">Intelligence for Growth</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
              <Link to="/" className="hover:text-[#FFD700]">Home</Link>
              <Link to="/pricing" className="hover:text-[#FFD700]">Pricing</Link>
              <Link to="/services" className="hover:text-[#FFD700]">Services</Link>
              <Link to="/portal" className="hover:text-[#FFD700]">Customer Portal</Link>
              <Link to="/login" className="hover:text-[#FFD700]">Sign In</Link>
            </div>
            <p className="text-xs text-white/30">© 2026 Xtreme SEO Optimizer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}