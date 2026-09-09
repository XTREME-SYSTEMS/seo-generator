import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCity, getNearbyCities, isValidState, generateFaqs, SERVICE_CATEGORIES, STATES, CITIES_BY_STATE } from '@/lib/leadGenCities';
import LeadForm from '@/components/leadgen/LeadForm';
import LeadGenLayout from '@/components/leadgen/LeadGenLayout';
import { MapPin, CheckCircle2, ArrowRight, ChevronDown, Search, Zap, Shield, Clock } from 'lucide-react';

export default function CityLanding() {
  const { state: stateParam, city: cityParam } = useParams();
  const stateCode = (stateParam || '').toUpperCase();
  const citySlug = (cityParam || '').toLowerCase();

  const city = getCity(stateCode, citySlug);

  useEffect(() => {
    if (!city) return;
    const origin = window.location.origin;
    const canonical = `${origin}${city.cleanRoute}`;
    document.title = `Lead Gen Near Me ${city.cityName}, ${city.stateCode} | Free Local Lead Quotes`;
    setMeta('description', `Find top-rated local service providers in ${city.cityName}, ${city.stateName}. Get free instant quotes, compare pros, and connect with leads near you. No obligation, fast response.`);
    setMeta('robots', 'index, follow');
    setCanonical(canonical);

    // JSON-LD: LocalBusiness
    const bizSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `Lead Gen Near You ${city.cityName}`,
      "description": `Free lead generation service connecting ${city.cityName}, ${city.stateCode} residents with top-rated local service providers. Get free quotes for home improvement, HVAC, plumbing, roofing, and more.`,
      "areaServed": { "@type": "City", "name": city.cityName, "addressRegion": city.stateCode },
      "url": canonical,
      "telephone": "+1-800-555-0000",
    };
    // JSON-LD: FAQPage
    const faqs = generateFaqs(city);
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    };
    // JSON-LD: BreadcrumbList
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": origin },
        { "@type": "ListItem", "position": 2, "name": city.stateName, "item": `${origin}/` },
        { "@type": "ListItem", "position": 3, "name": city.cityName, "item": canonical },
      ]
    };
    injectJsonLd('leadgen-biz', bizSchema);
    injectJsonLd('leadgen-faq', faqSchema);
    injectJsonLd('leadgen-breadcrumb', breadcrumbSchema);

    return () => {
      removeJsonLd('leadgen-biz');
      removeJsonLd('leadgen-faq');
      removeJsonLd('leadgen-breadcrumb');
    };
  }, [city?.route]);

  if (!city || !isValidState(stateCode)) {
    return (
      <LeadGenLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find that city page.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg">
            <Search className="w-5 h-5" /> Browse All Cities
          </Link>
        </div>
      </LeadGenLayout>
    );
  }

  const faqs = generateFaqs(city);
  const nearbyCities = getNearbyCities(stateCode, city.route, 8);

  return (
    <LeadGenLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-yellow-50 to-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Link to="/" className="hover:text-yellow-600">Home</Link>
                <ChevronDown className="w-4 h-4 -rotate-90" />
                <span>{city.stateName}</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
                <span className="text-gray-900 font-medium">{city.cityName}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                Lead Gen Near You in {city.cityName}, {city.stateCode}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Get free quotes from top-rated local service providers in {city.cityName}, {city.stateName}.
                Compare up to 3 pros, no obligation, fast response.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 100% Free</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Obligation</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Licensed & Insured Pros</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 24-Hour Response</span>
              </div>
            </div>
            <div>
              <LeadForm city={city.cityName} state={city.stateCode} />
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Find Local Service Providers in {city.cityName}, {city.stateCode}
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              Looking for reliable local contractors and service providers in {city.cityName}, {city.stateName}?
              Lead Gen Near You connects homeowners and businesses in {city.cityName} with verified, top-rated
              professionals for any project — from home improvement and flooring to HVAC, plumbing, roofing, and more.
            </p>
            <p>
              Our {city.cityName} lead generation network includes licensed and insured contractors who serve
              {city.stateName} and the surrounding areas. Whether you need a quick repair or a major renovation,
              we'll match you with up to 3 qualified local pros who can get the job done right.
            </p>
            <p>
              Best of all, our service is completely free for {city.cityName} residents. Just fill out the form above,
              and you'll receive your first quote within 24 hours. Compare quotes, check reviews, and choose the
              pro that's right for you — with zero pressure and zero obligation.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-12 px-4 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works in {city.cityName}</h2>
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
              <p className="text-sm text-gray-600">We connect you with up to 3 qualified {city.cityName} pros within 24 hours.</p>
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

      {/* Service Categories */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Services Available in {city.cityName}, {city.stateCode}
          </h2>
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

      {/* Why Choose Us */}
      <section className="bg-gray-50 py-12 px-4 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why {city.cityName} Residents Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Verified Pros Only</h3>
                <p className="text-sm text-gray-600">Every {city.cityName} contractor is licensed, insured, and background-checked.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Fast Response</h3>
                <p className="text-sm text-gray-600">Get your first quote from a {city.cityName} pro within 24 hours.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">No Obligation</h3>
                <p className="text-sm text-gray-600">Free quotes with zero pressure. You choose who to work with.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions — {city.cityName}, {city.stateCode}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <section className="bg-gray-50 py-12 px-4 border-t border-gray-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nearby Cities in {city.stateName}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {nearbyCities.map((c) => (
                <Link
                  key={c.route}
                  to={c.cleanRoute}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3 hover:border-yellow-400 transition-colors text-sm text-gray-700"
                >
                  <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  {c.cityName}, {c.stateCode}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-yellow-400 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to Get Free Quotes in {city.cityName}?
          </h2>
          <p className="text-gray-800 mb-6">Fill out the form and get matched with local pros today.</p>
          <a href="#top" className="inline-flex items-center gap-2 bg-gray-900 text-yellow-400 font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
            Get My Free Quotes <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </LeadGenLayout>
  );
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

function injectJsonLd(id, schema) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = id; document.head.appendChild(el); }
  el.textContent = JSON.stringify(schema);
}

function removeJsonLd(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}