const mount = document.querySelector('#operations');
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const params = new URLSearchParams(location.search);
const eventId = params.get('event');
const view = params.get('vista') || 'configuracion';
const labels = { review: 'Por revisar', correction: 'Requiere corrección', rejected: 'No elegible', approved: 'Aprobado' };
const tabs = { configuracion: 'Configuración', solicitudes: 'Solicitudes', rosters: 'Profundidad', operacion: 'Operación', prensa: 'Publicación' };
const headings = { configuracion: 'Configuración del evento', solicitudes: 'Solicitudes y validación',
  rosters: 'Profundidad por posición', operacion: 'Rósters del Invitational', prensa: 'Publicación para prensa' };
const nextScreen = { solicitudes: ['rosters', 'Armar equipos'], rosters: ['operacion', 'Continuar al evento'],
  operacion: ['prensa', 'Publicar para prensa'] };
const eventQuery = '?event=' + encodeURIComponent(eventId ?? '');
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
    <div class="row"><label>Fecha de inicio<input type="date" name="starts" required value="${escape(event.starts)}"></label>
    <label>Fecha de cierre<input type="date" name="ends" required value="${escape(event.ends)}"></label></div>
    <label>Instrucciones de pago<textarea name="payment_instructions" maxlength="2000">${escape(event.payment_instructions)}</textarea></label>
    <div class="form-section"><label class="check"><input type="checkbox" name="accepting" ${event.accepting ? 'checked' : ''}> Habilitar formulario público</label>
    <p class="hint">Al abrir las inscripciones podrás compartir el enlace y el QR.</p></div>
    <div class="form-actions"><button>${event.id ? 'Guardar configuración' : 'Crear evento'}</button></div></form>`;
}

function controlMenu() {
  return `<aside class="side"><h3>CENTRO DE CONTROL</h3><nav aria-label="Centro de control">
    ${Object.entries(tabs).map(([key, label]) => `<a href="/admin/${eventQuery}&vista=${key}" ${view === key ? 'aria-current="page"' : ''}>${key === 'configuracion' ? 'Eventos y configuración' : label}</a>`).join('')}
    <div class="side-divider"></div><a href="/admin/preview${eventQuery}">Formulario de inscripción</a>
    <a href="/prensa${eventQuery}">Media Center público ↗</a></nav></aside>`;
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

function renderScreen({ event, teams, players }) {
  const approved = players.filter(player => player.status === 'approved');
  switch (view) {
    case 'solicitudes':
      return `<div class="metrics">${[['Solicitudes', players.length], ['Por revisar', players.filter(p => p.status === 'review').length],
        ['Aprobadas', approved.length], ['Equipos creados', teams.length]].map(([label, count]) => `<div class="card metric"><small>${label}</small><strong>${count}</strong></div>`).join('')}</div>
        <div class="ops-inbox"><section class="card"><h2 class="display">Bandeja de solicitudes</h2>
        <div class="toolbar"><input type="search" data-search aria-label="Buscar jugador" placeholder="Buscar jugador…">
        <select data-status aria-label="Filtrar estado"><option value="">Todos los estados</option>${Object.entries(labels).map(([value,label]) => `<option value="${value}">${label}</option>`).join('')}</select></div>
        ${players.map(player => `<button type="button" class="request" data-review="${player.id}"><span class="avatar">${initials(player.details.name)}</span>
          <span><strong>${escape(player.details.name)}</strong><small>${player.id} · ${escape(player.details.age)} años</small></span>
          <span><strong>${escape(player.details.primary)}</strong><small>${escape(player.details.secondary)}</small></span>${statusTag(player.status)}</button>`).join('')}
        <p data-review-empty hidden>No hay solicitudes que coincidan.</p></section><section>` +
        (players.map(player => playerForm(player, 'review', `
        <div class="photo">${demoState ? initials(player.details.name) : `<img src="/admin/registrations/${player.id}/photo?ver=1" alt="Foto de ${escape(player.details.name)}">`}</div>
        ${statusTag(player.status)}<div class="data"><div><small>Edad</small><b>${escape(player.details.age)} años</b></div>
        <div><small>Batea / lanza</small><b>${escape(player.details.bats)} / ${escape(player.details.throws)}</b></div></div>
        <p>${escape(player.details.email)} · ${escape(player.details.phone)} · ${escape(player.details.age)} años</p>
        <h4>Documento cargado</h4><p class="receipt">Comprobante de pago · Ref. ${escape(player.details.payref || '—')}</p>
        ${demoState ? '<p class="notice">Comprobante de ejemplo · RD$ 6,200.00</p>' : `<a class="btn light" href="/admin/registrations/${player.id}/receipt?ver=1" target="_blank" rel="noopener">Ampliar comprobante</a>`}
        <details><summary>Datos de inscripción</summary><dl>${Object.entries({
          'Código': player.id, 'Fecha de nacimiento': player.details.birth, 'Nacionalidad': player.details.nationality,
          'Ciudad': player.details.city, 'Tutor': player.details.guardian, 'Teléfono del tutor': player.details.guardianPhone,
          'Academia': player.details.academy, 'Nivel': player.details.level, 'Batea': player.details.bats, 'Lanza': player.details.throws,
          'Estatura': player.details.height, 'Peso': player.details.weight, 'Asistencia': player.details.attendance,
          'Referencia de pago': player.details.payref
        }).map(([label, value]) => `<dt>${label}</dt><dd>${escape(value || '—')}</dd>`).join('')}</dl></details>
        <label>Nota interna<textarea name="note" placeholder="Observaciones…" maxlength="2000">${escape(player.note)}</textarea></label>
        <div class="decisions"><button name="status" value="correction">Pedir corrección</button>
        <button name="status" value="rejected">No elegible</button><button name="status" value="approved">Aprobar solicitud y pago</button>
        <button name="status" value="${player.status}">Guardar nota</button></div>`)).join('') ||
        empty('Todavía no se han recibido solicitudes.')) + '</section></div>';
    case 'rosters':
      return `<p class="notice warn">Selecciona una posición para consultar jugadores por su posición principal o secundaria.</p>
        <div class="diamondgrid"><div><div class="diamond" aria-label="Posiciones de béisbol">${positions.map(([position, short, left, top]) =>
          `<button class="pos" type="button" style="left:${left}%;top:${top}%" data-position="${position}" aria-label="${position}" aria-pressed="false">
          ${short} <span>${approved.filter(player => [player.details.primary, player.details.secondary].includes(position)).length}</span></button>`).join('')}</div>
          <p><button type="button" data-position="" aria-pressed="true">Todas las posiciones</button></p></div><div>
          <h3>Jugadores aprobados</h3><p id="position-empty" hidden>Sin jugadores en esta posición.</p>` +
        (approved.map(player => `<form class="chip assignment" data-action="assign" data-player="${player.id}"><span class="avatar">${initials(player.details.name)}</span>
          <span><b>${escape(player.details.name)}</b><small>${escape(player.details.primary)} / ${escape(player.details.secondary || '—')}</small></span>
          <label class="sr-only" for="team-${player.id}">Equipo de ${escape(player.details.name)}</label><select id="team-${player.id}" name="team_id" data-autoassign>
          <option value="">Sin asignar</option>${teams.filter(team => !player.event_id || team.event_id === player.event_id).map(team =>
            `<option value="${team.id}" ${selected(player.team_id, team.id)}>${escape(team.name)}</option>`).join('')}</select><button class="sr-only">Guardar</button></form>`).join('') ||
          empty('Los jugadores aprobados aparecerán aquí.')) +
          `${eventId || demoState ? '<form class="team-create" data-action="team"><label>Nuevo equipo<input name="name" required maxlength="60" placeholder="Nombre del equipo"></label><button>+ Crear otro equipo</button></form>' : '<p class="notice">Selecciona un evento para crear equipos.</p>'}</div></div>`;
    case 'operacion': {
      const assigned = approved.filter(player => player.team_id);
      const active = teams.some(team => team.id === params.get('equipo')) ? params.get('equipo') : assigned[0]?.team_id;
      return `<div class="teams ops-team-tabs">${teams.map(team => `<a class="btn ${team.id === active ? '' : 'light'}" href="/admin/${eventQuery}&vista=operacion&equipo=${team.id}">${escape(team.name)}</a>`).join('')}
        <a class="btn light" href="/admin/${eventQuery}&vista=rosters">+ Nuevo equipo</a></div>
        <p class="notice">El sistema advierte si un número de camiseta ya está en uso dentro del equipo.</p>
        <div class="card ops-table"><table><thead><tr><th>Check-in</th><th>Jugador</th><th>Posición</th><th># Chaqueta</th>
        <th>60 yd</th><th>Velocidad</th><th>Estado</th></tr></thead><tbody>${assigned.filter(player => player.team_id === active).map(operationRow).join('') || '<tr><td colspan="7">Todavía no hay jugadores asignados a equipos.</td></tr>'}</tbody></table></div>`;
    }
    case 'prensa':
      return `<p><a href="/prensa${eventQuery}" target="_blank" rel="noopener">Abrir Media Center</a></p>` +
        (approved.filter(player => player.team_id && player.details.consent).map(player => playerForm(player, 'publish', `
          <p>${escape(player.team)}</p><label class="check"><input type="checkbox" name="published" ${player.published ? 'checked' : ''}> Publicar perfil deportivo</label>`)).join('') ||
          empty('Los jugadores con autorización de publicación y equipo asignado aparecerán aquí.'));
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
  if (!eventId && view === 'configuracion') {
    const events = await api('events');
    mount.innerHTML = '<div class="dash ops-dash">' + controlMenu() +
      '<section><div class="apphead"><div><span class="eyebrow">Organización</span><h2 class="display">Eventos y configuración</h2><p>Gestiona tus ediciones y abre sus inscripciones.</p></div></div>' +
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
  if (data.demo) {
    if (!demoState) {
      try { demoState = JSON.parse(sessionStorage.getItem('canelo-demo')) || data; }
      catch { demoState = data; }
    }
    data = demoState;
  } else demoState = undefined;
  screenPlayers = data.players;
  const events = await api('events');
  const filter = `<label>Evento<select id="event-filter"><option value="">Todos los eventos</option>${events.map(event =>
    `<option value="${event.id}" ${selected(eventId, event.id)}>${escape(event.name)}</option>`).join('')}</select></label>`;
  const next = nextScreen[view];
  const sidebar = ['solicitudes', 'configuracion'].includes(view);
  mount.innerHTML = `<div class="${sidebar ? 'dash ops-dash' : 'screen-wide'}">${sidebar ? controlMenu() : ''}<section><div class="apphead"><div><span class="eyebrow">${escape(data.event.name)}</span>
    <h2 class="display">${headings[view] ?? headings.configuracion}</h2></div>
    ${next ? `<a class="btn red" href="/admin/${eventQuery}&vista=${next[0]}">${next[1]}</a>` : ''}
    </div>${data.demo ? '<p class="notice">Demostración con jugadores y equipos ficticios. Puedes probar los cambios durante esta visita.</p>' : filter}<div class="${view === 'configuracion' ? 'event-settings' : ''}">${renderScreen(data)}</div></section></div>`;
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
  const button = form.querySelector('button');
  const fields = Object.fromEntries(new FormData(form, event.submitter));
  const nullableNumber = key => fields[key] === '' ? null : Number(fields[key]);
  const playerEvent = screenPlayers.find(player => player.id === form.dataset.player)?.event_id ?? eventId;
  const playerPath = 'registrations/' + form.dataset.player + '?event=' + encodeURIComponent(playerEvent ?? '');
  button.disabled = true;
  try {
    if (demoState && form.dataset.action === 'team') {
      const name = fields.name.trim();
      if (demoState.teams.some(team => team.name.toLowerCase() === name.toLowerCase())) throw new Error('Ya existe ese equipo.');
      demoState.teams.push({ id: 'demo-' + crypto.randomUUID(), event_id: 'demo', name });
      sessionStorage.setItem('canelo-demo', JSON.stringify(demoState));
      await load();
      message('Equipo creado en la demostración.');
      return;
    }
    if (demoState && form.dataset.player) {
      const player = demoState.players.find(player => player.id === form.dataset.player);
      if (form.dataset.action === 'review') Object.assign(player, fields);
      if (form.dataset.action === 'assign') {
        player.team_id = fields.team_id || null;
        player.team = demoState.teams.find(team => team.id === player.team_id)?.name || '';
      }
      if (form.dataset.action === 'operate' && fields.jersey !== '' && demoState.players.some(other =>
        other.id !== player.id && other.team_id === player.team_id && other.jersey === Number(fields.jersey))) {
        throw new Error('Ese número ya está en uso en el equipo.');
      }
      if (form.dataset.action === 'operate') Object.assign(player, {
        checked: !!fields.checked, jersey: nullableNumber('jersey'), sprint: nullableNumber('sprint'), velocity: nullableNumber('velocity')
      });
      if (form.dataset.action === 'publish') player.published = !!fields.published;
      if (player.status !== 'approved') Object.assign(player, {team_id:null,team:'',published:false,checked:false});
      sessionStorage.setItem('canelo-demo', JSON.stringify(demoState));
      await load();
      message('Cambio aplicado a la demostración.');
      return;
    }
    switch (form.dataset.action) {
      case 'event': {
        const result = await api('events' + (eventId ? eventQuery : ''), { ...fields, accepting: !!fields.accepting });
        if (!eventId) {
          location.assign('/admin/?event=' + result.id);
          return;
        }
        break;
      }
      case 'team': await api('teams' + eventQuery, fields); break;
      case 'review': await api(playerPath, fields); break;
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
    button.disabled = false;
  }
});

load().catch(error => message(error.message, true));
