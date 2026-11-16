// Print the slide decks in src/decks/ to PDF, one 1280 x 720 page per slide, from a built and served site.
// Usage: serve the built site (e.g. python3 -m http.server 8150 -d _site), then
//   node scripts/decks/print-pdfs.cjs http://127.0.0.1:8150
// Needs Playwright with Chromium (a dev tool, not a dependency of the site). Fails if any slide overflows its frame.
// Code Apache-2.0.
const { chromium } = require('playwright');
const { join } = require('node:path');
const DECKS = [
  ['odoo-briefing', 'ae-innovation-hub-and-odoo.pdf'],
  ['whats-new', 'whats-new-in-the-ae-innovation-hub.pdf'],
];
(async () => {
  const base = process.argv[2] || 'http://127.0.0.1:8150';
  const b = await chromium.launch(); let bad = 0;
  for (const [slug, file] of DECKS) {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    await p.goto(`${base}/decks/${slug}/`, { waitUntil: 'networkidle' });
    await p.emulateMedia({ media: 'print' });
    await p.evaluate(() => document.fonts.ready);
    const over = await p.evaluate(() => [...document.querySelectorAll('.s')].map((s, i) => [i + 1, s.scrollHeight, s.scrollWidth]).filter(([, h, w]) => h > 720 || w > 1280));
    if (over.length) { bad++; console.error(`${slug}: slides overflow ${JSON.stringify(over)}`); }
    const out = join('src', 'decks', slug, file);
    await p.pdf({ path: out, width: '1280px', height: '720px', printBackground: true });
    console.log(`${out}: ${await p.evaluate(() => document.querySelectorAll('.s').length)} slides`);
    await p.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
