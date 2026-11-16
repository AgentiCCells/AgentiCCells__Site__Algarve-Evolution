#!/usr/bin/env bash
# Install and start the AE Innovation Hub's local Odoo 19 Community, idempotently.
# Safe to run again at any time: each step checks what is already there.
#
#   scripts/odoo/setup-local.sh            install what is missing, seed if the hub is empty, start Odoo
#   scripts/odoo/setup-local.sh --seed     also re-run the seed (updates records in place)
#   scripts/odoo/setup-local.sh --update   also upgrade the algarve_innovation_hub addon (after editing it)
#   scripts/odoo/setup-local.sh --export   also export the feeds and check them
#   scripts/odoo/setup-local.sh --stop     stop the local Odoo and exit
#
# Settings (environment): ODOO_HOME (/opt/odoo19), ODOO_NIGHTLY (19.0.20261116; "latest" also works),
# AIH_SECRETS (/root/.agents/odoo), AIH_DB (algarve_innovation_hub), AIH_DB_USER (odoo), ODOO_PORT (8069).
# Secrets are generated into AIH_SECRETS (mode 600) and never printed.
# Written by odoo@AgentiCCells.dinis. Apache-2.0.
set -euo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
ODOO_HOME=${ODOO_HOME:-/opt/odoo19}
ODOO_NIGHTLY=${ODOO_NIGHTLY:-19.0.20261116}
SECRETS=${AIH_SECRETS:-/root/.agents/odoo}
DB=${AIH_DB:-algarve_innovation_hub}
PORT=${ODOO_PORT:-8069}
DBUSER=${AIH_DB_USER:-odoo}
APPS=base,contacts,event,website_event,crm,project,survey
PY=${PYTHON:-python3.13}
CONF=$SECRETS/odoo.conf

SEED=0; UPDATE=0; EXPORT=0; STOP=0
for a in "$@"; do
  case $a in
    --seed) SEED=1 ;; --update) UPDATE=1 ;; --export) EXPORT=1 ;; --stop) STOP=1 ;;
    *) echo "unknown option $a" >&2; exit 2 ;;
  esac
done

log() { printf '== %s\n' "$*"; }
odoo() { (cd /tmp && env PYTHONPATH="$ODOO_HOME/src" "$ODOO_HOME/venv/bin/python" "$ODOO_HOME/src/setup/odoo" "$@"); }
psql_pg() { (cd /tmp && su postgres -c "psql -v ON_ERROR_STOP=1 -qtA $*"); }
running() { curl -sf -o /dev/null "http://127.0.0.1:$PORT/web/health"; }
stop_odoo() {
  if [ -f "$ODOO_HOME/odoo.pid" ] && kill -0 "$(cat "$ODOO_HOME/odoo.pid")" 2>/dev/null; then
    kill "$(cat "$ODOO_HOME/odoo.pid")"; for _ in $(seq 1 30); do running || break; sleep 1; done
  fi
  pkill -f "setup/odoo -c $CONF" 2>/dev/null || true
  rm -f "$ODOO_HOME/odoo.pid"
}

if [ $STOP = 1 ]; then stop_odoo; log "Odoo stopped"; exit 0; fi

