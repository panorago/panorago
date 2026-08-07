import { absoluteUrl, resolveSiteOrigin } from "@/lib/utils";

/** Default browser / SERP title — brand + tagline. */
export const SITE_TITLE = "Panora Go - Discover Connect Belong";

export const SITE_TITLE_TEMPLATE = "%s | Panora Go";

export const SITE_DESCRIPTION =
  "Panora Go is Zimbabwe's premium tourism and lifestyle discovery platform. Discover Connect Belong — curated places, weekends, and insider notes across Panora Zimbabwe.";

export const SITE_KEYWORDS = [
  "Panora Go",
  "tourism Panora",
  "Panora Zimbabwe",
  "Discover Connect Belong",
  "Zimbabwe tourism",
  "Zimbabwe travel",
  "Harare",
  "Victoria Falls",
  "weekend escapes",
  "curated places Zimbabwe",
  "lifestyle discovery Zimbabwe",
] as const;

export function siteLogoUrl() {
  return absoluteUrl("/logos/pgo-dark-icon.png");
}

/** Social profiles for Organization sameAs (only set URLs). */
export function organizationSameAs(): string[] {
  return [
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
    process.env.NEXT_PUBLIC_SOCIAL_TIKTOK,
    process.env.NEXT_PUBLIC_SOCIAL_X,
  ].filter((v): v is string => Boolean(v?.trim()));
}

/** Root Organization + WebSite JSON-LD (SearchAction → /discover). */
export function rootJsonLd() {
  const origin = resolveSiteOrigin();
  const home = absoluteUrl("/");
  const logo = siteLogoUrl();
  const sameAs = organizationSameAs();

  const organization = {
    "@type": "Organization",
    "@id": `${home}#organization`,
    name: "Panora Go",
    alternateName: ["PGO", "Panora"],
    url: home,
    logo: {
      "@type": "ImageObject",
      url: logo,
    },
    description: SITE_DESCRIPTION,
    slogan: "Discover. Connect. Belong.",
    areaServed: {
      "@type": "Country",
      name: "Zimbabwe",
    },
    ...(sameAs.length ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${home}#website`,
    name: "Panora Go",
    alternateName: SITE_TITLE,
    url: home,
    description: SITE_DESCRIPTION,
    inLanguage: "en-ZW",
    publisher: { "@id": `${home}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${origin}/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };
}
