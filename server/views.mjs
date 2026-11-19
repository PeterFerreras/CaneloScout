/**
 * Server-rendered presentation layer.
 * The public site and administrative shell have distinct navigation and CSS.
 * This file intentionally does not own database mutations or authentication.
 */
export function createViews({ root, getEvent, listEvents, db, escape }) {
  function navigation(eventId, active, privateView = false) {
    const query = eventId ? '?event=' + encodeURIComponent(eventId) : '';
    if (!privateView) {
      const links = [
        ['Inicio', '/'],
        ['Eventos', '/eventos'],
        ['Media Center', '/prensa' + query],
      ['Seguimiento', '/seguimiento']
      ];
      if (eventId && getEvent(eventId)?.accepting) links.push(['Inscribirme', '/registro' + query]);
      else if (listEvents().some(event => event.accepting)) links.push(['Inscribirme', '/eventos']);
      return '<nav class="public-nav" aria-label="Navegación pública">' +
        links.map(([label, href]) => '<a href="' + escape(href) + '"' +
          (active === label ? ' aria-current="page"' : '') +
          (label === 'Inscribirme' ? ' class="nav-cta"' : '') + '>' + label + '</a>').join('') + '</nav>';
    }
    // El back office utiliza su propio menú lateral; el encabezado solo enlaza al portal público.
    return '<nav class="admin-top-nav" aria-label="Acceso al portal público">' +
      '<a href="/" class="admin-portal-link">Ver portal público ↗</a></nav>';
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
  
  function registrationPage(event, preview = false, correctionCode = '') {
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
      .replace('US$100 o RD$6,200', escape(event.fee_label || 'Consulta la tarifa con la organización'))
      .replace(/<div class="pay">.*?<\/div>/,
        '<div class="pay" style="white-space:pre-wrap">' +
        escape(event.payment_instructions || 'Consulta con la organización las instrucciones de pago.') + '</div>')
      .replace('La descripción debe incluir el nombre del jugador. Asistencia: <strong>+1 914-490-9560</strong>.',
        escape(event.contact || 'Verifica los datos de pago con la organización antes de realizar una transferencia.'))
      .replace('Esta maqueta conserva los datos solo en este navegador.', 'Tu solicitud fue recibida y se encuentra en revisión.')
    .replace('<div id="code" class="code"></div>',
      '<div id="code" class="code"></div><p><a id="tracking-link" class="btn light" href="/seguimiento">Consultar estado de solicitud</a></p>')
      .replace('<button class="btn" onclick="go(\'admin\')">Ver en solicitudes</button>',
        '<a class="btn" href="/">Volver al inicio</a>')
      .replace('REGISTRO ABIERTO', preview ? 'VISTA PREVIA' : 'REGISTRO ABIERTO');
    if (correctionCode) content = content.replace('<div id="formarea"', '<div class="notice">Completa nuevamente los datos y adjunta los documentos corregidos. Se conservará tu código de seguimiento.</div><div id="formarea"');
    if (preview) content = content.replace('<div id="formarea"',
      '<div class="notice" role="note">Vista previa: puedes recorrer el formulario sin guardar solicitudes.</div><div id="formarea"');
    return documentHead(preview ? 'Vista previa de inscripción' : event.name + ' · Inscripción') +
      '<body>' + header(event.id, 'Inscribirme') + content + footer() +
      '<div id="toast" class="toast" role="status" aria-live="polite"></div>' +
      '<div id="active-event" data-id="' + escape(event.id) + '" data-starts="' +
      escape(event.starts) + '" data-correction="' + escape(correctionCode) + '" data-preview="' + preview + '" hidden></div>' +
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
    const featured = available[0];
    const days = featured ? Math.round((new Date(featured.ends) - new Date(featured.starts)) / 86400000) + 1 : null;
    home = home.replace('Próximas ediciones · República Dominicana', featured ? escape(featured.name + ' · ' + featured.starts + ' — ' + featured.ends + ' · ' + featured.venue) : 'Consulta las próximas ediciones').replace('2 DÍAS', days ? days + (days === 1 ? ' DÍA' : ' DÍAS') : 'EDICIONES').replace('El MVP acompaña', 'La plataforma acompaña');
    const catalog = '<section class="section event-catalog" id="eventos"><div class="wrap">' +
      '<div class="head"><div><span class="eyebrow">Canelo Scout</span><h2>EVENTOS</h2>' +
      '<p>Consulta las ediciones disponibles, las fechas y el proceso de inscripción.</p></div></div>' +
      (available.length ? '<div class="event-list">' + eventCards(available) + '</div>' :
        '<div class="card public-empty">Actualmente no hay eventos abiertos para inscripción.</div>') +
      '</div></section>';
    return documentHead('Inicio') + '<body>' + header('', 'Inicio') +
      home + catalog + footer() + '</body></html>';
  }

  return { navigation, html, registrationPage, presentationPage, publicEvents, eventCards };
}
