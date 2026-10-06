// Handles the "Send an owl" form. Everything else is served as static files.
// The destination inbox lives in the OWL_TO secret, so it never appears in this public repo or on the site.
import { EmailMessage } from 'cloudflare:email';

const FROM = 'owl@clairealmand.com';
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const oneLine = (s, max) => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
// Header text with accents or emoji must be encoded (RFC 2047) or mail clients garble it.
const header = (s) => /^[\x20-\x7e]*$/.test(s) ? s
  : '=?UTF-8?B?' + btoa(String.fromCharCode(...new TextEncoder().encode(s))) + '?=';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/owl') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

    let form;
    try { form = await request.formData(); } catch { return json({ ok: false, error: 'bad-form' }, 400); }

    // Bots fill the hidden field or submit instantly; pretend it worked and drop it.
    const started = Number(form.get('t')) || 0;
    if (form.get('website') || Date.now() - started < 3000) return json({ ok: true });

    const name = oneLine(form.get('name'), 120);
    const email = oneLine(form.get('email'), 200);
    const message = String(form.get('message') || '').trim().slice(0, 5000);
    if (!name || !message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return json({ ok: false, error: 'missing' }, 400);
    if (!env.OWL || !env.OWL_TO) return json({ ok: false, error: 'not-configured' }, 503);

    // A retry after a timeout carries the same id; if that owl already flew, don't send it twice.
    // Best effort: the edge cache is per location, which covers a visitor retrying from the same place.
    const id = /^[a-z0-9-]{8,64}$/i.test(String(form.get('id') || '')) ? String(form.get('id')) : '';
    const seenKey = id && new Request('https://owl.internal/sent/' + id);
    if (seenKey && await caches.default.match(seenKey)) return json({ ok: true, duplicate: true });

    const raw = [
      `From: "Owl from clairealmand.com" <${FROM}>`,
      `To: <${env.OWL_TO}>`,
      `Reply-To: ${header(name.replace(/["\\]/g, ''))} <${email}>`,
      `Subject: ${header(`Owl from ${name}`)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@clairealmand.com>`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      `${name} <${email}> sent an owl from clairealmand.com:`,
      '',
      message,
      '',
      '--',
      'Hit reply to answer them directly.',
    ].join('\r\n');

    try {
      await env.OWL.send(new EmailMessage(FROM, env.OWL_TO, raw));
      if (seenKey) await caches.default.put(seenKey, new Response('sent', { headers: { 'cache-control': 'max-age=86400' } }));
      return json({ ok: true });
    } catch (e) {
      console.error('owl send failed', e && e.message);
      return json({ ok: false, error: 'send-failed' }, 502);
    }
  },
};
