import React from 'react';
import { Link } from 'react-router-dom';

// Shared layout for LeadGenNearYou.com pages
export default function LeadGenLayout({ children }) {
  return (
    <div id="top" className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              Lead Gen<span className="text-yellow-500"> Near You</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link to="/" className="hover:text-yellow-600">Home</Link>
            <a href="#services" className="hover:text-yellow-600">Services</a>
            <a href="#how-it-works" className="hover:text-yellow-600">How It Works</a>
            <a href="#states" className="hover:text-yellow-600">Browse Cities</a>
          </nav>
          <a href="#top" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors">
            Get Free Quotes
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div>
              <span className="text-xl font-bold text-white">
                Lead Gen<span className="text-yellow-400"> Near You</span>
              </span>
              <p className="text-sm mt-2 max-w-xs">Free lead generation service connecting homeowners with top-rated local service providers across the United States.</p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/" className="hover:text-yellow-400">Home</Link>
              <a href="#services" className="hover:text-yellow-400">Services</a>
              <a href="#how-it-works" className="hover:text-yellow-400">How It Works</a>
              <a href="#states" className="hover:text-yellow-400">Browse by State</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Lead Gen Near You. All rights reserved. Connecting homeowners with local service providers nationwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}