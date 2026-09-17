import React from "react";

export default function FunnelStepsSection({ props }) {
  const steps = props?.steps || [];
  if (!steps.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h2 className="text-2xl font-bold text-slate-900">{props?.title || "Get Started"}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">{i + 1}</span>
            <h3 className="mt-4 font-semibold text-slate-900">{s.headline}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.subtext}</p>
          </div>
        ))}
      </div>
      <a href="#quote" className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3 text-sm font-bold text-slate-900">
        Request My Quote
      </a>
    </section>
  );
}