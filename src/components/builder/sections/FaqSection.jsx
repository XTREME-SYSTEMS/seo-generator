import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqSection({ props }) {
  const items = props?.items || [];
  const [open, setOpen] = useState(0);
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <h2 className="text-2xl font-bold text-slate-900">{props?.title || "FAQ"}</h2>
      <div className="mt-6 space-y-3">
        {items.map((f, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <span className="font-medium text-slate-900">{f.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-slate-600">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}