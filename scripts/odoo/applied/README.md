# The plan broker's record

`scripts/odoo/apply-plan.mjs plan.json --apply` appends one line per run to `<date>.jsonl` in this folder (the date is UTC). It is the last step of plan, then apply (docs/v2/PLAN.md): a record of what was written to the experimentation Odoo, kept in git so it outlasts any chat.

Each line is one JSON object:

| Field | What |
| --- | --- |
| `at` | when the broker ran (ISO, UTC) |
| `mode` | `apply` (dry runs are printed, not recorded) |
| `plan_hash` | `sha256:` of the plan's canonical JSON without its signature: the exact text the reviewer signed |
| `plan_created`, `hub` | when and where the plan was signed (the hub's Plan page) |
| `reviewer` | `{ name, fingerprint }` as on `scripts/odoo/reviewers.json`; the full public key stays there |
| `odoo` | `{ url, db }` of the experimentation Odoo it wrote to |
| `items[]` | `{ id, source, title, status, calls[] }`; status is `applied`, `partly applied`, `failed` or `skipped` (with `reason`: the policy, or a record that changed in Odoo after the item's snapshot) |
| `items[].calls[]` | `{ path, body, result, before? }`: the call as sent (references to earlier calls resolved), Odoo's answer, and for writes the values before |

The broker refuses to apply a plan whose hash is already here with `mode: apply` (unless `--again`).

Only the broker appends here. Test runs write elsewhere (`--record-dir`), so the file holds real applications only. Code Apache-2.0; text CC BY 4.0. Written by odoo@AgentiCCells.dinis.
