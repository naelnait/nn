#!/usr/bin/env bash
# Verification loop: typecheck -> unit tests -> build for both apps, run
# before opening a PR or cutting a release. E2E is a separate, slower phase
# (needs both dev servers up) — opt in with --e2e.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
step() { echo; echo "==> $1"; }

step "Backend: typecheck"
(cd "$ROOT/backend" && npm run typecheck)

step "Backend: unit tests"
(cd "$ROOT/backend" && npm test)

step "Backend: build"
(cd "$ROOT/backend" && npm run build)

step "Frontend: typecheck"
(cd "$ROOT/frontend" && npm run typecheck)

step "Frontend: build"
(cd "$ROOT/frontend" && npm run build)

if [[ "${1:-}" == "--e2e" ]]; then
  step "Frontend: e2e (Playwright — starts its own backend + preview servers)"
  (cd "$ROOT/frontend" && npm run test:e2e)
fi

step "All checks passed"
