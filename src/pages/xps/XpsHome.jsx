import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import XpsLayout from '@/components/xps/XpsLayout';
import { XPS_LOCATIONS, XPS_EXPANSION_CITIES, XPS_REGIONS, XPS_SERVICES, getLocationName, getLocationsByRegion } from '@/lib/xpsLocations';
import { MapPin, Phone, Search, Building2, GraduationCap, Truck, Wrench, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function XpsHome() {
  const [search, setSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState('all');

  const filtered = useMemo(() => {
    let list = XPS_LOCATIONS.filter((l) => l.status === 'open');
    if (activeRegion !== 'all') list = list.filter((l) => l.region === activeRegion);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        l.stateName.toLowerCase().includes(q) ||
        (l.area && l.area.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, activeRegion]);

  const openCount = XPS_LOCATIONS.filter((l) => l.status === 'open').length;

  return (
    <XpsLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-yellow-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
              {openCount}+ Locations Nationwide
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Premium Concrete & Epoxy Flooring Supplies Near You
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Xtreme Polishing Systems supplies contractors with professional-grade concrete products, epoxy coatings,
              flooring machines, and decorative materials. Find a supply center or training location near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/locations" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5" /> Browse All Locations
              </Link>
              <a href="#services" className="border border-gray-300 hover:border-yellow-400 text-gray-700 font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Wrench className="w-5 h-5" /> View Products
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-4 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div><div className="text-3xl font-bold text-yellow-500">{openCount}+</div><div className="text-sm text-gray-500">Locations</div></div>
          <div><div className="text-3xl font-bold text-yellow-500">10+</div><div className="text-sm text-gray-500">Product Lines</div></div>
          <div><div className="text-3xl font-bold text-yellow-500">4</div><div className="text-sm text-gray-500">Countries</div></div>
          <div><div className="text-3xl font-bold text-yellow-500">35+</div><div className="text-sm text-gray-500">Expansion Cities</div></div>
        </div>
      </section>

      {/* Search + Location Directory */}
      <section id="locations" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Find an XPS Location Near You</h2>
          <p className="text-gray-500 text-center mb-8">Search by city, state, or region to find your nearest supply center</p>

          {/* Search */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search city or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Region filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveRegion('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeRegion === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All Regions
            </button>
            {XPS_REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeRegion === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Results */}
          {search || activeRegion !== 'all' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((loc) => (
                <LocationCard key={loc.slug} loc={loc} />
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-8">No locations found. Try a different search.</p>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {XPS_REGIONS.map((region) => {
                const locs = getLocationsByRegion(region);
                if (locs.length === 0) return null;
                return (
                  <div key={region}>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-yellow-400 rounded-full"></span>
                      {region} <span className="text-gray-400 font-normal text-sm">({locs.length})</span>
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {locs.map((loc) => <LocationCard key={loc.slug} loc={loc} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-gray-50 py-12 px-4 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">Products & Services</h2>
          <p className="text-gray-500 text-center mb-8">Everything contractors need for concrete and flooring projects</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {XPS_SERVICES.map((s) => (
              <div key={s.slug} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training */}
      <section id="training" className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Hands-On Contractor Training</h2>
          <p className="text-gray-600 mb-6">
            Select XPS locations are designated Training Centers, offering hands-on certification classes for
            concrete polishing, epoxy application, surface preparation, and more. Level up your skills and grow your business.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {XPS_LOCATIONS.filter((l) => l.type === 'Training Location' || l.type === 'Distribution & Training Center').slice(0, 8).map((l) => (
              <Link key={l.slug} to={`/locations/${l.slug}`} className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 transition-colors">
                {getLocationName(l)}, {l.state}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Expansion */}
      <section className="bg-gray-50 py-12 px-4 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Coming Soon — New XPS Xpress Locations</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            XPS Xpress locations are now open to new business opportunities for motivated entrepreneurs, contractors, and industry professionals.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {XPS_EXPANSION_CITIES.map((c, i) => (
              <span key={i} className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500">
                {c.city}, {c.state}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-yellow-400 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Your Next Project?</h2>
          <p className="text-gray-800 mb-6">Find your nearest XPS supply center and get expert help with product selection.</p>
          <Link to="/locations" className="inline-flex items-center gap-2 bg-gray-900 text-yellow-400 font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Find a Location <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </XpsLayout>
  );
}

function LocationCard({ loc }) {
  const name = getLocationName(loc);
  const isTraining = loc.type === 'Training Location' || loc.type === 'Distribution & Training Center';
  return (
    <Link
      to={`/locations/${loc.slug}`}
      className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-yellow-400 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {isTraining ? <GraduationCap className="w-5 h-5 text-yellow-500" /> : <Building2 className="w-5 h-5 text-gray-400" />}
          <h3 className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{name}</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-yellow-500 transition-colors" />
      </div>
      <div className="text-sm text-gray-500 space-y-1">
        <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {loc.address}</p>
        <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {loc.phone}</p>
        <p className="text-xs text-gray-400 mt-1">{loc.type}</p>
      </div>
    </Link>
  );
}