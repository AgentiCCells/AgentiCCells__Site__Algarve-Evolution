// The hub in the browser: the persona you try it as, and the staff view that unlocks the private feed.
// Odoo is the source of truth; the public feed is served with the site, the private feed only encrypted.
// window.HUB = { persona, publicFeed(), privateFeed, on(event, fn) }. Events: 'persona', 'private'.
(() => {
  const personas = JSON.parse(document.getElementById('hub-personas')?.textContent || '[]');
  const store = { get: (s, k) => { try { return s.getItem(k); } catch { return null; } }, set: (s, k, v) => { try { s.setItem(k, v); } catch {} } };
  const listeners = {};
  const HUB = window.HUB = {
    persona: 'visitor', privateFeed: null, _public: null,
    on(ev, fn) { (listeners[ev] ||= []).push(fn); if (ev === 'persona') fn(HUB.persona); if (ev === 'private' && HUB.privateFeed) fn(HUB.privateFeed); },
    emit(ev, v) { (listeners[ev] || []).forEach(fn => { try { fn(v); } catch (e) { console.warn(e); } }); },
    async publicFeed() { return HUB._public ||= fetch('/feeds/public.json').then(r => r.json()); },
  };
  const sel = document.querySelector('[data-persona-select]'), hint = document.querySelector('[data-persona-hint]'), state = document.querySelector('[data-feed-state]');
  function apply(id) {
    HUB.persona = id; document.body.dataset.persona = id;
    const p = personas.find(x => x.id === id); if (hint && p) hint.textContent = p.hint;
    if (sel) sel.value = id;
    // data-for="founder mentor": highlighted for those personas. data-only="staff": shown only to them.
    document.querySelectorAll('[data-for]').forEach(el => el.classList.toggle('for-me', el.dataset.for.split(/\s+/).includes(id)));
    document.querySelectorAll('[data-only]').forEach(el => { el.hidden = !el.dataset.only.split(/\s+/).includes(id); });
    store.set(localStorage, 'hub-persona', id); HUB.emit('persona', id);
    if (id === 'staff' && !HUB.privateFeed) askKey();
  }
  // The staff view: the access key is asked for here, used in this tab only, and never sent anywhere.
  const b = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function open(accessKey) {
    const enc = await fetch('/feeds/private.enc.json').then(r => r.json());
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(accessKey), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b(enc.kdf.salt), iterations: enc.kdf.iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b(enc.iv) }, key, b(enc.ciphertext));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  let dlg;
  function askKey() {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'key-dialog';
      dlg.innerHTML = `<form method="dialog"><h2>Algarve Evolution team</h2><p>Not everything in Odoo is public. Enter the access key to open the private feed in this tab: sessions' notes, contact details, participants and jury scores. The key stays in this browser tab; nothing is sent.</p><label>Access key <input name="k" type="password" autocomplete="off" required></label><p class="key-msg" role="alert"></p><menu><button value="cancel" formnovalidate>Stay public</button> <button value="ok" class="primary">Open the private feed</button></menu></form>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('close', async () => {
        if (dlg.returnValue !== 'ok') return;
        const k = dlg.querySelector('[name=k]').value; dlg.querySelector('[name=k]').value = '';
        try { await unlock(k); } catch { dlg.querySelector('.key-msg').textContent = 'That key does not open the private feed.'; dlg.showModal(); }
      });
    }
    dlg.querySelector('.key-msg').textContent = ''; dlg.showModal();
  }
  async function unlock(k) {
    HUB.privateFeed = await open(k); store.set(sessionStorage, 'hub-key', k);
    if (state) { state.textContent = 'Private feed open in this tab (Odoo, all records)'; state.classList.add('is-private'); }
    document.body.classList.add('has-private'); HUB.emit('private', HUB.privateFeed);
  }
  sel?.addEventListener('change', () => apply(sel.value));
  const saved = store.get(localStorage, 'hub-persona'); const k = store.get(sessionStorage, 'hub-key');
  apply(personas.some(p => p.id === saved) && saved !== 'staff' ? saved : 'visitor');
  if (saved === 'staff' && k) unlock(k).then(() => apply('staff')).catch(() => apply('visitor'));
})();
