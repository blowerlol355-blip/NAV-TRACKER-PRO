#!/bin/bash
# NavTrack Pro - Dev Server Auto-Restart Script
# This script keeps the Next.js dev server running by auto-restarting when it crashes.

LOG_FILE="/home/z/my-project/dev.log"
PORT=3000
MAX_RESTARTS=50
RESTART_COUNT=0

cd /home/z/my-project

echo "[$(date)] Auto-restart script started" >> "$LOG_FILE"

while [ $RESTART_COUNT -lt $MAX_RESTARTS ]; do
  # Kill any existing server on port 3000
  PID=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PID" ]; then
    kill $PID 2>/dev/null
    sleep 2
  fi

  echo "[$(date)] Starting Next.js dev server (attempt $((RESTART_COUNT+1)))..." >> "$LOG_FILE"
  
  # Start the server
  npx next dev -p $PORT >> "$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to be ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:$PORT 2>/dev/null; then
      echo "[$(date)] Server ready (PID: $SERVER_PID)" >> "$LOG_FILE"
      break
    fi
    sleep 1
  done
  
  # Monitor server - wait for it to die
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 3
  done
  
  RESTART_COUNT=$((RESTART_COUNT+1))
  echo "[$(date)] Server died (PID: $SERVER_PID), restarting in 3s..." >> "$LOG_FILE"
  sleep 3
done

echo "[$(date)] Max restarts reached. Exiting." >> "$LOG_FILE"
