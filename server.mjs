import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';
import { randomBytes, randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import QRCode from 'qrcode';
import { updateOperation } from './server/workflow.mjs';
import { createViews } from './server/views.mjs';
import { renderLoginPage } from './server/login-view.mjs';
import { createSiteSettings } from './server/site-settings.mjs';
import { createTryouts, POSITION_GROUPS } from './server/tryouts.mjs';

const adminPassword = process.env.ADMIN_PASSWORD;
const port = Number(process.env.PORT ?? 8091);
const publicOrigin = new URL(process.env.PUBLIC_ORIGIN ?? 'http://127.0.0.1:' + port);
if (!['http:', 'https:'].includes(publicOrigin.protocol) || publicOrigin.username || publicOrigin.password) {
  throw new Error('PUBLIC_ORIGIN debe ser una dirección HTTP o HTTPS.');
}
const registrationUrl = id => new URL('/registro?event=' + encodeURIComponent(id), publicOrigin).href;
const databaseDirectory = process.env.DATA_DIR ? pathToFileURL(resolve(process.env.DATA_DIR) + sep) : new URL('./data/', import.meta.url);
const root = readFileSync(new URL('./dist/index.html', import.meta.url), 'utf8')
  .replace('Sí, ambos días', 'Todo el evento')
  .replace('Solo el día 7', 'Solo el primer día')
  .replace('Solo el día 8', 'Solo el segundo día');
const registrationScript = readFileSync(new URL('./registration.js', import.meta.url));
const operationsScript = readFileSync(new URL('./operations.js', import.meta.url));

function validDate(value) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

if (!adminPassword || adminPassword.length < 12 || adminPassword.length > 512) {
  throw new Error('Define ADMIN_PASSWORD con entre 12 y 512 caracteres.');
}

mkdirSync(databaseDirectory, { recursive: true });
const db = new DatabaseSync(new URL('registrations.sqlite', databaseDirectory));
db.exec(`CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY, created_at TEXT NOT NULL, details TEXT NOT NULL,
  photo BLOB NOT NULL, photo_type TEXT NOT NULL, receipt BLOB NOT NULL, receipt_type TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, starts TEXT NOT NULL, ends TEXT NOT NULL,
  venue TEXT NOT NULL, accepting INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), name TEXT NOT NULL,
  UNIQUE(event_id, name COLLATE NOCASE)
);
CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY REFERENCES registrations(id), status TEXT NOT NULL DEFAULT 'review',
  note TEXT NOT NULL DEFAULT '', team_id TEXT REFERENCES teams(id), jersey INTEGER,
  checked INTEGER NOT NULL DEFAULT 0, sprint REAL, velocity REAL, published INTEGER NOT NULL DEFAULT 0,
  UNIQUE(team_id, jersey)
);`);
if (!db.prepare('PRAGMA table_info(registrations)').all().some(column => column.name === 'event_id')) {
  db.exec('ALTER TABLE registrations ADD COLUMN event_id TEXT REFERENCES events(id)');
}
if (!db.prepare('PRAGMA table_info(events)').all().some(column => column.name === 'payment_instructions')) {
  db.exec("ALTER TABLE events ADD COLUMN payment_instructions TEXT NOT NULL DEFAULT ''");
}
if (!db.prepare('PRAGMA table_info(events)').all().some(column => column.name === 'description')) {
  db.exec("ALTER TABLE events ADD COLUMN description TEXT NOT NULL DEFAULT ''");
}
const legacyDates = db.prepare("SELECT DISTINCT json_extract(details, '$.eventDate') AS date FROM registrations WHERE event_id IS NULL").all();
for (const { date } of legacyDates) {
  const id = 'legacy-' + date;
  db.prepare('INSERT OR IGNORE INTO events (id, name, starts, ends, venue, accepting) VALUES (?, ?, ?, ?, ?, 0)')
    .run(id, 'Canelo Scout · ' + date, date, date, '');
  db.prepare("UPDATE registrations SET event_id = ? WHERE event_id IS NULL AND json_extract(details, '$.eventDate') = ?").run(id, date);
}
for (const [name, definition] of [['fee_label', "TEXT NOT NULL DEFAULT ''"], ['contact', "TEXT NOT NULL DEFAULT ''"]]) {
  if (!db.prepare('PRAGMA table_info(events)').all().some(c => c.name === name)) db.exec(`ALTER TABLE events ADD COLUMN ${name} ${definition}`);
}
if (!db.prepare('PRAGMA table_info(operations)').all().some(c => c.name === 'payment_status')) {
  db.exec("ALTER TABLE operations ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'");
  // Before this migration the approval button explicitly validated both application and payment.
  db.exec("UPDATE operations SET payment_status = 'validated' WHERE status = 'approved'");
}
db.exec('INSERT OR IGNORE INTO operations (id) SELECT id FROM registrations');
const siteSettings = createSiteSettings(db);
const tryouts = createTryouts(db);
const requestLocale = req => {
  const query = new URL(req.url, 'http://localhost').searchParams.get('lang');
  if (query === 'es' || query === 'en') return query;
  return /(?:^|;\s*)canelo_lang=en(?:;|$)/.test(req.headers.cookie ?? '') ? 'en' : 'es';
};

const required = ['name', 'birth', 'nationality', 'city', 'phone', 'email', 'primary',
  'bats', 'throws', 'academy', 'level', 'attendance', 'passport', 'payref'];
const optional = ['instagram', 'guardian', 'guardianPhone', 'secondary', 'height', 'weight', 'graduation'];
const options = new Map([...root.matchAll(/<select name="(\w+)"[^>]*>(.*?)<\/select>/g)]
  .map(([, name, markup]) => [name, [...markup.matchAll(/<option>([^<]+)<\/option>/g)]
    .map(([, value]) => value)]));

function upload(encoded, limit, allowPdf) {
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length > limit * 1024 * 1024) return null;
  let type;
  if (bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) type = 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) type = 'image/png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') type = 'image/webp';
  if (allowPdf && bytes.toString('ascii', 0, 5) === '%PDF-') type = 'application/pdf';
  return type ? { bytes, type } : null;
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJson(req, limit = 18 * 1024 * 1024) {
  if (req.headers['content-type'] !== 'application/json') throw Object.assign(new Error('Formato inválido.'), { status: 415 });
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks));
  } catch {
    throw Object.assign(new Error('Solicitud inválida.'), { status: 400 });
  }
}

