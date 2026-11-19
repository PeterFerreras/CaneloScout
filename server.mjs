import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import QRCode from 'qrcode';
import { runInNewContext } from 'node:vm';

const adminPassword = process.env.ADMIN_PASSWORD;
const port = Number(process.env.PORT ?? 8091);
const publicOrigin = new URL(process.env.PUBLIC_ORIGIN ?? 'http://127.0.0.1:' + port);
if (!['http:', 'https:'].includes(publicOrigin.protocol) || publicOrigin.username || publicOrigin.password) {
  throw new Error('PUBLIC_ORIGIN debe ser una dirección HTTP o HTTPS.');
}
const registrationUrl = id => new URL('/registro?event=' + encodeURIComponent(id), publicOrigin).href;
const databaseDirectory = new URL('./data/', import.meta.url);
const root = readFileSync(new URL('./dist/index.html', import.meta.url), 'utf8')
  .replace('Solo el día 7', 'Solo el primer día')
  .replace('Solo el día 8', 'Solo el segundo día');
const registrationScript = readFileSync(new URL('./registration.js', import.meta.url));
const operationsScript = readFileSync(new URL('./operations.js', import.meta.url));

function validDate(value) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

if (!adminPassword || adminPassword.length < 12) {
  throw new Error('Define ADMIN_PASSWORD (mínimo 12 caracteres).');
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
db.exec('INSERT OR IGNORE INTO operations (id) SELECT id FROM registrations');

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
  const event = typeof input?.eventId === 'string' && db.prepare('SELECT * FROM events WHERE id = ? AND accepting = 1').get(input.eventId);
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
  const id = 'CSI-' + randomUUID();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO registrations VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, new Date().toISOString(), JSON.stringify({ ...details, age, eventDate, consent: true, truth: true }),
        photo.bytes, photo.type, receipt.bytes, receipt.type, event.id);
    db.prepare('INSERT INTO operations (id) VALUES (?)').run(id);
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
let failedLogins = [];

function loginTarget(value) {
  if (typeof value !== 'string' || !/^\/admin\/(?:preview)?(?:\?|$)/.test(value)) return '/admin/';
  return value.split('#')[0];
}

