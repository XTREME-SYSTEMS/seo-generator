import React from "react";
import HeroSection from "@/components/builder/sections/HeroSection";
import ServicesSection from "@/components/builder/sections/ServicesSection";
import FaqSection from "@/components/builder/sections/FaqSection";
import CtaContactSection from "@/components/builder/sections/CtaContactSection";
import ProcessSection from "@/components/builder/sections/ProcessSection";
import GallerySection from "@/components/builder/sections/GallerySection";
import TestimonialsSection from "@/components/builder/sections/TestimonialsSection";
import TrustSection from "@/components/builder/sections/TrustSection";
import FunnelStepsSection from "@/components/builder/sections/FunnelStepsSection";

const SECTION_MAP = {
  hero: HeroSection,
  trust: TrustSection,
  services: ServicesSection,
  gallery: GallerySection,
  process: ProcessSection,
  testimonials: TestimonialsSection,
  funnel: FunnelStepsSection,
  faq: FaqSection,
  cta: CtaContactSection,
};

export default function SiteRenderer({ sections, images, phone, onLeadSubmit, submitting, submitted }) {
  if (!sections?.length) return null;
  return (
    <div className="bg-white">
      {sections.map((sec, i) => {
        const Component = SECTION_MAP[sec.type];
        if (!Component) return null;
        return (
          <Component
            key={i}
            props={sec.props}
            images={sec.type === "gallery" ? images?.gallery : images}
            phone={phone}
            onLeadSubmit={onLeadSubmit}
            submitting={submitting}
            submitted={submitted}
          />
        );
      })}
    </div>
  );
}