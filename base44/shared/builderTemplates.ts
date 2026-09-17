// AI Website Generation Engine — templates, prompts, schema, section assembler.
// Self-contained module used by the Deep Architecture pipeline.
// Ported from xtremeaibuilder3 and generalized for any industry.

export const GALLERY_COUNT = 3;

export const CONTENT_SCHEMA = {
  type: "object",
  properties: {
    hero: {
      type: "object",
      properties: { headline: { type: "string" }, subheadline: { type: "string" }, cta: { type: "string" } },
      required: ["headline", "subheadline", "cta"],
    },
    trust_badges: { type: "array", items: { type: "string" } },
    services: {
      type: "array",
      items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] },
    },
    process: {
      type: "array",
      items: { type: "object", properties: { step: { type: "string" }, title: { type: "string" }, description: { type: "string" } }, required: ["title", "description"] },
    },
    benefits: { type: "array", items: { type: "string" } },
    gallery_captions: { type: "array", items: { type: "string" } },
    testimonial: {
      type: "object",
      properties: { quote: { type: "string" }, author: { type: "string" }, role: { type: "string" } },
      required: ["quote", "author"],
    },
    about: { type: "string" },
    funnel_steps: {
      type: "array",
      items: { type: "object", properties: { headline: { type: "string" }, subtext: { type: "string" } }, required: ["headline", "subtext"] },
    },
    faq: {
      type: "array",
      items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] },
    },
    seo: {
      type: "object",
      properties: {
        meta_title: { type: "string" },
        meta_description: { type: "string" },
        focus_keywords: { type: "array", items: { type: "string" } },
        og_title: { type: "string" },
      },
    },
  },
  required: ["hero", "services", "process", "gallery_captions", "testimonial"],
};

const IMG_STYLE = "Ultra-realistic professional photography, no fake text, no logos, no CGI, no cartoon.";

