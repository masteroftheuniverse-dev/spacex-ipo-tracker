#!/usr/bin/env node
/**
 * feed-logger.js — Shared live feed logger for SpaceX IPO Pipeline
 * Appends events to /Users/Clawdbot/Projects/live-feed/feed.json
 * and /Users/Clawdbot/.openclaw/workspace/ACTIVITY-LOG.md
 */

const fs = require('fs');

const FEED_PATH = '/Users/Clawdbot/Projects/live-feed/feed.json';
const ACTIVITY_LOG = '/Users/Clawdbot/.openclaw/workspace/ACTIVITY-LOG.md';
const MAX_FEED_ENTRIES = 100;

const AGENT_MAP = {
  oracle:      { name: 'Oracle',      emoji: '🔮' },
  creator:     { name: 'Creator',     emoji: '🎨' },
  publisher:   { name: 'Publisher',   emoji: '📣' },
  persephone:  { name: 'Persephone',  emoji: '💃' },
};

function logToFeed(agent, type, msg, tokens = {}) {
  const now = new Date();
  const ts = now.toISOString().slice(0, 16).replace('T', ' ');

  // Write to feed.json
  try {
    let feed = [];
    if (fs.existsSync(FEED_PATH)) {
      try { feed = JSON.parse(fs.readFileSync(FEED_PATH, 'utf8')); } catch (e) {}
    }
    
    // Dedup: check last 5 entries for identical message
    const isDuplicate = feed.slice(0, 5).some(e => e.msg === msg && e.agent === agent);
    if (isDuplicate) return;
    
    const entry = { ts, agent, type, msg };
    if (tokens.tokensIn)  entry.tokensIn  = tokens.tokensIn;
    if (tokens.tokensOut) entry.tokensOut = tokens.tokensOut;
    feed.unshift(entry);
    
    // Trim to max entries
    if (feed.length > MAX_FEED_ENTRIES) feed.splice(MAX_FEED_ENTRIES);
    fs.writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2));
  } catch(e) {}

  // Write to ACTIVITY-LOG.md
  try {
    const ag = AGENT_MAP[agent] || { name: agent, emoji: '🤖' };
    const logLine = `[${ts}] ${ag.emoji} ${ag.name} | ${type.toUpperCase()} | ${msg}\n`;
    fs.appendFileSync(ACTIVITY_LOG, logLine);
  } catch(e) {}
}

module.exports = { logToFeed };