# 1. PostgreSQL server
if ! ls /usr/lib/postgresql/*/bin/postgres >/dev/null 2>&1; then
  log "installing PostgreSQL (apt)"
  apt-get update -q && DEBIAN_FRONTEND=noninteractive apt-get install -y -q postgresql
fi
PGVER=$(ls /usr/lib/postgresql | sort -n | tail -1)
if ! pg_lsclusters -h | grep -q "^$PGVER main"; then pg_createcluster "$PGVER" main; fi
if ! pg_lsclusters -h | grep -q "^$PGVER main .* online"; then log "starting PostgreSQL $PGVER"; pg_ctlcluster "$PGVER" main start; fi

# 2. Odoo 19 Community source (nightly.odoo.com; github.com is not needed)
if [ ! -f "$ODOO_HOME/src/odoo/release.py" ]; then
  log "downloading Odoo $ODOO_NIGHTLY"
  mkdir -p "$ODOO_HOME/download" "$ODOO_HOME/src"
  TGZ="$ODOO_HOME/download/odoo_$ODOO_NIGHTLY.tar.gz"
  if [ ! -s "$TGZ" ]; then
    curl -fsSL -o "$TGZ" "https://nightly.odoo.com/19.0/nightly/src/odoo_$ODOO_NIGHTLY.tar.gz" ||
      curl -fsSL -o "$TGZ" "https://nightly.odoo.com/19.0/nightly/src/odoo_19.0.latest.tar.gz"
  fi
  tar -xzf "$TGZ" -C "$ODOO_HOME/src" --strip-components=1
fi

# 3. Python virtual environment with Odoo's requirements
if [ ! -f "$ODOO_HOME/venv/.deps-ok" ]; then
  log "installing Python dependencies (venv, $PY)"
  "$PY" -m venv "$ODOO_HOME/venv"
  "$ODOO_HOME/venv/bin/pip" install -q --upgrade pip wheel setuptools
  # python-ldap (only for the auth_ldap module) and psycopg2 need C headers; psycopg2-binary is the same module.
  grep -v -E '^(python-ldap|psycopg2)' "$ODOO_HOME/src/requirements.txt" > "$ODOO_HOME/requirements.local.txt"
  "$ODOO_HOME/venv/bin/pip" install -q -r "$ODOO_HOME/requirements.local.txt" psycopg2-binary==2.9.10
  touch "$ODOO_HOME/venv/.deps-ok"
fi

# 4. Secrets and the Odoo configuration (mode 600, never printed)
umask 077
mkdir -p "$SECRETS" "$ODOO_HOME/data"
chmod 700 "$SECRETS"
for s in db-password master-password admin-password; do
  [ -s "$SECRETS/$s" ] || "$PY" -c 'import secrets; print(secrets.token_urlsafe(24))' > "$SECRETS/$s"
  chmod 600 "$SECRETS/$s"
done
cat > "$CONF" <<EOF
[options]
addons_path = $ODOO_HOME/src/odoo/addons,$REPO/odoo/addons
admin_passwd = $(cat "$SECRETS/master-password")
db_host = 127.0.0.1
db_port = 5432
db_user = $DBUSER
db_password = $(cat "$SECRETS/db-password")
db_name = $DB
dbfilter = ^$DB\$
list_db = False
http_interface = 127.0.0.1
http_port = $PORT
gevent_port = $((PORT + 3))
data_dir = $ODOO_HOME/data
logfile = $ODOO_HOME/odoo.log
EOF
chmod 600 "$CONF"
umask 022

# 5. Database role and database
# The password goes to psql on stdin, so it never shows in a process list.
if [ "$(psql_pg "-c \"SELECT 1 FROM pg_roles WHERE rolname='$DBUSER'\"")" != 1 ]; then
  psql_pg "-c \"CREATE ROLE $DBUSER LOGIN CREATEDB\""
fi
printf "ALTER ROLE %s PASSWORD '%s';\n" "$DBUSER" "$(cat "$SECRETS/db-password")" | (cd /tmp && su postgres -c "psql -q -v ON_ERROR_STOP=1")
if [ "$(psql_pg "-c \"SELECT 1 FROM pg_database WHERE datname='$DB'\"")" != 1 ]; then
  log "creating database $DB"
  (cd /tmp && su postgres -c "createdb -O $DBUSER -E UTF8 -T template0 $DB")
fi
module_state() { psql_pg "-d $DB -c \"SELECT state FROM ir_module_module WHERE name='$1'\"" 2>/dev/null || true; }

# 6. Modules: the standard apps, then the hub addon
if [ "$(module_state base)" != installed ]; then
  stop_odoo
  log "installing Odoo apps: $APPS (a few minutes)"
  odoo -c "$CONF" -d "$DB" -i "$APPS" --stop-after-init
fi
if [ "$(module_state algarve_innovation_hub)" != installed ]; then
  stop_odoo
  log "installing the algarve_innovation_hub addon"
  odoo -c "$CONF" -d "$DB" -i algarve_innovation_hub --stop-after-init
elif [ $UPDATE = 1 ]; then
  stop_odoo
  log "upgrading the algarve_innovation_hub addon"
  odoo -c "$CONF" -d "$DB" -u algarve_innovation_hub --stop-after-init
fi

# 7. Accounts: admin password from the secrets folder, the read-only feed user and its API key
log "accounts"
AIH_SECRETS="$SECRETS" odoo shell -c "$CONF" -d "$DB" --no-http --logfile="$ODOO_HOME/shell.log" < "$REPO/scripts/odoo/accounts.py"

# 8. Seed (when asked, or when the hub is empty)
if [ $SEED = 1 ] || [ "$(psql_pg "-d $DB -c \"SELECT count(*) FROM aih_programme\"")" = 0 ]; then
  log "seeding"
  AIH_REPO="$REPO" odoo shell -c "$CONF" -d "$DB" --no-http --logfile="$ODOO_HOME/shell.log" < "$REPO/scripts/odoo/seed.py"
fi

# 9. Start Odoo in the background, bound to 127.0.0.1
if ! running; then
  log "starting Odoo on http://127.0.0.1:$PORT"
  (
    cd /tmp || exit 1
    nohup env PYTHONPATH="$ODOO_HOME/src" "$ODOO_HOME/venv/bin/python" "$ODOO_HOME/src/setup/odoo" -c "$CONF" \
      > "$ODOO_HOME/server.out" 2>&1 < /dev/null &
    echo $! > "$ODOO_HOME/odoo.pid"
  )
  for _ in $(seq 1 90); do running && break; sleep 1; done
fi
running && log "Odoo is up: http://127.0.0.1:$PORT (database $DB; log $ODOO_HOME/odoo.log)" || { echo "Odoo did not start; see $ODOO_HOME/odoo.log" >&2; exit 1; }

# 10. Feeds (when asked)
if [ $EXPORT = 1 ]; then
  log "exporting and checking the feeds"
  ODOO_URL="http://127.0.0.1:$PORT" ODOO_DB="$DB" ODOO_API_KEY_FILE="$SECRETS/feed-api-key" \
    FEED_ACCESS_KEY_FILE="$SECRETS/private-feed-key" node "$REPO/scripts/odoo/export-feeds.mjs"
  FEED_ACCESS_KEY_FILE="$SECRETS/private-feed-key" node "$REPO/scripts/odoo/check-feeds.mjs"
fi
