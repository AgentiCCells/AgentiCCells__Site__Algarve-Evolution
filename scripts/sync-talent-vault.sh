#!/usr/bin/env bash
# Pull the talent map's data from its sgit vault (eii0x48f) into src/talent-map/data/.
# The key is never stored in this repository: pass it in TALENT_VAULT_KEY (a read-only key is enough).
set -euo pipefail
cd "$(dirname "$0")/.."
: "${TALENT_VAULT_KEY:?set TALENT_VAULT_KEY to the vault eii0x48f read key}"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
(cd "$tmp" && sgit clone "$TALENT_VAULT_KEY" v >/dev/null)
cp "$tmp"/v/data/*.json "$tmp"/v/data/README.md src/talent-map/data/
echo "synced src/talent-map/data/ from vault eii0x48f"
