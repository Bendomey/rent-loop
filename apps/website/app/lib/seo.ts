import { APP_NAME } from "./constants";
import { safeString } from "./strings";
import { capitalize } from "./utils";

const MAX_LENGTH_META_DESCRIPTION = 200;

const baseKeywords =
  "property management, rental management, real estate software, tenant management, lease management, maintenance tracking, rent collection, property analytics, landlord tools, property manager software, real estate management, rental property software, tenant screening, online rent payments, property marketing, lease agreements, maintenance requests, financial reporting, property inspections, vacancy management, rental listings";

export function getSocialMetas({
  url,
  title = `${capitalize(APP_NAME)} - Smart renting made simple.`,
  description = "Smart renting made simple.",
  images = [],
  keywords = "",
  origin,
}: {
  images?: Array<string>;
  url: string;
  title?: string;
  description?: string;
  keywords?: string;
  origin?: string;
}) {
  if (keywords.length) {
    keywords = keywords.concat(`, ${baseKeywords}`);
  } else {
    keywords = baseKeywords;
  }

  if (!images.length && origin) {
    images = [`${origin}/logo.png`];
  }

  const ogImages = images.map((image) => {
    return { name: "og:image", content: image };
  });

  const twitterImages = images.map((image) => {
    return { name: "twitter:image", content: image };
  });

  const truncateDescription =
    description.length > MAX_LENGTH_META_DESCRIPTION
      ? description.slice(0, MAX_LENGTH_META_DESCRIPTION) + "..."
      : description.slice(0, MAX_LENGTH_META_DESCRIPTION);

  const metas = [
    { title },
    { name: "title", content: title },
    { name: "description", content: truncateDescription },
    {
      name: "keywords",
      content: `${APP_NAME}${keywords ? `, ${keywords}` : ""}`,
    },
    { name: "robots", content: "index, follow" },
    { name: "author", content: "RentLoop" },
    { rel: "canonical", href: url },
    { name: "og:url", content: url },
    { name: "og:site_name", content: capitalize(APP_NAME) },
    { name: "og:type", content: "website" },
    { name: "og:title", content: title },
    { name: "og:description", content: truncateDescription },
    ...ogImages,
    {
      name: "twitter:card",
      content: images.length ? "summary_large_image" : "summary",
    },
    { name: "twitter:creator", content: "@rentloopgh" },
    { name: "twitter:site", content: "@rentloopgh" },
    { name: "twitter:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: truncateDescription },
    ...twitterImages,
    { name: "twitter:image:alt", content: title },
  ];

  if (images.length) {
    metas.push({ name: "image", content: safeString(images[0]) });
  }

  return metas;
}

/**
 * Organization structured data (JSON-LD)
 */
export function getOrganizationSchema(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RentLoop",
    url: origin,
    logo: `${origin}/logo.png`,
    description:
      "Smart renting made simple.",
    sameAs: ["https://twitter.com/rentloopgh"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  };
}

/**
 * WebSite structured data for search engines
 */
export function getWebsiteSchema(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RentLoop",
    url: origin,
    description:
      "Smart renting made simple.",
  };
}

/**
 * SoftwareApplication structured data
 */
export function getSoftwareAppSchema(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RentLoop",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: origin,
    description:
      "Smart renting made simple.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GHS",
    },
  };
}
