# Running the hub's local Odoo

Our own Odoo 19 Community, the source of truth for the AE Innovation Hub (Algarve Evolution Innovation Hub) prototype. It runs in this container only, bound to 127.0.0.1. The container is ephemeral, so everything is rebuilt by one script.

## Start it (again)

```
scripts/odoo/setup-local.sh            # install what is missing, seed if empty, start Odoo
scripts/odoo/setup-local.sh --export   # the same, then export and check the feeds
```

Then open http://127.0.0.1:8069 and sign in as `admin` with the password in `/root/.agents/odoo/admin-password`. The top menu **Innovation Hub** holds the four activities.

The script is idempotent; each step checks what is already there:

1. PostgreSQL: installs the server with apt if missing, creates and starts the cluster.
2. Odoo source: downloads the nightly build `odoo_19.0.20261116.tar.gz` from https://nightly.odoo.com/19.0/nightly/src/ into `/opt/odoo19/src` (set `ODOO_NIGHTLY=latest` for the newest).
3. Python: a venv at `/opt/odoo19/venv` (Python 3.13) with Odoo's `requirements.txt`, except `python-ldap` (only the LDAP login module needs it) and `psycopg2`, replaced by `psycopg2-binary` 2.9.10 (the same module, without C headers).
4. Secrets: generates the database password, the Odoo master password and the admin password into `/root/.agents/odoo/` (mode 600) and writes `odoo.conf` there. Nothing is printed.
5. Database: role `odoo` and database `algarve_innovation_hub`.
6. Modules: `contacts`, `event`, `website_event`, `crm`, `project`, `survey`, then our addon `odoo/addons/algarve_innovation_hub` (it depends on `mail`, `contacts` and `event`; `project` holds the tasks the Odoo page's "Ideas and needs" would create).
7. Accounts (`scripts/odoo/accounts.py`): sets the admin password from its file; creates the read-only user `feed-exporter` (Internal User + Innovation Hub / Feed reader) and an API key for it, kept only in `/root/.agents/odoo/feed-api-key`; and the user `plan-broker` (Internal User + Innovation Hub / Plan broker: create and update hub records and hub contacts, no delete, no users or rights) with its key in `/root/.agents/odoo/plan-broker-api-key`. Only the plan broker (`scripts/odoo/apply-plan.mjs`, see `scripts/odoo/applied/README.md`) uses it.
8. Seed (`scripts/odoo/seed.py`), when the hub is empty or with `--seed`. It updates records in place, never duplicates.
9. Starts Odoo in the background (`/opt/odoo19/odoo.pid`, log `/opt/odoo19/odoo.log`).

Other options: `--update` upgrades the addon after you edit it; `--seed` re-runs the seed; `--stop` stops Odoo. After changing the addon or the seed, run `scripts/odoo/setup-local.sh --update --seed --export`: it upgrades the addon, re-seeds, exports and checks the feeds (see `src/feeds/README.md`). A fresh container first downloads Odoo and installs its Python packages (several minutes); restarting an existing install took 25 seconds here (16 November 2026).

## Files outside the repository

| Path | What |
| --- | --- |
| `/opt/odoo19/` | Odoo source, venv, filestore (`data/`), logs, pid |
| `/root/.agents/odoo/odoo.conf` | Odoo configuration (holds the database and master passwords; mode 600) |
| `/root/.agents/odoo/admin-password` | the `admin` user's password |
| `/root/.agents/odoo/feed-api-key` | API key of the read-only `feed-exporter` user |
| `/root/.agents/odoo/plan-broker-api-key` | API key of the `plan-broker` user (hub records only, no delete) |
| `/root/.agents/odoo/private-feed-key` | access key of the encrypted private feed (created by the exporter) |

Never print, copy or commit these.

## Feeds

```
node scripts/odoo/export-feeds.mjs                                            # writes src/feeds/
FEED_ACCESS_KEY_FILE=/root/.agents/odoo/private-feed-key node scripts/odoo/check-feeds.mjs
```

See `src/feeds/README.md`.

## Real data in the seed

`scripts/odoo/seed/real-public.json` comes from PrompTugal.news's by-place data, through `scripts/odoo/extract-real-seed.mjs <PrompTugal data/by-place>`. Re-run that only when the source changes.

## Notes

- Odoo runs as root here and says "Running as user 'root' is a security risk". Acceptable for a local, loopback-only prototype; a real deployment runs it as its own user.
- `wkhtmltopdf` is not installed, so PDF reports do not render. Nothing in the hub needs them.
- The database list is off (`list_db = False`) and Odoo only serves `algarve_innovation_hub`.