export const TEMPLATES = [
  {
    id: "epoxy",
    label: "Epoxy & Concrete Flooring",
    copyContext: (_ctx) => "Professional epoxy and decorative concrete flooring contractor. Focus on durability, professional installation, residential & commercial service, free estimates, and long-lasting finishes.",
    images: (_ctx) => ({
      hero: "Ultra-realistic metallic epoxy floor in a modern showroom, black charcoal silver and subtle copper pearlescent movement, fluid depth, soft ribbons, glossy topcoat, realistic furniture reflections, clean commercial lighting, 24mm interior photography, contractor portfolio style, wide 16:9 composition with clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Ultra-realistic full flake epoxy garage floor, clean two-car residential garage, neutral gray black white tan flake blend, dense full broadcast, satin-gloss clear topcoat, stem wall edges, expansion joints, 24mm interior lens, contractor portfolio. " + IMG_STYLE,
        "Ultra-realistic stained concrete floor in a modern restaurant, warm brown and amber translucent stain, natural mottling, sawcut joints, satin sealer, tables, chairs, warm lighting. " + IMG_STYLE,
        "Ultra-realistic natural polished concrete floor in a modern retail store, exposed aggregate, burnished gloss, control joints, overhead light reflections, not epoxy or wet glass. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "general_contractor",
    label: "General Contractor",
    copyContext: (_ctx) => "General contractor and home remodeling: kitchen and bathroom remodels, additions, whole-home renovations. Emphasize licensed & insured, free estimates, quality craftsmanship, on-time delivery, and a trusted local reputation.",
    images: (_ctx) => ({
      hero: "Beautifully remodeled modern kitchen, white shaker cabinets, quartz countertops, subway tile backsplash, pendant lighting, natural daylight, professional interior photography, wide 16:9 composition with clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Newly remodeled modern bathroom, freestanding tub, walk-in glass shower, marble-look tile, vanity, warm lighting, real-estate photography. " + IMG_STYLE,
        "Newly built home addition exterior, clean siding, modern windows, blue sky, professional contractor portfolio photo. " + IMG_STYLE,
        "Bright remodeled open-concept living room, hardwood floors, neutral palette, large windows, professional interior photography. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "cleaning",
    label: "Cleaning Services",
    copyContext: (_ctx) => "Residential and commercial cleaning services: recurring cleaning, deep cleaning, move-in/move-out, office cleaning. Emphasize vetted staff, eco-friendly products, satisfaction guarantee, and flexible scheduling.",
    images: (_ctx) => ({
      hero: "Bright spotless modern living room just cleaned, sunlight streaming through windows, gleaming floors, tidy furniture, fresh atmosphere, real-estate photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Sparkling clean modern bathroom, spotless surfaces, fresh towels, bright lighting, professional cleaning portfolio. " + IMG_STYLE,
        "Clean modern open office space, tidy desks, polished floors, natural light, professional commercial cleaning photo. " + IMG_STYLE,
        "Spotless modern kitchen, clean countertops, stainless appliances, gleaming, real-estate photography. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "roofing",
    label: "Roofing",
    copyContext: (_ctx) => "Roofing contractor: roof replacement, repair, storm damage, inspections. Emphasize licensed & insured, free inspections, manufacturer-certified installers, financing, and a trusted local reputation.",
    images: (_ctx) => ({
      hero: "Newly installed architectural asphalt shingle roof on a suburban home, clean crisp lines, blue sky, professional roofing portfolio, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Clean new roof on a residential home, dimensional shingles, tidy edge detailing, blue sky, contractor portfolio. " + IMG_STYLE,
        "Roofing crew in safety gear installing shingles on a residential roof, realistic worksite, professional service photography. " + IMG_STYLE,
        "Close-up of a roof edge and gutter with new shingles and clean flashing, professional detail shot. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "hvac",
    label: "HVAC",
    copyContext: (_ctx) => "HVAC contractor: AC and heating install and repair, maintenance plans, indoor air quality. Emphasize certified technicians, 24/7 emergency service, free estimates, financing, and energy efficiency.",
    images: (_ctx) => ({
      hero: "HVAC technician in clean uniform inspecting a new high-efficiency outdoor AC unit beside a tidy suburban home, professional service photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Newly installed high-efficiency furnace and air handler in a clean utility closet, tidy copper lines, professional install photo. " + IMG_STYLE,
        "Modern smart thermostat on a wall in a clean living room, professional service photography. " + IMG_STYLE,
        "HVAC technician servicing an outdoor condenser unit with tools, realistic, professional service photo. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "landscaping",
    label: "Landscaping & Hardscaping",
    copyContext: (_ctx) => "Landscaping and hardscaping: design, lawn care, patios, retaining walls, drainage. Emphasize custom design, licensed, free consultations, curb appeal, and outdoor living.",
    images: (_ctx) => ({
      hero: "Professionally landscaped backyard with stone paver patio, lush green lawn, planting beds, outdoor lighting, golden hour, professional landscape photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Newly installed stone retaining wall and paver walkway on a residential property, clean craftsmanship, professional hardscape photo. " + IMG_STYLE,
        "Freshly landscaped front yard with curb appeal, tidy lawn, mulched beds, walkway, blue sky. " + IMG_STYLE,
        "Outdoor stone fire pit patio with seating, evening lighting, professional landscape portfolio. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "plumbing",
    label: "Plumbing",
    copyContext: (_ctx) => "Plumbing contractor: drain cleaning, water heater repair and installation, leak detection, emergency plumbing. Emphasize licensed & insured, 24/7 emergency service, upfront pricing, and same-day service.",
    images: (_ctx) => ({
      hero: "Professional plumber in clean uniform working under a modern kitchen sink with tools, tidy workspace, professional service photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Newly installed tankless water heater on a clean utility room wall, tidy copper and PEX lines, professional install photo. " + IMG_STYLE,
        "Plumber snaking a drain with professional equipment, realistic worksite, professional service photo. " + IMG_STYLE,
        "Modern bathroom plumbing rough-in with clean PEX manifolds, professional construction photo. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "electrical",
    label: "Electrical",
    copyContext: (_ctx) => "Electrical contractor: panel upgrades, wiring, lighting installation, EV chargers, generators. Emphasize licensed electricians, code compliance, safety inspections, and upfront pricing.",
    images: (_ctx) => ({
      hero: "Electrician in clean uniform installing a modern electrical panel in a tidy utility room, professional service photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Newly installed modern electrical panel with clean labeling, tidy wiring, professional install photo. " + IMG_STYLE,
        "Electrician installing recessed lighting in a modern ceiling, realistic worksite, professional service photo. " + IMG_STYLE,
        "EV charger installation on a garage wall, clean install, professional electrical portfolio. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "pest_control",
    label: "Pest Control",
    copyContext: (_ctx) => "Pest control and extermination: termite treatment, rodent control, bed bug removal, preventative pest management. Emphasize licensed technicians, pet-safe treatments, guaranteed results, and recurring protection plans.",
    images: (_ctx) => ({
      hero: "Pest control technician in clean uniform inspecting a modern home exterior with professional equipment, tidy suburban property, professional service photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Pest control technician applying treatment along a home foundation, realistic worksite, professional service photo. " + IMG_STYLE,
        "Clean modern kitchen with pest control bait stations discreetly placed, professional portfolio. " + IMG_STYLE,
        "Termite inspection technician checking a crawl space with professional equipment, realistic, professional service photo. " + IMG_STYLE,
      ],
    }),
  },
  {
    id: "restaurant",
    label: "Restaurant / Hospitality",
    copyContext: (_ctx) => "Restaurant and hospitality: dine-in, private events, catering. Emphasize ambiance, locally sourced ingredients, signature dishes, and reservations.",
    images: (_ctx) => ({
      hero: "Inviting modern restaurant interior, warm lighting, beautifully set tables, exposed brick, full bar, professional hospitality photography, wide 16:9, clean negative space for a headline. " + IMG_STYLE,
      gallery: [
        "Beautifully plated signature dish on a restaurant table, professional food photography, natural light. " + IMG_STYLE,
        "Cozy restaurant dining area, warm lighting, full tables, inviting atmosphere, hospitality photography. " + IMG_STYLE,
        "Craft cocktail at a modern restaurant bar, professional beverage photography, warm ambiance. " + IMG_STYLE,
      ],
    }),
  },
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function buildCopyPrompt(template, ctx) {
  const isFunnel = ctx.pageType === "funnel";
  return `You are an expert SEO and AEO (Answer Engine Optimization) copywriter for professional ${template.label} businesses. Write ${isFunnel ? "lead-generation funnel" : "landing page"} content for this business:

Business name: ${ctx.businessName}
Service area: ${ctx.city || "local area"}
Phone: ${ctx.phone || "(555) 123-4567"}
Page type: ${isFunnel ? "Lead generation funnel" : "Landing page"}

Industry guidance:
${template.copyContext(ctx)}

Requirements:
- Use realistic, specific, non-generic service language. No fake manufacturer names or unverifiable claims.
- hero: { headline (strong, benefit-driven, include the service + city), subheadline (one sentence), cta (short, e.g. "Get My Free Quote") }.
- trust_badges: 4 short trust signals (e.g. "Licensed & Insured", "Free Estimates").
- services: 3-4 service offerings with a one-line description each.
- process: 3-4 steps (each with step label like "01", title, description).
- benefits: 3-4 short benefit bullets.
- gallery_captions: 3 short captions for project photos.
- testimonial: { quote, author, role } — one realistic review.
- about: 2-3 sentences about the company.
- ${isFunnel ? "funnel_steps: 3 short step headlines with subtext guiding the visitor toward requesting a quote." : "faq: 3 questions and answers optimized for AEO (answer engines like ChatGPT, Perplexity)."}
- seo: { meta_title (under 60 chars, include service + city), meta_description (under 155 chars), focus_keywords (5 keywords), og_title }

Return only JSON matching the provided schema.`;
}

export function assembleSections(copy, ctx, template) {
  const sections = [];
  sections.push({
    type: "hero",
    props: {
      eyebrow: `${template.label} Specialists`,
      headline: copy.hero?.headline,
      subheadline: copy.hero?.subheadline,
      cta: copy.hero?.cta,
    },
  });
  if (copy.trust_badges?.length) sections.push({ type: "trust", props: { badges: copy.trust_badges } });
  if (copy.services?.length) sections.push({ type: "services", props: { title: "Our Services", items: copy.services } });
  if (ctx.pageType === "landing" && copy.gallery_captions?.length) sections.push({ type: "gallery", props: { title: "Recent Work", captions: copy.gallery_captions } });
  if (copy.process?.length) sections.push({ type: "process", props: { title: "How It Works", steps: copy.process } });
  if (copy.testimonial?.quote) sections.push({ type: "testimonials", props: { title: "What Customers Say", items: [copy.testimonial] } });
  if (ctx.pageType === "funnel" && copy.funnel_steps?.length) sections.push({ type: "funnel", props: { title: "Get Started", steps: copy.funnel_steps } });
  if (ctx.pageType === "landing" && copy.faq?.length) sections.push({ type: "faq", props: { title: "Frequently Asked Questions", items: copy.faq } });
  sections.push({ type: "cta", props: { headline: "Get Your Free Quote", subtext: "Fill out the form and we'll get back to you within 24 hours." } });
  return sections;
}