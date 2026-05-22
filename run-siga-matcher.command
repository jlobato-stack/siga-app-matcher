#!/bin/zsh
set -u

cd "$(dirname "$0")"

LOG_FILE="run-siga-matcher.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting SIGA matcher..."

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for the first run..."
    npm install || {
      echo "npm install failed. Check $LOG_FILE."
      read -r "_?Press Enter to close..."
      exit 1
    }
  fi

  node ./node_modules/vite/bin/vite.js &
  DEV_PID=$!
  sleep 5
  open "http://localhost:5173" >/dev/null 2>&1 || true
  wait $DEV_PID
elif command -v python3 >/dev/null 2>&1 && [ -f "dist/index.html" ]; then
  echo "Node.js not found. Starting static demo from dist/."
  STATIC_PORT="$(python3 - <<'PY'
import socket

for port in range(4173, 4190):
    sock = socket.socket()
    try:
        sock.bind(("127.0.0.1", port))
    except OSError:
        continue
    else:
        sock.close()
        print(port)
        break
PY
)"

  if [ -z "$STATIC_PORT" ]; then
    STATIC_PORT=4173
  fi

  echo "Serving demo on port $STATIC_PORT."
  python3 -m http.server "$STATIC_PORT" --directory dist &
  DEV_PID=$!
  sleep 2
  open "http://localhost:$STATIC_PORT" >/dev/null 2>&1 || true
  wait $DEV_PID
else
  echo "Node.js is not installed, and no dist build was found."
  echo "Install Node.js to run the live app, or build once and then use the static demo fallback."
  read -r "_?Press Enter to close..."
  exit 1
fi
