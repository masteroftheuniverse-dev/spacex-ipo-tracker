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
  logToFeed('publisher','task',`📣 Sending newsletter to Beehiiv subscribers${dryRun ? ' (dry run)' : ''}`);

  const payload = {
    title: draft.subject,
    subtitle: `SpaceX IPO weekly update from tracker`,
    content: {
      free: {
        web: draft.newsletter_html,
        email: draft.newsletter_html
      }
    },
    status: 'confirmed',
    send_at: null
  };

  if (dryRun) {
    return { success: true, dry_run: true, message: 'Dry run completed successfully' };
  }

  try {
    const response = await fetch(BEEHIIV_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BEEHIIV_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: data.errors ? data.errors[0]?.message : 'Unknown error'
      };
    }
    
    return {
      success: true,
      post_id: data.data?.id,
      message: 'Post published to Beehiiv'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
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
