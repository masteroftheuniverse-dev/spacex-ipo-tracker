#!/usr/bin/env node
/**
 * SEC S-1 Filing Monitor
 * Checks SEC EDGAR hourly for any SpaceX S-1 or S-1/A filing.
 * If found → immediately triggers emergency Beehiiv broadcast.
 */

const fs = require('fs');
const path = require('path');
const { logToFeed } = require('./feed-logger');

const STATE_DIR = path.join(__dirname, 'state');
const ALERT_FLAG = path.join(STATE_DIR, 'sec-alert-fired.json');
const STARTUP_FLAG = path.join(STATE_DIR, 'sec-started.json');
const WORKSPACE = path.join(__dirname, '../../..');
const LOG_FILE = path.join(STATE_DIR, 'sec-monitor.log');

// SEC EDGAR full-text search for SpaceX S-1 filings
const SEC_URL = 'https://efts.sec.gov/LATEST/search-index?q=%22SpaceX%22&dateRange=custom&startdt=2026-01-01&forms=S-1,S-1%2FA';
const SEC_RSS  = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=spacex&type=S-1&dateb=&owner=include&count=10&output=atom';

function rotateLog() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stat = fs.statSync(LOG_FILE);
      if (stat.size > 50 * 1024) { // 50KB
        const lines = fs.readFileSync(LOG_FILE, 'utf8').split('\n');
        const keep = lines.slice(-20);
        fs.writeFileSync(LOG_FILE, keep.join('\n'));
      }
    }
  } catch (e) {}
}

function appendLog(msg) {
  rotateLog();
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
}

async function checkSECFilings() {
  try {
    // Check if alert already fired
    if (fs.existsSync(ALERT_FLAG)) {
      return { alreadyFired: true };
    }

    // Query SEC EDGAR full-text search
    const res = await fetch(SEC_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SpaceXIPOTracker contact@spacexipotracker.com' }
    });

    if (!res.ok) {
      appendLog(`SEC API error: ${res.status}`);
      return { found: false };
    }

    const data = await res.json();
    const hits = data.hits?.hits || [];

    // Look for actual SpaceX S-1 (not just mentions of SpaceX in other filings)
    const spacexFiling = hits.find(h => {
      const entity = (h._source?.entity_name || '').toLowerCase();
      const formType = h._source?.file_type || '';
      return (entity.includes('spacex') || entity.includes('space exploration')) &&
             (formType === 'S-1' || formType === 'S-1/A');
    });

    if (spacexFiling) {
      appendLog(`🚨 SPACEX S-1 FOUND: ${spacexFiling._source?.entity_name}`);
      logToFeed('persephone', 'alert', '🚨 SpaceX S-1 filing detected on SEC EDGAR!');

      // Save alert flag (compact)
      fs.writeFileSync(ALERT_FLAG, JSON.stringify({
        date: new Date().toISOString(),
        filing: spacexFiling._source?.file_type,
        entity: spacexFiling._source?.entity_name,
        accession: spacexFiling._source?.accession_no
      }));

      // Log to ACTIVITY-LOG
      const activityLog = path.join(WORKSPACE, 'ACTIVITY-LOG.md');
      try {
        fs.appendFileSync(activityLog,
          `[${new Date().toISOString().slice(0,16).replace('T',' ')}] Persephone | CRITICAL ALERT | 🚨 SpaceX S-1 filing detected on SEC EDGAR — emergency newsletter broadcast triggered!\n`
        );
      } catch(e) {}

      return { found: true, filing: spacexFiling };
    }

    return { found: false };

  } catch (err) {
    appendLog(`Error: ${err.message}`);
    return { found: false, error: err.message };
  }
}

async function triggerEmergencyBroadcast(filing) {
  try {
    const publisher = require('./publisher.js');
    // Publisher will detect the alert flag and send emergency broadcast
  } catch(e) {
    appendLog(`Publisher trigger failed: ${e.message}`);
  }
}

async function runLoop() {
  // Log startup once
  const started = !fs.existsSync(STARTUP_FLAG);
  if (started) {
    appendLog('[SEC Monitor] Started. Polling every 60s.');
    fs.writeFileSync(STARTUP_FLAG, '1');
  }

  while (true) {
    try {
      const result = await checkSECFilings();
      if (result.found) {
        await triggerEmergencyBroadcast(result.filing);
        appendLog('🚨 EMERGENCY BROADCAST TRIGGERED — exiting watch loop');
        process.exit(2);
      }
      if (result.alreadyFired) {
        appendLog('Alert already fired — shutting down monitor');
        process.exit(0);
      }
    } catch (err) {
      appendLog(`Loop error: ${err.message}`);
    }
    // Wait 60 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  }
}

// Single-run mode (for cron/testing): node sec-monitor.js --once
if (process.argv.includes('--once')) {
  // Single-check mode — launchctl StartInterval fires this every 60s
checkSECFilings().then(r => {
  if (r.found) {
    appendLog('🚨 FOUND');
    triggerEmergencyBroadcast(r.filing).then(() => process.exit(2));
  } else {
    process.exit(0);
  }
});
} // end if
