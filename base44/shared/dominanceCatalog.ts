// Comprehensive catalog of submission targets for digital dominance.
// Organized by category and tier (1=critical, 2=high, 3=medium, 4=low).
// Seeded into SubmissionTarget records by DigitalDominanceGenerator.

export interface CatalogEntry {
  site_name: string;
  url: string;
  category: string;
  tier: 1 | 2 | 3 | 4;
  submission_type: string;
  requires_verification: boolean;
  is_free: boolean;
  domain_authority: number;
  estimated_seo_value: string;
  description: string;
}

export const DOMINANCE_CATALOG: CatalogEntry[] = [
  // ═══ TIER 1 — BUSINESS LISTINGS (critical for local SEO) ═══
  { site_name: 'Google Business Profile', url: 'https://www.google.com/business/', category: 'business_listing', tier: 1, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 100, estimated_seo_value: 'critical', description: 'Google My Business — most important local SEO listing' },
  { site_name: 'Bing Places for Business', url: 'https://www.bingplaces.com/', category: 'business_listing', tier: 1, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 95, estimated_seo_value: 'critical', description: 'Bing local business listing' },
  { site_name: 'Apple Maps Connect', url: 'https://business.apple.com/', category: 'business_listing', tier: 1, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 100, estimated_seo_value: 'critical', description: 'Apple Maps business listing' },
  { site_name: 'Yelp for Business', url: 'https://biz.yelp.com/', category: 'business_listing', tier: 1, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'critical', description: 'Yelp business listing — major review platform' },
  { site_name: 'Facebook Business Page', url: 'https://www.facebook.com/business/', category: 'social_platform', tier: 1, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 96, estimated_seo_value: 'critical', description: 'Facebook business page — social presence + local' },
  { site_name: 'LinkedIn Company Page', url: 'https://www.linkedin.com/company/', category: 'social_platform', tier: 1, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 98, estimated_seo_value: 'critical', description: 'LinkedIn company page — B2B presence' },

  // ═══ TIER 1 — REVIEW SITES ═══
  { site_name: 'Better Business Bureau', url: 'https://www.bbb.org/', category: 'review_site', tier: 1, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 91, estimated_seo_value: 'critical', description: 'BBB accreditation — trust signal' },
  { site_name: 'Trustpilot', url: 'https://www.trustpilot.com/', category: 'review_site', tier: 1, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'critical', description: 'Trustpilot — customer reviews' },

  // ═══ TIER 2 — BUSINESS DIRECTORIES ═══
  { site_name: 'Yellow Pages', url: 'https://www.yellowpages.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 80, estimated_seo_value: 'high', description: 'YellowPages.com directory listing' },
  { site_name: 'Whitepages', url: 'https://www.whitepages.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 78, estimated_seo_value: 'high', description: 'Whitepages business listing' },
  { site_name: 'Superpages', url: 'https://www.superpages.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 75, estimated_seo_value: 'high', description: 'Superpages directory' },
  { site_name: 'MerchantCircle', url: 'https://www.merchantcircle.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 70, estimated_seo_value: 'high', description: 'MerchantCircle local business network' },
  { site_name: 'Manta', url: 'https://www.manta.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 72, estimated_seo_value: 'high', description: 'Manta small business directory' },
  { site_name: 'Foursquare', url: 'https://foursquare.com/', category: 'business_listing', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 85, estimated_seo_value: 'high', description: 'Foursquare location listing' },
  { site_name: 'MapQuest', url: 'https://www.mapquest.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 73, estimated_seo_value: 'high', description: 'MapQuest local listing' },
  { site_name: 'CityGrid', url: 'https://www.citygrid.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 68, estimated_seo_value: 'medium', description: 'CityGrid local directory' },
  { site_name: 'Hotfrog', url: 'https://www.hotfrog.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 65, estimated_seo_value: 'medium', description: 'Hotfrog business directory' },
  { site_name: 'Brownbook', url: 'https://www.brownbook.net/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 60, estimated_seo_value: 'medium', description: 'Brownbook business directory' },
  { site_name: ' Tupalo', url: 'https://www.tupalo.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 58, estimated_seo_value: 'medium', description: 'Tupalo local business directory' },
  { site_name: 'BizVotes', url: 'https://www.bizvotes.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 55, estimated_seo_value: 'medium', description: 'BizVotes business directory' },
  { site_name: 'LocalStack', url: 'https://www.localstack.com/', category: 'directory', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 52, estimated_seo_value: 'medium', description: 'LocalStack local business directory' },

  // ═══ TIER 2 — HOME SERVICE PLATFORMS ═══
  { site_name: 'Angi (Angie\'s List)', url: 'https://business.angi.com/', category: 'industry_specific', tier: 2, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 88, estimated_seo_value: 'high', description: 'Angi home services marketplace' },
  { site_name: 'HomeAdvisor', url: 'https://www.homeadvisor.com/', category: 'industry_specific', tier: 2, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 87, estimated_seo_value: 'high', description: 'HomeAdvisor contractor directory' },
  { site_name: 'Thumbtack', url: 'https://www.thumbtack.com/professionals', category: 'industry_specific', tier: 2, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 85, estimated_seo_value: 'high', description: 'Thumbtack professional services' },
  { site_name: 'Houzz', url: 'https://www.houzz.com/professionals', category: 'industry_specific', tier: 2, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 90, estimated_seo_value: 'high', description: 'Houzz home design + contractor directory' },
  { site_name: 'Porch', url: 'https://porch.com/professionals', category: 'industry_specific', tier: 2, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 78, estimated_seo_value: 'high', description: 'Porch home services directory' },
  { site_name: 'Tack', url: 'https://www.tackapp.com/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 50, estimated_seo_value: 'medium', description: 'Tack home services platform' },

  // ═══ TIER 2 — SOCIAL PLATFORMS ═══
  { site_name: 'Twitter/X', url: 'https://twitter.com/', category: 'social_platform', tier: 2, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 94, estimated_seo_value: 'high', description: 'Twitter/X business account' },
  { site_name: 'Instagram', url: 'https://www.instagram.com/', category: 'social_platform', tier: 2, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 95, estimated_seo_value: 'high', description: 'Instagram business profile' },
  { site_name: 'TikTok', url: 'https://www.tiktok.com/business/', category: 'social_platform', tier: 2, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'high', description: 'TikTok business account' },
  { site_name: 'YouTube', url: 'https://www.youtube.com/', category: 'social_platform', tier: 2, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 100, estimated_seo_value: 'high', description: 'YouTube channel' },
  { site_name: 'Pinterest', url: 'https://business.pinterest.com/', category: 'social_platform', tier: 2, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 94, estimated_seo_value: 'high', description: 'Pinterest business account' },
  { site_name: 'Nextdoor', url: 'https://business.nextdoor.com/', category: 'social_platform', tier: 2, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 80, estimated_seo_value: 'high', description: 'Nextdoor local business page' },

  // ═══ TIER 2 — REVIEW SITES ═══
  { site_name: 'ConsumerAffairs', url: 'https://www.consumeraffairs.com/', category: 'review_site', tier: 2, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 85, estimated_seo_value: 'high', description: 'ConsumerAffairs reviews' },
  { site_name: 'Sitejabber', url: 'https://www.sitejabber.com/', category: 'review_site', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 80, estimated_seo_value: 'high', description: 'Sitejabber business reviews' },
  { site_name: 'ResellerRatings', url: 'https://www.resellerratings.com/', category: 'review_site', tier: 2, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 75, estimated_seo_value: 'medium', description: 'ResellerRatings merchant reviews' },

  // ═══ TIER 3 — B2B / SAAS DIRECTORIES ═══
  { site_name: 'Crunchbase', url: 'https://www.crunchbase.com/', category: 'directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 88, estimated_seo_value: 'high', description: 'Crunchbase company profile' },
  { site_name: 'Glassdoor', url: 'https://www.glassdoor.com/', category: 'directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'medium', description: 'Glassdoor company profile' },
  { site_name: 'Indeed Company Page', url: 'https://www.indeed.com/hire/companies', category: 'directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 95, estimated_seo_value: 'medium', description: 'Indeed company page' },
  { site_name: 'ZipRecruiter Employer', url: 'https://www.ziprecruiter.com/employers', category: 'directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 85, estimated_seo_value: 'medium', description: 'ZipRecruiter employer profile' },
  { site_name: 'G2', url: 'https://www.g2.com/', category: 'review_site', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 82, estimated_seo_value: 'high', description: 'G2 software reviews' },
  { site_name: 'Capterra', url: 'https://www.capterra.com/', category: 'review_site', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 80, estimated_seo_value: 'high', description: 'Capterra software directory' },
  { site_name: 'GetApp', url: 'https://www.getapp.com/', category: 'directory', tier: 3, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 75, estimated_seo_value: 'medium', description: 'GetApp software directory' },
  { site_name: 'Software Advice', url: 'https://www.softwareadvice.com/', category: 'directory', tier: 3, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 76, estimated_seo_value: 'medium', description: 'Software Advice directory' },
  { site_name: 'Product Hunt', url: 'https://www.producthunt.com/', category: 'saas_marketplace', tier: 3, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 89, estimated_seo_value: 'high', description: 'Product Hunt product launch' },
  { site_name: 'AlternativeTo', url: 'https://alternativeto.net/', category: 'saas_marketplace', tier: 3, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 70, estimated_seo_value: 'medium', description: 'AlternativeTo software directory' },

  // ═══ TIER 3 — PRESS RELEASE ═══
  { site_name: 'PR Newswire', url: 'https://www.prnewswire.com/', category: 'press_release', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 90, estimated_seo_value: 'high', description: 'PR Newswire press release distribution' },
  { site_name: 'Business Wire', url: 'https://www.businesswire.com/', category: 'press_release', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 88, estimated_seo_value: 'high', description: 'Business Wire press release' },
  { site_name: 'PRWeb', url: 'https://www.prweb.com/', category: 'press_release', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 82, estimated_seo_value: 'medium', description: 'PRWeb press release distribution' },
  { site_name: '24-7 Press Release', url: 'https://www.24-7pressrelease.com/', category: 'press_release', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 60, estimated_seo_value: 'low', description: 'Free press release distribution' },
  { site_name: 'PRLog', url: 'https://www.prlog.org/', category: 'press_release', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 55, estimated_seo_value: 'low', description: 'Free press release directory' },
  { site_name: 'Online PR News', url: 'https://www.onlineprnews.com/', category: 'press_release', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 50, estimated_seo_value: 'low', description: 'Online PR News free releases' },

  // ═══ TIER 3 — PODCAST / VIDEO DIRECTORIES ═══
  { site_name: 'Apple Podcasts Connect', url: 'https://podcastsconnect.apple.com/', category: 'podcast_directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 100, estimated_seo_value: 'medium', description: 'Apple Podcasts directory' },
  { site_name: 'Spotify for Podcasters', url: 'https://podcasters.spotify.com/', category: 'podcast_directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 95, estimated_seo_value: 'medium', description: 'Spotify podcast directory' },
  { site_name: 'Google Podcasts', url: 'https://podcasts.google.com/', category: 'podcast_directory', tier: 3, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 100, estimated_seo_value: 'medium', description: 'Google Podcasts directory' },

  // ═══ TIER 3 — APP STORES ═══
  { site_name: 'Google Play Console', url: 'https://play.google.com/console/', category: 'app_store', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 100, estimated_seo_value: 'high', description: 'Google Play app listing' },
  { site_name: 'Apple App Store Connect', url: 'https://appstoreconnect.apple.com/', category: 'app_store', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 100, estimated_seo_value: 'high', description: 'Apple App Store listing' },

  // ═══ TIER 3 — INDUSTRY-SPECIFIC ═══
  { site_name: 'Avvo', url: 'https://www.avvo.com/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 80, estimated_seo_value: 'high', description: 'Avvo attorney directory' },
  { site_name: 'Healthgrades', url: 'https://www.healthgrades.com/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 85, estimated_seo_value: 'high', description: 'Healthgrades healthcare provider directory' },
  { site_name: 'Zocdoc', url: 'https://www.zocdoc.com/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 82, estimated_seo_value: 'high', description: 'Zocdoc medical practice listing' },
  { site_name: 'Psychology Today', url: 'https://www.psychologytoday.com/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 88, estimated_seo_value: 'high', description: 'Psychology Today therapist directory' },
  { site_name: 'Cars.com Dealer', url: 'https://www.cars.com/dealers/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 85, estimated_seo_value: 'high', description: 'Cars.com dealer listing' },
  { site_name: 'AutoTrader Dealer', url: 'https://www.autotrader.com/dealers', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 83, estimated_seo_value: 'high', description: 'AutoTrader dealer listing' },
  { site_name: 'Realtor.com', url: 'https://www.realtor.com/professionals', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 90, estimated_seo_value: 'high', description: 'Realtor.com professional listing' },
  { site_name: 'Zillow Professional', url: 'https://www.zillow.com/professionals/', category: 'industry_specific', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'high', description: 'Zillow professional directory' },

  // ═══ TIER 4 — GENERAL DIRECTORIES (citation building) ═══
  { site_name: 'DMOZ', url: 'https://dmoz-odp.org/', category: 'directory', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 70, estimated_seo_value: 'low', description: 'DMOZ open directory (legacy)' },
  { site_name: 'Jasmine Directory', url: 'https://www.jasminedirectory.com/', category: 'directory', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 55, estimated_seo_value: 'low', description: 'Jasmine business directory' },
  { site_name: 'Aviva Directory', url: 'https://www.avivadirectory.com/', category: 'directory', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 52, estimated_seo_value: 'low', description: 'Aviva directory listing' },
  { site_name: 'Directory Critic', url: 'https://www.directorycritic.com/', category: 'directory', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 48, estimated_seo_value: 'low', description: 'Directory Critic listing' },
  { site_name: 'SoMuch', url: 'https://www.somuch.com/', category: 'directory', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 45, estimated_seo_value: 'low', description: 'SoMuch directory' },
  { site_name: 'Blogarama', url: 'https://blogarama.com/', category: 'blog_network', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 50, estimated_seo_value: 'low', description: 'Blogarama blog directory' },
  { site_name: 'BlogCatalog', url: 'https://www.blogcatalog.com/', category: 'blog_network', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 48, estimated_seo_value: 'low', description: 'BlogCatalog directory' },
  { site_name: 'BlogHub', url: 'https://www.bloghub.com/', category: 'blog_network', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 40, estimated_seo_value: 'low', description: 'BlogHub directory' },

  // ═══ TIER 4 — GOVERNMENT / LOCAL ═══
  { site_name: 'SAM.gov', url: 'https://www.sam.gov/', category: 'government', tier: 4, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 85, estimated_seo_value: 'medium', description: 'SAM.gov federal contractor registration' },
  { site_name: 'US Chamber of Commerce', url: 'https://www.uschamber.com/', category: 'government', tier: 4, submission_type: 'form', requires_verification: true, is_free: false, domain_authority: 80, estimated_seo_value: 'medium', description: 'US Chamber of Commerce membership' },

  // ═══ TIER 4 — FORUM / COMMUNITY ═══
  { site_name: 'Reddit', url: 'https://www.reddit.com/', category: 'forum', tier: 4, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'medium', description: 'Reddit business subreddit presence' },
  { site_name: 'Quora', url: 'https://www.quora.com/', category: 'forum', tier: 4, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 88, estimated_seo_value: 'medium', description: 'Quora business space' },
  { site_name: 'Medium', url: 'https://medium.com/', category: 'blog_network', tier: 4, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 95, estimated_seo_value: 'medium', description: 'Medium publication' },
  { site_name: 'WordPress.com', url: 'https://wordpress.com/', category: 'blog_network', tier: 4, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 94, estimated_seo_value: 'low', description: 'WordPress.com blog' },
  { site_name: 'Blogger', url: 'https://www.blogger.com/', category: 'blog_network', tier: 4, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 92, estimated_seo_value: 'low', description: 'Blogger blog' },
  { site_name: 'Tumblr', url: 'https://www.tumblr.com/', category: 'blog_network', tier: 4, submission_type: 'oauth', requires_verification: true, is_free: true, domain_authority: 90, estimated_seo_value: 'low', description: 'Tumblr blog' },

  // ═══ TIER 4 — NICHE DIRECTORIES ═══
  { site_name: 'TrustRadius', url: 'https://www.trustradius.com/', category: 'review_site', tier: 4, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 72, estimated_seo_value: 'medium', description: 'TrustRadius B2B software reviews' },
  { site_name: 'Clutch', url: 'https://clutch.co/', category: 'directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 78, estimated_seo_value: 'high', description: 'Clutch B2B service provider directory' },
  { site_name: 'UpCity', url: 'https://upcity.com/', category: 'directory', tier: 3, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 70, estimated_seo_value: 'medium', description: 'UpCity marketing agency directory' },
  { site_name: 'Sortlist', url: 'https://www.sortlist.com/', category: 'directory', tier: 4, submission_type: 'form', requires_verification: true, is_free: true, domain_authority: 55, estimated_seo_value: 'low', description: 'Sortlist agency directory' },
  { site_name: 'CrowdReviews', url: 'https://www.crowdreviews.com/', category: 'review_site', tier: 4, submission_type: 'form', requires_verification: false, is_free: true, domain_authority: 45, estimated_seo_value: 'low', description: 'CrowdReviews business reviews' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  business_listing: 'Business Listings',
  review_site: 'Review Sites',
  social_platform: 'Social Platforms',
  industry_specific: 'Industry Directories',
  press_release: 'Press Release',
  podcast_directory: 'Podcast Directories',
  app_store: 'App Stores',
  saas_marketplace: 'SaaS Marketplaces',
  government: 'Government / Local',
  directory: 'General Directories',
  blog_network: 'Blog Networks',
  forum: 'Forums / Community',
  other: 'Other',
};