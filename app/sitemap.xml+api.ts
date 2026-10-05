export async function GET(request: Request) {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "") ||
    "https";
  const baseUrl = `${protocol}://${host}`;

  const pages = [
    { path: "", priority: "1.0" },
    { path: "/feed", priority: "0.8" },
    { path: "/saved", priority: "0.5" },
    { path: "/settings", priority: "0.3" },
    { path: "/app", priority: "0.9" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
