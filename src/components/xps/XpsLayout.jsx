import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ChevronRight } from 'lucide-react';

export default function XpsLayout({ children }) {
  return (
    <div id="top" className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-gray-900 text-sm">
              XPS
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">
              Xtreme Polishing<span className="text-yellow-500"> Systems</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link to="/" className="hover:text-yellow-600">Home</Link>
            <Link to="/locations" className="hover:text-yellow-600">All Locations</Link>
            <a href="#services" className="hover:text-yellow-600">Products</a>
            <a href="#training" className="hover:text-yellow-600">Training</a>
          </nav>
          <Link to="/locations" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> Find a Location
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-gray-900 text-xs">XPS</div>
                <span className="text-lg font-bold text-white">Xtreme Polishing Systems</span>
              </div>
              <p className="text-sm max-w-xs">
                Premium concrete products, epoxy coatings, flooring machines, and decorative materials for professional contractors. 66+ locations across North America.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-white font-semibold mb-1">Quick Links</span>
              <Link to="/" className="hover:text-yellow-400">Home</Link>
              <Link to="/locations" className="hover:text-yellow-400">All Locations</Link>
              <a href="#services" className="hover:text-yellow-400">Products</a>
              <a href="#training" className="hover:text-yellow-400">Training & Certification</a>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-white font-semibold mb-1">Top Selling</span>
              <span>Concrete Polishing Supplies</span>
              <span>Epoxy Coatings</span>
              <span>Flooring Machines & Equipment</span>
              <span>Diamond Tooling & Accessories</span>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Xtreme Polishing Systems. All rights reserved. Supplies concrete and floor resurfacing contractors with professional, premium quality, and innovative products at affordable prices.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}