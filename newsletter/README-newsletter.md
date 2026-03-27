# SpaceX IPO Insider — Newsletter System

Beehiiv-powered newsletter automation for [spacex-ipo-tracker.netlify.app](https://spacex-ipo-tracker.netlify.app).

---

## 📁 File Map

```
spacex-ipo-tracker/
├── netlify/
│   └── functions/
│       └── subscribe.js          ← Serverless subscriber intake (→ Beehiiv)
├── newsletter/
│   ├── broadcast.js              ← Send newsletter issues
│   ├── draft.json                ← Current issue draft
│   ├── welcome-email-template.html
│   └── README-newsletter.md      ← This file
├── netlify.toml                  ← Netlify function config
└── index.html                    ← Landing page (form updated)
```

---

## 🚀 Sending a Newsletter

### Step 1 — Preview (creates draft on Beehiiv, does NOT send)
```bash
cd /Users/Clawdbot/.openclaw/workspace/projects/spacex-ipo-tracker
node newsletter/broadcast.js --preview
```
Check the draft URL printed in the terminal. Review it in Beehiiv dashboard.

### Step 2 — Send to all subscribers
```bash
node newsletter/broadcast.js --send
```
This publishes the draft and delivers to all active subscribers.

### One-liner with custom content (skips draft.json)
```bash
node newsletter/broadcast.js --topic "SpaceX IPO Alert 🚨" --content "<p>Breaking news here.</p>" --send
```

---

## 📝 Writing a Custom Draft

Edit `newsletter/draft.json`:
```json
{
  "subject": "SpaceX IPO Insider #2 — Your Subject Here",
  "subtitle": "Optional subtitle shown in email preview",
  "content_html": "<p>Full HTML content of the newsletter.</p>"
}
```

- `subject` → Email subject line + post title  
- `subtitle` → Preview text (shown in inbox before open)  
- `content_html` → Full HTML body. Use inline CSS for email clients.

---

## 👥 Checking Subscriber Count

Via Beehiiv API (run in terminal):
```bash
curl -s -H "Authorization: Bearer GOJQtV5V7sdT7zujutCucapNjIhbiCToLHnAEREC0gl3s4SmSVphmScGTYLrTx9i" \
  "https://api.beehiiv.com/v2/publications/pub_dd3a65a6-68cb-40df-98ed-55132ddc0f28/subscriptions?limit=1" \
  | python3 -m json.tool | grep total_results
```

Or via Beehiiv dashboard: [app.beehiiv.com](https://app.beehiiv.com)

---

## ⚙️ Environment Variables (for production)

Set in Netlify dashboard → Site settings → Environment variables:

| Variable | Value |
|---|---|
| `BEEHIIV_API_KEY` | `GOJQtV5V7sd...` |
| `BEEHIIV_PUB_ID` | `pub_dd3a65a6-...` |

The API key is also hardcoded as fallback for local dev.

---

## 🔄 How the Subscribe Flow Works

1. User enters email on landing page
2. Form POSTs to `/.netlify/functions/subscribe`
3. Netlify function calls `POST https://api.beehiiv.com/v2/publications/{pub_id}/subscriptions`
4. Beehiiv sends welcome email automatically (`send_welcome_email: true`)
5. If Netlify function fails → silent fallback to Web3Forms (email notification only)

---

*Plebworm Syndicate*
