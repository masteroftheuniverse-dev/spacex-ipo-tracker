#!/bin/bash

# SpaceX IPO Pipeline Orchestrator
set -e

# Ensure node is in PATH for cron environments
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIPELINE_DIR="$PROJECT_DIR/pipeline"
LOGS_DIR="$PIPELINE_DIR/logs"
LOG_FILE="$LOGS_DIR/pipeline-$(date +%Y-%m-%d).log"

mkdir -p "$LOGS_DIR"

START=$(date +%s)
echo "🚀 Pipeline started: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"

node "$PIPELINE_DIR/oracle.js" 2>&1 | tee -a "$LOG_FILE" || { echo "❌ oracle.js failed" | tee -a "$LOG_FILE"; exit 1; }
node "$PIPELINE_DIR/creator.js" 2>&1 | tee -a "$LOG_FILE" || { echo "❌ creator.js failed" | tee -a "$LOG_FILE"; exit 1; }
node "$PIPELINE_DIR/publisher.js" 2>&1 | tee -a "$LOG_FILE" || { echo "❌ publisher.js failed" | tee -a "$LOG_FILE"; exit 1; }
node "$PIPELINE_DIR/site-updater.js" 2>&1 | tee -a "$LOG_FILE" || { echo "❌ site-updater.js failed" | tee -a "$LOG_FILE"; exit 1; }

END=$(date +%s)
DURATION=$((END - START))
echo "✓ Pipeline complete in ${DURATION}s: $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
