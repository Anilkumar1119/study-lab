#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export AUTH_SECRET
AUTH_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
export AUTH_TRUST_HOST=true TEACHER_INVITE_CODE=local-smoke-teacher-token PGLITE_DIR=memory:// NEXT_TELEMETRY_DISABLED=1
unset ANTHROPIC_API_KEY AUTH_URL DATABASE_URL
node scripts/mock-claude.mjs &
mock_pid=$!
trap 'kill "$mock_pid" "${app_pid:-$mock_pid}" 2>/dev/null || true' EXIT
for mode in 0 1; do
  study_port=$((4176 + mode))
  if [[ "$mode" == 1 ]]; then
    export ANTHROPIC_API_KEY=mock ANTHROPIC_BASE_URL=http://127.0.0.1:4175
  fi
  node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port "$study_port" &
  app_pid=$!
  for attempt in {1..40}; do
    curl -fsS "http://localhost:$study_port/" >/dev/null 2>&1 && break
    sleep 0.25
  done
  SMOKE_AI="$mode" SMOKE_ORIGIN="http://localhost:$study_port" node scripts/smoke.mjs
  kill "$app_pid"
  wait "$app_pid" || true
done
