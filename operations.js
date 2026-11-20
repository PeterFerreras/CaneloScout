import { render as solicitudes } from '/client/solicitudes.js';
import { render as profundidad } from '/client/profundidad.js';
import { render as operacion } from '/client/operacion.js';
import { render as publicacion } from '/client/publicacion.js';
import { render as sitio } from '/client/sitio.js';
import { render as tryoutScreen } from '/client/tryouts.js';
const mount = document.querySelector('#operations');
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const params = new URLSearchParams(location.search);
const eventId = params.get('event');
const requestedView = params.get('vista');
const view = ['solicitudes', 'rosters', 'operacion', 'tryouts', 'prensa', 'sitio'].includes(requestedView) ? requestedView : 'configuracion';
const labels = { review: 'Por revisar', correction: 'Requiere corrección', rejected: 'No elegible', approved: 'Aprobado' };
const tabs = { configuracion: 'Configuración', solicitudes: 'Solicitudes', rosters: 'Profundidad', operacion: 'Operación', tryouts: 'Tryouts', prensa: 'Publicación' };
const headings = { configuracion: 'Configuración del evento', solicitudes: 'Solicitudes y validación',
  rosters: 'Profundidad por posición', operacion: 'Rósters del Invitational', tryouts: 'Tryouts y juego', prensa: 'Publicación para prensa', sitio: 'Administración del sitio' };
const nextScreen = { solicitudes: ['rosters', 'Armar equipos'], rosters: ['operacion', 'Continuar al evento'],
  operacion: ['tryouts', 'Registrar tryouts'], tryouts: ['prensa', 'Publicar para prensa'] };
const eventQuery = eventId ? '?event=' + encodeURIComponent(eventId) : '?';
let screenPlayers = [];
let demoState;

