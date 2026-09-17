import React from "react";
import { Star } from "lucide-react";

export default function TestimonialsSection({ props }) {
  const items = props?.items || [];
  if (!items.length) return null;
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {items.map((t, i) => (
          <div key={i} className={i ? "mt-10" : ""}>
            <div className="mb-3 flex justify-center">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-xl font-medium text-slate-800">"{t.quote}"</blockquote>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {t.author}
              {t.role ? `, ${t.role}` : ""}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}