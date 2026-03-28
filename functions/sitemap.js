export async function onRequest(context) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://spacexipotracker.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://spacexipotracker.com/markets.html</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://spacexipotracker.com/news.html</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://spacexipotracker.com/invest.html</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://spacexipotracker.com/analysis/2026-03-27-starlink-10k-satellites.html</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://spacexipotracker.com/analysis/2026-03-26-valuation.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://spacexipotracker.com/analysis/2026-03-25-starlink-ipo.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://spacexipotracker.com/analysis/2026-03-24-launch-tech.html</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://spacexipotracker.com/privacy.html</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
