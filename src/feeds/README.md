# The hub's feeds

Odoo is the source of truth for the AE Innovation Hub. The site reads only these files, exported from Odoo by `scripts/odoo/export-feeds.mjs` in the shape `docs/v2/CONTRACT.md` sets.

Today they come from our own local Odoo 19 Community (see `scripts/odoo/RUN.md`), seeded with real public organisations, communities and events (each with its source URL) and with simulated programmes, companies, mentors, KPIs, challenges, applications, vibathons, projects and people. Every simulated record says `"simulated": true` and its name ends in "(simulated)".

## `public.json`

Committed and served. It holds:

- only records published in Odoo (`is_published`, or `aih_published` on contacts and events);
- only public fields: no session `notes`, no supplier `contact`, no vibathon `participants`, no project `scores`;
- people (mentors, individual suppliers, talent of kind professional, consultant, investor or mentor, project team members, jurors) only when they have given consent;
- references to something not public set to `null` or left out (for example a session run by a mentor who has not consented keeps `"mentor_id": null`).

## `private.enc.json`

The private feed: every record and every field, for Algarve Evolution staff. It is never in the repository in clear. The file is

```
{ "v": 1, "kdf": { "salt": base64, "iterations": 200000 }, "iv": base64, "ciphertext": base64 }
```

AES-256-GCM (the 16-byte tag is at the end of the ciphertext, as WebCrypto writes it), with the key derived by PBKDF2-SHA256 from an access key. The access key is not in the repository; locally it is in `/root/.agents/odoo/private-feed-key`. A browser decrypts it like this:

```js
const b = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function openPrivateFeed(enc, accessKey) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(accessKey), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b(enc.kdf.salt), iterations: enc.kdf.iterations },
    material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(enc.iv) }, key, b(enc.ciphertext));
  return JSON.parse(new TextDecoder().decode(plain));
}
```

A wrong key makes `decrypt` throw.

## Re-export

The feeds are files in git: re-export them whenever Odoo's data, the addon or the exporter changes, then commit both files together.

1. Start (or rebuild) the local Odoo and export in one go:

   ```
   scripts/odoo/setup-local.sh --export                   # Odoo running already, data unchanged
   scripts/odoo/setup-local.sh --update --seed --export   # after editing the addon or scripts/odoo/seed.py
   ```

   `--update` upgrades the addon (new fields and models), `--seed` re-runs the seed (records are updated in place, never duplicated), `--export` runs the two commands below.
2. Or, with the local Odoo already running, by hand:

   ```
   node scripts/odoo/export-feeds.mjs
   FEED_ACCESS_KEY_FILE=/root/.agents/odoo/private-feed-key node scripts/odoo/check-feeds.mjs
   ```

   The exporter prints a table of records per entity, public and private. The private feed is encrypted with the same access key each time (a new salt and IV, so the file changes even when the data does not).
3. Build and check the site, which re-runs the feed checker:

   ```
   node scripts/build.mjs && node scripts/validate.mjs
   ```

   Every page reads `public.json` at build time, so the counts on every page move with the export.
4. If the shape changed, update `docs/v2/CONTRACT.md` (its change list), `scripts/odoo/check-feeds.mjs` and this file in the same commit.

The checker validates both feeds against the contract (shapes, ids, references, the consent rule, no private field or e-mail address in `public.json`, a source URL on every real record) and decrypts the private feed. It prints OK or the problems.

The exporter reads Odoo over the Odoo 19 JSON-2 API (`POST /json/2/<model>/search_read`, `Authorization: bearer <API key>`) as `feed-exporter`, a user that can read the hub's models and change nothing.

## Pointing it at Algarve Evolution's own Odoo (a proposal)

Algarve Evolution's Odoo (https://www.algarveevolution.pt, Odoo 19.0) would replace ours with no change to the site:

1. Their Odoo needs the hub's models: install the addon `odoo/addons/algarve_innovation_hub` (LGPL-3), which needs an Odoo that accepts custom addons (self-hosted or Odoo.sh), or map the exporter's model and field names to models they already keep. We do not know how their Odoo is hosted.
2. They create a user with only "Innovation Hub / Feed reader (read only)", sign in as that user, and create an API key (Preferences, Account Security, New API Key).
3. In their own CI, they keep that key as a secret `ODOO_API_KEY`, and a random access key as `FEED_ACCESS_KEY`, and run
   `ODOO_URL=https://<their odoo> ODOO_DB=<their database> node scripts/odoo/export-feeds.mjs`
   then `check-feeds.mjs`, and publish `public.json` and `private.enc.json`.
4. They give the access key only to the staff who should see the private feed, and rotate it (and the API key) when someone leaves.

The keys stay in their CI. We never hold them, and no customer data comes into our accounts.
