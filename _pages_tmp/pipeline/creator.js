#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logToFeed } = require('./feed-logger');

const STATE_DIR = path.join(__dirname, 'state');
const BRIEF_FILE = path.join(STATE_DIR, 'weekly-brief.json');
const DRAFT_FILE = path.join(STATE_DIR, 'weekly-draft.json');

function readBrief() {
  if (!fs.existsSync(BRIEF_FILE)) {
    throw new Error(`Brief file not found: ${BRIEF_FILE}`);
  }
  return JSON.parse(fs.readFileSync(BRIEF_FILE, 'utf-8'));
}

function generateNewsletterHTML(brief) {
  logToFeed('creator','task','✍️ Writing SpaceX IPO newsletter issue...');

  const headlines = brief.headlines || [];
  const bulletPoints = headlines
    .slice(0, 5)
    .map(h => `
      <div style="margin-bottom: 16px; padding: 12px; border-left: 4px solid #FF6B35; background-color: #1a1a2e;">
        <h4 style="color: #FF6B35; margin: 0 0 8px 0; font-size: 16px;">${h.title}</h4>
        <p style="color: #c0c0c0; margin: 0 0 8px 0; font-size: 14px; line-height: 1.5;">${h.description}</p>
        <a href="${h.url}" style="color: #FF6B35; text-decoration: none; font-weight: 600; font-size: 13px;">Read more →</a>
      </div>
    `)
    .join('');

  const newsletter = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background-color: #0f0f1e;
      color: #e0e0e0;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1a1a2e;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #FF6B35;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 28px;
      margin: 0;
      color: #FF6B35;
    }
    h2 {
      color: #ffffff;
      font-size: 24px;
      margin: 20px 0;
      line-height: 1.3;
    }
    p {
      color: #c0c0c0;
      line-height: 1.6;
      font-size: 15px;
    }
    .highlights {
      margin: 30px 0;
      padding: 20px;
      background-color: #16213e;
      border-radius: 8px;
    }
    .valuation-box {
      background-color: #0f3460;
      border-left: 4px solid #FF6B35;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .valuation-box h4 {
      color: #FF6B35;
      margin: 0 0 8px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .valuation-number {
      font-size: 32px;
      font-weight: bold;
      color: #FF6B35;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #FF6B35;
      color: #1a1a2e;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #ff8c5a;
    }
    .footer {
      border-top: 1px solid #333;
      margin-top: 40px;
      padding-top: 20px;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    .footer a {
      color: #FF6B35;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .container {
        padding: 20px 15px;
      }
      h2 {
        font-size: 20px;
      }
      .valuation-number {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p style="margin: 0; font-size: 12px; color: #FF6B35; text-transform: uppercase; letter-spacing: 1px;">SpaceX IPO Insider</p>
      <h1 class="logo">🚀</h1>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #c0c0c0;">Weekly IPO Tracker Report</p>
    </div>

    <h2>SpaceX IPO Week of ${brief.week}</h2>

    <p>Welcome to this week's SpaceX IPO Insider report. Below are the latest developments in SpaceX's journey toward going public.</p>

    <div class="highlights">
      <h3 style="color: #FF6B35; margin: 0 0 20px 0; font-size: 18px;">📰 Top Headlines</h3>
      ${bulletPoints}
    </div>

    <div class="valuation-box">
      <h4>Current Valuation</h4>
      <div class="valuation-number">${brief.valuation}</div>
      <p style="margin: 0; font-size: 13px;">Based on latest secondary market transactions and investor rounds.</p>
    </div>

    <div style="background-color: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="color: #FF6B35; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Key Angle</h4>
      <p style="margin: 0; font-size: 15px; color: #e0e0e0;">${brief.key_angle}</p>
    </div>

    <div style="background-color: #0f3460; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4 style="color: #FF6B35; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">IPO Timeline</h4>
      <p style="margin: 0; font-size: 15px; color: #e0e0e0;">SpaceX is expected to go public in <strong>Q4 2026</strong>. Starlink IPO expected to precede SpaceX by 6-12 months. SEC filing anticipated Q2-Q3 2026.</p>
    </div>

    <p style="text-align: center;">
      <a href="https://spacex-ipo-tracker.com" class="cta-button">View Full Tracker →</a>
    </p>

    <div class="footer">
      <p style="margin: 0 0 12px 0;">
        You're receiving this because you subscribed to SpaceX IPO Insider newsletter.
      </p>
      <p style="margin: 0;">
        <a href="https://spacex-ipo-tracker.com">spacex-ipo-tracker.com</a> | 
        <a href="#unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #666;">
        ⚠️ Disclaimer: This is informational content only. Not financial advice. Always consult with a financial advisor before investing.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return newsletter;
}

function generateSiteSnippet(brief) {
  const headlines = brief.headlines || [];
  const newsItems = headlines
    .slice(0, 4)
    .map(h => `
                <article class="news-item">
                    <h3>${h.title}</h3>
                    <p><a href="${h.url}" target="_blank" rel="noopener">${h.description}</a></p>
                </article>`)
    .join('\n');

  const snippet = `<div class="news-grid">
${newsItems}
                <article class="news-item">
                    <h3>SpaceX IPO Valuation Update</h3>
                    <p><strong>${brief.week}:</strong> Current valuation estimated at <strong>${brief.valuation}</strong>. ${brief.key_angle}</p>
                </article>
            </div>`;

  return snippet;
}

function main() {
  try {
    const brief = readBrief();
    const newsletter = generateNewsletterHTML(brief);
    const snippet = generateSiteSnippet(brief);

    const draft = {
      subject: `SpaceX IPO Insider — Week of ${brief.week}`,
      newsletter_html: newsletter,
      site_update_snippet: snippet,
      created_at: new Date().toISOString()
    };

    fs.writeFileSync(DRAFT_FILE, JSON.stringify(draft, null, 2));
    logToFeed('creator','completed','Newsletter draft ready — subject: ' + draft.subject);
  } catch (error) {
    process.exit(1);
  }
}

main();
