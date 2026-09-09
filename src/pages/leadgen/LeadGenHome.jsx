import React from 'react';
import { Link } from 'react-router-dom';
import { STATES, CITIES_BY_STATE, SERVICE_CATEGORIES } from '@/lib/leadGenCities';
import LeadForm from '@/components/leadgen/LeadForm';
import LeadGenLayout from '@/components/leadgen/LeadGenLayout';
import { Search, Zap, CheckCircle2, MapPin, ArrowRight } from 'lucide-react';

export default function LeadGenHome() {
  return (
    <LeadGenLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-yellow-50 to-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Get Free Quotes from Local Pros Near You
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Lead Gen Near You connects homeowners and businesses with top-rated, verified local service
                providers across {STATES.length} states and {Object.values(CITIES_BY_STATE).flat().length}+ cities.
                Get up to 3 free quotes — no obligation, fast response.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-6">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 100% Free</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Obligation</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Licensed Pros</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 24hr Response</span>
              </div>
              <a href="#lead-form" className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors">
                Get My Free Quotes <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <div id="lead-form">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 px-4 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-yellow-400 rounded-full flex items-center justify-center">
                <Search className="w-7 h-7 text-gray-900" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">1. Tell Us What You Need</h3>
              <p className="text-sm text-gray-600">Fill out our quick form with your project details and contact info.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-yellow-400 rounded-full flex items-center justify-center">
                <Zap className="w-7 h-7 text-gray-900" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">2. Get Matched Instantly</h3>
              <p className="text-sm text-gray-600">We connect you with up to 3 qualified local pros within 24 hours.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-yellow-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-gray-900" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">3. Compare & Choose</h3>
              <p className="text-sm text-gray-600">Review quotes, compare providers, and pick the best one for your project.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Services We Connect You With</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICE_CATEGORIES.map((s) => (
              <div key={s.slug} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
                <h3 className="font-bold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* State Directory */}
      <section id="states" className="py-12 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Browse Cities by State</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STATES.map((stateCode) => {
              const cities = CITIES_BY_STATE[stateCode];
              const stateName = cities[0]?.stateName || stateCode;
              return (
                <div key={stateCode} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-yellow-500" />
                    {stateName} ({cities.length} cities)
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.slice(0, 8).map((c) => (
                      <Link
                        key={c.route}
                        to={c.cleanRoute}
                        className="text-xs bg-gray-100 hover:bg-yellow-100 text-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        {c.cityName}
                      </Link>
                    ))}
                    {cities.length > 8 && (
                      <span className="text-xs text-gray-400 px-2 py-1">+{cities.length - 8} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-yellow-400 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Free Quotes?</h2>
          <p className="text-gray-800 mb-6">Fill out the form and get matched with local pros today.</p>
          <a href="#lead-form" className="inline-flex items-center gap-2 bg-gray-900 text-yellow-400 font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Get My Free Quotes <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </LeadGenLayout>
  );
}