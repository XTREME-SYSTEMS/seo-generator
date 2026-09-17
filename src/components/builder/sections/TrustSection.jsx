import React from "react";
import { Check } from "lucide-react";

export default function TrustSection({ props }) {
  const badges = props?.badges || [];
  if (!badges.length) return null;
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-3 px-6 py-5">
        {badges.map((b, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Check className="h-4 w-4 text-amber-500" /> {b}
          </span>
        ))}
      </div>
    </div>
  );
}