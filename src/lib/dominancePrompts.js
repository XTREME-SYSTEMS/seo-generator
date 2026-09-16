// Exhaustive prompt library for the Digital Dominance system.
// Each prompt is professionally engineered to be precise, actionable, and
// produce structured output — 100x sharper than a raw instruction.

export const PROMPT_PHASES = [
  {
    phase: 'Phase 0 — Deep Architecture & Google Compliance',
    description: 'Design the system from the ground up to follow 100% of Google\'s specifications, generate 1000s of unique pages per day, operate autonomously 24/7, and set + achieve ranking goals.',
    prompts: [
      {
        title: 'Google Specification Compliance Architecture',
        prompt: `You are a Google Search specification architect. Design a system architecture where EVERY component — page generation, structured data, content quality, technical SEO, internal linking, and deployment — complies with 100% of Google's published specifications.

GOOGLE SPECIFICATIONS TO COMPLY WITH (cite the specific guideline for each):
1. Search Quality Rater Guidelines (E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness)
2. Helpful Content Update guidelines (people-first content, not search-engine-first)
3. Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1)
4. Mobile-First Indexing requirements
5. Page Experience signals
6. Structured Data guidelines (schema.org, JSON-LD, Rich Results eligibility)
7. Sitemap and robots.txt specifications
8. Canonicalization and duplicate content policies
9. URL structure guidelines (clean, descriptive, stable)
10. Image optimization guidelines (alt text, format, lazy loading)
11. JavaScript SEO guidelines (server-side rendering, dynamic rendering)
12. Spam policies (no cloaking, no doorway pages, no scraped content, no auto-generated content)
13. Link spam policies (no paid links, no link schemes)
14. Local SEO guidelines (Google Business Profile, NAP consistency, local structured data)
15. AI content guidelines (helpful, original, quality content regardless of how it's produced)

For each specification:
- The exact requirement (quote or paraphrase the guideline)
- How the system enforces compliance (automated checks, generation rules, validation gates)
- The validation mechanism (how we prove compliance before deployment)
- The failure consequence (what happens if non-compliant content is generated)

ARCHITECTURE PRINCIPLE: Compliance is not a post-generation check — it is a generation constraint. Every page is born compliant, not made compliant after the fact.

OUTPUT: A JSON architecture document with: per-specification compliance rules, generation constraints, validation gates, and the system topology that enforces compliance at every layer.`,
      },
      {
        title: 'Programmatic Page Generation Engine (1000s/Day)',
        prompt: `You are a programmatic SEO architect. Design a page generation engine that produces 1,000+ unique, high-quality, strategically-targeted web pages per day — each designed to rank in Google's top 5 as fast as technologically possible.

SCALE REQUIREMENTS:
- Throughput: 1,000+ pages per day, every day, 24/7
- Uniqueness: each page must be 80%+ unique content (not templated thin content)
- Quality: each page must pass Google's Helpful Content guidelines
- Strategic targeting: each page targets a specific keyword + location + intent combination
- Indexability: each page is crawlable, has proper meta tags, schema, and internal links

GENERATION PIPELINE DESIGN:
1. Keyword-Location Matrix: generate {services} × {cities/counties/regions} combinations, each with search volume and difficulty
2. Content Uniqueness Engine: for each combination, generate genuinely unique content using:
   - Local data injection (city-specific facts, landmarks, regulations, demographics)
   - Service-specific details (pricing ranges, process steps, common issues)
   - Seasonal and temporal context (current season, weather, local events)
   - Unique angles (FAQ, case study, comparison, guide, checklist formats)
3. Page Template System: 10+ page templates (service page, location page, FAQ, guide, comparison, case study, checklist, directory, glossary, tool) — each with unique structure and content patterns
4. Content Depth Rules: minimum 800 words, unique H1, 3+ H2s, FAQ section, internal links, schema markup, images with alt text
5. Internal Linking Graph: every page links to 5-10 related pages with descriptive anchor text
6. Schema Markup: LocalBusiness, Service, FAQPage, BreadcrumbList, Article (as appropriate)
7. Meta Optimization: unique title (under 60 chars), meta description (under 155 chars), URL slug

ANTI-THIN-CONTENT RULES:
- No page may be generated from a template with only variable substitution
- Each page must contain at least 3 paragraphs of genuinely unique, valuable content
- No duplicate paragraphs across pages (even if similar topics)
- Each page must answer a specific user question that no other page answers

OUTPUT: JSON with the complete generation pipeline specification, including: keyword matrix structure, content uniqueness algorithms, template definitions, validation rules, and the deployment + indexing acceleration protocol (IndexNow, sitemap ping, GSC submission).`,
      },
      {
        title: 'Autonomous Goal-Setting & Achievement System',
        prompt: `You are an autonomous AI system architect. Design a goal-setting and achievement system that operates without human intervention — it defines ranking goals, tracks progress, adjusts strategy, and achieves them.

GOAL HIERARCHY:
1. Ultimate Goal: "Achieve top 5 Google ranking for {primary_keyword} in {location} within {timeframe}"
2. Sub-Goals (auto-generated):
   - "Generate 1000 pages targeting long-tail variations of {primary_keyword}"
   - "Acquire 50 backlinks from domains with DA > 30"
   - "Achieve 90+ Google Lighthouse score on all pages"
   - "Get 500 pages indexed within 30 days"
   - "Achieve 20 featured snippets for {primary_keyword} questions"
3. Task-Level Goals (auto-generated daily):
   - "Generate 50 new pages today targeting {untapped_keywords}"
   - "Submit to 10 new directories today"
   - "Fix 5 technical SEO issues found in audit"
   - "Acquire 3 backlinks today"

AUTONOMOUS DECISION ENGINE:
1. Goal Definition: the system reads current rankings, competitor positions, and search volume, then defines goals using a scoring algorithm (keyword value × achievability × timeframe)
2. Progress Tracking: daily measurement of ranking position, organic traffic, indexed pages, backlinks, and conversion rate
3. Strategy Adjustment: if a goal is behind schedule, the system automatically:
   - Increases content generation volume for underperforming keywords
   - Shifts targeting to easier keyword variations
   - Accelerates backlink acquisition
   - Adjusts internal linking to boost important pages
4. Goal Achievement Detection: when a goal is achieved, the system:
   - Records the methods that worked (for future goal-setting)
   - Sets a new, harder goal (e.g., top 3 → top 1)
   - Expands to adjacent keywords
5. Failure Recovery: if a goal is not achieved within the timeframe:
   - Analyzes why (algorithm update, competition, technical issue)
   - Adjusts the goal or strategy
   - Re-attempts with modified approach

FEEDBACK LOOP:
- Every 24 hours: measure progress, adjust daily tasks
- Every 7 days: evaluate sub-goal progress, adjust strategy
- Every 30 days: evaluate ultimate goal, adjust or escalate
- Every 90 days: full system retrospective, update goal-setting algorithm

OUTPUT: JSON with the complete autonomous goal-setting architecture: goal hierarchy, scoring algorithms, decision rules, feedback loops, and the state machine for goal lifecycle (defined → in_progress → achieved → escalated → retired).`,
      },
      {
        title: '24/7 Autonomous Operation Protocol',
        prompt: `You are a DevOps and reliability architect. Design the 24/7 autonomous operation protocol for a programmatic SEO system that generates 1000s of pages per day without human intervention.

OPERATIONAL REQUIREMENTS:
- Uptime: 99.9% (max 8.7 hours downtime per year)
- Throughput: 1000+ pages generated, deployed, and submitted for indexing per day
- Self-healing: detect and recover from failures automatically
- Self-monitoring: track system health, performance, and output quality continuously
- Zero human intervention: the system operates, monitors, heals, and scales itself

SYSTEM COMPONENTS TO DESIGN:
1. Generation Worker Pool: 5-10 concurrent workers generating pages
2. Deployment Pipeline: auto-deploy generated pages to the live site (Vercel/static host)
3. Indexing Accelerator: auto-submit new pages via IndexNow, sitemap ping, and GSC API
4. Health Monitor: check every component every 5 minutes
5. Self-Healer: detect failures and automatically restart/replace components
6. Quality Validator: validate every generated page against Google specs before deployment
7. Progress Tracker: measure ranking progress daily and feed back to the goal system
8. Alert System: only alert humans for critical failures that cannot be auto-healed

AUTONOMOUS LOOP (runs every 5 minutes):
1. Check goal progress → determine what to generate next
2. Generate batch of pages (10-50 per cycle)
3. Validate each page against Google specs
4. Deploy valid pages to live site
5. Submit for indexing (IndexNow + sitemap + GSC)
6. Update progress tracking
7. Check system health → self-heal if needed
8. Repeat

FAILURE HANDLING:
- Generation failure: retry 3x, then skip and log
- Deployment failure: retry 3x, then alert
- Indexing failure: retry 3x, then try alternative method
- Quality validation failure: regenerate with different parameters
- System component crash: auto-restart, log, and continue
- API rate limit hit: back off and retry with delay
- Complete system failure: restart all components, resume from last checkpoint

CHECKPOINT & RESUME:
- Every batch is checkpointed to the database
- On restart, the system resumes from the last checkpoint
- No work is lost, no pages are duplicated

OUTPUT: JSON with the complete 24/7 operation protocol: component topology, loop specification, failure handling rules, checkpoint/resume logic, and the health monitoring dashboard schema.`,
      },
      {
        title: 'Deep System Architecture Blueprint',
        prompt: `You are a chief software architect. Design the complete deep architecture for an autonomous programmatic SEO dominance system that generates 1000s of Google-compliant pages per day, operates 24/7, and achieves top 5 rankings autonomously.

ARCHITECTURE LAYERS (design each in detail):

1. DATA LAYER
   - Entity model: what data is stored (keywords, pages, rankings, backlinks, goals, tasks, receipts)
   - Storage: Base44 entities + Supabase for high-volume page content
   - Data flow: how data moves between generation, deployment, and tracking

2. INTELLIGENCE LAYER
   - LLM gateway: which models for which tasks (generation, analysis, decision-making)
   - Prompt library: how prompts are versioned, tested, and improved
   - Decision engine: how the system decides what to generate, submit, and optimize next

3. GENERATION LAYER
   - Page generation pipeline: keyword → content → schema → meta → internal links
   - Content uniqueness engine: how each page is made genuinely unique
   - Quality validation: how each page is validated against Google specs before deployment
   - Throughput: how 1000+ pages/day is achieved (concurrency, batching, caching)

4. DEPLOYMENT LAYER
   - Static site generation: how pages are built and deployed
   - CDN distribution: how pages are served globally with low latency
   - Domain management: how multiple domains/sites are managed
   - Sitemap management: how sitemaps are generated and updated

5. INDEXING LAYER
   - IndexNow: real-time indexing submission
   - Sitemap ping: automatic sitemap submission to Google/Bing
   - GSC API: URL submission and monitoring
   - Indexing verification: how we confirm pages are indexed

6. RANKING LAYER
   - Rank tracking: daily position monitoring for all target keywords
   - Competitor monitoring: track competitor positions and strategies
   - SERP analysis: analyze what's ranking and why
   - Algorithm update detection: detect Google algorithm changes and adapt

7. AUTONOMY LAYER
   - Goal engine: defines, tracks, and achieves ranking goals
   - Decision engine: decides what to do next based on goal progress
   - Self-healing: detects and recovers from failures
   - Feedback loop: learns from results and improves over time

8. COMPLIANCE LAYER
   - Google spec enforcement: every page is validated against Google guidelines
   - Quality gates: no page deploys without passing all validation checks
   - Audit trail: every action is logged with provenance
   - Spam prevention: automated detection and prevention of spam patterns

OUTPUT: A JSON architecture blueprint with all 8 layers, their components, data flows, interfaces, and the system topology diagram (as a dependency graph). This is the master document that all other prompts and implementations reference.`,
      },
    ],
  },
  {
    phase: 'Phase 1 — Foundation',
    description: 'Structure the business, define the brand, and map the competitive landscape before any submission begins.',
    prompts: [
      {
        title: 'Business Profile Structuring',
        prompt: `You are an expert business analyst and data architect. Given the raw business information below, transform it into a comprehensive, standardized business profile optimized for automated multi-platform submission.

RAW BUSINESS INFO:
{business_name}
{website_url}
{phone}
{email}
{address}
{category}
{description}

REQUIREMENTS:
1. Generate three description variants: short (155 chars for meta), medium (500 chars for directories), and long (2000 chars for detailed listings)
2. Infer the NAICS code and industry category
3. Extract a list of 10-15 services derived from the description
4. Generate a tagline and 3 unique selling propositions
5. Define the service area (cities, counties, radius)
6. Generate SEO-optimized keywords (primary, secondary, long-tail)
7. Structure business hours in a standardized format
8. Generate brand voice guidelines (tone, style, prohibited phrases)

OUTPUT: Return a single JSON object with all fields populated. No placeholders. Every field must contain production-ready content.`,
      },
      {
        title: 'Brand Identity & Positioning Matrix',
        prompt: `You are a brand strategist. Given the business profile below, create a complete brand identity and positioning matrix that will be used across every digital submission platform.

BUSINESS PROFILE:
{profile_json}

DELIVERABLES:
1. Brand positioning statement (one sentence that defines who you serve, what problem you solve, and why you're different)
2. Brand archetype (from the 12 Jungian archetypes) with justification
3. Tone of voice: 5 adjectives + 3 example sentences + 3 "we don't sound like" sentences
4. Visual identity recommendations: primary color (hex), secondary color (hex), accent (hex), typography pairing, logo style direction
5. Brand story (250 words) for the "About Us" section across platforms
6. Value proposition ladder: 3 tiers (feature → benefit → transformation)
7. Competitive differentiation matrix: 5 competitors, 5 dimensions, how you win each

OUTPUT: Structured JSON. Every field must be specific and immediately usable — no generic placeholders.`,
      },
      {
        title: 'Competitive Landscape Deep-Scan',
        prompt: `You are a competitive intelligence analyst. Research the top 10 competitors in the {industry} space in {location} and produce a comprehensive competitive landscape report.

For each competitor, provide:
1. Company name, website URL, and estimated annual revenue range
2. Digital presence score (0-100) based on: website quality, review count, directory listings, social media activity, content output
3. Top 3 strengths and top 3 weaknesses
4. Platforms they are listed on (directories, review sites, social platforms)
5. Their average rating across review platforms
6. Their primary SEO keywords and estimated organic traffic
7. Their content strategy (blog frequency, content types, social posting cadence)
8. Gaps in their digital presence that we can exploit

Then provide:
- A "Dominance Opportunity Map" ranking the top 20 platforms where competitors are NOT listed but we should be
- A "Quality Benchmark" defining the minimum quality bar we must exceed on each platform

OUTPUT: Structured JSON with a summary dashboard and per-competitor detail objects.`,
      },
    ],
  },
  {
    phase: 'Phase 2 — Discovery',
    description: 'Find every single source, directory, and platform where the business can be submitted for maximum digital coverage.',
    prompts: [
      {
        title: 'Exhaustive Submission Target Discovery',
        prompt: `You are a digital presence architect. Your objective is to identify EVERY website, directory, platform, and service where a {category} business in {location} should be listed to achieve complete digital dominance.

CATEGORIES TO COVER (be exhaustive — do not skip any):
1. Search engine business profiles (Google, Bing, Apple, Yahoo)
2. General business directories (Yelp, Yellow Pages, Whitepages, Superpages, Manta, MerchantCircle, etc.)
3. Review platforms (Trustpilot, BBB, ConsumerAffairs, Sitejabber, etc.)
4. Social media platforms (Facebook, LinkedIn, Instagram, Twitter/X, TikTok, YouTube, Pinterest, Nextdoor)
5. Industry-specific directories and marketplaces (Angi, HomeAdvisor, Thumbtack, Houzz, Porch, etc.)
6. Local citation sources (chambers of commerce, local business associations, city directories)
7. Press release distribution services
8. Podcast and video directories
9. App stores and SaaS marketplaces (if applicable)
10. Government and municipal directories
11. Forum and community platforms (Reddit, Quora, Medium)
12. Blog networks and content syndication platforms
13. Niche-specific directories unique to the {category} industry

For EACH target, provide:
- site_name, url, category, tier (1=critical, 2=high, 3=medium, 4=low)
- submission_type (form, api, oauth, manual, email)
- requires_verification (boolean), is_free (boolean)
- domain_authority (0-100), estimated_seo_value (critical/high/medium/low)
- submission_url (the direct URL to the submission/listing form, not just the homepage)
- estimated_time_to_complete (minutes)
- notes on any special requirements

MINIMUM: Generate 100 targets. Prioritize by SEO impact. Do not include sites that are defunct or require paid enterprise accounts.

OUTPUT: JSON array of target objects, sorted by tier then domain_authority descending.`,
      },
      {
        title: 'Niche-Specific Directory Deep Discovery',
        prompt: `You are a niche directory researcher. For the {category} industry specifically, find every industry-specific directory, trade association, professional body, and niche platform where a business should be listed.

SEARCH STRATEGY:
1. Industry trade associations (national, regional, state-level)
2. Professional certification bodies and registries
3. Industry-specific review platforms
4. Niche marketplaces and lead-generation platforms
5. Trade publication directories
6. Industry conference and event listing sites
7. Professional network platforms specific to this industry
8. Supplier/vendor directories
9. Industry forums and online communities
10. Award and recognition programs

For each, provide: site_name, url, category="industry_specific", submission_url, submission_type, is_free, domain_authority, why_it_matters (1 sentence), and a difficulty_rating (easy/medium/hard).

MINIMUM: 30 niche-specific targets. These should be DIFFERENT from the general directories.

OUTPUT: JSON array.`,
      },
      {
        title: 'Local Citation Source Discovery',
        prompt: `You are a local SEO specialist. For a {category} business located in {city}, {state}, find every local citation source that contributes to local search ranking.

INCLUDE:
1. Local chamber of commerce
2. City/county business directories
3. State business registries
4. Local newspaper business directories
5. Regional business associations
6. Local networking groups (BNI chapters, Rotary, etc.)
7. Community portals and local guides
8. Tourism boards (if relevant)
9. Local review sites specific to the area
10. Regional directories (e.g., "{state} business directory")

For each: site_name, url, submission_url, is_free, domain_authority, local_seo_impact (high/medium/low).

MINIMUM: 20 local citation sources specific to {city}, {state}.

OUTPUT: JSON array.`,
      },
      {
        title: 'Government & Municipal Directory Discovery',
        prompt: `You are a government compliance researcher. Identify every government and municipal directory where a {category} business should be registered or listed.

INCLUDE:
1. Federal registrations (SAM.gov, SBA, etc.)
2. State business registries and licensing boards
3. County business licenses and registrations
4. City business permits and directories
5. Professional licensing boards (if applicable)
6. Regulatory body registrations (if applicable)
7. Government procurement portals
8. Economic development office listings
9. Small business administration resources
10. Trade-specific government registries

For each: site_name, url, submission_url, is_required (boolean), is_free, authority_level (federal/state/county/city), and instructions_summary.

OUTPUT: JSON array with at least 15 government sources.`,
      },
    ],
  },
  {
    phase: 'Phase 3 — Content Generation',
    description: 'Generate high-quality, platform-optimized content for every submission target.',
    prompts: [
      {
        title: 'High-Quality Website Generation',
        prompt: `You are a world-class web designer and conversion optimization expert. Generate a complete, production-ready website for a {category} business.

BUSINESS PROFILE:
{profile_json}

WEBSITE REQUIREMENTS:
1. Homepage with hero section, value proposition, social proof, services overview, CTA
2. Services pages (one per service with SEO-optimized content)
3. About page with brand story and team
4. Contact page with form, map, hours
5. Testimonials/reviews page
6. FAQ page (10 questions with schema-ready answers)
7. Service area page (cities/regions served)
8. Blog with 3 initial posts

TECHNICAL REQUIREMENTS:
- Semantic HTML5, mobile-first responsive design
- Core Web Vitals optimized (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- Schema.org structured data (LocalBusiness, Service, FAQ, BreadcrumbList)
- SEO-optimized meta titles and descriptions for every page
- Accessible (WCAG 2.1 AA compliant)
- Conversion-optimized with clear CTAs and trust signals

OUTPUT: For each page, provide: page_name, slug, meta_title, meta_description, h1, body_content (HTML), schema_markup (JSON-LD), and internal_links. Return as a JSON array of page objects.`,
      },
      {
        title: 'Funnel Generation & Optimization',
        prompt: `You are a funnel architecture expert. Design a complete conversion funnel for a {category} business that maximizes lead capture and conversion.

BUSINESS PROFILE:
{profile_json}

FUNNEL COMPONENTS TO DESIGN:
1. Top of Funnel (Awareness): 5 lead magnet ideas + landing page copy for each
2. Middle of Funnel (Consideration): 3 nurture email sequences (5 emails each) with subject lines and body copy
3. Bottom of Funnel (Decision): 3 sales page variants with different angles
4. Post-Purchase: Onboarding sequence (3 emails) + review request sequence (3 emails)
5. Abandoned Cart/Lead: Re-engagement sequence (3 emails)

FOR EACH COMPONENT:
- Page/email title
- Full copy (HTML for pages, plain text for emails)
- CTA text and action
- Conversion psychology principle used (scarcity, social proof, authority, etc.)
- A/B test variant recommendation

OUTPUT: Structured JSON with all funnel components. Every piece of copy must be production-ready, not placeholder.`,
      },
      {
        title: 'Google Programmatic Content Generation',
        prompt: `You are a programmatic SEO expert. Design a programmatic content system for a {category} business that generates hundreds of SEO-optimized pages targeting local search intent.

STRATEGY:
1. Identify 50 service × location keyword combinations (e.g., "plumber in {city}", "emergency plumber {city}")
2. For each combination, generate a unique, valuable page that is NOT thin content
3. Each page must have: unique H1, 500+ words of genuinely useful content, local intent signals, FAQ section, internal links, schema markup

CONTENT RULES:
- No duplicate content — each page must be 80%+ unique
- Include local signals: city name, nearby landmarks, local references
- Include service-specific details: pricing ranges, process steps, common questions
- Add value beyond a template: local tips, seasonal considerations, regional regulations

OUTPUT: For each page, provide: target_keyword, slug, meta_title, meta_description, h1, body_content (HTML), faq_section (JSON-LD), internal_links. Return as JSON array. Generate 10 representative pages with a template pattern for scaling to 500+.`,
      },
      {
        title: 'Multi-Platform Content Adaptation',
        prompt: `You are a content adaptation specialist. Given the business profile below, generate platform-specific content for every major platform where the business will be listed.

BUSINESS PROFILE:
{profile_json}

PLATFORMS TO GENERATE CONTENT FOR:
1. Google Business Profile: business description (750 chars), services list, attributes, posts (3 weekly post templates)
2. Facebook: about section, milestone descriptions, 5 post templates
3. LinkedIn: company description, specialties, 5 article outlines
4. Instagram: bio (150 chars), 10 caption templates with hashtags
5. Twitter/X: bio (160 chars), 20 tweet templates
6. TikTok: bio, 10 video script outlines
7. Yelp: business description (1000 chars), specialties, history
8. BBB: business description, management profile
9. Trustpilot: review invitation email copy (3 variants)
10. Angi/HomeAdvisor: project description templates, qualifications summary

CONTENT RULES:
- Each platform's content must match its tone and format constraints
- No copy-paste between platforms — each must be genuinely adapted
- Include platform-specific features (hashtags, emojis, formatting)
- Optimize each for the platform's search/discovery algorithm

OUTPUT: JSON object keyed by platform name, with all content fields populated.`,
      },
      {
        title: 'Press Release Generation',
        prompt: `You are a PR professional. Generate 5 press releases for a {category} business to distribute across press release syndication networks.

BUSINESS PROFILE:
{profile_json}

PRESS RELEASE ANGLES:
1. Business launch/announcement
2. Community involvement / local event sponsorship
3. New service offering or technology adoption
4. Industry expertise / thought leadership announcement
5. Award or recognition received

FOR EACH PRESS RELEASE:
- Compelling headline (under 100 chars)
- Dateline and opening paragraph (who, what, when, where, why)
- Body (300-500 words, newsworthy tone, third person)
- Quote from business owner/leader
- Boilerplate (standard company description for all releases)
- Media contact section
- Suggested distribution platforms (PRWeb, PRNewswire, Business Wire, free alternatives)

OUTPUT: JSON array of 5 press release objects, each fully written and ready for distribution.`,
      },
    ],
  },
  {
    phase: 'Phase 4 — Submission Automation',
    description: 'Use the CloudBrowser swarm to navigate, fill forms, and submit across every discovered target.',
    prompts: [
      {
        title: 'CloudBrowser Swarm Orchestration',
        prompt: `You are a browser automation architect. Design the orchestration protocol for a CloudBrowser swarm that will submit a business profile to 100+ websites autonomously.

SWARM SPECIFICATIONS:
- Pool of 5-10 concurrent browser sessions
- Each session: 1440x900 viewport, captcha auto-solve, ad blocking, 30s timeout per page
- Session lifecycle: create → navigate → extract → fill → submit → screenshot → close
- Rate limiting: max 1 submission per site, 5-second delay between sessions
- Error handling: 3 retries per target, exponential backoff, dead-letter queue for permanent failures
- Screenshot capture: before form fill, after submit, on error
- Progress tracking: real-time status updates to BatchSubmissionJob entity

ORCHESTRATION LOGIC TO DESIGN:
1. Queue management: how targets are prioritized (tier 1 first, then 2, etc.)
2. Session allocation: how sessions are assigned to targets
3. Concurrency control: how to prevent duplicate submissions
4. State management: how to track per-target progress across batches
5. Recovery: how to resume from where a failed batch left off

OUTPUT: A JSON orchestration specification document with all logic, parameters, and error handling rules. This will be used to configure the CloudBrowser swarm controller.`,
      },
      {
        title: 'Form Analysis & Field Mapping',
        prompt: `You are a form intelligence system. Given the HTML form structure extracted from a website and a business profile, produce a precise field-by-field mapping that the browser automation will use to fill the form.

FORM FIELDS (extracted from {site_name}):
{form_fields_json}

BUSINESS PROFILE:
{profile_json}

MAPPING RULES:
1. Match each form field to the most relevant business profile field based on: field name, label, placeholder, type, and context
2. For select/dropdown fields, match the business value to the closest option (do not just type — select)
3. For checkbox/radio fields, determine the correct option based on business context
4. Skip fields that cannot be confidently mapped (password, captcha, agree-to-terms, newsletter opt-in)
5. For required fields with no match, generate the most appropriate value based on context
6. For description fields, use the medium-length business description
7. For category fields, match to the closest available option in the dropdown

OUTPUT: JSON object mapping each field selector to its value. Include a confidence score (0-1) for each mapping. Exclude any mapping with confidence below 0.5. Include a "skipped_fields" array with reasons.`,
      },
      {
        title: 'Automated Form Filling & Submission Protocol',
        prompt: `You are a browser automation engineer. Write the JavaScript execution plan that the CloudBrowser engine will run to fill and submit a form on an arbitrary website.

GIVEN:
- Field mapping: {field_mapping_json}
- Target URL: {target_url}

REQUIREMENTS:
1. Use native value setters (Object.getOwnPropertyDescriptor) to trigger React/Vue/Angular change detection
2. Dispatch 'input' and 'change' events after setting each value
3. For select elements: set value, then dispatch change event
4. For checkboxes/radios: set checked property, then dispatch change event
5. For file upload fields: skip (cannot automate without local files)
6. For rich text editors (contenteditable): use document.execCommand('insertText') or set innerHTML
7. After filling all fields, locate the submit button by: [type="submit"], then by text content matching (submit, create, add, register, continue, sign up)
8. Click the submit button
9. Wait 3 seconds for the response
10. Capture a screenshot of the result page
11. Detect success indicators: URL change, success message text, confirmation page
12. Detect failure indicators: error messages, same-page validation errors, captcha challenge

OUTPUT: A single JavaScript IIFE that the CloudBrowser engine can execute via its 'evaluate' action. The IIFE should return a JSON object with: fields_filled, submit_clicked, success_detected, error_messages, and result_url.`,
      },
      {
        title: 'API-Based Submission Protocol',
        prompt: `You are an API integration engineer. For submission targets that expose an API (instead of a web form), design the API submission protocol.

For each API-enabled target:
1. Identify the API endpoint URL and HTTP method
2. Determine authentication method (API key, OAuth, basic auth)
3. Map business profile fields to API request body fields
4. Define the request headers, body format (JSON/form-data), and expected response
5. Define error handling: what HTTP status codes mean success/failure/retry
6. Define rate limiting rules (requests per minute/hour)
7. Define idempotency strategy (how to avoid duplicate submissions)

TARGETS TO DESIGN FOR:
- Google Business Profile API
- Yelp Fusion API (if available for business creation)
- Facebook Graph API (page creation)
- LinkedIn API (company page creation)
- Bing Places API (if available)
- Apple Maps Connect API
- Any industry-specific APIs

OUTPUT: JSON object keyed by platform, with: endpoint, method, auth_type, request_body_template, headers, success_codes, retry_rules. Each template must be immediately usable — no placeholders.`,
      },
    ],
  },
  {
    phase: 'Phase 5 — Intelligence & Extraction',
    description: 'Extract business models and operational models from competitor analysis — the only value from cloning.',
    prompts: [
      {
        title: 'Business Model Extraction from Competitor Analysis',
        prompt: `You are a business model analyst. Given the website content and structure of a top competitor in the {category} space, extract their complete business model.

COMPETITOR DATA:
{competitor_website_html}
{competitor_screenshot_url}

EXTRACT:
1. Revenue model: how they make money (subscription, one-time, freemium, lead-gen, marketplace, advertising)
2. Pricing strategy: price points, tiers, bundling, discounts
3. Customer acquisition channels: how they attract customers (SEO, paid, social, referrals, partnerships)
4. Value proposition: their primary promise to customers
5. Target customer: who they serve (demographics, psychographics, firmographics)
6. Cost structure: major cost categories (COGS, labor, marketing, technology)
7. Key resources: what assets they rely on (brand, data, network, technology, licenses)
8. Key activities: what they do (production, problem-solving, platform/network)
9. Key partnerships: who they depend on (suppliers, distributors, technology partners)
10. Competitive advantage / moat: what protects them from competition
11. Scalability model: how they grow without linear cost increase
12. Unit economics: estimated CAC, LTV, payback period, gross margin

OUTPUT: Structured JSON with all 12 dimensions. Include a "replication_blueprint" field that describes how to build a superior version of this model.`,
      },
      {
        title: 'Operational Model Extraction from Competitor Analysis',
        prompt: `You are an operations analyst. Given the website content and structure of a top competitor, extract their complete operational model — how the business actually runs day-to-day.

COMPETITOR DATA:
{competitor_website_html}
{competitor_screenshot_url}

EXTRACT:
1. Service delivery model: how they deliver their service (in-person, remote, hybrid, automated)
2. Workflow/process steps: the customer journey from first contact to completion
3. Team structure: inferred roles and responsibilities (from "About Us", "Team" pages)
4. Technology stack: tools and platforms they use (from job postings, tech stack indicators, integrations)
5. Quality assurance: how they ensure service quality (reviews, guarantees, certifications)
6. Customer communication: channels and frequency (phone, email, SMS, portal)
7. Scheduling and dispatch: how they manage appointments and routing
8. Supply chain: materials, equipment, suppliers
9. Capacity model: how they scale operations (employees, subcontractors, franchises)
10. Standard operating procedures: inferred from FAQ, process descriptions, service pages
11. Performance metrics: what they track (response time, completion time, satisfaction)
12. Compliance and safety: licenses, insurance, safety protocols mentioned

OUTPUT: Structured JSON. Include an "operational_advantages" array and an "operational_gaps" array — what they do well and where they're vulnerable.`,
      },
      {
        title: 'Competitor Intelligence Benchmarking',
        prompt: `You are a competitive intelligence analyst. Benchmark the top 10 competitors in the {category} space across {location} and produce a dominance opportunity matrix.

For each competitor, score them (0-10) on:
1. Website quality (design, speed, UX, mobile, content depth)
2. SEO strength (organic keywords, backlinks, domain authority, content volume)
3. Review presence (total reviews, average rating, response rate, recency)
4. Directory coverage (number of directories listed on, consistency of NAP)
5. Social media presence (followers, posting frequency, engagement rate)
6. Local SEO (Google Business Profile completeness, posts, photos, Q&A)
7. Content marketing (blog frequency, content quality, lead magnets)
8. Paid advertising (estimated ad spend, ad quality, landing page quality)
9. Conversion optimization (CTAs, forms, trust signals, speed)
10. Brand consistency (messaging, visuals, tone across platforms)

THEN PRODUCE:
- An industry average score for each dimension
- A "dominance gap" for each dimension (how far below 10 the industry average is)
- A prioritized action plan: which dimensions to attack first for maximum competitive advantage
- A "quality benchmark" — the minimum score we must achieve on each dimension to dominate

OUTPUT: JSON with per-competitor scores, industry averages, dominance gaps, and the prioritized action plan.`,
      },
    ],
  },
  {
    phase: 'Phase 6 — Amplification & Dominance',
    description: 'Amplify presence through backlinks, syndication, PR, reviews, and brand mention monitoring.',
    prompts: [
      {
        title: 'Backlink Building Automation Strategy',
        prompt: `You are a link-building strategist. Design a comprehensive backlink building plan for a {category} business that will be executed through automated CloudBrowser submissions.

STRATEGY TIERS:
1. Tier 1 (Directory backlinks): All directory submissions produce a backlink — track which produce dofollow vs nofollow
2. Tier 2 (Content backlinks): Guest post outreach, HARO responses, resource page submissions
3. Tier 3 (Social backlinks): Social profiles, content syndication, social bookmarks
4. Tier 4 (PR backlinks): Press release distribution, media mentions, news coverage
5. Tier 5 (Industry backlinks): Trade associations, industry directories, partner pages
6. Tier 6 (Local backlinks): Chamber of commerce, local business associations, community sites
7. Tier 7 (Competitor backlinks): Identify where competitors get backlinks, then get listed there too

For each tier:
- Target count (how many backlinks to acquire)
- Domain authority range
- Automation feasibility (fully automated, semi-automated, manual)
- Estimated time to execute
- Expected SEO impact

OUTPUT: JSON with the full backlink acquisition plan, organized by tier, with automation instructions for each.`,
      },
      {
        title: 'Content Syndication Strategy',
        prompt: `You are a content syndication strategist. Design a content syndication system that distributes the business's content across every platform for maximum reach and SEO benefit.

CONTENT TYPES TO SYNDICATE:
1. Blog posts → Medium, LinkedIn Articles, Blogger, Tumblr, WordPress.com
2. Press releases → PRWeb, PRNewswire, free PR sites
3. Videos → YouTube, Vimeo, Dailymotion
4. Images/infographics → Pinterest, Flickr, Imgur
5. Podcasts → Apple Podcasts, Spotify, Google Podcasts, Stitcher
6. Documents → Scribd, SlideShare, Issuu
7. Social posts → Facebook, Twitter, LinkedIn, Instagram, TikTok

FOR EACH SYNDICATION CHANNEL:
- Content adaptation rules (how to reformat for this platform)
- Posting frequency recommendation
- Link-back strategy (how to drive traffic back to the main site)
- SEO value (backlink type, authority passed)
- Automation method (API, CloudBrowser form fill, manual)

OUTPUT: JSON syndication plan with per-channel instructions and an automation schedule.`,
      },
      {
        title: 'Review Generation & Management Protocol',
        prompt: `You are a reputation management expert. Design a review generation and management system for a {category} business.

SYSTEM COMPONENTS:
1. Review request sequences:
   - Post-service email (3 variants, sent 24h after service)
   - SMS review request (2 variants, sent 48h after service)
   - In-person QR code review card design
2. Platform-specific review funnels:
   - Google-first funnel (directs happy customers to Google, unhappy to private feedback)
   - Yelp funnel, Facebook funnel, Angi funnel
3. Review response templates:
   - 5-star response (3 variants)
   - 4-star response (3 variants)
   - 1-3 star response (3 variants, empathetic + corrective)
4. Review monitoring:
   - Daily check across Google, Yelp, Facebook, BBB, Trustpilot
   - Alert system for negative reviews (immediate notification)
   - Weekly review summary report
5. Review amplification:
   - Embed best reviews on website
   - Share reviews on social media
   - Include reviews in email signatures

OUTPUT: JSON with all templates, sequences, and monitoring rules. Every template must be production-ready copy, not placeholder.`,
      },
      {
        title: 'Brand Mention Monitoring & Expansion',
        prompt: `You are a brand monitoring strategist. Design a system that monitors the internet for mentions of the business and expands brand presence wherever relevant.

MONITORING TARGETS:
1. Google Alerts setup (brand name, owner name, key services)
2. Social media mention monitoring (Twitter, Facebook, Instagram, LinkedIn, Reddit)
3. Review platform monitoring (Google, Yelp, BBB, Trustpilot, ConsumerAffairs)
4. Forum/community monitoring (Reddit, Quora, industry forums)
5. News/press monitoring (Google News, local news sites)
6. Backlink monitoring (new links pointing to the site)
7. Competitor mention monitoring (what are competitors doing that we should respond to)

EXPANSION STRATEGY:
- When mentioned positively: amplify (share, repost, thank)
- When mentioned negatively: respond immediately and professionally
- When NOT mentioned: find relevant conversations and participate
- When competitors are mentioned: insert our superior alternative
- When industry topics trend: create content and insert our perspective

OUTPUT: JSON monitoring plan with: tools, frequency, alert thresholds, response templates, and expansion tactics.`,
      },
    ],
  },
  {
    phase: 'Phase 7 — Verification & Tracking',
    description: 'Verify submissions went live, track dominance progress, and continuously improve.',
    prompts: [
      {
        title: 'Submission Verification Protocol',
        prompt: `You are a verification engineer. Design a protocol that uses the CloudBrowser swarm to verify that each submission actually went live and is publicly visible.

VERIFICATION LOGIC:
1. For each submitted target, wait 48-72 hours (configurable)
2. Navigate to the target site and search for the business name
3. Check if the listing exists and is publicly accessible (not behind login)
4. Verify the listing contains correct: business name, phone, address, website URL
5. Capture a screenshot of the live listing as proof
6. Record the live listing URL
7. Check for data inconsistencies (wrong phone, wrong address, etc.)

VERIFICATION STATES:
- verified: listing is live and correct
- live_with_errors: listing is live but has data inconsistencies
- pending: not yet visible (may still be in review queue)
- rejected: listing was rejected or removed
- not_found: no listing found after 7 days

OUTPUT: JSON verification protocol with: check logic, wait periods, verification criteria, and state machine transitions. This will be used to configure the verification workflow.`,
      },
      {
        title: 'Dominance Tracking & Reporting Dashboard',
        prompt: `You are a data visualization and reporting expert. Design the tracking and reporting system for the Digital Dominance campaign.

METRICS TO TRACK:
1. Total targets discovered (by category, by tier)
2. Submissions attempted, succeeded, failed
3. Verification status (verified, live_with_errors, pending, rejected)
4. Live listings count (confirmed visible to the public)
5. Backlinks acquired (count, domain authority distribution)
6. Citation consistency score (NAP consistency across all listings)
7. Review acquisition (new reviews per platform, average rating)
8. Organic traffic impact (before/after comparison)
9. Local search ranking changes (Google Maps, local pack)
10. Brand mention growth (month over month)

REPORTS TO GENERATE:
1. Daily: submission progress, failures, action items
2. Weekly: dominance scorecard, new listings, review summary
3. Monthly: full dominance report with traffic/ranking impact analysis

OUTPUT: JSON with the complete metrics schema, report templates, and a dashboard layout specification. Include the SQL/NoSQL queries needed to compute each metric from the SubmissionTarget and BatchSubmissionJob entities.`,
      },
      {
        title: 'Continuous Improvement Loop',
        prompt: `You are a systems optimization engineer. Design a continuous improvement loop that analyzes submission results and improves the system over time.

LOOP COMPONENTS:
1. Failure analysis: categorize every failed submission by reason (no form found, form changed, captcha, login required, timeout, etc.)
2. Success pattern recognition: identify what makes successful submissions work (which form types, which field mappings, which sites)
3. Field mapping refinement: update the LLM mapping prompts based on what worked vs failed
4. New target discovery: based on where competitors are listed that we're not
5. Quality scoring: rate each live listing for completeness and accuracy
6. Re-submission strategy: for failed targets, determine if retry is worthwhile and what to change
7. Catalog updates: add new targets discovered, remove dead targets
8. Performance optimization: identify slow targets and optimize the CloudBrowser flow

LOOP FREQUENCY:
- Daily: failure analysis + re-submission queue
- Weekly: success pattern analysis + field mapping updates
- Monthly: catalog audit + new target discovery + quality scoring

OUTPUT: JSON with the complete loop specification, including: analysis queries, update rules, trigger conditions, and the feedback loop architecture.`,
      },
    ],
  },
];

// Flatten for easy access
export const ALL_PROMPTS = PROMPT_PHASES.flatMap(phase =>
  phase.prompts.map((p, i) => ({
    number: ALL_PROMPTS.length + i + 1, // will be recalculated
    phase: phase.phase,
    ...p,
  }))
);

// Properly number all prompts sequentially
let _counter = 0;
export const NUMBERED_PROMPTS = PROMPT_PHASES.flatMap(phase => {
  return phase.prompts.map(p => {
    _counter++;
    return {
      number: _counter,
      phase: phase.phase,
      phaseDescription: phase.description,
      ...p,
    };
  });
});

export const TOTAL_PROMPTS = NUMBERED_PROMPTS.length;