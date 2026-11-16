#!/usr/bin/env bash
# Teste supabase/schema.sql sur un PostgreSQL local jetable (nécessite PostgreSQL 15+).
set -euo pipefail
cd "$(dirname "$0")"
BIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
BIN=${PG_BIN:-$BIN}
WORK=$(mktemp -d)
RUN=()
if [ "$(id -u)" = 0 ]; then chown postgres "$WORK"; RUN=(runuser -u postgres --); fi
cleanup() { "${RUN[@]}" "$BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
"${RUN[@]}" "$BIN/initdb" -D "$WORK/data" -A trust -U postgres -E UTF8 --locale=C.UTF-8 >/dev/null
"${RUN[@]}" "$BIN/pg_ctl" -D "$WORK/data" -o "-k $WORK -p 54329 -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null
export PGOPTIONS="-c client_min_messages=warning"
PSQL=("${RUN[@]}" env PGOPTIONS="$PGOPTIONS" psql -h "$WORK" -p 54329 -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
cat stubs.sql ../schema.sql ../vehicle_catalog.sql | "${PSQL[@]}" >/dev/null
# Deuxième passage : le schéma doit être ré-exécutable sans erreur.
"${PSQL[@]}" >/dev/null < ../schema.sql
"${PSQL[@]}" -t < tests.sql | grep -v "^\s*$"
echo "Tests base de données : OK"
