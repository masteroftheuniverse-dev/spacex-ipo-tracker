#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { logToFeed } = require('./feed-logger');

const STATE_DIR = path.join(__dirname, 'state');
const ODDS_HISTORY_FILE = path.join(STATE_DIR, 'odds-history.json');
const DRAFT_FILE = path.join(STATE_DIR, 'weekly-draft.json');
const ANALYSIS_FILE = path.join(STATE_DIR, 'daily-analysis.json');
const PROJECT_ROOT = path.dirname(__dirname);
const INDEX_FILE = path.join(PROJECT_ROOT, 'index.html');

function readDraft() {
  if (!fs.existsSync(DRAFT_FILE)) {
    throw new Error(`Draft file not found: ${DRAFT_FILE}`);
  }
  return JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf-8'));
}

function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function deployToNetlify(htmlChanged) {
  if (!htmlChanged) {
    return { success: true, message: 'No changes — deployment skipped', deployed: false };
  }

  logToFeed('persephone','task','🚀 Deploying updated spacexipotracker.com...');
  
  try {
    // Deploy via wrangler (direct, bypasses git auto-deploy which is broken)
    execSync(`cd ${PROJECT_ROOT} && git add -A && git diff --cached --quiet || git commit -m "Auto-deploy: pipeline update $(date +%Y-%m-%d)" && git push origin main && CLOUDFLARE_API_TOKEN=cfut_T34WybWPWiZfErXzkYYbT3XIU8C1hGw3L36gXko895917adf npx wrangler pages deploy . --project-name spacex-ipo-tracker`, {
      stdio: 'inherit',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    });

    logToFeed('persephone','completed','✅ spacexipotracker.com updated and live (Cloudflare Pages)');
    return { success: true, message: 'Pushed to GitHub → Cloudflare Pages', deployed: true };
  } catch (error) {
    return { success: false, message: `Deployment failed: ${error.message}`, deployed: false };
  }
}

function updateOddsSection(indexContent) {
  if (!fs.existsSync(ODDS_HISTORY_FILE)) return indexContent;

  let history;
  try { history = JSON.parse(fs.readFileSync(ODDS_HISTORY_FILE, 'utf-8')); } catch (e) { return indexContent; }
  if (!history.length) return indexContent;

  const latest = history[0];
  const prev = history[1] || null;

  const MARKET_LABELS = {
    jun26_pct: { ticker: 'KXIPOSPACEX-26JUN01', label: 'Before Jun 2026' },
    dec26_pct: { ticker: 'KXIPOSPACEX-26DEC01', label: 'Before Dec 2026' },
    jun27_pct: { ticker: 'KXIPOSPACEX-27JUN01', label: 'Before Jun 2027' },
  };

  const dateObj = new Date(latest.date + 'T12:00:00Z');
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const rows = ['jun26_pct', 'dec26_pct', 'jun27_pct'].map((key, i) => {
    const curr = latest[key];
    const last = prev ? prev[key] : null;
    const diff = (curr !== null && last !== null) ? curr - last : null;
    const isLast = i === 2;

    let changeCell = '<td style="padding:12px 16px; color:#888; font-weight:600;">—</td>';
    if (diff !== null) {
      const color = diff > 0 ? '#30d158' : diff < 0 ? '#ff6b6b' : '#888';
      const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '→';
      const sign = diff > 0 ? '+' : '';
      changeCell = `<td style="padding:12px 16px; color:${color}; font-weight:600;">${sign}${diff}% ${arrow}</td>`;
    }

    return `                        <tr${isLast ? '' : ' style="border-bottom:1px solid rgba(255,255,255,0.06);"'}>
                            <td style="padding:12px 16px; color:#aaa;">${dateStr}</td>
                            <td style="padding:12px 16px; color:#eee; font-size:13px;">${MARKET_LABELS[key].ticker}<br><span style="color:#888; font-size:12px;">${MARKET_LABELS[key].label}</span></td>
                            <td style="padding:12px 16px; color:#eee; font-weight:600;">${curr !== null ? curr + '%' : '—'}</td>
                            <td style="padding:12px 16px; color:#aaa;">${last !== null ? last + '%' : '—'}</td>
                            ${changeCell}
                        </tr>`;
  }).join('\n');

  const startMarker = '<!-- IPO-ODDS-TRACKER-START -->';
  const endMarker = '<!-- IPO-ODDS-TRACKER-END -->';
  const startIdx = indexContent.indexOf(startMarker);
  const endIdx = indexContent.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) return indexContent;

  return indexContent.substring(0, startIdx + startMarker.length) +
    '\n' + rows + '\n' +
    indexContent.substring(endIdx);
}

