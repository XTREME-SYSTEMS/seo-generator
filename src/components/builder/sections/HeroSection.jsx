import React from "react";
import { Phone } from "lucide-react";

export default function HeroSection({ props, images, phone }) {
  const c = props || {};
  return (
    <div className="relative h-[420px] sm:h-[520px]">
      {images?.hero && <img src={images.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
      <div className="relative mx-auto flex h-full max-w-5xl flex-col items-start justify-center px-6 text-white">
        {c.eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">{c.eyebrow}</p>}
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">{c.headline}</h1>
        {c.subheadline && <p className="mt-4 max-w-xl text-lg text-slate-200">{c.subheadline}</p>}
        {c.cta && (
          <a href="#quote" className="mt-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3 text-sm font-bold text-slate-900">
            {c.cta}
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="mt-3 inline-flex items-center gap-2 text-sm text-slate-200">
            <Phone className="h-4 w-4" /> {phone}
          </a>
        )}
      </div>
    </div>
  );
}