async function register(req, res) {
  const input = await readJson(req);
  const correction = typeof input?.correctionCode === 'string' && db.prepare(
    "SELECT r.id, r.event_id FROM registrations r JOIN operations o ON o.id=r.id WHERE r.id=? AND o.status='correction'"
  ).get(input.correctionCode);
  if (input?.correctionCode && !correction) return json(res, 422, { error: 'Esta solicitud no está habilitada para corrección.' });
  const event = correction ? getEvent(correction.event_id) : typeof input?.eventId === 'string' && db.prepare('SELECT * FROM events WHERE id = ? AND accepting = 1').get(input.eventId);
  if (!event) return json(res, 422, { error: 'El evento no recibe inscripciones.' });
  const eventDate = event.starts;
  const details = Object.fromEntries([...required, ...optional].map(name =>
    [name, typeof input?.fields?.[name] === 'string' ? input.fields[name].trim() : '']));
  if (required.some(name => !details[name]) || Object.values(details).some(value => value.length > 250) ||
      [...options].some(([name, values]) => details[name] && !values.includes(details[name])) ||
      !validDate(details.birth) || details.birth >= eventDate ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) ||
      input?.fields?.consent !== 'on' || input?.fields?.truth !== 'on') {
    return json(res, 422, { error: 'Revisa los datos requeridos y las autorizaciones.' });
  }
  const age = +eventDate.slice(0, 4) - +details.birth.slice(0, 4) -
    Number(eventDate.slice(5) < details.birth.slice(5));
  if (age < 18 && (!details.guardian || !details.guardianPhone)) {
    return json(res, 422, { error: 'Completa los datos del tutor.' });
  }
  const photo = upload(input.photo, 5, false);
  const receipt = upload(input.receipt, 8, true);
  if (!photo || !receipt) return json(res, 422, { error: 'Usa JPG, PNG o WebP para la foto y esos formatos o PDF para el comprobante.' });
  const id = correction?.id || 'CSI-' + randomUUID();
  db.exec('BEGIN');
  try {
    if (correction) {
      db.prepare('UPDATE registrations SET details=?, photo=?, photo_type=?, receipt=?, receipt_type=? WHERE id=?')
        .run(JSON.stringify({ ...details, age, eventDate, consent: true, truth: true }), photo.bytes, photo.type, receipt.bytes, receipt.type, id);
      db.prepare("UPDATE operations SET status='review', payment_status='pending', published=0 WHERE id=?").run(id);
    } else {
      db.prepare('INSERT INTO registrations VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, new Date().toISOString(), JSON.stringify({ ...details, age, eventDate, consent: true, truth: true }),
        photo.bytes, photo.type, receipt.bytes, receipt.type, event.id);
    db.prepare('INSERT INTO operations (id) VALUES (?)').run(id);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return json(res, 201, { id });
}

const digest = value => createHash('sha256').update(value).digest();
const passwordDigest = digest(adminPassword);
const sessions = new Map();
const sessionLifetime = 8 * 60 * 60;
const secureCookie = publicOrigin.protocol === 'https:' ? '; Secure' : '';
const sessionToken = req => req.headers.cookie?.match(/(?:^|;\s*)canelo_session=([a-f0-9]{64})(?:;|$)/)?.[1];
const sessionCookie = (token, age) => `canelo_session=${token}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${age}${secureCookie}`;
const redirect = (res, location) => {
  res.writeHead(303, { Location: location });
  return res.end();
};
// Limitar intentos fallidos por dirección del socket, evitando bloquear a todos los usuarios.
// Nunca confiar en X-Forwarded-For sin configurar explícitamente un proxy de confianza.
const loginFailures = new Map();
const loginWindowMs = 60_000;
const loginMaxFailures = 8;
function recentFailures(remoteAddress, now) {
  const times = (loginFailures.get(remoteAddress) ?? []).filter(time => now - time < loginWindowMs);
  if (times.length) loginFailures.set(remoteAddress, times);
  else loginFailures.delete(remoteAddress);
  return times;
}
function recordFailedLogin(remoteAddress, now) {
  if (loginFailures.size > 512) {
    for (const [ip] of loginFailures) recentFailures(ip, now);
  }
  const times = recentFailures(remoteAddress, now);
  times.push(now);
  loginFailures.set(remoteAddress, times);
}

function loginTarget(value) {
  if (typeof value !== 'string' || !/^\/admin\/(?:preview|site\/preview)?(?:\?|$)/.test(value)) return '/admin/';
  return value.split('#')[0];
}

function loginPage(res, error = '', next = '/admin/') {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(renderLoginPage({ root, escape, error, next }));
}

async function login(req, res) {
  if (req.headers.origin && req.headers.origin !== publicOrigin.origin &&
      req.headers.origin !== 'http://' + req.headers.host) {
    res.statusCode = 403;
    return loginPage(res, 'Abre el formulario desde la dirección del panel.');
  }
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/x-www-form-urlencoded') {
    res.statusCode = 415;
    return loginPage(res, 'No se pudo leer el formulario.');
  }
  const now = Date.now();
  const loginAddress = req.socket.remoteAddress ?? 'unknown';
  if (recentFailures(loginAddress, now).length >= loginMaxFailures) {
    res.statusCode = 429;
    res.setHeader('Retry-After', '60');
    return loginPage(res, 'Se alcanzó el límite de intentos. Inténtalo nuevamente en un minuto.');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 8192) {
      res.statusCode = 413;
      return loginPage(res, 'El formulario supera el tamaño permitido.');
    }
    chunks.push(chunk);
  }
  const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
  const next = loginTarget(form.get('next'));
  const username = form.get('username')?.trim() ?? '';
  const password = form.get('password') ?? '';
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(username) ||
      password.length < 12 || password.length > 512) {
    recordFailedLogin(loginAddress, now);
    res.statusCode = 422;
    return loginPage(res, 'Completa ambos campos con valores válidos e inténtalo nuevamente.', next);
  }
  if (username !== 'admin' || !timingSafeEqual(passwordDigest, digest(password))) {
    recordFailedLogin(loginAddress, now);
    res.statusCode = 401;
    return loginPage(res, 'El usuario o la contraseña son incorrectos.', next);
  }
  loginFailures.delete(loginAddress);
  sessions.delete(sessionToken(req));
  for (const [token, expiry] of sessions) {
    if (expiry <= now) sessions.delete(token);
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, now + sessionLifetime * 1000);
  res.setHeader('Set-Cookie', sessionCookie(token, sessionLifetime));
  return redirect(res, next);
}
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const getEvent = id => db.prepare('SELECT * FROM events WHERE id = ?').get(id ?? '');
const listEvents = () => db.prepare('SELECT * FROM events ORDER BY starts DESC, name').all();
const { html, registrationPage, presentationPage, publicEvents, eventCards } =
  createViews({ root, getEvent, listEvents, db, escape, getSiteSettings: siteSettings.publicSite });

