#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd \"$PROJECT_DIR\"; npm run server"
    do script "cd \"$PROJECT_DIR\"; npm run dev"
end tell
EOF
