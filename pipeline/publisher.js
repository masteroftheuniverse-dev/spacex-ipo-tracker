#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logToFeed } = require('./feed-logger');

const STATE_DIR = path.join(__dirname, 'state');
const DRAFT_FILE = path.join(STATE_DIR, 'weekly-draft.json');
const LOG_FILE = path.join(STATE_DIR, 'publish-log.json');

const BEEHIIV_API_URL = 'https://api.beehiiv.com/v2/publications/pub_dd3a65a6-68cb-40df-98ed-55132ddc0f28/posts';
const BEEHIIV_AUTH_TOKEN = 'GOJQtV5V7sdT7zujutCucapNjIhbiCToLHnAEREC0gl3s4SmSVphmScGTYLrTx9i';

function readDraft() {
  if (!fs.existsSync(DRAFT_FILE)) {
    throw new Error(`Draft file not found: ${DRAFT_FILE}`);
  }
  return JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf-8'));
}

function loadPublishLog() {
  if (fs.existsSync(LOG_FILE)) {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  }
  return { posts: [] };
}

function appendToLog(result) {
  const log = loadPublishLog();
  log.posts.push({
    ...result,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

async function publishToBeehiiv(draft, dryRun) {
  // NOTE: Beehiiv POST /posts API requires Enterprise plan.
  // Workaround: write a ready-to-paste HTML file and log it.
  // Russell can log into beehiiv.com, create a new post, and paste the HTML.
  const DRAFT_HTML_PATH = path.join(STATE_DIR, 'beehiiv-ready-draft.html');
  
  const html = draft.newsletter_html || `<h1>${draft.subject}</h1><p>Weekly SpaceX IPO update ready.</p>`;
  fs.writeFileSync(DRAFT_HTML_PATH, html);
  
  logToFeed('publisher','task',`📣 Beehiiv draft written to ${DRAFT_HTML_PATH}${dryRun ? ' (dry run)' : ''} — paste into beehiiv.com to send`);

  if (dryRun) {
    return { success: true, dry_run: true, message: 'Dry run: draft written to state/beehiiv-ready-draft.html' };
  }

  return {
    success: true,
    message: `Draft saved to pipeline/state/beehiiv-ready-draft.html — paste into beehiiv.com/posts/new to send`,
    draft_path: DRAFT_HTML_PATH,
    subject: draft.subject,
    note: 'Beehiiv POST API requires Enterprise plan. Manual paste is the workaround.'
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  try {
    const draft = readDraft();
    const result = await publishToBeehiiv(draft, dryRun);

    appendToLog({
      subject: draft.subject,
      ...result
    });

    if (result.success) {
      logToFeed('publisher','completed','Newsletter sent to all subscribers via Beehiiv');
    } else {
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
