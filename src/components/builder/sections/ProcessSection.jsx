import React from "react";

export default function ProcessSection({ props }) {
  const steps = props?.steps || [];
  if (!steps.length) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h2 className="text-2xl font-bold text-slate-900">{props?.title || "How It Works"}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((p, i) => (
          <div key={i}>
            <span className="text-sm font-bold text-amber-500">{p.step || `0${i + 1}`}</span>
            <h3 className="mt-1 font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}