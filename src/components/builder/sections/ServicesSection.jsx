import React from "react";

export default function ServicesSection({ props }) {
  const items = props?.items || [];
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h2 className="text-2xl font-bold text-slate-900">{props?.title || "Our Services"}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => (
          <div key={i} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            {s.priceRange && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{s.priceRange}</span>
                {s.priceNote && <p className="mt-1.5 text-xs text-slate-400">{s.priceNote}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}