async function api(path, payload) {
  const response = await fetch('/admin/' + path, payload === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (response.status === 401) {
    location.replace('/admin/login?next=' + encodeURIComponent('/admin/' + location.search));
    throw new Error('La sesión terminó. Vuelve a iniciar sesión.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

function eventForm(event = {}) {
  return `<form class="card event-form" data-action="event">
    <h3>Datos del evento</h3>
    <label>Nombre del evento<input name="name" required maxlength="120" value="${escape(event.name)}"></label>
    <label>Sede<input name="venue" required maxlength="160" value="${escape(event.venue)}"></label>
    <label>Descripción pública<textarea name="description" maxlength="1200" placeholder="Presenta el evento, objetivos y requisitos principales.">${escape(event.description)}</textarea></label>
    <label>Importe / tarifa pública<input name="fee_label" maxlength="120" value="${escape(event.fee_label)}" placeholder="Ej. US$100 o entrada gratuita"></label>
    <label>Contacto de la organización<input name="contact" maxlength="250" value="${escape(event.contact)}"></label>
    <div class="row"><label>Fecha de inicio<input type="date" name="starts" required value="${escape(event.starts)}"></label>
    <label>Fecha de cierre<input type="date" name="ends" required value="${escape(event.ends)}"></label></div>
    <label>Instrucciones de pago<textarea name="payment_instructions" maxlength="2000">${escape(event.payment_instructions)}</textarea></label>
    <div class="form-section"><label class="check"><input type="checkbox" name="accepting" ${event.accepting ? 'checked' : ''}> Habilitar formulario público</label>
    <p class="hint">Al abrir las inscripciones podrás compartir el enlace y el QR.</p></div>
    <div class="form-actions"><button>${event.id ? 'Guardar configuración' : 'Crear evento'}</button></div></form>`;
}

function controlMenu() {
  const entries = Object.entries(tabs);
  return `<aside class="side admin-sidebar" aria-label="Menú lateral del centro de control">
    <div class="side-intro">
      <span class="side-eyebrow">PANEL ORGANIZADOR</span>
      <h2>CENTRO DE CONTROL</h2>
      <p>Administración de eventos y talento deportivo.</p>
    </div>
    <div class="side-section-label">GESTIÓN</div>
    <nav class="side-nav" aria-label="Módulos administrativos">
      ${entries.map(([key, label], index) =>
        `<a href="/admin/${eventQuery}&vista=${key}" ${view === key ? 'aria-current="page"' : ''}>
          <span class="side-step" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <span>${key === 'configuracion' ? 'Eventos y configuración' : label}</span>
        </a>`).join('')}
    </nav>
    <div class="side-section-label side-section-secondary">SITIO WEB</div>
    <nav class="side-nav side-site-nav" aria-label="Administración del portal">
      <a href="/admin/?vista=sitio" ${view === 'sitio' ? 'aria-current="page"' : ''}>
        <span class="side-step" aria-hidden="true">⚙</span>
        <span>Administración del sitio</span>
      </a>
    </nav>
    <div class="side-section-label side-section-secondary">RECURSOS</div>
    <div class="side-shortcuts">
      <a href="/admin/preview${eventQuery}">Formulario de inscripción <span aria-hidden="true">↗</span></a>
      <a href="/prensa${eventQuery}" target="_blank" rel="noopener">Media Center público <span aria-hidden="true">↗</span></a>
    </div>
    <div class="side-bottom">
      <span class="side-indicator" aria-hidden="true"></span>
      <div><strong>Panel de administración</strong><small>Acceso restringido</small></div>
    </div>
  </aside>`;
}

const selected = (current, value) => current === value ? 'selected' : '';
const playerTitle = player => `${escape(player.details.name)} <small>${escape(player.details.primary)} / ${escape(player.details.secondary || '—')}</small>`;
const playerForm = (player, action, fields) => `<form class="card" data-action="${action}" data-player="${player.id}">
  <h3>${playerTitle(player)}</h3>${fields}${action === 'review' ? '' : '<button>Guardar</button>'}</form>`;
const empty = text => `<p class="card">${text}</p>`;
const initials = name => escape(name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase());
const statusTag = status => `<span class="tag ${status === 'approved' ? 'ok' : status === 'rejected' ? 'red' : ''}">${labels[status]}</span>`;
const positions = [
  ['Catcher', 'C', 50, 94], ['Pitcher', 'P', 50, 59], ['Primera base', '1B', 70, 55],
  ['Segunda base', '2B', 60, 42], ['Shortstop', 'SS', 40, 42], ['Tercera base', '3B', 30, 55],
  ['Left field', 'LF', 22, 28], ['Center field', 'CF', 50, 17], ['Right field', 'RF', 78, 28]
];

function operationRow(player) {
  const form = 'operation-' + player.id;
  const measurement = (name, value, rules, label) => `<input form="${form}" type="number" name="${name}" value="${escape(value)}" ${rules} aria-label="${label}">`;
  return `<tr><td><button type="button" class="btn ${player.checked ? 'green' : 'light'}" data-checkin="${player.id}" aria-pressed="${!!player.checked}">${player.checked ? 'Presente' : 'Pendiente'}</button>
    <input form="${form}" type="checkbox" name="checked" ${player.checked ? 'checked' : ''} hidden></td>
    <td><b>${escape(player.details.name)}</b><small>${player.id}</small></td><td>${escape(player.details.primary)}<small>${escape(player.details.secondary)}</small></td>
    <td>${measurement('jersey', player.jersey, 'min="0" max="999"', 'Camiseta')}</td>
    <td>${measurement('sprint', player.sprint, 'min="0.01" step="any"', '60 yardas (s)')}</td>
    <td>${measurement('velocity', player.velocity, 'min="0.01" step="any"', 'Velocidad (mph)')}</td>
    <td><span class="tag blue">${escape(player.team)}</span><form id="${form}" data-action="operate" data-player="${player.id}"><button>Guardar</button></form></td></tr>`;
}

function renderScreen(data) {
  const { event } = data;
  const context = { escape, labels, initials, statusTag, playerForm, empty, positions, selected, operationRow, eventQuery, eventId, demoState, params };
  switch (view) {
    case 'solicitudes': return solicitudes(data, context);
    case 'rosters': return profundidad(data, context);
    case 'operacion': return operacion(data, context);
    case 'tryouts': return tryoutScreen(data, context);
    case 'prensa': return publicacion(data, context);
    default:
      return eventForm(event) + `<section class="card" id="formulario"><h2>Formulario de inscripción</h2>
        <p><a href="/admin/preview${eventQuery}">Ver formulario de inscripción</a></p>${event.accepting ? `
        <p><a href="/registro${eventQuery}" target="_blank" rel="noopener">Abrir formulario</a></p>
        <label>Enlace de inscripción<input id="share-link" readonly></label>
        <button type="button" id="copy-link">Copiar enlace</button>
        <p><img class="qr" src="/admin/qr${eventQuery}" alt="QR de inscripción"></p>
        <a class="button" href="/admin/qr${eventQuery}&descargar=1">Descargar QR</a>
        <p class="hint" id="qr-hint"></p>` : '<p>Habilita el formulario público para compartir el enlace y descargar el QR.</p>'}</section>`;
  }
}

async function load() {
  if (view === 'tryouts') {
    // A tryout is always tied to a specific event. Never mix players across editions.
    if (!eventId) {
      const events = await api('events');
      screenPlayers = [];
      mount.innerHTML = '<div class="dash ops-dash admin-shell">' + controlMenu() +
        '<section class="admin-content"><div class="admin-breadcrumb">Administración / Tryouts</div>' +
        '<h2 class="display">Selecciona un evento para evaluar</h2>' +
        '<p>Cada edición tiene sus propias sesiones: primero tryouts, luego el juego.</p>' +
        '<div class="try-event-list">' + (events.map(e =>
          '<a class="card try-event-card" href="/admin/?event=' + encodeURIComponent(e.id) +
          '&vista=tryouts"><strong>' + escape(e.name) + '</strong><small>' +
          escape(e.venue) + ' · ' + escape(e.starts) + '</small></a>').join('') ||
          '<div class="card">Crea un evento en Configuración para comenzar.</div>') +
        '</div></section></div>';
      return;
    }
    const query='tryouts?event='+encodeURIComponent(eventId)+
      (params.get('session')?'&session='+encodeURIComponent(params.get('session')):'');
    const data=await api(query);
    if(data.session && !params.get('session')) {
      // Keep the selected session in the URL so edits always target the correct one.
      const q=new URLSearchParams(params);q.set('session',data.session.id);
      history.replaceState(null,'','/admin/?'+q.toString());
      params.set('session',data.session.id);
    }
    screenPlayers=data.players;
    mount.innerHTML = '<div class="dash ops-dash admin-shell">' + controlMenu() +
      '<section class="admin-content"><div class="admin-breadcrumb"><a href="/admin/">Administración</a> / Tryouts y Juego</div>' +
      '<div class="apphead"><div><span class="eyebrow">EVALUACIÓN DE JUGADORES</span>' +
      '<h2 class="display">Tryouts y juego</h2></div></div><div class="admin-module">' +
      tryoutScreen(data,{escape,eventId,params}) + '</div></section></div>';
    // Custom drill position choices only show positions matching the selected group.
    mount.querySelectorAll('[data-try-group]').forEach(groupSelect=>{
      const position=groupSelect.form.querySelector('[data-try-position]');
      const adjust=()=>{
        for(const option of position.options) option.hidden=option.value!=='all' &&
          option.dataset.group!==groupSelect.value;
        if(position.selectedOptions[0]?.hidden)position.value='all';
      };
      groupSelect.addEventListener('change',adjust);adjust();
    });
    mount.querySelectorAll('.try-attempt .try-valid input').forEach(check=>{
      const input=check.closest('form').querySelector('input[name="value"]');
      const adjust=()=>{input.disabled=!check.checked;input.required=check.checked};
      check.addEventListener('change',adjust);
      adjust();
    });
    return;
  }
  if (view === 'sitio') {
    const config = await api('site');
    screenPlayers = [];
    mount.innerHTML = '<div class="dash ops-dash admin-shell">' + controlMenu() +
      '<section class="admin-content"><div class="admin-breadcrumb"><a href="/admin/">Administración</a>' +
      '<span>/</span><strong>Sitio web</strong></div>' +
      '<div class="apphead"><div><span class="eyebrow">Configuración general</span>' +
      '<h2 class="display">Administración del sitio</h2>' +
      '<p>Contenido público, idiomas, enlaces y metadatos de búsqueda.</p></div></div>' +
      '<div class="admin-module">' + sitio(config, { escape }) + '</div></section></div>';
    return;
  }
  if (!eventId && view === 'configuracion') {
    const events = await api('events');
    mount.innerHTML = '<div class="dash ops-dash admin-shell">' + controlMenu() +
      '<section class="admin-content"><div class="admin-breadcrumb"><a href="/admin/">Administración</a><span>/</span><strong>Eventos</strong></div><div class="apphead"><div><span class="eyebrow">Organización</span><h2 class="display">Eventos y configuración</h2><p>Gestiona tus ediciones y abre sus inscripciones.</p></div></div>' +
      '<div class="ops-home"><section><h3>Mis eventos</h3>' + (events.map(event =>
      `<article class="card"><h3><a href="/admin/?event=${event.id}&vista=${encodeURIComponent(view)}">${escape(event.name)}</a></h3>
      <p>${escape(event.venue)} · ${event.starts} a ${event.ends}</p>
      <span class="tag ${event.accepting ? 'ok' : ''}">${event.accepting ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}</span></article>`).join('') ||
      empty('Todavía no tienes eventos. Completa los datos para crear el primero.')) +
      '<a class="btn light" href="/admin/preview">Ver formulario de inscripción</a></section><section><h3>Crear evento</h3>' +
      eventForm() + '</section></div></section></div>';
    return;
  }
  let data = await api('event' + eventQuery);
  screenPlayers = data.players;
  const events = await api('events');
  const filter = `<label>Evento<select id="event-filter"><option value="">Todos los eventos</option>${events.map(event =>
    `<option value="${event.id}" ${selected(eventId, event.id)}>${escape(event.name)}</option>`).join('')}</select></label>`;
  const next = nextScreen[view];
  // Un único layout para todas las vistas: menú lateral fijo y contenido fluido.
  mount.innerHTML = `<div class="dash ops-dash admin-shell">${controlMenu()}<section class="admin-content"><div class="admin-breadcrumb"><a href="/admin/">Administración</a><span>/</span><strong>${escape(headings[view] ?? headings.configuracion)}</strong></div><div class="apphead"><div><span class="eyebrow">${escape(data.event.name)}</span>
    <h2 class="display">${headings[view] ?? headings.configuracion}</h2></div>
    ${next ? `<a class="btn red" href="/admin/${eventQuery}&vista=${next[0]}">${next[1]}</a>` : ''}
    </div>${data.demo ? '<p class="notice">Demostración con jugadores y equipos ficticios. Puedes probar los cambios durante esta visita.</p>' : '<div class="admin-filter-bar">' + filter + '</div>'}<div class="admin-module ${view === 'configuracion' ? 'event-settings' : ''}">${renderScreen(data)}</div></section></div>`;
  mount.querySelector('#event-filter')?.addEventListener('change', event => {
    const query = new URLSearchParams({ vista: view });
    if (event.target.value) query.set('event', event.target.value);
    location.assign('/admin/?' + query);
  });
  setupInbox(data.players);
  mount.querySelectorAll('[data-autoassign]').forEach(select => select.addEventListener('change', () => select.form.requestSubmit()));
  mount.querySelectorAll('[data-checkin]').forEach(button => button.addEventListener('click', () => {
    const form = document.getElementById('operation-' + button.dataset.checkin);
    const checkbox = form.elements.namedItem('checked');
    checkbox.checked = !checkbox.checked;
    form.requestSubmit();
  }));
  mount.querySelectorAll('[data-position]').forEach(button => {
    button.addEventListener('click', () => {
      const position = button.dataset.position;
      mount.querySelectorAll('[data-position]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      const matches = new Set(data.players.filter(player =>
        player.status === 'approved' && (!position || [player.details.primary, player.details.secondary].includes(position)))
        .map(player => player.id));
      mount.querySelectorAll('[data-player]').forEach(form => { form.hidden = !matches.has(form.dataset.player); });
      mount.querySelector('#position-empty').hidden = !position || matches.size > 0;
    });
  });
  const share = mount.querySelector('#share-link');
  if (share) {
    share.value = data.registrationUrl;
    mount.querySelector('#copy-link').onclick = async () => {
      try {
        await navigator.clipboard.writeText(share.value);
        message('Enlace copiado.');
      } catch {
        share.select();
        message('Copia el enlace seleccionado.');
      }
    };
    if (new URL(share.value).hostname === '127.0.0.1' || new URL(share.value).hostname === 'localhost') {
      mount.querySelector('#qr-hint').textContent = 'Este enlace es local. Para escanearlo desde otro dispositivo, configura la dirección pública del servidor.';
    }
  }
}

function setupInbox(players) {
  const search = mount.querySelector('[data-search]');
  if (!search) return;
  const status = mount.querySelector('[data-status]');
  const entries = [...mount.querySelectorAll('[data-review]')];
  const forms = [...mount.querySelectorAll('[data-player]')];
  let selectedId;
  function select(id) {
    selectedId = id;
    entries.forEach(entry => entry.setAttribute('aria-pressed', String(entry.dataset.review === id)));
    forms.forEach(form => { form.hidden = form.dataset.player !== id; });
  }
  function filter() {
    const query = search.value.trim().toLowerCase();
    const matches = new Set(players.filter(player => (!status.value || player.status === status.value) &&
      [player.id, player.details.name, player.details.primary, player.details.secondary].some(value =>
        String(value ?? '').toLowerCase().includes(query))).map(player => player.id));
    entries.forEach(entry => { entry.hidden = !matches.has(entry.dataset.review); });
    mount.querySelector('[data-review-empty]').hidden = matches.size > 0;
    select(matches.has(selectedId) ? selectedId : matches.values().next().value);
  }
  entries.forEach(entry => entry.addEventListener('click', () => select(entry.dataset.review)));
  search.addEventListener('input', filter);
  status.addEventListener('change', filter);
  filter();
}

function message(text, error = false) {
  let state = document.querySelector('#operation-status');
  if (!state) {
    state = document.createElement('p');
    state.id = 'operation-status';
    state.setAttribute('role', 'status');
    mount.before(state);
  }
  state.textContent = text;
  state.className = error ? 'error' : 'success';
}

mount.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const button = event.submitter || form.querySelector('button');
  const fields = Object.fromEntries(new FormData(form, event.submitter));
  const nullableNumber = key => fields[key] === '' ? null : Number(fields[key]);
  const playerEvent = screenPlayers.find(player => player.id === form.dataset.player)?.event_id ?? eventId;
  const playerPath = 'registrations/' + form.dataset.player + '?event=' + encodeURIComponent(playerEvent ?? '');
  if (form.dataset.saving) return;
  form.dataset.saving = 'true';
  button.disabled = true;
  try {
    switch (form.dataset.action) {
      case 'site': {
        const action = fields.action;
        if (!['save', 'publish'].includes(action)) throw new Error('Acción no válida.');
        await api('site', fields);
        await load();
        message(action === 'publish' ? 'Sitio publicado correctamente.' : 'Borrador guardado correctamente.');
        return;
      }
      case 'event': {
        const result = await api('events' + (eventId ? eventQuery : ''), { ...fields, accepting: !!fields.accepting });
        if (!eventId) {
          location.assign('/admin/?event=' + result.id);
          return;
        }
        break;
      }
      case 'tryout-session': {
        const result=await api('tryouts/sessions'+eventQuery,{
          name:fields.name,date:fields.date,kind:fields.kind,note:fields.note||''
        });
        location.assign('/admin/?event='+encodeURIComponent(eventId)+
          '&vista=tryouts&session='+encodeURIComponent(result.id));
        return;
      }
      case 'tryout-status': {
        const id=params.get('session') || mount.querySelector('.try-session-link[aria-current="page"]')
          ?.href.match(/session=([^&]+)/)?.[1];
        if(!id)throw Error('Selecciona una sesión.');
        await api('tryouts/sessions/'+encodeURIComponent(id)+'/status'+eventQuery,
          {status:fields.status,published:!!fields.published});
        break;
      }
      case 'tryout-drill': {
        const id=params.get('session') || mount.querySelector('.try-session-link[aria-current="page"]')
          ?.href.match(/session=([^&]+)/)?.[1];
        if(!id)throw Error('Selecciona una sesión.');
        await api('tryouts/sessions/'+encodeURIComponent(id)+'/drills'+eventQuery,{
          name:fields.name,group:fields.group,position:fields.position,unit:fields.unit,
          attempts:Number(fields.attempts),best:fields.best,
          minValue:fields.minValue===''?null:Number(fields.minValue),
          maxValue:fields.maxValue===''?null:Number(fields.maxValue)
        });break;
      }
      case 'tryout-drill-settings': {
        const id=params.get('session');
        if(!id)throw Error('Selecciona una sesión.');
        await api('tryouts/sessions/'+encodeURIComponent(id)+'/drills/'+encodeURIComponent(fields.drillId)+eventQuery,{
          enabled:!!fields.enabled,attempts:Number(fields.attempts),best:fields.best,
          minValue:fields.minValue===''?null:Number(fields.minValue),
          maxValue:fields.maxValue===''?null:Number(fields.maxValue)
        });break;
      }
      case 'tryout-attempt': {
        const id=params.get('session') || mount.querySelector('.try-session-link[aria-current="page"]')
          ?.href.match(/session=([^&]+)/)?.[1];
        if(!id)throw Error('Selecciona una sesión.');
        await api('tryouts/sessions/'+encodeURIComponent(id)+'/attempts'+eventQuery,{
          playerId:form.dataset.player,drillId:fields.drillId,
          attemptNo:Number(fields.attemptNo),
          value:fields.delete==='true'||fields.value==null||fields.value===''?null:Number(fields.value),
          valid:!!fields.valid,delete:fields.delete==='true',note:fields.note||''
        });break;
      }
      case 'team': await api('teams' + eventQuery, fields); break;
      case 'review': case 'payment': await api(playerPath, fields); break;
      case 'assign': await api(playerPath, { team_id: fields.team_id || null }); break;
      case 'operate': await api(playerPath, { checked: !!fields.checked, jersey: nullableNumber('jersey'),
        sprint: nullableNumber('sprint'), velocity: nullableNumber('velocity') }); break;
      case 'publish': await api(playerPath, { published: !!fields.published }); break;
    }
    await load();
    message('Cambios guardados.');
  } catch (error) {
    message(error.message, true);
  } finally {
    delete form.dataset.saving;
    button.disabled = false;
  }
});

load().catch(error => message(error.message, true));