function updateAnalysisSection(indexContent) {
  if (!fs.existsSync(ANALYSIS_FILE)) return indexContent;

  let analyses;
  try { analyses = JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf-8')); } catch (e) { return indexContent; }

  if (!analyses.length) return indexContent;

  const imageMap = {
    'Valuation': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
    'Starlink IPO': 'https://images.unsplash.com/photo-1457364887197-9150188c107b?w=600&q=80',
    'Launch & Tech': 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=600&q=80'
  };

  const cardHTML = analyses.slice(0, 5).map(a => {
    const slug = `${a.date}-${a.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const imageUrl = imageMap[a.tag] || imageMap['Valuation'];
    const paragraphs = a.html.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
    const excerpt = paragraphs.slice(0, 2)
      .map(p => p.replace(/<[^>]+>/g, ''))
      .join(' ')
      .substring(0, 150) + '...';

    return `<article class="analysis-card">
                    <img src="${imageUrl}" alt="${a.angle}" class="analysis-card-image">
                    <div class="analysis-card-content">
                        <span class="analysis-card-date">${a.dateStr}</span>
                        <span class="analysis-card-tag">${a.tag}</span>
                        <h3>${a.angle}</h3>
                        <p class="analysis-card-excerpt">${excerpt}</p>
                        <a href="/analysis/${slug}.html" class="analysis-card-link">Read Analysis →</a>
                    </div>
                </article>`;
  }).join('\n');

  const startMarker = '<!-- NEWS-CARDS-START -->';
  const endMarker = '<!-- NEWS-CARDS-END -->';
  const startIdx = indexContent.indexOf(startMarker);
  const endIdx = indexContent.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) return indexContent;

  return indexContent.substring(0, startIdx + startMarker.length) +
    '\n            <div class="news-cards-grid">\n' + cardHTML + '\n            </div>\n            ' +
    indexContent.substring(endIdx);
}

async function main() {
  try {
    const startTime = Date.now();

    // Generate any missing /analysis/*.html pages first
    require('./generate-articles');

    const draft = readDraft();
    
    // Read index.html ONCE
    if (!fs.existsSync(INDEX_FILE)) {
      throw new Error(`Index file not found: ${INDEX_FILE}`);
    }
    let content = fs.readFileSync(INDEX_FILE, 'utf-8');
    const originalHash = hashContent(content);
    
    // Apply all transformations in memory
    const startMarker = '<!-- LATEST-UPDATES-START -->';
    const endMarker = '<!-- LATEST-UPDATES-END -->';
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    
    if (startIdx !== -1 && endIdx !== -1) {
      content = content.substring(0, startIdx + startMarker.length) + 
        '\n            ' + draft.site_update_snippet + '\n            ' +
        content.substring(endIdx);
    }
    
    // Apply analysis and odds sections
    content = updateAnalysisSection(content);
    content = updateOddsSection(content);
    
    const newHash = hashContent(content);
    const htmlChanged = originalHash !== newHash;
    
    // Write once
    if (htmlChanged) {
      fs.writeFileSync(INDEX_FILE, content);
    }
    
    const deployResult = deployToNetlify(htmlChanged);
    const elapsed = Date.now() - startTime;
    
    logToFeed('persephone', 'completed', `✓ Site updated${htmlChanged ? ' + deployed' : ''} (${elapsed}ms)`);
  } catch (error) {
    process.exit(1);
  }
}

main();
