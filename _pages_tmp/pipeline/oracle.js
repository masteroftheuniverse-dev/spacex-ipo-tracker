#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logToFeed } = require('./feed-logger');

const STATE_DIR = path.join(__dirname, 'state');
const BRIEF_FILE = path.join(STATE_DIR, 'weekly-brief.json');
const ANALYSIS_FILE = path.join(STATE_DIR, 'daily-analysis.json');

const BRAVE_API_KEY = 'BSAiXTAGiMriYnQMeNsJ5ib1eA4b_vb';
const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';
const BRAVE_CACHE_FILE = path.join(STATE_DIR, 'brave-cache.json');
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours

// Rotate queries daily for broad coverage
const QUERIES = [
  'SpaceX IPO news 2026',
  'Starlink IPO date announcement',
  'SpaceX valuation secondary market',
  'Elon Musk SpaceX public offering',
  'SpaceX SEC filing S-1 registration',
  'SpaceX Starship launch investment',
  'private space company IPO 2026'
];

function getCache() {
  if (fs.existsSync(BRAVE_CACHE_FILE)) {
    try { return JSON.parse(fs.readFileSync(BRAVE_CACHE_FILE, 'utf8')); } catch (e) {}
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(BRAVE_CACHE_FILE, JSON.stringify(cache));
}

function getCachedResults(query) {
  const cache = getCache();
  const entry = cache[query];
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_MAX_AGE) return null;
  return entry.results;
}

