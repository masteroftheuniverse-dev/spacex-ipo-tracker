#!/usr/bin/env node
/**
 * SpaceX IPO Insider — Beehiiv Broadcast Script
 * Usage:
 *   node broadcast.js --preview          # Create draft only, don't send
 *   node broadcast.js --send             # Create draft + send to all subscribers
 *   node broadcast.js --topic "Title" --content "<p>HTML</p>" --preview
 *
 * Reads from newsletter/draft.json by default if no --topic/--content provided.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const BEEHIIV_API_KEY =
  process.env.BEEHIIV_API_KEY ||
  'GOJQtV5V7sdT7zujutCucapNjIhbiCToLHnAEREC0gl3s4SmSVphmScGTYLrTx9i';
const PUB_ID =
  process.env.BEEHIIV_PUB_ID || 'pub_dd3a65a6-68cb-40df-98ed-55132ddc0f28';
const DRAFT_FILE = path.join(__dirname, 'draft.json');

// ── CLI Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const isPreview = hasFlag('--preview');
const isSend = hasFlag('--send');

if (!isPreview && !isSend) {
  console.error('❌  Specify --preview or --send');
  process.exit(1);
}

// ── Load draft content ───────────────────────────────────────────────────────
let subject, subtitle, content_html;

const topicArg = getArg('--topic');
const contentArg = getArg('--content');

if (topicArg && contentArg) {
  subject = topicArg;
  subtitle = '';
  content_html = contentArg;
} else if (fs.existsSync(DRAFT_FILE)) {
  const draft = JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf8'));
  subject = draft.subject;
  subtitle = draft.subtitle || '';
  content_html = draft.content_html;
} else {
  console.error('❌  No --topic/--content provided and no draft.json found.');
  process.exit(1);
}

console.log(`\n📨  SpaceX IPO Insider — Broadcast`);
console.log(`    Subject  : ${subject}`);
console.log(`    Subtitle : ${subtitle}`);
console.log(`    Mode     : ${isPreview ? 'PREVIEW (draft only)' : 'SEND to all subscribers'}\n`);

// ── HTTP helper ──────────────────────────────────────────────────────────────
function beehiivRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.beehiiv.com',
      path: `/v2${endpoint}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Step 1: Create draft post
  console.log('⏳  Creating draft post on Beehiiv...');
  const createRes = await beehiivRequest(
    'POST',
    `/publications/${PUB_ID}/posts`,
    {
      title: subject,
      subtitle: subtitle || undefined,
      content_html,
      status: 'draft',
      platform: 'email',
    }
  );

  if (createRes.status !== 201 && createRes.status !== 200) {
    console.error('❌  Failed to create post:', JSON.stringify(createRes.body, null, 2));
    process.exit(1);
  }

  const postId = createRes.body?.data?.id;
  const postUrl = createRes.body?.data?.web_url;
  console.log(`✅  Draft created — ID: ${postId}`);
  if (postUrl) console.log(`    Preview URL: ${postUrl}`);

  if (isPreview) {
    console.log('\n🔍  Preview mode — draft created, NOT sent. Run with --send to publish.\n');
    return;
  }

  // Step 2: Send / publish
  console.log('\n⏳  Sending to all subscribers...');
  const sendRes = await beehiivRequest(
    'PATCH',
    `/publications/${PUB_ID}/posts/${postId}`,
    { status: 'confirmed' }
  );

  if (sendRes.status !== 200) {
    console.error('❌  Failed to send post:', JSON.stringify(sendRes.body, null, 2));
    process.exit(1);
  }

  console.log(`🚀  Sent! Post status: ${sendRes.body?.data?.status}`);
  console.log(`    Post ID: ${postId}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
