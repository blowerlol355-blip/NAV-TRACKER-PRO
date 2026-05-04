#!/bin/bash
# NavTrack Pro - Robust dev server auto-restart script
# This script keeps the Next.js dev server running by detecting when it dies
# and automatically restarting it.

LOG="/home/z/my-project/dev.log"
cd /home/z/my-project

echo "[$(date)] Auto-restart daemon started" >> "$LOG"

while true; do
  # Kill any leftover server
  OLD_PID=$(lsof -t -i:3000 2>/dev/null)
  if [ -n "$OLD_PID" ]; then
    kill $OLD_PID 2>/dev/null
    sleep 2
  fi

  # Start server
  npx next dev -p 3000 >> "$LOG" 2>&1 &
  SERVER_PID=$!
  echo "[$(date)] Started server PID=$SERVER_PID" >> "$LOG"

  # Wait for server to be ready (up to 30s)
  for i in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
      echo "[$(date)] Server ready" >> "$LOG"
      break
    fi
    sleep 1
  done

  # Monitor the server - detect when it dies
  while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "[$(date)] Server PID=$SERVER_PID died" >> "$LOG"
      break
    fi
    
    # Also check if it responds to HTTP
    if ! curl -s -o /dev/null -m 5 http://localhost:3000 2>/dev/null; then
      # Server might be hung - check if process still exists
      if kill -0 $SERVER_PID 2>/dev/null; then
        echo "[$(date)] Server hung (not responding), killing PID=$SERVER_PID" >> "$LOG"
        kill $SERVER_PID 2>/dev/null
        sleep 2
        kill -9 $SERVER_PID 2>/dev/null
        break
      fi
    fi
    
    sleep 5
  done

  echo "[$(date)] Restarting in 3 seconds..." >> "$LOG"
  sleep 3
done
