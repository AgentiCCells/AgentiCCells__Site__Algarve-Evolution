# Plan, then apply: the hub's review queue (contract)

Dinis Cruz, 16 November 2026: "Yes, can you build it?" (the plan-then-apply pattern from "Odoo's agents can now write to the system of record", https://newsroom.sgit.ai/articles/odoo-and-our-stack.html: snapshot, plan, policy check, signed approval, broker, record).

## In the browser: window.HUB.plan (src/hub/hub.js)
- `HUB.plan.add(item)` -> id. item = { source: "<page or workflow id>", title: "<what this does, in a sentence>", calls: [ { method: "POST", path: "/json/2/<model>/<method>", body: {...} } ], policy?: { agent: "<cell or page>", grant: [...], mandate: "...", checks: [ { rule, ok: bool, note } ], needs_approval: bool }, refs?: [ "<feed ids>" ] }. Stored in localStorage ("hub-plan"), shown with a count in the header, kept in this browser only.
- `HUB.plan.list()`, `HUB.plan.remove(id)`, `HUB.plan.clear()`, `HUB.plan.on(fn)` (called with the list after each change).
- Every `<details class="odoo-call">` on any page gets an "Add to plan" button automatically (hub.js reads the verb, path and JSON body from the panel), so pages need no changes; pages and workflows may also call HUB.plan.add directly with a policy.

## The Plan page (/plan/)
The AE team reviews every proposed change: grouped by source, each with its calls, its policy checks and its references. Approve or reject per item. Approving signs: the browser makes an ECDSA P-256 key pair for the reviewer (kept in this browser; the public half shown as a fingerprint), and signs the canonical JSON of the approved plan. Export: a signed plan file (plan.json: { v:1, created, reviewer: { name, publicKeyJwk, fingerprint }, items: [...], signature }), and a copy of the private key never leaves the browser.

## The broker (scripts/odoo/apply-plan.mjs)
`node scripts/odoo/apply-plan.mjs plan.json [--apply]`: verifies the signature and that the reviewer's key is in an allow list (scripts/odoo/reviewers.json; empty by default, a key is added by a person), checks every call against the broker's own policy (allowed models and methods only; no unlink; no writes to res.users or access rights), then dry-runs (default: prints what it would do) or applies to the experimentation Odoo through the JSON-2 API with a dedicated user that may write only hub models, and appends a record of what was applied (plan hash, reviewer fingerprint, results) to scripts/odoo/applied/<date>.jsonl. Never against Algarve Evolution's official Odoo.