async function searchBrave(query, freshness = 'pd') {
  const cached = getCachedResults(query);
  if (cached) return cached;

  const params = new URLSearchParams({ q: query, count: '8', freshness });
  const url = `${BRAVE_API_URL}?${params}`;
  try {
    const res = await fetch(url, {
      headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.web?.results || []).slice(0, 5).map(r => ({
      title: r.title,
      url: r.url,
      description: r.description || '',
      source: new URL(r.url).hostname.replace('www.', '')
    }));
    
    // Cache the results
    const cache = getCache();
    cache[query] = { timestamp: Date.now(), results };
    saveCache(cache);
    
    return results;
  } catch (e) {
    return [];
  }
}

// Synthesize a plain-English analysis article from headlines
function synthesizeAnalysis(headlines, date) {
  if (!headlines.length) return null;

  const dateStr = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const titles = headlines.map(h => h.title.toLowerCase()).join(' ');

  // Detect topic angle
  let tag = 'IPO Watch';
  let angle = '';
  let body = '';

  if (titles.includes('starship') || titles.includes('launch') || titles.includes('rocket')) {
    tag = 'Launch & Tech';
    angle = 'Starship Progress and Its Impact on SpaceX IPO Timing';
    body = `SpaceX's Starship development remains one of the most watched indicators for IPO readiness. Each successful launch milestone strengthens the company's valuation story and signals to institutional investors that the business case for going public is maturing. Analysts closely watch Starship commercialization — once it begins generating launch revenue at scale, SpaceX's case for a public market listing becomes significantly stronger.`;
  } else if (titles.includes('starlink') || titles.includes('satellite')) {
    tag = 'Starlink IPO';
    angle = 'Starlink IPO: The Gateway to SpaceX Going Public';
    body = `Elon Musk has repeatedly stated that Starlink will IPO before SpaceX itself. Starlink's subscription revenue — currently serving millions of customers globally — provides the recurring revenue profile that public market investors favor. A Starlink IPO is expected to serve as both a valuation benchmark and a dry run for the larger SpaceX offering. Investors tracking the Starlink IPO timeline should watch for SEC filings that would precede any public offering by 3–6 months.`;
  } else if (titles.includes('valuation') || titles.includes('funding') || titles.includes('billion')) {
    tag = 'Valuation';
    angle = 'SpaceX Valuation Update — Reading the Secondary Market Signals';
    body = `Secondary market transactions in SpaceX shares are the closest thing retail investors have to real-time pricing data on the company before it goes public. When these transactions tick up in volume or price, it signals institutional conviction. SpaceX's current ~$350B valuation implies an IPO share price that would place it among the largest U.S. tech listings in history. For context, Meta IPO'd at ~$100B in 2012. The gap illustrates how much expectations have grown.`;
  } else if (titles.includes('faa') || titles.includes('regulat') || titles.includes('license')) {
    tag = 'Regulatory';
    angle = 'FAA Approvals and Regulatory Milestones — Why They Matter for IPO Timing';
    body = `Regulatory clearances from the FAA are a critical gating factor for SpaceX's launch cadence — and by extension, its path to IPO. Every approval unlocks additional launch revenue and reduces the risk profile that institutional IPO investors will scrutinize. Delays in FAA licensing have historically been a headwind for SpaceX's timeline projections. Investors should monitor regulatory milestones alongside financial indicators.`;
  } else {
    tag = 'IPO Watch';
    angle = 'SpaceX IPO Watch — Today\'s Key Developments';
    body = `Staying ahead of the SpaceX IPO requires tracking a wide range of signals: secondary market pricing, Elon Musk statements, SEC activity, launch milestones, and competitor moves. No single indicator predicts timing, but the convergence of multiple positive signals — rising valuation, Starlink revenue growth, and regulatory progress — is what typically precedes a major tech IPO filing.`;
  }

  // Build source citations
  const sources = headlines.slice(0, 4).map(h =>
    `<a href="${h.url}" target="_blank" rel="noopener">${h.source}</a>`
  ).join(' · ');

  const headlineLinks = headlines.slice(0, 3).map(h =>
    `<li><a href="${h.url}" target="_blank" rel="noopener">${h.title}</a> — ${h.description.slice(0, 100)}${h.description.length > 100 ? '...' : ''}</li>`
  ).join('\n                        ');

  return {
    date,
    dateStr,
    tag,
    angle,
    body,
    headlines: headlines.slice(0, 4),
    html: `
                <article class="analysis-item">
                    <div class="analysis-meta">
                        <span class="analysis-date">${dateStr}</span>
                        <span class="analysis-tag">${tag}</span>
                    </div>
                    <h3>${angle}</h3>
                    <p>${body}</p>
                    <div class="analysis-headlines">
                        <p class="analysis-headlines-label">📰 News driving this analysis:</p>
                        <ul>
                        ${headlineLinks}
                        </ul>
                    </div>
                    <p class="analysis-sources"><strong>Sources:</strong> ${sources}</p>
                </article>`
  };
}

function generateBrief(headlines) {
  const week = new Date().toISOString().split('T')[0];
  let keyAngle = 'Starlink IPO expected in 2026, followed by SpaceX IPO in Q4 2026';

  if (headlines.length > 0) {
    const titles = headlines.map(h => h.title).join(' | ');
    if (titles.includes('Starship')) keyAngle = 'SpaceX Starship progress accelerates IPO timeline expectations';
    else if (titles.includes('Starlink')) keyAngle = 'Starlink IPO paves way for SpaceX public markets entry';
    else if (titles.includes('valuation') || titles.includes('funding')) keyAngle = 'SpaceX valuation growth signals investor confidence ahead of IPO';
    else if (titles.includes('FAA') || titles.includes('regulat')) keyAngle = 'Regulatory progress supports SpaceX IPO timeline';
  }

  return {
    week,
    headlines: headlines.length > 0 ? headlines : [
      { title: 'SpaceX Continues Starship Development Progress', url: 'https://spacex.com', description: 'SpaceX makes progress on Starship development.', source: 'spacex.com' },
      { title: 'Starlink IPO Expected Before SpaceX Goes Public', url: 'https://spacex.com/starlink', description: 'Elon Musk reiterates Starlink will IPO first in 2026.', source: 'spacex.com' }
    ],
    valuation: '~$350B',
    key_angle: keyAngle,
    generated_at: new Date().toISOString()
  };
}

const ODDS_HISTORY_FILE = path.join(STATE_DIR, 'odds-history.json');

const KALSHI_MARKETS = [
  { ticker: 'KXIPOSPACEX-26JUN01', key: 'jun26_pct', label: 'Before Jun 2026' },
  { ticker: 'KXIPOSPACEX-26DEC01', key: 'dec26_pct', label: 'Before Dec 2026' },
  { ticker: 'KXIPOSPACEX-27JUN01', key: 'jun27_pct', label: 'Before Jun 2027' },
];

async function fetchKalshiPrice(ticker) {
  try {
    const url = `https://trading-api.kalshi.com/trade-api/v2/markets/${ticker}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SpaceXIPOTracker/1.0' }
    });
    if (!res.ok) {
      console.warn(`[Oracle] Kalshi ${res.status} for ${ticker}`);
      return null;
    }
    const data = await res.json();
    // yes_ask is the buy price (0-1 scale), multiply by 100 for percent
    const price = data.market?.yes_ask ?? data.market?.last_price ?? null;
    return price !== null ? Math.round(price * 100) : null;
  } catch (e) {
    console.warn(`[Oracle] Kalshi fetch error for ${ticker}: ${e.message}`);
    return null;
  }
}

async function updateOddsTracker() {
  try {
    // Fetch current prices
    const results = await Promise.all(KALSHI_MARKETS.map(m => fetchKalshiPrice(m.ticker)));

    // Build entry
    const entry = {
      date: new Date().toISOString().split('T')[0],
      jun26_pct: results[0],
      dec26_pct: results[1],
      jun27_pct: results[2],
    };

    // All null = API unavailable, skip write
    if (results.every(r => r === null)) return;

    // Load existing history
    let history = [];
    if (fs.existsSync(ODDS_HISTORY_FILE)) {
      try { history = JSON.parse(fs.readFileSync(ODDS_HISTORY_FILE, 'utf-8')); } catch (e) {}
    }

    // Remove duplicate for today if re-running
    history = history.filter(h => h.date !== entry.date);
    history.unshift(entry);
    history = history.slice(0, 12); // keep last 12 weeks

    fs.writeFileSync(ODDS_HISTORY_FILE, JSON.stringify(history));
  } catch (e) {}
}

async function main() {
  try {
    logToFeed('oracle', 'task', '🔍 Researching SpaceX IPO news...');

    // Run two queries: today's rotation + always a fresh "latest" query
    const dayIndex = Math.floor(Date.now() / 86400000) % QUERIES.length;
    const primaryQuery = QUERIES[dayIndex];
    const freshQuery = 'SpaceX IPO latest news today';

    const [primaryResults, freshResults] = await Promise.all([
      searchBrave(primaryQuery, 'pd'),
      searchBrave(freshQuery, 'pd')
    ]);

    // Deduplicate by URL
    const seen = new Set();
    const allHeadlines = [...primaryResults, ...freshResults].filter(h => {
      if (seen.has(h.url)) return false;
      seen.add(h.url);
      return true;
    }).slice(0, 8);

    // Generate weekly brief
    const brief = generateBrief(allHeadlines);
    fs.writeFileSync(BRIEF_FILE, JSON.stringify(brief));

    // Generate daily analysis article
    const today = new Date().toISOString().split('T')[0];
    const analysis = synthesizeAnalysis(allHeadlines, today);
    if (analysis) {
      // Load existing analyses, prepend today's, keep last 30
      let existing = [];
      if (fs.existsSync(ANALYSIS_FILE)) {
        try { existing = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8')); } catch (e) {}
      }
      // Only write if content changed
      const lastEntry = existing[0];
      const contentChanged = !lastEntry || lastEntry.angle !== analysis.angle || lastEntry.body !== analysis.body;
      
      if (contentChanged) {
        existing = existing.filter(a => a.date !== today);
        existing.unshift(analysis);
        existing = existing.slice(0, 30);
        fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(existing, null, 2)); // keep formatted for HTML strings
      }
    }

    logToFeed('oracle', 'completed', `Brief + analysis: ${allHeadlines.length} headlines, ${brief.valuation}`);

    // Update odds history
    await updateOddsTracker();
  } catch (error) {
    process.exit(1);
  }
}

main();
