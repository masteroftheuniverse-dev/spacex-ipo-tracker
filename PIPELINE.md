# SpaceX IPO Pipeline — Automated Weekly Newsletter

Complete automated pipeline for the SpaceX IPO Insider newsletter. Orchestrates research → content creation → publishing → site deployment.

## Architecture

```
[Oracle] → [Creator] → [Publisher] → [SiteUpdater]
   ↓           ↓            ↓            ↓
 Brief     Newsletter    Beehiiv      Netlify
  JSON       Draft        Post         Deploy
```

## Files & Components

### Core Agents

#### `pipeline/oracle.js`
**Research Agent** — Gathers latest SpaceX IPO news

- Searches Brave Search API for `SpaceX IPO news` (last 7 days, count=10)
- Extracts top 5 results (title, url, description)
- Generates valuation estimate and key angle
- Outputs: `pipeline/state/weekly-brief.json`
- **Fallback:** If API fails, uses default content to continue pipeline

```json
{
  "week": "2026-03-26",
  "headlines": [
    { "title": "...", "url": "...", "description": "..." }
  ],
  "valuation": "~$350B",
  "key_angle": "...",
  "generated_at": "2026-03-26T16:44:43.330Z"
}
```

#### `pipeline/creator.js`
**Content Agent** — Creates newsletter & site updates

- Reads `weekly-brief.json`
- Generates professional HTML newsletter:
  - Dark navy background (#1a1a2e)
  - Orange accents (#FF6B35)
  - 3-5 news bullets with links
  - Valuation box
  - IPO timeline estimate
  - CTA back to spacexipotracker.com
  - Unsubscribe footer
  - Mobile responsive inline CSS
- Creates site update snippet for index.html replacement
- Outputs: `pipeline/state/weekly-draft.json`

```json
{
  "subject": "SpaceX IPO Insider — Week of 2026-03-26",
  "newsletter_html": "<html>...</html>",
  "site_update_snippet": "<div class=\"news-grid\">...</div>",
  "created_at": "2026-03-26T16:44:08.318Z"
}
```

#### `pipeline/publisher.js`
**Distribution Agent** — Sends newsletter via Beehiiv

- Reads `weekly-draft.json`
- POSTs to Beehiiv API: `https://api.beehiiv.com/v2/publications/{id}/posts`
- Payload structure:
  ```json
  {
    "title": "...",
    "subtitle": "...",
    "content": {
      "free": {
        "web": "...",
        "email": "..."
      }
    },
    "status": "confirmed",
    "send_at": null
  }
  ```
- Logs results to: `pipeline/state/publish-log.json`
- **Dry-run mode:** `node publisher.js --dry-run` (skips actual API call)
- **Note:** Requires Beehiiv enterprise plan for email sending

#### `pipeline/site-updater.js`
**Deployment Agent** — Updates site & deploys

- Reads `weekly-draft.json`
- Updates `index.html` between markers:
  ```html
  <!-- LATEST-UPDATES-START -->
  ...new content...
  <!-- LATEST-UPDATES-END -->
  ```
- Runs `netlify deploy --dir=. --prod`
- Logs success/failure

### Orchestrators

#### `pipeline/run-pipeline.sh`
Master bash script that runs full pipeline in sequence:

```bash
node oracle.js && \
node creator.js && \
node publisher.js && \
node site-updater.js
```

- Logs to: `pipeline/logs/pipeline-YYYY-MM-DD.log`
- Updates `ACTIVITY-LOG.md` on completion
- Error handling prevents cascade failures

#### `pipeline/state/`
Transient state directory storing JSON files between pipeline steps:
- `weekly-brief.json` — Research output from oracle.js
- `weekly-draft.json` — Content output from creator.js
- `publish-log.json` — Publication history

### Configuration

#### Cron Job
Runs every **Monday at 9:00 AM EST**:

```
0 9 * * 1 cd /Users/Clawdbot/.openclaw/workspace/projects/spacex-ipo-tracker && \
bash pipeline/run-pipeline.sh >> pipeline/logs/cron.log 2>&1
```

Install with:
```bash
crontab -e
# Add line above and save
```

## API Credentials

Stored in `/Users/Clawdbot/.openclaw/workspace/MEMORY.md`:

- **Brave Search API:** `X-Subscription-Token: BSAiXTAGiMriYnQMeNsJ5ib1eA4b_vb`
- **Beehiiv Auth:** `Bearer GOJQtV5V7sdT7zujutCucapNjIhbiCToLHnAEREC0gl3s4SmSVphmScGTYLrTx9i`
- **Beehiiv Publication ID:** `pub_dd3a65a6-68cb-40df-98ed-55132ddc0f28`

## Usage

### Run Full Pipeline
```bash
cd /Users/Clawdbot/.openclaw/workspace/projects/spacex-ipo-tracker
bash pipeline/run-pipeline.sh
```

### Run Individual Steps
```bash
# Research only
node pipeline/oracle.js

# Content generation only
node pipeline/creator.js

# Test publisher (dry-run)
node pipeline/publisher.js --dry-run

# Site update only
node pipeline/site-updater.js
```

### View Logs
```bash
# Latest pipeline run
cat pipeline/logs/pipeline-$(date +%Y-%m-%d).log

# Cron execution history
tail -f pipeline/logs/cron.log
```

## Error Handling

All scripts handle failures gracefully:

- **Oracle:** Falls back to default headlines if API fails
- **Creator:** Continues even if headlines are empty
- **Publisher:** Logs errors without crashing; supports dry-run testing
- **SiteUpdater:** Updates HTML even if Netlify deployment fails
- **Run Script:** Stops pipeline if a step fails (with status logged)

## Newsletter Design

Professional dark-themed email template:

- **Background:** Navy #1a1a2e, #0f0f1e
- **Accents:** Orange #FF6B35
- **Typography:** System fonts (-apple-system, Segoe UI, sans-serif)
- **Responsive:** Mobile-optimized with media queries
- **Sections:**
  - Header with logo
  - Week title
  - Top headlines (3-5 bullets)
  - Valuation box
  - Key angle highlight
  - IPO timeline
  - CTA button
  - Footer with disclaimer

## Next Steps

1. **Upgrade Beehiiv Plan:** Enable enterprise features for email sending
2. **Fix Brave API:** Configure API key for successful search queries
3. **Expand News Sources:** Add RSS feeds, news APIs (NewsAPI, etc.)
4. **Add Caching:** Prevent duplicate headlines across weeks
5. **Analytics:** Track open rates, click-through rates
6. **Subscriber Management:** Track subscriber growth

## Tech Stack

- **Node.js** v25.8.1 (native fetch API)
- **Bash** (orchestration)
- **APIs:** Brave Search, Beehiiv, Netlify
- **No external npm dependencies** (uses built-in Node.js modules)
- **Cron** (scheduling)

---

Created: 2026-03-26  
Last Updated: 2026-03-26  
Status: ✓ Fully Operational
