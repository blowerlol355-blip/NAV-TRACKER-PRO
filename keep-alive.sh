#!/bin/bash
while true; do
  cd /home/z/my-project
  bun run dev &
  SERVER_PID=$!
  echo "Server PID: $SERVER_PID started at $(date)"
  
  # Wait for server to respond
  for i in $(seq 1 15); do
    sleep 1
    if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
      echo "Server is responding at $(date)"
      break
    fi
  done
  
  # Monitor server - if it stops responding, kill and restart
  while true; do
    sleep 10
    if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
      echo "Server not responding at $(date), restarting..."
      kill $SERVER_PID 2>/dev/null
      wait $SERVER_PID 2>/dev/null
      break
    fi
  done
done