function loginPage(res, error = '', next = '/admin/') {
  const head = root.slice(0, root.indexOf('</head>'))
    .replace('<title>Canelo Scout Invitational · MVP</title>', '<title>Iniciar sesión | Canelo Scout</title>');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(`${head}<style>
    .login-brand{color:inherit;text-decoration:none}
    .login-main{min-height:calc(100vh - 86px);padding:48px 20px;background:var(--p);display:grid;place-items:center}
    .login-grid{width:100%;max-width:440px;padding:0}
    .login-main h1{font:36px Anton;color:var(--n);margin:6px 0 24px}
    .login-form{color:var(--i);padding:clamp(24px,5vw,40px);box-shadow:0 16px 50px #071b3d12}
    .login-form label{display:block;font-weight:700;margin-bottom:6px}
    .login-form input:not([type=hidden]){width:100%;padding:12px;border:1px solid var(--l);border-radius:8px}
    .login-return{display:block;text-align:center;margin-top:22px;color:var(--b);text-decoration:none}
    .login-main .login-error{color:#a70d28;background:#fde2e7;padding:10px;font-size:14px;border-radius:8px}
    .login-form .field{margin-bottom:16px}
    .login-form .btn{width:100%;margin-top:6px}
    @media(max-width:720px){.login-grid{grid-template-columns:1fr}}
    </style></head><body><div class="stripe"></div>
    <header><div class="nav"><a class="brand login-brand" href="/">
    <span class="mark" aria-hidden="true">CS</span><span><small>PLATAFORMA OFICIAL</small><strong>CANELO SCOUT</strong></span></a></div></header>
    <main class="login-main"><div class="login-grid">
    <form class="card login-form" method="post" action="/admin/login">
    <input type="hidden" name="next" value="${escape(next)}">
    <span class="eyebrow">Panel organizador</span><h1>Iniciar sesión</h1>
    ${error ? `<p class="login-error" role="alert">${escape(error)}</p>` : ''}
    <div class="field"><label for="login-user">Usuario</label><input id="login-user" name="username" autocomplete="username" required maxlength="80" autofocus></div>
    <div class="field"><label for="login-password">Contraseña</label><input id="login-password" name="password" type="password" autocomplete="current-password" required maxlength="512"></div>
    <button class="btn red">Entrar al panel</button></form><a class="login-return" href="/">← Volver a Canelo Scout</a>
    </div></main></body></html>`);
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
  failedLogins = failedLogins.filter(time => now - time < 60_000);
  if (failedLogins.length >= 8) {
    res.statusCode = 429;
    return loginPage(res, 'Hubo varios intentos fallidos. Espera un minuto.');
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
  if (form.get('username') !== 'admin' ||
      !timingSafeEqual(passwordDigest, digest(form.get('password') ?? ''))) {
    failedLogins.push(now);
    res.statusCode = 401;
    return loginPage(res, 'El usuario o la contraseña son incorrectos.', next);
  }
  failedLogins = [];
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
const samplePlayers = runInNewContext(root.match(/const seed=.*?;\r?\n/)[0] + ';seed');
function demonstration() {
  const teams = ['Azul', 'Rojo'].map(name => ({ id: 'demo-' + name, event_id: 'demo', name }));
  return {
    demo: true, event: { name: 'Demostración · Canelo Scout' }, teams,
    players: samplePlayers.map(player => ({
      id: player.id, event_id: 'demo', details: { ...player, consent: true, email: 'ejemplo@example.com', phone: 'Datos de ejemplo' },
      status: player.status, note: '', team_id: player.team ? 'demo-' + player.team : null, team: player.team,
      jersey: player.number === '' ? null : player.number, checked: false,
      sprint: player.sprint ? Number(player.sprint) : null, velocity: parseFloat(player.velo) || null,
      published: player.status === 'approved'
    }))
  };
}

function navigation(eventId, active, privateView = false) {
  const query = eventId ? '?event=' + encodeURIComponent(eventId) : '';
  if (!privateView) {
    const links = [
      ['Inicio', '/'],
      ['Eventos', '/eventos'],
      ['Media Center', '/prensa' + query]
    ];
    if (eventId && getEvent(eventId)?.accepting) links.push(['Inscribirme', '/registro' + query]);
    else if (listEvents().some(event => event.accepting)) links.push(['Inscribirme', '/eventos']);
    return '<nav class="public-nav" aria-label="Navegación pública">' +
      links.map(([label, href]) => '<a href="' + escape(href) + '"' +
        (active === label ? ' aria-current="page"' : '') +
        (label === 'Inscribirme' ? ' class="nav-cta"' : '') + '>' + label + '</a>').join('') + '</nav>';
  }
  const panel = '/admin/' + query;
  const sep = query ? '&' : '?';
  const links = [
    ['Eventos', '/admin/'],
    ['Solicitudes', panel + sep + 'vista=solicitudes'],
    ['Profundidad', panel + sep + 'vista=rosters'],
    ['Operación', panel + sep + 'vista=operacion'],
    ['Publicación', panel + sep + 'vista=prensa'],
    ['Ver portal ↗', '/']
  ];
  return '<nav class="links ops-links" aria-label="Navegación de administración">' +
    links.map(([label, href]) => '<a href="' + escape(href) + '"' +
      ((label === active || label === 'Eventos' && active === 'Configuración') ? ' aria-current="page"' : '') +
      '>' + label + '</a>').join('') + '</nav>';
}

function documentHead(title, privateView = false) {
  return root.slice(0, root.indexOf('</head>'))
    .replace('<title>Canelo Scout Invitational · MVP</title>',
      '<title>' + escape(title) + ' | Canelo Scout</title>') +
    '<link rel="stylesheet" href="' + (privateView ? '/operations.css' : '/public.css') + '"></head>';
}

function header(eventId = '', active = 'Inicio', privateView = false) {
  return '<div class="stripe"></div><header><div class="nav ' +
    (privateView ? 'admin-header' : 'public-header') + '">' +
    '<a class="brand public-brand" href="/"><span class="mark" aria-hidden="true">CS</span>' +
    '<span><small>PLATAFORMA DE SCOUTING</small><strong>CANELO SCOUT</strong></span></a>' +
    navigation(eventId, active, privateView) + '</div></header>';
}

function footer(privateView = false) {
  return '<footer class="' + (privateView ? '' : 'public-footer') +
    '"><div class="wrap"><strong>CANELO SCOUT</strong>' +
    '<p>' + (privateView ? 'Centro de control de eventos deportivos.' :
    'Registro de jugadores, eventos y perfiles de scouting.') + '</p></div></footer>';
}

function html(res, title, content, script = '', options = {}) {
  const privateView = !!options.privateView;
  const eventId = options.eventId ?? '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(documentHead(title, privateView) + '<body>' +
    header(eventId, options.active || 'Inicio', privateView) +
    '<main class="' + (privateView ? 'workspace' : 'public-main') + ' ' +
      (options.fullWidth ? '' : 'app') + '">' +
      (options.hideTitle ? '' : '<div class="apphead"><div><h1>' + escape(title) + '</h1></div></div>') +
      content + '</main>' + footer(privateView) + script + '</body></html>');
}

function registrationPage(event, preview = false) {
  const format = new Intl.DateTimeFormat('es-DO', { dateStyle: 'long', timeZone: 'UTC' });
  const dateLabel = event.starts === event.ends ? format.format(new Date(event.starts)) :
    format.formatRange(new Date(event.starts), new Date(event.ends));
  let content = root.slice(root.indexOf('<main id="register"'), root.indexOf('<main id="admin"'))
    .replace('<main id="register" class="view">', '<main id="register" class="view active public-main">')
    .replace('<h1>CANELO SCOUT INVITATIONAL</h1>', '<h1>' + escape(event.name) + '</h1>')
    .replace('7 y 8 de noviembre de 2026 · República Dominicana', escape(dateLabel + ' · ' + event.venue))
    .replace('Asistencia 7 y 8 de noviembre', 'Disponibilidad para el evento')
    .replace('<div class="notice">Completa este formulario', event.description ?
      '<div class="notice">' + escape(event.description) + '</div><div class="notice">Completa este formulario' :
      '<div class="notice">Completa este formulario')
    .replace('US$100 o RD$6,200', 'Información del evento')
    .replace(/<div class="pay">.*?<\/div>/,
      '<div class="pay" style="white-space:pre-wrap">' +
      escape(event.payment_instructions || 'Consulta con la organización las instrucciones de pago.') + '</div>')
    .replace('La descripción debe incluir el nombre del jugador. Asistencia: <strong>+1 914-490-9560</strong>.',
      'Verifica los datos de pago con la organización antes de realizar una transferencia.')
    .replace('Esta maqueta conserva los datos solo en este navegador.', 'Tu solicitud fue recibida y se encuentra en revisión.')
    .replace('<button class="btn" onclick="go(\'admin\')">Ver en solicitudes</button>',
      '<a class="btn" href="/">Volver al inicio</a>')
    .replace('REGISTRO ABIERTO', preview ? 'VISTA PREVIA' : 'REGISTRO ABIERTO');
  if (preview) content = content.replace('<div id="formarea"',
    '<div class="notice" role="note">Vista previa: puedes recorrer el formulario sin guardar solicitudes.</div><div id="formarea"');
  return documentHead(preview ? 'Vista previa de inscripción' : event.name + ' · Inscripción') +
    '<body>' + header(event.id, 'Inscribirme') + content + footer() +
    '<div id="toast" class="toast" role="status" aria-live="polite"></div>' +
    '<div id="active-event" data-id="' + escape(event.id) + '" data-starts="' +
    escape(event.starts) + '" data-preview="' + preview + '" hidden></div>' +
    '<script src="/registration.js" defer></script></body></html>';
}

function eventCards(events) {
  return events.map(event => {
    const link = '/eventos/' + encodeURIComponent(event.id);
    const description = event.description ? '<p>' + escape(event.description) + '</p>' : '';
    return '<article class="card event-card"><span class="tag ' +
      (event.accepting ? 'ok' : 'blue') + '">' +
      (event.accepting ? 'Inscripciones abiertas' : 'Evento disponible') +
      '</span><h3>' + escape(event.name) + '</h3>' + description +
      '<p class="event-meta">' + escape(event.venue) + '</p>' +
      '<p>' + escape(event.starts) + ' — ' + escape(event.ends) + '</p>' +
      '<div class="actions"><a class="btn light" href="' + link + '">Ver detalles</a>' +
      (event.accepting ? '<a class="btn red" href="/registro?event=' +
      encodeURIComponent(event.id) + '">Inscribirme</a>' : '') +
      '</div></article>';
  }).join('');
}

function publicEvents() {
  return listEvents().filter(event => event.accepting || db.prepare(
    'SELECT 1 FROM operations o JOIN registrations r ON r.id=o.id WHERE r.event_id=? AND o.published=1 LIMIT 1'
  ).get(event.id));
}

function presentationPage() {
  let home = root.slice(root.indexOf('<main id="home"'), root.indexOf('<main id="register"'))
    .replace('<main id="home" class="view active">', '<main id="home" class="view active public-main">')
    .replace('<button class="btn red" onclick="go(\'register\')">Comenzar registro</button>',
      '<a class="btn red" href="/eventos">Comenzar registro</a>')
    .replace('<button class="btn white" onclick="go(\'admin\')">Ver centro de control</button>',
      '<a class="btn white" href="/#eventos">Ver eventos</a>')
    .replace(/7 y 8 de noviembre de 2026/g, 'Próximas ediciones');
  const available = publicEvents();
  const catalog = '<section class="section event-catalog" id="eventos"><div class="wrap">' +
    '<div class="head"><div><span class="eyebrow">Canelo Scout</span><h2>EVENTOS</h2>' +
    '<p>Consulta las ediciones disponibles, las fechas y el proceso de inscripción.</p></div></div>' +
    (available.length ? '<div class="event-list">' + eventCards(available) + '</div>' :
      '<div class="card public-empty">Actualmente no hay eventos abiertos para inscripción.</div>') +
    '</div></section>';
  return documentHead('Inicio') + '<body>' + header('', 'Inicio') +
    home + catalog + footer() + '</body></html>';
}

function roster(eventId) {
  return db.prepare(`SELECT r.id, r.event_id, r.created_at, r.details, o.status, o.note, o.team_id, o.jersey,
    o.checked, o.sprint, o.velocity, o.published, t.name AS team
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
    if (req.method === 'GET' && ['/admin/', '/admin/preview'].includes(path)) {
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
    const active = ({ solicitudes: 'Solicitudes', rosters: 'Rósters', operacion: 'Evento', prensa: 'Prensa' })[url.searchParams.get('vista')] ?? 'Configuración';
    return html(res, 'Panel de eventos', '<form class="session-actions" method="post" action="/admin/logout"><button>Cerrar sesión</button></form><div id="operations"></div>',
      '<script src="/operations.js" defer></script>', { eventId, active, privateView: true, hideTitle: true });
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
    if (!event && !listEvents().length) return json(res, 200, demonstration());
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
      const existing = db.prepare('SELECT * FROM operations WHERE id = ?').get(id);
      const next = { ...existing, ...patch };
      if (!['review', 'correction', 'rejected', 'approved'].includes(next.status) ||
          typeof next.note !== 'string' || next.note.length > 2000 ||
          typeof next.checked !== 'boolean' && ![0, 1].includes(next.checked) ||
          typeof next.published !== 'boolean' && ![0, 1].includes(next.published)) {
        return invalid(res, 'Revisa el estado y la nota de la solicitud.');
      }
      if (next.team_id !== null && (typeof next.team_id !== 'string' ||
          !db.prepare('SELECT 1 FROM teams WHERE id = ? AND event_id = ?').get(next.team_id, event.id))) {
        return invalid(res, 'Selecciona un equipo de este evento.');
      }
      if (next.status !== 'approved') {
        Object.assign(next, { team_id: null, jersey: null, checked: 0, sprint: null, velocity: null, published: 0 });
      }
      if (next.team_id !== existing.team_id) Object.assign(next, { jersey: null, published: 0 });
      if (next.published && !next.team_id) return invalid(res, 'Asigna un equipo antes de publicar.');
      if (next.jersey !== null && (!next.team_id || !Number.isInteger(next.jersey) || next.jersey < 0 || next.jersey > 999)) {
        return invalid(res, 'Usa un número de camiseta entre 0 y 999 para un jugador con equipo.');
      }
      if ([next.sprint, next.velocity].some(value => value !== null && !(typeof value === 'number' && Number.isFinite(value) && value > 0))) {
        return invalid(res, 'Las mediciones deben ser números positivos.');
      }
      if (next.jersey !== null && db.prepare('SELECT 1 FROM operations WHERE team_id = ? AND jersey = ? AND id <> ?')
          .get(next.team_id, next.jersey, id)) return invalid(res, 'Ese número ya está en uso en el equipo.');
      db.prepare('UPDATE operations SET status = ?, note = ?, team_id = ?, jersey = ?, checked = ?, sprint = ?, velocity = ?, published = ? WHERE id = ?')
        .run(next.status, next.note, next.team_id, next.jersey, Number(next.checked), next.sprint, next.velocity, Number(next.published), id);
      return json(res, 200, { ok: true });
    }
  }
  return json(res, 404, { error: 'Recurso no encontrado.' });
}

const assets = new Map([
  ['/registration.js', [registrationScript, 'text/javascript']],
  ['/operations.js', [operationsScript, 'text/javascript']],
  ['/operations.css', [readFileSync(new URL('./operations.css', import.meta.url)), 'text/css']],
  ['/public.css', [readFileSync(new URL('./public.css', import.meta.url)), 'text/css']]
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
      return res.end(presentationPage());
    }
    const event = getEvent(url.searchParams.get('event'));
    if (req.method === 'GET' && path === '/eventos') {
      const available = publicEvents();
      return html(res, 'Eventos disponibles', '<div class="selection-grid"><p>Selecciona una edición para consultar sus detalles o inscribirte.</p>' +
        (available.length ? '<div class="event-list">' + eventCards(available) + '</div>' :
          '<div class="card public-empty">No hay ediciones públicas disponibles en este momento.</div>') + '</div>',
        '', { active: 'Eventos' });
    }
    const eventRoute = path.match(/^\/eventos\/([a-f0-9-]{36})$/);
    if (req.method === 'GET' && eventRoute) {
      const selectedEvent = getEvent(eventRoute[1]);
      if (!selectedEvent) return html(res, 'Evento no encontrado', '<p>Consulta los eventos disponibles.</p><a href="/eventos">Volver a eventos</a>');
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
      if (url.searchParams.has('event') && !event) {
        res.statusCode = 404;
        return html(res, 'Evento no encontrado', '<p>El enlace no corresponde a un evento disponible.</p><a href="/eventos">Ver eventos</a>');
      }
      const pressEvent = event ?? {id:'',name:'Todos los eventos',venue:'Canelo Scout'};
      const playerId = url.searchParams.get('jugador');
      const query = url.searchParams.get('buscar')?.trim().toLowerCase() ?? '';
      const teamId = url.searchParams.get('equipo') ?? '';
      const demo = !event && !listEvents().length;
      const published = (demo ? demonstration().players : event ? roster(event.id) : listEvents().flatMap(item => roster(item.id))).filter(player => player.published && player.status === 'approved' &&
        player.team && player.details.consent);
      const teams = new Map(published.map(player => [player.team_id, player.team]));
      const cards = published.filter(player => (!playerId || player.id === playerId) &&
        (!teamId || player.team_id === teamId) &&
        [player.details.name, player.details.primary, player.details.secondary].some(value => String(value ?? '').toLowerCase().includes(query)))
        .map(({ id, event_id, details, team, jersey, sprint, velocity }) => `<article class="card pcard">
          <div class="cover"><span class="number">${jersey ?? '—'}</span>${escape(details.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())}</div>
          <div class="pbody"><span class="tag blue">${escape(team)}</span>
          <h3><a href="/prensa?event=${event_id}&amp;jugador=${id}">${escape(details.name)}</a></h3>
          <p>${escape(details.primary)} · ${escape(details.age)} años · B/T ${escape(details.bats?.[0] ?? '—')}/${escape(details.throws?.[0] ?? '—')}</p>
          <div class="stats"><div><b>${escape(details.height || '—')}</b><small>ESTATURA</small></div>
          <div><b>${escape(details.weight || '—')}</b><small>PESO</small></div>
          <div><b>${velocity === null ? '—' : velocity + ' mph'}</b><small>VELOCIDAD</small></div></div>
          ${playerId && sprint !== null ? `<p>60 yardas: ${sprint} s</p>` : ''}</div></article>`).join('');
      return html(res, 'Media Center', `<section class="mediahero"><div class="wrap">
        <span class="badge">MEDIA CENTER · ACCESO PARA PRENSA</span><h1>Talento en el diamante</h1>
        <p>${escape(pressEvent.name)} · ${escape(pressEvent.venue)} · Rósters oficiales</p></div></section>
        <section class="wrap ops-press">${demo ? '<p class="notice">Demostración con jugadores ficticios.</p>' : ''}<div class="head"><div><span class="eyebrow">Directorio de jugadores</span><h2>Perfiles publicados</h2></div>
        <form class="toolbar" action="/prensa"><select name="event" aria-label="Evento"><option value="">Todos los eventos</option>${listEvents().map(item =>
          `<option value="${item.id}" ${item.id === pressEvent.id ? 'selected' : ''}>${escape(item.name)}</option>`).join('')}</select>
        <input type="search" name="buscar" value="${escape(query)}" placeholder="Buscar jugador o posición…" aria-label="Buscar jugador o posición">
        <select name="equipo" aria-label="Equipo"><option value="">Todos los equipos</option>${[...teams].map(([id, name]) =>
          `<option value="${id}" ${id === teamId ? 'selected' : ''}>${escape(name)}</option>`).join('')}</select><button>Filtrar</button></form></div>
        ${cards ? '<div class="mediagrid">' + cards + '</div>' : '<p>No hay perfiles publicados que coincidan.</p>'}</section>`,
        '', { eventId: pressEvent.id, active: 'Prensa', hideTitle: true, fullWidth: true });
    }
    return json(res, 404, { error: 'Página no encontrada.' });
  } catch (error) {
    if (!error.status) console.error(error.message);
    return json(res, error.status ?? 500, { error: error.status ? error.message : 'No se pudo completar la operación.' });
  }
}).listen(port, process.env.BIND_HOST ?? '127.0.0.1', () => {
  console.log('CaneloScout en ' + publicOrigin.origin);
});