function roster(eventId) {
  return db.prepare(`SELECT r.id, r.event_id, r.created_at, r.details, o.status, o.note, o.team_id, o.jersey,
    o.payment_status, o.checked, o.sprint, o.velocity, o.published, t.name AS team
    FROM registrations r JOIN operations o ON o.id = r.id LEFT JOIN teams t ON t.id = o.team_id
    WHERE r.event_id = ? ORDER BY r.created_at DESC`).all(eventId)
    .map(row => ({ ...row, details: JSON.parse(row.details) }));
}

const invalid = (res, error) => json(res, 422, { error });
const clean = value => typeof value === 'string' ? value.trim() : '';

async function admin(req, res, path, url) {
  const token = sessionToken(req);
  const signedIn = (sessions.get(token) ?? 0) > Date.now();
  if (path === '/admin/login') {
    const next = loginTarget(url.searchParams.get('next'));
    if (req.method === 'GET') return signedIn ? redirect(res, next) : loginPage(res, '', next);
    if (req.method === 'POST') return login(req, res);
  }
  if (req.method === 'POST' && path !== '/admin/login' &&
      req.headers.origin && req.headers.origin !== publicOrigin.origin &&
      req.headers.origin !== 'http://' + req.headers.host) {
    return json(res, 403, { error: 'Origen no autorizado.' });
  }
  if (!signedIn) {
    sessions.delete(token);
    if (req.method === 'GET' && ['/admin/', '/admin/preview', '/admin/site/preview'].includes(path)) {
      return redirect(res, '/admin/login?next=' + encodeURIComponent(path + url.search));
    }
    return json(res, 401, { error: 'Acceso administrativo requerido.' });
  }
  if (req.method === 'POST' && path === '/admin/logout') {
    sessions.delete(token);
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return redirect(res, '/admin/login');
  }
  if (req.method === 'GET' && path === '/admin/') {
    const eventId = getEvent(url.searchParams.get('event'))?.id;
    if (!eventId && url.searchParams.has('event')) {
      const view = url.searchParams.get('vista');
      return redirect(res, '/admin/' + (view ? '?vista=' + encodeURIComponent(view) : ''));
    }
    const active = ({ solicitudes: 'Solicitudes', rosters: 'Profundidad', operacion: 'Operación', tryouts: 'Tryouts', prensa: 'Publicación' })[url.searchParams.get('vista')] ?? 'Configuración';
    return html(res, 'Panel de eventos', '<div id="operations"></div>',
      '<script type="module" src="/operations.js"></script>', { eventId, active, privateView: true, hideTitle: true });
  }
  if (path === '/admin/site' && req.method === 'GET') return json(res, 200, siteSettings.state());
  if (path === '/admin/site' && req.method === 'POST') {
    const input = await readJson(req, 20000);
    if (!['save', 'publish'].includes(input?.action)) return invalid(res, 'Acción de configuración no válida.');
    const result = siteSettings.save(input, input.action === 'publish');
    return result.error ? invalid(res, result.error) : json(res, 200, result.value);
  }
  if (path === '/admin/site/preview' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(presentationPage({ settings: siteSettings.state().draft, locale: requestLocale(req), preview: true }));
  }
  // An event owns its own showcase and game sessions. All changes require admin login.
  if (path === '/admin/tryouts' && req.method === 'GET') {
    const selectedEvent = getEvent(url.searchParams.get('event'));
    if (!selectedEvent) return invalid(res, 'Selecciona un evento antes de evaluar jugadores.');
    return json(res, 200, tryouts.list(selectedEvent.id, url.searchParams.get('session') ?? ''));
  }
  if (path === '/admin/tryouts/sessions' && req.method === 'POST') {
    const selectedEvent = getEvent(url.searchParams.get('event'));
    if (!selectedEvent) return invalid(res, 'Selecciona un evento válido.');
    return json(res, 201, tryouts.createSession(selectedEvent.id, await readJson(req, 4096)));
  }
  const tryoutAction = path.match(/^\/admin\/tryouts\/sessions\/([a-f0-9-]{36})\/(drills|attempts|status)$/);
  if (tryoutAction && req.method === 'POST') {
    const selectedEvent = getEvent(url.searchParams.get('event'));
    if (!selectedEvent) return invalid(res, 'Selecciona un evento válido.');
    const [ , sessionId, action ] = tryoutAction;
    const input = await readJson(req, 4096);
    if (action === 'drills') return json(res, 201, tryouts.createDrill(selectedEvent.id, sessionId, input));
    if (action === 'attempts') return json(res, 200, tryouts.record(selectedEvent.id, sessionId, input));
    return json(res, 200, tryouts.setSession(selectedEvent.id, sessionId, input));
  }
  if (path === '/admin/events' && req.method === 'GET') return json(res, 200, listEvents());
  const event = getEvent(url.searchParams.get('event'));
  if (req.method === 'GET' && path === '/admin/preview') {
    if (url.searchParams.has('event') && !event) return json(res, 404, { error: 'Evento no encontrado.' });
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(registrationPage(event ?? {
      id: '', name: 'Canelo Scout Invitational', starts: date, ends: date, venue: 'Sede por configurar', payment_instructions: ''
    }, true));
  }
  if (req.method === 'GET' && path === '/admin/event') {
    if (!event && url.searchParams.get('event')) return json(res, 404, { error: 'Evento no encontrado.' });

    return json(res, 200, { event: event ?? {name:'Todos los eventos'},
      registrationUrl: event ? registrationUrl(event.id) : '',
      teams: event ? db.prepare('SELECT * FROM teams WHERE event_id = ? ORDER BY name').all(event.id) : db.prepare('SELECT * FROM teams ORDER BY name').all(),
      players: event ? roster(event.id) : listEvents().flatMap(item => roster(item.id)) });
  }
  if (req.method === 'GET' && path === '/admin/qr' && event?.accepting) {
    const qr = await QRCode.toBuffer(registrationUrl(event.id), { width: 512, margin: 4, errorCorrectionLevel: 'M' });
    res.setHeader('Content-Type', 'image/png');
    if (url.searchParams.has('descargar')) res.setHeader('Content-Disposition', 'attachment; filename="inscripcion-qr.png"');
    return res.end(qr);
  }
  if (req.method === 'POST' && path === '/admin/events') {
    const input = await readJson(req, 16384);
    const { starts, ends, accepting } = input ?? {};
    const name = clean(input?.name);
    const venue = clean(input?.venue);
    const payment = clean(input?.payment_instructions);
    const description = clean(input?.description);
    const fee = clean(input?.fee_label);
    const contact = clean(input?.contact);
    if (fee.length > 120 || contact.length > 250) return invalid(res, 'Revisa la tarifa y el contacto.');
    if (!name || name.length > 120 || !venue || venue.length > 160 || !validDate(starts ?? '') ||
        !validDate(ends ?? '') || ends < starts || typeof accepting !== 'boolean' || payment.length > 2000 || description.length > 1200) {
      return invalid(res, 'Completa el nombre, la sede y el rango de fechas.');
    }
    if (url.searchParams.has('event') && !event) return json(res, 404, { error: 'Evento no encontrado.' });
    const id = event?.id ?? randomUUID();
    if (event) {
      if (event.starts !== starts && db.prepare('SELECT 1 FROM registrations WHERE event_id = ? LIMIT 1').get(id)) {
        return invalid(res, 'La fecha de inicio ya se usó para calcular la edad de las inscripciones recibidas.');
      }
      db.prepare('UPDATE events SET name = ?, starts = ?, ends = ?, venue = ?, accepting = ?, payment_instructions = ?, description = ? WHERE id = ?')
        .run(name, starts, ends, venue, Number(accepting), payment, description, id);
    } else {
      db.prepare('INSERT INTO events (id, name, starts, ends, venue, accepting, payment_instructions, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, name, starts, ends, venue, Number(accepting), payment, description);
    }
    db.prepare('UPDATE events SET fee_label = ?, contact = ? WHERE id = ?').run(fee, contact, id);
    return json(res, 200, { id });
  }
  if (req.method === 'POST' && path === '/admin/teams' && event) {
    const name = clean((await readJson(req, 16384))?.name);
    if (!name || name.length > 60) return invalid(res, 'Escribe un nombre de equipo de hasta 60 caracteres.');
    const result = db.prepare('INSERT OR IGNORE INTO teams VALUES (?, ?, ?)').run(randomUUID(), event.id, name);
    return result.changes ? json(res, 201, { ok: true }) : invalid(res, 'Ya existe un equipo con ese nombre.');
  }
  const playerRoute = path.match(/^\/admin\/registrations\/(CSI-[a-f0-9-]+)(?:\/(photo|receipt))?$/);
  if (playerRoute) {
    const [, id, fileField] = playerRoute;
    if (req.method === 'GET' && fileField) {
      const file = db.prepare(`SELECT ${fileField} AS bytes, ${fileField}_type AS type FROM registrations WHERE id = ?`).get(id);
      if (file) {
        const disposition = url.searchParams.has('ver') ? 'inline' : 'attachment';
        res.writeHead(200, { 'Content-Type': file.type, 'Content-Disposition': `${disposition}; filename="${fileField}.${file.type.split('/')[1]}"` });
        return res.end(file.bytes);
      }
    }
    if (req.method === 'POST' && !fileField && event &&
        db.prepare('SELECT 1 FROM registrations WHERE id = ? AND event_id = ?').get(id, event.id)) {
      const patch = await readJson(req, 16384);
      if (updateOperation({ db, id, event, patch, res, invalid }) !== true) return;
      return json(res, 200, { ok: true });
    }
  }
  return json(res, 404, { error: 'Recurso no encontrado.' });
}

const assets = new Map([
  ...['solicitudes', 'profundidad', 'operacion', 'publicacion'].map(name => ['/client/' + name + '.js', [readFileSync(new URL('./client/' + name + '.js', import.meta.url)), 'text/javascript']]),
  ['/registration.js', [registrationScript, 'text/javascript']],
  ['/operations.js', [operationsScript, 'text/javascript']],
  ['/client/sitio.js', [readFileSync(new URL('./client/sitio.js', import.meta.url)), 'text/javascript']],
  ['/client/tryouts.js', [readFileSync(new URL('./client/tryouts.js', import.meta.url)), 'text/javascript']],
  ['/showcase.js', [readFileSync(new URL('./showcase.js', import.meta.url)), 'text/javascript']],
  ['/operations.css', [readFileSync(new URL('./operations.css', import.meta.url)), 'text/css']],
  ['/public.css', [readFileSync(new URL('./public.css', import.meta.url)), 'text/css']],
  ['/shell.css', [readFileSync(new URL('./shell.css', import.meta.url)), 'text/css']],
  ['/i18n.js', [readFileSync(new URL('./i18n.js', import.meta.url)), 'text/javascript']],
  ['/login.css', [readFileSync(new URL('./login.css', import.meta.url)), 'text/css']],
  ['/login.js', [readFileSync(new URL('./login.js', import.meta.url)), 'text/javascript']]
]);

createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (req.method === 'GET' && path === '/admin') {
      return admin(req, res, '/admin/', url);
    }
    if (path.startsWith('/admin/')) return await admin(req, res, path, url);
    if (req.method === 'POST' && path === '/api/registrations') return await register(req, res);
    if (req.method === 'GET' && assets.has(path)) {
      const [body, type] = assets.get(path);
      res.setHeader('Content-Type', type + '; charset=utf-8');
      return res.end(body);
    }
    if (req.method === 'GET' && path === '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(presentationPage({ locale: requestLocale(req) }));
    }
    const event = getEvent(url.searchParams.get('event'));
    // Public API exposes only authorized profiles and sessions explicitly published by organizers.
    if (req.method === 'GET' && path === '/api/showcase') {
      const playerId = url.searchParams.get('player');
      if (!event || !/^CSI-[a-f0-9-]{36}$/.test(playerId ?? '')) {
        return json(res, 404, { error: 'Ficha deportiva no disponible.' });
      }
      const profile = tryouts.publicPlayer(event.id, playerId);
      return profile ? json(res, 200, profile) : json(res, 404, { error: 'Ficha deportiva no publicada.' });
    }
    if (req.method === 'GET' && path === '/corregir') {
      const code = url.searchParams.get('codigo')?.trim() ?? '';
      const registration = db.prepare("SELECT r.event_id FROM registrations r JOIN operations o ON o.id=r.id WHERE r.id=? AND o.status='correction'").get(code);
      if (!registration) {
        res.statusCode = 404;
        return html(res, 'Corrección no disponible', '<p>Verifica el código y el estado de la solicitud.</p><a href="/seguimiento">Consultar estado</a>');
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(registrationPage(getEvent(registration.event_id), false, code));
    }
    if (req.method === 'GET' && path === '/seguimiento') {
      const code = url.searchParams.get('codigo')?.trim() ?? '';
      const validCode = /^CSI-[a-f0-9-]{36}$/.test(code);
      const result = validCode ? db.prepare(
        'SELECT o.status, e.name AS event_name FROM registrations r ' +
        'JOIN operations o ON o.id = r.id JOIN events e ON e.id = r.event_id WHERE r.id = ?'
      ).get(code) : null;
      const statusNames = {
        review: 'En revisión', correction: 'Requiere corrección',
        rejected: 'No elegible', approved: 'Aprobada'
      };
      const outcome = !code ? '' : result ?
        '<section class="card pad"><h2>Estado de la solicitud</h2>' +
        '<p>Evento: ' + escape(result.event_name) + '</p><p><strong>Estado: ' +
        escape(statusNames[result.status] ?? 'En revisión') + '</strong></p>' +
        (result.status === 'correction' ?
          '<p>Contacta a la organización para confirmar los documentos que necesitas corregir.</p><a class="btn red" href="/corregir?codigo=' + encodeURIComponent(code) + '">Actualizar solicitud</a>' : '') +
        '</section>' :
        '<p class="notice warn">No se encontró una solicitud con ese código. Verifícalo e inténtalo nuevamente.</p>';
      return html(res, 'Seguimiento de solicitud',
        '<section class="card pad"><p>Consulta el estado de tu inscripción usando el código recibido al finalizar el formulario.</p>' +
        '<form action="/seguimiento" method="GET"><label for="request-code">Código de solicitud</label>' +
        '<input id="request-code" name="codigo" value="' + escape(code) +
        '" placeholder="CSI-..." required style="max-width:500px;display:block;margin:10px 0">' +
        '<button class="btn red">Consultar estado</button></form></section>' + outcome,
        '', { active: 'Seguimiento' });
    }
    if (req.method === 'GET' && path === '/eventos') {
      const available = publicEvents();
      return html(res, 'Eventos disponibles', '<div class="selection-grid"><p>Selecciona una edición para consultar sus detalles o inscribirte.</p>' +
        (available.length ? '<div class="event-list">' + eventCards(available) + '</div>' :
          '<div class="card public-empty">No hay ediciones públicas disponibles en este momento.</div>') + '</div>',
        '', { active: 'Eventos' });
    }
    const eventRoute = path.match(/^\/eventos\/([a-zA-Z0-9-]+)$/);
    if (req.method === 'GET' && eventRoute) {
      const selectedEvent = getEvent(eventRoute[1]);
      if (!selectedEvent) {
        res.statusCode = 404;
        return html(res, 'Evento no encontrado', '<p>Consulta los eventos disponibles.</p><a href="/eventos">Volver a eventos</a>');
      }
      const isPublic = publicEvents().some(item => item.id === selectedEvent.id);
      if (!isPublic) return html(res, 'Evento no disponible', '<p>Este evento todavía no está publicado.</p><a href="/eventos">Ver otros eventos</a>');
      const content = '<section class="card pad"><span class="eyebrow">Canelo Scout Invitational</span>' +
        '<h2 class="display">' + escape(selectedEvent.name) + '</h2>' +
        (selectedEvent.description ? '<p>' + escape(selectedEvent.description) + '</p>' : '') +
        '<p><strong>Fechas:</strong> ' + escape(selectedEvent.starts) + ' — ' + escape(selectedEvent.ends) + '</p>' +
        '<p><strong>Sede:</strong> ' + escape(selectedEvent.venue) + '</p>' +
        (selectedEvent.accepting ? '<a class="btn red" href="/registro?event=' + encodeURIComponent(selectedEvent.id) + '">Inscribirme</a>' :
          '<p class="notice">Las inscripciones no están abiertas en este momento.</p>') +
        ' <a class="btn light" href="/prensa?event=' + encodeURIComponent(selectedEvent.id) + '">Media Center</a></section>';
      return html(res, selectedEvent.name, content, '', { active: 'Eventos', eventId: selectedEvent.id, hideTitle: true });
    }
    if (req.method === 'GET' && path === '/registro' && !event) {
      if (url.searchParams.has('event')) {
        res.statusCode = 404;
        return html(res, 'Evento no encontrado', '<p>El enlace no corresponde a un evento válido.</p><a href="/eventos">Ver eventos disponibles</a>');
      }
      return redirect(res, '/eventos');
    }
    if (req.method === 'GET' && path === '/registro' && event) {
      if (!event.accepting) {
        res.statusCode = 410;
        return html(res, 'Inscripciones cerradas', `<p>${escape(event.name)}</p><p><a href="/">Ver eventos disponibles</a></p>`);
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(registrationPage(event));
    }
    if (req.method === 'GET' && path === '/prensa') {
      if (url.searchParams.get('event') && !event) {
        res.statusCode = 404;
        return html(res, 'Evento no encontrado', '<p>El enlace no corresponde a un evento disponible.</p><a href="/eventos">Ver eventos</a>');
      }
      const pressEvent = event ?? {id:'',name:'Todos los eventos',venue:'Canelo Scout'};
      const playerId = url.searchParams.get('jugador');
      const group = url.searchParams.get('grupo') ?? '';
      const query = url.searchParams.get('buscar')?.trim().toLowerCase() ?? '';
      const teamId = url.searchParams.get('equipo') ?? '';
      const published = (event ? roster(event.id) : listEvents().flatMap(item => roster(item.id))).filter(player => player.published && player.status === 'approved' &&
        player.team && player.details.consent && player.payment_status === 'validated');
      const teams = new Map(published.map(player => [player.team_id, player.team]));
      const cards = published.filter(player => (!playerId || player.id === playerId) &&
        (!teamId || player.team_id === teamId) &&
        (!group || [player.details.primary, player.details.secondary].some(position =>
          (POSITION_GROUPS[group] ?? []).includes(position))) &&
        [player.details.name, player.details.primary, player.details.secondary].some(value => String(value ?? '').toLowerCase().includes(query)))
        .map(({ id, event_id, details, team, jersey, sprint, velocity }) => `<article class="card pcard">
          <div class="cover"><span class="number">${jersey ?? '—'}</span>${escape(details.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())}</div>
          <div class="pbody"><span class="tag blue">${escape(team)}</span>
          <h3><a href="/prensa?event=${event_id}&amp;jugador=${id}">${escape(details.name)}</a></h3>
          <a class="scout-view-link" href="/prensa?event=${event_id}&amp;jugador=${id}">Ficha deportiva y resultados de tryouts ↗</a>
          <p>${escape(details.primary)} · ${escape(details.age)} años · B/T ${escape(details.bats?.[0] ?? '—')}/${escape(details.throws?.[0] ?? '—')}</p>
          <div class="stats"><div><b>${escape(details.height || '—')}</b><small>ESTATURA</small></div>
          <div><b>${escape(details.weight || '—')}</b><small>PESO</small></div>
          <div><b>${velocity === null ? '—' : velocity + ' mph'}</b><small>VELOCIDAD</small></div></div>
          ${playerId && sprint !== null ? `<p>60 yardas: ${sprint} s</p>` : ''}</div></article>`).join('');
      const selected = playerId ? published.find(player => player.id === playerId &&
        (!event || player.event_id === event.id)) : null;
      const scorecard = selected ? `<section class="wrap scout-profile" id="showcase-profile"
        data-player="${escape(selected.id)}" data-event="${escape(selected.event_id)}">
        <header class="scout-profile-heading"><div><span class="eyebrow">SCOUT REPORT · SHOWCASE</span>
          <h2>Resultados de ${escape(selected.details.name)}</h2>
          <p>Primero pruebas y mediciones de tryouts; después estadísticas del juego. Cada intento conserva su marca.</p></div>
          <button id="showcase-refresh" class="btn light" type="button">Actualizar resultados</button>
        </header><p id="showcase-updated" class="scout-updated"></p>
        <div class="scout-phase-guide" aria-label="Fases del evento">
          <span>01 · TRYOUTS</span><span>02 · JUEGO</span></div>
        <div id="showcase-body" class="scout-history" aria-live="polite"><p>Cargando resultados…</p></div>
        <p id="showcase-status" role="status" class="scout-note"></p>
      </section>` : '';
      return html(res, 'Media Center', `<section class="mediahero"><div class="wrap">
        <span class="badge">MEDIA CENTER · ACCESO PARA PRENSA</span><h1>Talento en el diamante</h1>
        <p>${escape(pressEvent.name)} · ${escape(pressEvent.venue)} · Rósters oficiales</p></div></section>
        <section class="wrap ops-press"><div class="head"><div><span class="eyebrow">Directorio de jugadores</span><h2>Perfiles publicados</h2></div>
        <form class="toolbar" action="/prensa"><select name="event" aria-label="Evento"><option value="">Todos los eventos</option>${listEvents().map(item =>
          `<option value="${item.id}" ${item.id === pressEvent.id ? 'selected' : ''}>${escape(item.name)}</option>`).join('')}</select>
        <input type="search" name="buscar" value="${escape(query)}" placeholder="Buscar jugador o posición…" aria-label="Buscar jugador o posición">
        <select name="equipo" aria-label="Equipo"><option value="">Todos los equipos</option>${[...teams].map(([id, name]) =>
          `<option value="${id}" ${id === teamId ? 'selected' : ''}>${escape(name)}</option>`).join('')}</select>
        <select name="grupo" aria-label="Grupo de posición"><option value="">Todos los grupos</option>
          ${Object.keys(POSITION_GROUPS).map(key => `<option value="${key}" ${group === key ? 'selected' : ''}>${escape({infield:'Infield',outfield:'Outfield',pitcher:'Pitchers',catcher:'Catchers'}[key])}</option>`).join('')}</select>
        <button>Filtrar</button></form></div>
        ${cards ? '<div class="mediagrid">' + cards + '</div>' : '<p>No hay perfiles publicados que coincidan.</p>'}</section>${scorecard}`,
        selected ? '<script src="/showcase.js" defer></script>' : '',
        { eventId: pressEvent.id, active: 'Prensa', hideTitle: true, fullWidth: true });
    }
    return json(res, 404, { error: 'Página no encontrada.' });
  } catch (error) {
    if (!error.status) console.error(error.message);
    return json(res, error.status ?? 500, { error: error.status ? error.message : 'No se pudo completar la operación.' });
  }
}).listen(port, process.env.BIND_HOST ?? '127.0.0.1', () => {
  console.log('CaneloScout en ' + publicOrigin.origin);
});

