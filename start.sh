#!/usr/bin/env bash
# 啟動本機伺服器並用瀏覽器開啟 papergrid。按 Ctrl+C 結束。
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-8765}"
URL="http://127.0.0.1:$PORT/index.html"

open_browser() {
  if command -v brave-browser >/dev/null 2>&1; then brave-browser "$URL" >/dev/null 2>&1 &
  elif command -v google-chrome >/dev/null 2>&1; then google-chrome "$URL" >/dev/null 2>&1 &
  else xdg-open "$URL" >/dev/null 2>&1 &
  fi
}

# 伺服器已經在跑的話，直接開頁面
if python3 -c "import socket,sys; s=socket.socket(); sys.exit(0 if s.connect_ex(('127.0.0.1',$PORT))==0 else 1)"; then
  echo "伺服器已在執行：$URL"
  open_browser
  exit 0
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM
sleep 0.8
echo "papergrid：$URL （Ctrl+C 結束）"
open_browser
wait $PID
