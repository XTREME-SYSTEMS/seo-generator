import React from "react";

export default function GallerySection({ props, images }) {
  const captions = props?.captions || [];
  const imgs = images || [];
  if (!imgs.length) return null;
  return (
    <section className="bg-slate-50 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-bold text-slate-900">{props?.title || "Recent Work"}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imgs.map((url, i) => (
            <figure key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={url} alt="" className="h-52 w-full object-cover" />
              {captions[i] && <figcaption className="px-3 py-2 text-xs text-slate-600">{captions[i]}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}