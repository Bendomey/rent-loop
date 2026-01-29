import { APP_DOMAIN, NODE_ENV } from "~/lib/constants";

export async function loader() {
  const protocol = NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${APP_DOMAIN}`;

  // Add all your routes here
  const routes = [
    { url: "/", priority: "1.0", changefreq: "weekly" },
    // Add more routes as your site grows
    // { url: "/about", priority: "0.8", changefreq: "monthly" },
    // { url: "/contact", priority: "0.8", changefreq: "monthly" },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
