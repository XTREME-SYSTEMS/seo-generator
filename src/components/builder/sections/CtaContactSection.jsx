import React from "react";

export default function CtaContactSection({ props, images, onLeadSubmit, submitting, submitted }) {
  const c = props || {};
  return (
    <section id="quote" className="relative">
      <div className="absolute inset-0">
        {images?.hero && <img src={images.hero} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-black/75" />
      </div>
      <div className="relative mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900">{c.headline || "Get Your Free Quote"}</h2>
          {c.subtext && <p className="mt-1 text-sm text-slate-600">{c.subtext}</p>}
          <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onLeadSubmit?.(new FormData(e.currentTarget)); }}>
            <input name="name" placeholder="Your Name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
            <input name="phone" placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
            <input name="email" type="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
            <textarea name="message" placeholder="Tell us about your project" rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-60">
              {submitting ? "Sending..." : submitted ? "Sent!" : "Get My Free Quote"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}