#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_OUT="$ROOT_DIR/apps/web/out"
API_ENV="$ROOT_DIR/apps/api/.env"
CADDYFILE="$ROOT_DIR/Caddyfile.local"
RUNTIME_DIR="$ROOT_DIR/.local/run"
CADDY_LOG="$RUNTIME_DIR/caddy.log"
NGROK_LOG="$RUNTIME_DIR/ngrok.log"
CADDY_PORT="${CADDY_PORT:-8080}"
API_PORT="${PORT:-4000}"
NGROK_API="${NGROK_API:-http://127.0.0.1:4040/api/tunnels}"

mkdir -p "$RUNTIME_DIR"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Erro: comando '$1' nao encontrado."
    echo "Instale '$1' e rode este script novamente."
    exit 1
  fi
}

cleanup() {
  echo
  echo "Encerrando Caddy e ngrok..."
  if [[ -n "${NGROK_PID:-}" ]] && kill -0 "$NGROK_PID" >/dev/null 2>&1; then
    kill "$NGROK_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${CADDY_PID:-}" ]] && kill -0 "$CADDY_PID" >/dev/null 2>&1; then
    kill "$CADDY_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

require_command caddy
require_command ngrok
require_command curl
require_command node

cd "$ROOT_DIR"

if [[ ! -f "$API_ENV" ]]; then
  echo "Erro: $API_ENV nao existe."
  echo "Crie o apps/api/.env antes de publicar."
  exit 1
fi

if [[ ! -f "$CADDYFILE" ]]; then
  echo "Erro: $CADDYFILE nao existe."
  exit 1
fi

if [[ ! -d "$WEB_OUT" || "${1:-}" == "--build" ]]; then
  echo "Build do frontend nao encontrado ou build solicitado. Gerando apps/web/out..."
  npm run build --workspace apps/web
fi

: > "$CADDY_LOG"
: > "$NGROK_LOG"

echo "Subindo Caddy local em http://127.0.0.1:$CADDY_PORT ..."
caddy run --config "$CADDYFILE" >"$CADDY_LOG" 2>&1 &
CADDY_PID=$!

sleep 1
if ! kill -0 "$CADDY_PID" >/dev/null 2>&1; then
  echo "Erro: Caddy nao subiu. Log:"
  sed -n '1,120p' "$CADDY_LOG"
  exit 1
fi

echo "Subindo ngrok para http://127.0.0.1:$CADDY_PORT ..."
ngrok http "$CADDY_PORT" --log=stdout >"$NGROK_LOG" 2>&1 &
NGROK_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 30); do
  if ! kill -0 "$NGROK_PID" >/dev/null 2>&1; then
    echo "Erro: ngrok nao subiu. Log:"
    sed -n '1,160p' "$NGROK_LOG"
    exit 1
  fi

  PUBLIC_URL="$(curl -fsS "$NGROK_API" 2>/dev/null | node -e '
let input = "";
process.stdin.on("data", (chunk) => input += chunk);
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const tunnel = (data.tunnels || []).find((item) => item.public_url && item.public_url.startsWith("https://"));
    if (tunnel) process.stdout.write(tunnel.public_url);
  } catch (_) {}
});
' || true)"

  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "Erro: nao consegui obter a URL HTTPS do ngrok."
  echo "Log do ngrok:"
  sed -n '1,180p' "$NGROK_LOG"
  exit 1
fi

node - "$API_ENV" "$PUBLIC_URL" <<'NODE'
const fs = require("fs");
const [envPath, publicUrl] = process.argv.slice(2);
let content = fs.readFileSync(envPath, "utf8");
if (/^WEB_ORIGIN=/m.test(content)) {
  content = content.replace(/^WEB_ORIGIN=.*$/m, `WEB_ORIGIN=${publicUrl}`);
} else {
  content += `${content.endsWith("\n") ? "" : "\n"}WEB_ORIGIN=${publicUrl}\n`;
}
fs.writeFileSync(envPath, content);
NODE

echo
echo "Publicacao local pronta."
echo
echo "URL externa:"
echo "$PUBLIC_URL"
echo
echo "WEB_ORIGIN atualizado em:"
echo "$API_ENV"
echo
echo "Agora suba a API manualmente em outro terminal:"
echo "NODE_ENV=production npm run start --workspace apps/api"
echo
echo "Depois teste:"
echo "curl -I $PUBLIC_URL/"
echo "curl -I $PUBLIC_URL/api/health"
echo
echo "Logs:"
echo "Caddy: $CADDY_LOG"
echo "ngrok: $NGROK_LOG"
echo
echo "Pressione Ctrl+C aqui para encerrar Caddy e ngrok."

tail -n +1 -f "$CADDY_LOG" "$NGROK_LOG" &
TAIL_PID=$!
wait "$CADDY_PID" "$NGROK_PID"
kill "$TAIL_PID" >/dev/null 2>&1 || true
