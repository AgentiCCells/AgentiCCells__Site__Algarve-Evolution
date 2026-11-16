#!/usr/bin/env bash
# Pull the talent map's data from its sgit vault (eii0x48f) into src/talent-map/data/.
# The public read-only key is the default (Dinis Cruz, 16 November 2026); the write key is never in this repository.
set -euo pipefail
cd "$(dirname "$0")/.."
TALENT_VAULT_KEY="${TALENT_VAULT_KEY:-sgit_public_read_b4073a22d002de4e3207417a9a87ad8bad1daa6b0567e243f28f6e5cb7c47adf:eii0x48f}"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
(cd "$tmp" && sgit clone "$TALENT_VAULT_KEY" v >/dev/null)
cp "$tmp"/v/data/*.json "$tmp"/v/data/README.md src/talent-map/data/
echo "synced src/talent-map/data/ from vault eii0x48f"
