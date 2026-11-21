/**
 * Server-rendered presentation layer.
 * The public site and administrative shell have distinct navigation and CSS.
 * This file intentionally does not own database mutations or authentication.
 */
export function createViews({ root, getEvent, listEvents, db, escape, getSiteSettings = () => ({}) }) {
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
      links.push(['Administración', '/admin/']);
      return '<nav class="public-nav" aria-label="Navegación pública">' +
        links.map(([label, href]) => '<a href="' + escape(href) + '"' +
          (active === label ? ' aria-current="page"' : '') +
          (label === 'Inscribirme' ? ' class="nav-cta"' :
            label === 'Administración' ? ' class="nav-admin-access"' : '') +
          '>' + label + '</a>').join('') + '</nav>';
    }
    // El menú lateral contiene las secciones; el encabezado agrupa cuenta, portal y cierre de sesión.
    return '<nav class="admin-top-nav" aria-label="Acciones de la cuenta administrativa">' +
      '<span class="admin-user"><span class="admin-user-avatar" aria-hidden="true">A</span>' +
      '<span class="admin-user-label"><strong>Administrador</strong><small>Centro de control</small></span></span>' +
      '<a href="/" class="admin-portal-link">Ver portal público ↗</a>' +
      '<form class="admin-logout" action="/admin/logout" method="post">' +
      '<button type="submit" aria-label="Cerrar sesión de administrador">Cerrar sesión</button></form></nav>';
  }
  
  function documentHead(title, privateView = false, seoDescription = '') {
    return root.slice(0, root.indexOf('</head>'))
      .replace('<title>Canelo Scout Invitational · MVP</title>',
        '<title>' + escape(title) + ' | Canelo Scout</title>') +
      '<link rel="stylesheet" href="' + (privateView ? '/operations.css' : '/public.css') +
      '"><link rel="stylesheet" href="/shell.css"><script src="/i18n.js" defer></script>' +
      (seoDescription ? '<meta name="description" content="' + escape(seoDescription) + '">' : '') + '</head>';
  }
  
  function header(eventId = '', active = 'Inicio', privateView = false) {
    return '<div class="stripe"></div><header><div class="nav ' +
      (privateView ? 'admin-header' : 'public-header') + '">' +
      '<a class="brand public-brand" href="/"><span class="mark" aria-hidden="true">CS</span>' +
      '<span><small>PLATAFORMA DE SCOUTING</small><strong>CANELO SCOUT</strong></span></a>' +
      navigation(eventId, active, privateView) + '</div></header>';
  }
  
  function footer(privateView = false, siteOverride = null) {
    const year = new Date().getFullYear();
    const site = siteOverride ?? getSiteSettings();
    const localized = '<p data-site-es="' + escape(site.footerDescriptionEs ?? '') +
      '" data-site-en="' + escape(site.footerDescriptionEn ?? '') + '">' +
      escape(site.footerDescriptionEs ?? '') + '</p>';
    const external = [
      ['Instagram', site.instagramUrl], ['Facebook', site.facebookUrl],
      ['YouTube', site.youtubeUrl]
    ].filter(([, href]) => href);
    const socialLinks = external.map(([name, href]) => '<a href="' + escape(href) +
      '" rel="noopener noreferrer" target="_blank">' + name + ' ↗</a>').join('');
    const email = site.contactEmail ?
      '<a href="mailto:' + escape(site.contactEmail) + '">' + escape(site.contactEmail) + '</a>' : '';
    const links = privateView
      ? [['Eventos y configuración', '/admin/'], ['Solicitudes', '/admin/?vista=solicitudes'], ['Ver portal público', '/']]
      : [['Eventos', '/eventos'], ['Seguimiento', '/seguimiento'], ['Media Center', '/prensa']];
    return '<footer class="site-footer ' + (privateView ? 'admin-footer' : 'public-footer') + '">' +
      '<div class="footer-inner"><div class="footer-overview">' +
      '<div class="footer-wordmark"><span class="footer-symbol" aria-hidden="true">CS</span>' +
      '<div><strong>CANELO SCOUT</strong><small>PLATAFORMA DE SCOUTING</small></div></div>' +
      (privateView ? '<p>Gestión de eventos, prospectos y operaciones deportivas.</p>' : localized) +
      '</div><div class="footer-col"><h2>NAVEGACIÓN</h2>' +
      links.map(([label, url]) => '<a href="' + url + '">' + escape(label) + '</a>').join('') +
      '</div><div class="footer-col footer-support"><h2>' +
      (privateView ? 'ORGANIZACIÓN' : 'PLATAFORMA') + '</h2>' +
      '<p>' + (privateView ? 'Área de acceso restringido para el equipo organizador.' :
      'Inscripción, seguimiento de solicitudes y perfiles autorizados para prensa y scouts.') +
      '</p>' +
      (privateView ? '<a href="/admin/?vista=sitio">Administración del sitio ↗</a>' :
      '<div class="footer-site-links">' + email + socialLinks + '</div><a href="/admin/" class="footer-admin-link">Acceso administrativo ↗</a>') +
      '</div></div><div class="footer-bottom"><span>© ' + year +
      ' Canelo Scout. Todos los derechos reservados.</span><span>' +
      (privateView ? 'Panel organizador' : 'Eventos · Talento · Scouting') +
      '</span></div></footer>';
  }
  
  function html(res, title, content, script = '', options = {}) {
    const privateView = !!options.privateView;
    const eventId = options.eventId ?? '';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(documentHead(title, privateView) + '<body class="' + (privateView ? 'admin-body' : 'public-body') + '">' +
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
      '<body class="public-body">' + header(event.id, 'Inscribirme') + content + footer() +
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
  
  function presentationPage({ settings = null, locale = 'es', preview = false } = {}) {
    const site = settings ?? getSiteSettings();
    const lang = locale === 'en' ? 'En' : 'Es';
    const text = name => escape(site[name + lang] ?? '');
    let home = root.slice(root.indexOf('<main id="home"'), root.indexOf('<main id="register"'))
      .replace('<main id="home" class="view active">', '<main id="home" class="view active public-main">')
      .replace('<button class="btn red" onclick="go(\'register\')">Comenzar registro</button>',
        '<a class="btn red" href="/eventos">Comenzar registro</a>')
      .replace('<button class="btn white" onclick="go(\'admin\')">Ver centro de control</button>',
        '<a class="btn white" href="/#eventos">Ver eventos</a>')
      .replace('🇺🇸 TRYOUT PARA BECAS · COLLEGE · HIGH SCHOOL', text('heroEyebrow'))
      .replace('<h1>CANELO SCOUT <span>INVITATIONAL</span></h1>',
        '<h1>' + text('heroTitle') + ' <span>' + text('heroAccent') + '</span></h1>')
      .replace('Una sola plataforma para captar talento, validar solicitudes, completar equipos durante el evento y publicar perfiles deportivos listos para prensa y scouts.', text('heroDescription'))
      .replace('DEL REGISTRO AL DIAMANTE', text('aboutTitle'))
      .replace('El MVP acompaña al organizador antes, durante y después del evento. Cada dato se captura una vez y se reutiliza en toda la operación.', text('aboutDescription'))
      .replace(/7 y 8 de noviembre de 2026/g, 'Próximas ediciones');
    if (site.heroImageUrl) {
      home = home.replace('<div class="ticket-top">',
        '<div class="ticket-top site-photo-ticket"><img class="site-hero-image" alt="" src="' +
        escape(site.heroImageUrl) + '" loading="lazy">');
    }
    const available = publicEvents();
    const featured = available[0];
    const days = featured ? Math.round((new Date(featured.ends) - new Date(featured.starts)) / 86400000) + 1 : null;
    home = home.replace('Próximas ediciones · República Dominicana',
      featured ? escape(featured.name + ' · ' + featured.starts + ' — ' + featured.ends + ' · ' + featured.venue) :
        'Consulta las próximas ediciones')
      .replace('2 DÍAS', days ? days + (days === 1 ? ' DÍA' : ' DÍAS') : 'EDICIONES');
    const catalog = '<section class="section event-catalog" id="eventos"><div class="wrap">' +
      '<div class="head"><div><span class="eyebrow">Canelo Scout</span><h2>EVENTOS</h2>' +
      '<p>Consulta las ediciones disponibles, las fechas y el proceso de inscripción.</p></div></div>' +
      (available.length ? '<div class="event-list">' + eventCards(available) + '</div>' :
        '<div class="card public-empty">Actualmente no hay eventos abiertos para inscripción.</div>') +
      '</div></section>';
    const banner = preview ? '<div class="site-preview-banner"><strong>VISTA PREVIA DEL BORRADOR</strong>' +
      '<span>Estos cambios todavía no están publicados.</span>' +
      '<a href="/admin/?vista=sitio">Volver a administración del sitio</a></div>' : '';
    return documentHead(site['seoTitle' + lang] || 'Inicio', false, site['seoDescription' + lang]) +
      '<body class="public-body">' + header('', 'Inicio') +
      banner + home + catalog + footer(false, site) + '</body></html>';
  }

  return { navigation, html, registrationPage, presentationPage, publicEvents, eventCards };
}
