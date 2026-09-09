import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import XpsLayout from '@/components/xps/XpsLayout';
import LeadForm from '@/components/leadgen/LeadForm';
import {
  getLocationBySlug,
  getNearbyLocations,
  getLocationName,
  getFullAddress,
  getMapUrl,
  getDirectionsUrl,
  generateLocationFaqs,
  XPS_SERVICES,
  XPS_LOCATIONS,
} from '@/lib/xpsLocations';
import { MapPin, Phone, Navigation, Building2, GraduationCap, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

export default function XpsLocationLanding() {
  const { slug } = useParams();
  const loc = getLocationBySlug(slug);

  useEffect(() => {
    if (!loc) return;
    const name = getLocationName(loc);
    const origin = window.location.origin;
    const canonical = `${origin}/locations/${loc.slug}`;

    document.title = `Xtreme Polishing Systems ${name}, ${loc.state} | Concrete & Epoxy Supplies`;
    setMeta('description', `Xtreme Polishing Systems in ${name}, ${loc.stateName}. ${loc.type} at ${loc.address}. ${loc.phone ? `Call ${loc.phone}.` : ''} Concrete polishing supplies, epoxy coatings, flooring machines, and contractor training.`);
    setMeta('robots', 'index, follow');
    setCanonical(canonical);

    const bizSchema = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": `Xtreme Polishing Systems - ${name}`,
      "description": `Xtreme Polishing Systems ${loc.type} in ${name}, ${loc.stateName}. Premium concrete products, epoxy coatings, flooring machines, and decorative materials.`,
      "url": canonical,
      ...(loc.phone ? { "telephone": loc.phone } : {}),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": loc.address,
        "addressLocality": loc.city,
        "addressRegion": loc.state,
        ...(loc.country !== 'USA' ? { "addressCountry": loc.country } : { "addressCountry": "US" }),
      },
      "areaServed": { "@type": "State", "name": loc.stateName },
    };

    const faqs = generateLocationFaqs(loc);
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": origin },
        { "@type": "ListItem", "position": 2, "name": "Locations", "item": `${origin}/locations` },
        { "@type": "ListItem", "position": 3, "name": `${name}, ${loc.state}`, "item": canonical },
      ]
    };

    injectJsonLd('xps-biz', bizSchema);
    injectJsonLd('xps-faq', faqSchema);
    injectJsonLd('xps-breadcrumb', breadcrumbSchema);

    return () => {
      removeJsonLd('xps-biz');
      removeJsonLd('xps-faq');
      removeJsonLd('xps-breadcrumb');
    };
  }, [slug]);

  if (!loc) {
    return (
      <XpsLayout>
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Location Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find that XPS location.</p>
          <Link to="/locations" className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg">
            <MapPin className="w-5 h-5" /> Browse All Locations
          </Link>
        </div>
      </XpsLayout>
    );
  }

  const name = getLocationName(loc);
  const faqs = generateLocationFaqs(loc);
  const nearby = getNearbyLocations(loc.slug, 6);
  const isTraining = loc.type === 'Training Location' || loc.type === 'Distribution & Training Center';
  const isComingSoon = loc.status === 'coming_soon';
  const openCount = XPS_LOCATIONS.filter((l) => l.status === 'open').length;

  return (
    <XpsLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-yellow-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-yellow-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/locations" className="hover:text-yellow-600">Locations</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{name}, {loc.state}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {isTraining ? <GraduationCap className="w-6 h-6 text-yellow-500" /> : <Building2 className="w-6 h-6 text-yellow-500" />}
                <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">{loc.type}</span>
                {isComingSoon && <span className="bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">Coming Soon</span>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
                Xtreme Polishing Systems — {name}, {loc.state}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Your trusted source for premium concrete products, epoxy coatings, flooring machines, and decorative materials
                in {loc.stateName}. {isTraining ? 'This location also offers hands-on contractor training and certification.' : ''}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">{loc.address}</p>
                    <p className="text-gray-600">{loc.city}{loc.area ? ` (${loc.area})` : ''}, {loc.state}</p>
                    {loc.country !== 'USA' && <p className="text-gray-600">{loc.country}</p>}
                  </div>
                </div>
                {loc.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <a href={`tel:${loc.phone.replace(/\s/g, '')}`} className="font-semibold text-gray-900 hover:text-yellow-600">{loc.phone}</a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-gray-600 text-sm">Mon-Fri 7:00 AM - 5:00 PM • Sat 8:00 AM - 12:00 PM</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {loc.phone && (
                  <a href={`tel:${loc.phone.replace(/\s/g, '')}`} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
                    <Phone className="w-4 h-4" /> Call This Location
                  </a>
                )}
                <a href={getDirectionsUrl(loc)} target="_blank" rel="noopener noreferrer" className="border border-gray-300 hover:border-yellow-400 text-gray-700 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
                  <Navigation className="w-4 h-4" /> Get Directions
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {!isComingSoon && (
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
                  <iframe
                    src={getMapUrl(loc)}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    loading="lazy"
                    title={`Map of XPS ${name}`}
                  />
                </div>
              )}
              {!isComingSoon && (
                <LeadForm
                  city={loc.city}
                  state={loc.state}
                  services={XPS_SERVICES}
                  title="Request a Quote"
                  subtitle="Contact this location for pricing & availability"
                  buttonText="Get My Quote"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About XPS {name}</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              The Xtreme Polishing Systems {loc.type} in {name}, {loc.stateName} is your local source for
              professional-grade concrete and flooring products. Located at {loc.address}, we serve contractors
              throughout {loc.stateName} and the surrounding areas.
            </p>
            <p>
              Whether you need epoxy coatings for a garage floor, concrete polishing supplies for a commercial project,
              or flooring machines for rent or purchase, our {name} team has you covered. We carry top-quality products
              at affordable prices, with expert advice to help you get the job done right.
            </p>
            {isTraining && (
              <p>
                As a designated {loc.type === 'Distribution & Training Center' ? 'Distribution & Training Center' : 'Training Location'},
                our {name} facility also offers hands-on certification classes for contractors looking to master concrete
                polishing, epoxy application, and surface preparation techniques. {loc.phone ? `Call ${loc.phone} to schedule a training session.` : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="bg-gray-50 py-12 px-4 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Products Available at XPS {name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {XPS_SERVICES.map((s) => (
              <div key={s.slug} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
                <div className="flex items-start gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-gray-900 text-sm">{s.name}</h3>
                </div>
                <p className="text-xs text-gray-500 pl-7">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">FAQ — XPS {name}, {loc.state}</h2>
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

      {/* Nearby */}
      {nearby.length > 0 && (
        <section className="bg-gray-50 py-12 px-4 border-t border-gray-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Other XPS Locations Nearby</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {nearby.map((n) => (
                <Link
                  key={n.slug}
                  to={`/locations/${n.slug}`}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3 hover:border-yellow-400 transition-colors text-sm text-gray-700"
                >
                  <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  {getLocationName(n)}, {n.state}
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to="/locations" className="inline-flex items-center gap-2 text-yellow-600 font-semibold hover:text-yellow-700">
                View All {openCount}+ Locations <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!isComingSoon && (
        <section className="bg-yellow-400 py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Need Supplies in {name}?</h2>
            <p className="text-gray-800 mb-6">
              {loc.phone ? `Call ${loc.phone} or request a quote online.` : 'Request a quote online and we\'ll get back to you fast.'}
            </p>
            <a href="#top" className="inline-flex items-center gap-2 bg-gray-900 text-yellow-400 font-bold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Request a Quote <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </section>
      )}
    </XpsLayout>
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