import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the actual browser dictionary and locale initialization without a DOM library.
const source = readFileSync(new URL('../i18n.js', import.meta.url), 'utf8');

function init(cookie, url) {
  const listeners = {};
  const window = {};
  const document = {
    cookie,
    documentElement: { lang: 'es' },
    readyState: 'loading',
    addEventListener(name, fn) { listeners[name] = fn; }
  };
  const replaced = [];
  const ctx = {
    document, window, URL,
    location: { href: url },
    history: { state: null, replaceState(...args) { replaced.push(args); } }
  };
  runInNewContext(source, ctx);
  return { window, document, replaced, listeners };
}

test('English locale is saved and UI labels are translated', () => {
  const r = init('canelo_lang=en', 'http://127.0.0.1/admin/?vista=solicitudes');
  assert.equal(r.document.documentElement.lang, 'en');
  assert.equal(r.window.CaneloI18n.t('Solicitudes'), 'Applications');
  assert.equal(r.window.CaneloI18n.t('Nombre completo'), 'Full name');
  assert.equal(r.window.CaneloI18n.t('Contraseña'), 'Password');
  assert.equal(r.window.CaneloI18n.t('Publicación para prensa'), 'Media publishing');
  assert.equal(r.window.CaneloI18n.t('Canelo Scout'), 'Canelo Scout');
  assert.equal(r.replaced.length, 0);
});

test('Spanish remains the default and override works without losing event URL', () => {
  const original = init('', 'http://127.0.0.1/registro?event=123');
  assert.equal(original.document.documentElement.lang, 'es');
  assert.equal(original.window.CaneloI18n.t('Solicitudes'), 'Solicitudes');

  const chosen = init('canelo_lang=es', 'http://127.0.0.1/registro?event=123&lang=en');
  assert.equal(chosen.window.CaneloI18n.locale, 'en');
  assert.match(chosen.document.cookie, /canelo_lang=en/);
  assert.equal(chosen.replaced.length, 1);
  assert.equal(chosen.replaced[0][2], '/registro?event=123');
});
