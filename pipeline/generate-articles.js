#!/usr/bin/env node
// generate-articles.js — writes full /analysis/*.html pages from daily-analysis.json
// Called by site-updater.js and can be run standalone.

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, 'state');
const ANALYSIS_FILE = path.join(STATE_DIR, 'daily-analysis.json');
const PROJECT_ROOT = path.dirname(__dirname);
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'analysis');

const IMAGE_MAP = {
  'Valuation': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  'Starlink IPO': 'https://images.unsplash.com/photo-1457364887197-9150188c107b?w=1200&q=80',
  'Launch & Tech': 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200&q=80',
  'IPO Watch': 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&q=80',
};

function slug(a) {
  return `${a.date}-${a.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function buildArticleHTML(a) {
  const imageUrl = IMAGE_MAP[a.tag] || IMAGE_MAP['IPO Watch'];
  const sl = slug(a);
  const canonicalUrl = `https://spacexipotracker.com/analysis/${sl}.html`;
  const title = `${a.angle} | SpaceX IPO Tracker`;
  const description = a.body.substring(0, 160);

  const headlineItems = (a.headlines || []).slice(0, 4).map(h =>
    `<li><a href="${h.url}" target="_blank" rel="noopener">${h.title}</a> — ${h.description.replace(/<[^>]+>/g, '').substring(0, 120)}...</li>`
  ).join('\n                        ');

  const sourceLinks = (a.headlines || []).slice(0, 4).map(h =>
    `<a href="${h.url}" target="_blank" rel="noopener">${h.source}</a>`
  ).join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow" />
  <title>${title}</title>
  <meta name="article:published_time" content="${a.date}" />
  <meta property="og:title" content="${a.angle}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${imageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${a.angle}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #09090f; color: #e2e2ea; line-height: 1.7; font-size: 17px; }
    .site-nav { background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 16px 20px; position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; }
    .site-nav-brand { font-size: 18px; font-weight: 700; color: #fff; text-decoration: none; }
    .site-nav-links { display: flex; gap: 24px; }
    .site-nav-links a { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 15px; }
    .site-nav-links a:hover { color: #fff; }
    .article-container { max-width: 760px; margin: 0 auto; padding: 48px 24px 80px; }
    .back-link { display: inline-block; margin-bottom: 24px; color: #f39c12; text-decoration: none; font-weight: 600; }
    .back-link:hover { opacity: 0.8; }
    .article-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta-badge { background: rgba(231,76,60,0.15); border: 1px solid rgba(231,76,60,0.45); color: #e74c3c; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; }
    .meta-date { font-size: 13px; color: rgba(255,255,255,0.4); }
    h1 { font-size: clamp(26px,4vw,42px); font-weight: 800; line-height: 1.2; color: #fff; margin-bottom: 20px; }
    .article-deck { font-size: 19px; color: rgba(255,255,255,0.65); line-height: 1.6; border-left: 3px solid #e67e22; padding-left: 16px; margin-bottom: 36px; }
    .article-hero { width: 100%; height: 360px; object-fit: cover; border-radius: 12px; margin-bottom: 40px; }
    h2 { font-size: 22px; font-weight: 700; color: #fff; margin: 40px 0 14px; }
    p { margin-bottom: 20px; color: rgba(255,255,255,0.78); }
    .news-list { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 24px; margin-bottom: 32px; }
    .news-list ul { padding-left: 20px; }
    .news-list li { margin-bottom: 12px; color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.6; }
    .news-list li a { color: #f39c12; text-decoration: none; }
    .news-list li a:hover { text-decoration: underline; }
    .sources { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); }
    .sources a { color: rgba(255,255,255,0.5); text-decoration: none; }
    .sources a:hover { color: #fff; }
    footer { text-align: center; padding: 40px 20px; border-top: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); font-size: 13px; }
    footer a { color: rgba(255,255,255,0.4); text-decoration: none; }
  </style>
</head>
<body>
  <nav class="site-nav">
    <a class="site-nav-brand" href="/">🚀 SpaceX IPO Tracker</a>
    <div class="site-nav-links">
      <a href="/">Home</a>
      <a href="/#analysis" class="active">Analysis</a>
    </div>
  </nav>

  <div class="article-container">
    <a class="back-link" href="/">← Back to Tracker</a>

    <div class="article-meta">
      <span class="meta-badge">${a.tag}</span>
      <span class="meta-date">${a.dateStr}</span>
    </div>

    <h1>${a.angle}</h1>
    <p class="article-deck">${a.body}</p>

    <img class="article-hero" src="${imageUrl}" alt="${a.angle}" loading="lazy" />

    <h2>📰 News Driving This Analysis</h2>
    <div class="news-list">
      <ul>
        ${headlineItems}
      </ul>
    </div>

    <h2>What This Means for the IPO</h2>
    <p>Each development above is a signal in the broader IPO timing picture. When multiple indicators converge — rising valuation, regulatory progress, Starlink momentum, and management commentary — the window for a formal S-1 filing narrows. We track all of them so you don't have to.</p>

    <p>Secondary market data shows SpaceX shares trading around $350B implied valuation. Prediction markets currently price a 52% chance of an IPO filing before June 2026. Watch for SEC movement, lock-up expiry announcements, and investor briefing schedules as the clearest near-term signals.</p>

    <p class="sources"><strong>Sources:</strong> ${sourceLinks}</p>
  </div>

  <footer>
    <p>© 2026 SpaceX IPO Tracker · <a href="/">spacexipotracker.com</a> · Not affiliated with SpaceX</p>
  </footer>
</body>
</html>`;
}

function run() {
  if (!fs.existsSync(ANALYSIS_FILE)) {
    console.log('[generate-articles] No daily-analysis.json — skipping');
    return;
  }
  if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
  }

  let analyses;
  try { analyses = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8')); } catch (e) {
    console.error('[generate-articles] Failed to parse daily-analysis.json:', e.message);
    return;
  }

  let written = 0;
  for (const a of analyses) {
    const sl = slug(a);
    const outFile = path.join(ANALYSIS_DIR, `${sl}.html`);
    if (!fs.existsSync(outFile)) {
      try {
        fs.writeFileSync(outFile, buildArticleHTML(a));
        console.log(`[generate-articles] ✅ Written: ${sl}.html`);
        written++;
      } catch (e) {
        console.error(`[generate-articles] ❌ Failed ${sl}.html:`, e.message);
      }
    }
  }

  if (written === 0) {
    console.log('[generate-articles] All articles already exist — nothing to write');
  } else {
    console.log(`[generate-articles] Done — ${written} new article(s) written`);
  }
}

run();
