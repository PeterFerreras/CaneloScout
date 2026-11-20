/**
 * Canelo Scout — browser internationalization.
 * The markup keeps the business values in Spanish; translating <option> text
 * never changes its submitted value. Only known UI strings are translated.
 */
(() => {
  'use strict';
  const translations = {
    'Inicio': 'Home',
    'Eventos': 'Events',
    'Media Center': 'Media Center',
    'Seguimiento': 'Track application',
    'Inscribirme': 'Register',
    'Administración': 'Administration',
    'Ver portal público ↗': 'View public portal ↗',
    'Ver portal público': 'View public portal',
    'Cerrar sesión': 'Sign out',
    'Centro de control': 'Control center',
    'Centro de control de eventos deportivos.': 'Sports event control center.',
    'PLATAFORMA DE SCOUTING': 'SCOUTING PLATFORM',
    'PANEL ORGANIZADOR': 'ORGANIZER DASHBOARD',
    'GESTIÓN': 'MANAGEMENT',
    'GESTIÓN DE EVENTOS': 'EVENT MANAGEMENT',
    'GESTIÓN DE EVENTOS DEPORTIVOS': 'SPORTS EVENT MANAGEMENT',
    'RECURSOS': 'RESOURCES',
    'Acceso restringido': 'Restricted access',
    'Acceso administrativo ↗': 'Administrative access ↗',
    'Administrador': 'Administrator',
    'Panel de administración': 'Administration panel',
    'Administración de eventos y talento deportivo.': 'Manage events and athletic talent.',
    'Eventos y configuración': 'Events and settings',
    'Configuración': 'Settings',
    'Solicitudes': 'Applications',
    'Profundidad': 'Depth chart',
    'Operación': 'Event operations',
    'Publicación': 'Publishing',
    'Formulario de inscripción': 'Registration form',
    'Media Center público ↗': 'Public Media Center ↗',
    'Vista previa del formulario ↗': 'Registration form preview ↗',
    'CANELO SCOUT · ORGANIZACIÓN': 'CANELO SCOUT · ORGANIZATION',
    'NAVEGACIÓN': 'NAVIGATION',
    'ORGANIZACIÓN': 'ORGANIZATION',
    'PLATAFORMA': 'PLATFORM',
    'Gestión de eventos, prospectos y operaciones deportivas.': 'Manage events, prospects, and sports operations.',
    'Conectamos a los atletas con nuevas oportunidades mediante eventos y perfiles deportivos.': 'Connecting athletes to new opportunities through events and sports profiles.',
    'Área de acceso restringido para el equipo organizador.': 'Restricted area for the organizing team.',
    'Inscripción, seguimiento de solicitudes y perfiles autorizados para prensa y scouts.': 'Registration, application tracking, and approved profiles for media and scouts.',
    'Todos los derechos reservados.': 'All rights reserved.',
    'Panel organizador': 'Organizer dashboard',
    'Eventos · Talento · Scouting': 'Events · Talent · Scouting',
    'Eventos disponibles': 'Available events',
    'Selecciona una edición para consultar sus detalles o inscribirte.': 'Select an event to view details or register.',
    'No hay ediciones públicas disponibles en este momento.': 'There are no public events available at this time.',
    'EVENTOS': 'EVENTS',
    'Consulta las ediciones disponibles, las fechas y el proceso de inscripción.': 'Browse available events, dates, and registration details.',
    'Actualmente no hay eventos abiertos para inscripción.': 'There are currently no events open for registration.',
    'Consulta las próximas ediciones': 'Explore upcoming events',
    'Ver detalles': 'View details',
    'Inscripciones abiertas': 'Registration open',
    'Inscripciones cerradas': 'Registration closed',
    'Evento disponible': 'Event available',
    'Ver eventos': 'View events',
    'Ver eventos disponibles': 'View available events',
    'Ver otros eventos': 'View other events',
    'Evento no encontrado': 'Event not found',
    'Evento no disponible': 'Event unavailable',
    'Este evento todavía no está publicado.': 'This event has not been published yet.',
    'El enlace no corresponde a un evento disponible.': 'This link does not point to an available event.',
    'El enlace no corresponde a un evento válido.': 'This link does not point to a valid event.',
    'Las inscripciones no están abiertas en este momento.': 'Registration is currently closed.',
    'Inscripciones cerradas': 'Registration closed',
    'Próximas ediciones': 'Upcoming events',
    'EDICIONES': 'EVENTS',
    'DEL REGISTRO AL DIAMANTE': 'FROM REGISTRATION TO THE DIAMOND',
    'REGISTRO': 'REGISTRATION',
    'REVISIÓN': 'REVIEW',
    'EVENTO': 'EVENT',
    'PRENSA': 'MEDIA',
    'Flujo completo': 'Complete workflow',
    'Solicitud pública': 'Public application',
    'Validación documental': 'Document verification',
    'Rósters operativos': 'Operational rosters',
    'Perfiles públicos autorizados para prensa, scouts y aliados.': 'Public profiles approved for media, scouts, and partners.',
    'El MVP acompaña al organizador antes, durante y después del evento. Cada dato se captura una vez y se reutiliza en toda la operación.': 'One platform to support organizers before, during, and after the event. Enter information once and reuse it across the operation.',
    'La plataforma acompaña al organizador antes, durante y después del evento. Cada dato se captura una vez y se reutiliza en toda la operación.': 'One platform to support organizers before, during, and after the event. Enter information once and reuse it across the operation.',
    'Comenzar registro': 'Start registration',
    'Ver eventos': 'View events',
    'Registro oficial de jugador': 'Official player registration',
    'REGISTRO ABIERTO': 'REGISTRATION OPEN',
    'VISTA PREVIA': 'PREVIEW',
    'Vista previa del formulario de inscripción.': 'Registration form preview.',
    'Vista previa: puedes recorrer el formulario sin guardar solicitudes.': 'Preview: browse the form without saving applications.',
    '1. Datos personales': '1. Personal details',
    '2. Perfil deportivo': '2. Player profile',
    '3. Logística y pago': '3. Logistics & payment',
    '4. Autorización': '4. Consent',
    'DATOS PERSONALES': 'PERSONAL INFORMATION',
    'Nombre completo': 'Full name',
    'Campo obligatorio.': 'Required field.',
    'Fecha de nacimiento': 'Date of birth',
    'Indica una fecha válida.': 'Enter a valid date.',
    'Nacionalidad': 'Nationality',
    'Ciudad y país': 'City and country',
    'WhatsApp': 'WhatsApp',
    'Correo': 'Email',
    'Instagram': 'Instagram',
    'Foto reciente': 'Recent photo',
    'Subir fotografía': 'Upload photo',
    'JPG, PNG o WebP · máx. 5 MB': 'JPG, PNG or WebP · max. 5 MB',
    'Carga una fotografía.': 'Upload a photo.',
    'El jugador es menor de edad. Registra el nombre y teléfono de su padre, madre o tutor.': 'The player is a minor. Provide the name and phone number of their parent or legal guardian.',
    'PERFIL DEPORTIVO': 'SPORTS PROFILE',
    'Posición principal': 'Primary position',
    'Posición secundaria': 'Secondary position',
    'Seleccionar': 'Select',
    'Ninguna': 'None',
    'Primera base': 'First base',
    'Segunda base': 'Second base',
    'Tercera base': 'Third base',
    'Batea': 'Bats',
    'Lanza': 'Throws',
    'Batea / lanza': 'Bats / throws',
    'Derecha': 'Right',
    'Izquierda': 'Left',
    'Ambas': 'Both',
    'Estatura': 'Height',
    'Peso': 'Weight',
    'Equipo, academia o centro actual': 'Current team, academy, or training center',
    'Estatus actual': 'Current status',
    'Academia / liga local': 'Academy / local league',
    'Independiente': 'Independent',
    'Año de graduación': 'Graduation year',
    'LOGÍSTICA Y PAGO': 'LOGISTICS & PAYMENT',
    'Disponibilidad para el evento': 'Availability for the event',
    'Todo el evento': 'Full event',
    'Solo el primer día': 'First day only',
    'Solo el segundo día': 'Second day only',
    'Necesito confirmar': 'To be confirmed',
    'Pasaporte vigente': 'Valid passport',
    'Sí': 'Yes',
    'No': 'No',
    'En proceso': 'In progress',
    '¿Cómo se enteró?': 'How did you hear about us?',
    'Academia / entrenador': 'Academy / coach',
    'Amigo o familiar': 'Friend or family',
    'Número de referencia': 'Reference number',
    'Comprobante': 'Payment receipt',
    'Cargar comprobante': 'Upload receipt',
    'Imagen o PDF · máx. 8 MB': 'Image or PDF · max. 8 MB',
    'Carga el comprobante.': 'Upload the receipt.',
    'INFORMACIÓN DE PAGO': 'PAYMENT INFORMATION',
    'Consulta la tarifa con la organización': 'Ask the organizer about fees',
    'Consulta con la organización las instrucciones de pago.': 'Contact the organizer for payment instructions.',
    'TITULAR': 'ACCOUNT HOLDER',
    'AUTORIZACIÓN': 'CONSENT',
    'Revisa la información. El registro será evaluado antes de ser aceptado.': 'Review the details. Your registration will be evaluated before acceptance.',
    'Autorización de imagen y datos deportivos': 'Photo and sports data authorization',
    'Debes aceptar la autorización.': 'You must accept the authorization.',
    'Declaración de veracidad': 'Accuracy declaration',
    'Confirmo que la información suministrada es correcta.': 'I confirm that the information provided is accurate.',
    'Debes confirmar la información.': 'You must confirm the information.',
    'Anterior': 'Back',
    'Continuar': 'Continue',
    'Enviar solicitud': 'Submit application',
    'Al enviar, tu información quedará registrada para revisión. Te contactaremos por WhatsApp, Instagram o correo.': 'Once submitted, your information will be reviewed. We will contact you by WhatsApp, Instagram, or email.',
    'SOLICITUD RECIBIDA': 'APPLICATION RECEIVED',
    'La validación inicial fue completada.': 'The initial checks have been completed.',
    'Tu solicitud fue recibida y se encuentra en revisión.': 'Your application was received and is under review.',
    'Consultar estado de solicitud': 'Track application',
    'Volver al inicio': 'Back to home',
    'Seguimiento de solicitud': 'Application status',
    'Consulta el estado de tu inscripción usando el código recibido al finalizar el formulario.': 'Check your registration status using the code received after submitting the form.',
    'Código de solicitud': 'Application code',
    'Consultar estado': 'Check status',
    'Estado de la solicitud': 'Application status',
    'En revisión': 'Under review',
    'Requiere corrección': 'Correction required',
    'No elegible': 'Not eligible',
    'Aprobada': 'Approved',
    'No se encontró una solicitud con ese código. Verifícalo e inténtalo nuevamente.': 'We could not find an application with this code. Check it and try again.',
    'Completa nuevamente los datos y adjunta los documentos corregidos. Se conservará tu código de seguimiento.': 'Update your information and attach corrected documents. Your tracking code will stay the same.',
    'Volver a Canelo Scout': 'Back to Canelo Scout',
    'CENTRO DE CONTROL': 'CONTROL CENTER',
    'PANEL ORGANIZADOR': 'ORGANIZER PANEL',
    'Administración de eventos y talento deportivo.': 'Manage events and sports talent.',
    'PANEL DE ADMINISTRACIÓN': 'ADMIN PANEL',
    'Panel de eventos': 'Event dashboard',
    'Administración': 'Administration',
    'Organización': 'Organization',
    'Eventos y configuración': 'Events & settings',
    'Configuración del evento': 'Event settings',
    'Mis eventos': 'My events',
    'Crear evento': 'Create event',
    'Gestiona tus ediciones y abre sus inscripciones.': 'Manage your events and open registration.',
    'Datos del evento': 'Event information',
    'Nombre del evento': 'Event name',
    'Sede': 'Venue',
    'Descripción pública': 'Public description',
    'Importe / tarifa pública': 'Price / public fee',
    'Contacto de la organización': 'Organizer contact',
    'Fecha de inicio': 'Start date',
    'Fecha de cierre': 'End date',
    'Instrucciones de pago': 'Payment instructions',
    'Habilitar formulario público': 'Enable public registration',
    'Al abrir las inscripciones podrás compartir el enlace y el QR.': 'When registration opens you can share the link and QR code.',
    'Guardar configuración': 'Save settings',
    'Formulario de inscripción': 'Registration form',
    'Ver formulario de inscripción': 'Preview registration form',
    'Abrir formulario': 'Open registration form',
    'Enlace de inscripción': 'Registration link',
    'Copiar enlace': 'Copy link',
    'Descargar QR': 'Download QR code',
    'Habilita el formulario público para compartir el enlace y descargar el QR.': 'Enable public registration to share the link and download a QR code.',
    'Selecciona un evento para crear equipos.': 'Select an event to create teams.',
    'Evento': 'Event',
    'Todos los eventos': 'All events',
    'Bandeja de solicitudes': 'Application inbox',
    'Solicitudes y validación': 'Applications & verification',
    'Por revisar': 'Pending review',
    'Aprobado': 'Approved',
    'Aprobadas': 'Approved',
    'Equipos creados': 'Teams created',
    'Todos los estados': 'All statuses',
    'No hay solicitudes que coincidan.': 'No matching applications.',
    'Datos de inscripción': 'Registration details',
    'Comprobante de pago': 'Payment receipt',
    'Comprobante de ejemplo · Sin valor contable': 'Sample receipt · Not valid for accounting',
    'Ampliar comprobante': 'View payment receipt',
    'Nota interna': 'Internal note',
    'Validación independiente del pago': 'Independent payment verification',
    'Pedir corrección': 'Request correction',
    'Aprobar solicitud': 'Approve application',
    'Guardar nota': 'Save note',
    'Guardar': 'Save',
    'Pago:': 'Payment:',
    'Por validar': 'Pending verification',
    'Validado': 'Verified',
    'Rechazado': 'Rejected',
    'Profundidad por posición': 'Depth chart by position',
    'Selecciona una posición para consultar jugadores por su posición principal o secundaria.': 'Select a position to view players with that primary or secondary position.',
    'Jugadores aprobados': 'Approved players',
    'Sin jugadores en esta posición.': 'No players in this position.',
    'Sin asignar': 'Unassigned',
    'Nuevo equipo': 'New team',
    '+ Crear otro equipo': '+ Create another team',
    'Todas las posiciones': 'All positions',
    'Rósters del Invitational': 'Invitational rosters',
    'Nuevo equipo': 'New team',
    '+ Nuevo equipo': '+ New team',
    'El sistema advierte si un número de camiseta ya está en uso dentro del equipo.': 'The system warns you when a jersey number is already assigned within a team.',
    'Check-in': 'Check-in',
    'Jugador': 'Player',
    'Posición': 'Position',
    '# Chaqueta': '# Jersey',
    'Velocidad': 'Velocity',
    'Estado': 'Status',
    'Presente': 'Checked in',
    'Pendiente': 'Pending',
    'Todavía no hay jugadores asignados a equipos.': 'There are no players assigned to teams yet.',
    'Publicación para prensa': 'Media publishing',
    'Aprobados': 'Approved',
    'Pagos validados': 'Verified payments',
    'Listos para publicar': 'Ready to publish',
    'Perfiles publicados': 'Published profiles',
    'Evaluación deportiva': 'Sports evaluation',
    'Comprobantes revisados': 'Receipts reviewed',
    'Cumplen los requisitos': 'Requirements met',
    'Visibles en Media Center': 'Visible in Media Center',
    'PUBLICACIÓN CONTROLADA': 'CONTROLLED PUBLISHING',
    'Perfiles para prensa y scouts': 'Profiles for media and scouts',
    'Solo serán visibles los jugadores aprobados, con pago validado, equipo asignado y autorización de publicación.': 'Only approved players with a verified payment, assigned team, and publication consent will be visible.',
    'Control de perfiles': 'Profile management',
    'Activa o retira los perfiles autorizados para su publicación.': 'Publish or unpublish authorized player profiles.',
    'ANTES DE PUBLICAR': 'BEFORE PUBLISHING',
    'Proceso de preparación': 'Preparation checklist',
    'Validar solicitudes': 'Verify applications',
    'Comprueba los datos y la documentación.': 'Check details and documentation.',
    'Confirmar pagos': 'Verify payments',
    'Autoriza el comprobante por separado.': 'Verify the receipt separately.',
    'Asignar un equipo': 'Assign a team',
    'Organiza a los jugadores aprobados.': 'Assign approved players to teams.',
    'Publicar el perfil': 'Publish profile',
    'Habilita el acceso para prensa y scouts.': 'Make the profile visible to media and scouts.',
    'Ir a solicitudes →': 'Go to applications →',
    'Sin jugadores preparados para publicación': 'No players ready to publish',
    'Revisar solicitudes': 'Review applications',
    'Organizar equipos': 'Organize teams',
    'Visible en Media Center': 'Visible in Media Center',
    'Publicado': 'Published',
    'Listo para publicar': 'Ready to publish',
    'Pendiente de pago': 'Payment pending',
    'Solicitud pública': 'Public application',
    'Revisar solicitudes': 'Review applications',
    'DIRECTORIO DE JUGADORES': 'PLAYER DIRECTORY',
    'Directorio de jugadores': 'Player directory',
    'Talento en el diamante': 'Talent on the diamond',
    'Media Center · Acceso para prensa': 'Media Center · Press access',
    'MEDIA CENTER · ACCESO PARA PRENSA': 'MEDIA CENTER · PRESS ACCESS',
    'Rósters oficiales': 'Official rosters',
    'Perfiles publicados': 'Published profiles',
    'Filtrar': 'Filter',
    'Todos los equipos': 'All teams',
    'No hay perfiles publicados que coincidan.': 'No published profiles match your search.',
    'REGISTRO OFICIAL': 'OFFICIAL REGISTRATION',
    'ACCESO RESTRINGIDO': 'RESTRICTED ACCESS',
    'Bienvenido de nuevo': 'Welcome back',
    'Inicia sesión para acceder al centro de control de Canelo Scout.': 'Sign in to access the Canelo Scout control center.',
    'No pudimos iniciar sesión': 'Unable to sign in',
    'Usuario': 'Username',
    'Contraseña': 'Password',
    'Mostrar': 'Show',
    'Ocultar': 'Hide',
    'Bloq Mayús está activado.': 'Caps Lock is on.',
    'Entrar al panel': 'Sign in',
    '¿Tienes problemas para acceder? Contacta al administrador de la plataforma.': 'Having trouble signing in? Contact the platform administrator.',
    '← Volver a Canelo Scout': '← Back to Canelo Scout',
    'Ir al portal público': 'Go to public website',
    'Acceso al back office | Canelo Scout': 'Back-office access | Canelo Scout',
    'TODO EL EVENTO.': 'THE ENTIRE EVENT.',
    'UN SOLO CONTROL.': 'ONE CONTROL CENTER.',
    'Gestiona inscripciones, evalúa prospectos y coordina los rósters desde un espacio de trabajo centralizado.': 'Manage registrations, assess prospects, and coordinate rosters from one workspace.',
    'Equipos y operación': 'Teams & operations',
    'CANELO SCOUT · ACCESO EXCLUSIVO PARA PERSONAL AUTORIZADO': 'CANELO SCOUT · AUTHORIZED STAFF ONLY',
    'El usuario o la contraseña son incorrectos.': 'Invalid username or password.',
    'Completa ambos campos con valores válidos e inténtalo nuevamente.': 'Complete both fields with valid values and try again.',
    'Se alcanzó el límite de intentos. Inténtalo nuevamente en un minuto.': 'Too many attempts. Try again in one minute.',
    'Ingresa tu nombre de usuario.': 'Enter your username.',
    'Ingresa tu contraseña.': 'Enter your password.',
    'La contraseña debe contener al menos 12 caracteres.': 'Your password must contain at least 12 characters.',
    'Revisa los campos marcados para continuar.': 'Review the highlighted fields to continue.',
    'Revisa los campos requeridos para avanzar.': 'Complete the required fields to continue.',
    'Enviar solicitud': 'Submit application',
    'Enviando solicitud…': 'Submitting application…',
    'Cambios guardados.': 'Changes saved.',
    'Enlace copiado.': 'Link copied.',
    'Selecciona un evento': 'Select an event',
    'Buscar jugador…': 'Search player…',
    'Buscar jugador o posición…': 'Search player or position…',
    'Observaciones…': 'Notes…',
    'Nombre del equipo': 'Team name',
    'Nombre del jugador': 'Player name',
    'Ingresa tu usuario': 'Enter username',
    'Ingresa tu contraseña': 'Enter password',
    'Ej. US$100 o entrada gratuita': 'e.g. US$100 or free entry',
    'Presenta el evento, objetivos y requisitos principales.': 'Describe the event, goals and eligibility requirements.'
  };

  const attributeTranslations = ['placeholder', 'aria-label', 'title'];
  const langCookie = document.cookie.match(/(?:^|;\s*)canelo_lang=(es|en)(?:;|$)/)?.[1] || 'es';
  const queryLocale = new URL(location.href).searchParams.get('lang');
  const locale = queryLocale === 'en' || queryLocale === 'es' ? queryLocale : langCookie;
  document.documentElement.lang = locale;
  if (queryLocale === 'es' || queryLocale === 'en') {
    document.cookie = 'canelo_lang=' + queryLocale + '; Path=/; SameSite=Lax; Max-Age=15552000';
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete('lang');
    history.replaceState(history.state, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
  }

  const translate = text => locale === 'en' ? translations[text] || text : text;
  // Display labels are not submitted as values: native options without a value
  // attribute receive their original canonical value before translating.
  function translateText(node) {
    const container = node.parentElement;
    if (!container || container.closest('script, style, textarea, code, pre, [data-no-translate]')) return;
    const source = node.nodeValue;
    const trimmed = source.trim();
    if (!trimmed || !translations[trimmed]) return;
    if (container.tagName === 'OPTION' && !container.hasAttribute('value')) {
      container.setAttribute('value', container.value);
    }
    node.nodeValue = source.replace(trimmed, translate(trimmed));
  }
  function translateElement(element) {
    if (!element || element.nodeType !== 1) return;
    for (const attr of attributeTranslations) {
      const text = element.getAttribute(attr);
      if (text && translations[text]) element.setAttribute(attr, translate(text));
    }
  }
  function localize(root) {
    if (locale !== 'en' || !root) return;
    if (root.nodeType === 3) return translateText(root);
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) translateElement(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === 3) translateText(node);
      else translateElement(node);
    }
  }

  function addSwitcher() {
    let parent = document.querySelector('.admin-top-nav, .public-nav, .login-header-inner');
    if (!parent || parent.querySelector('.language-switch')) return;
    const group = document.createElement('div');
    group.className = 'language-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Idioma / Language');
    for (const [value, label] of [['es', 'ES'], ['en', 'EN']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lang = value;
      button.textContent = label;
      button.setAttribute('aria-pressed', String(value === locale));
      button.setAttribute('aria-label', value === 'es' ? 'Español' : 'English');
      button.addEventListener('click', () => {
        if (value === locale) return;
        document.cookie = 'canelo_lang=' + value + '; Path=/; SameSite=Lax; Max-Age=15552000';
        location.reload();
      });
      group.append(button);
    }
    const before = parent.querySelector('.nav-admin-access, .admin-portal-link, .login-public-link');
    if (before) parent.insertBefore(group, before);
    else parent.append(group);
  }

  function start() {
    addSwitcher();
    localize(document.body);
    if (locale === 'en') {
      const observer = new MutationObserver(changes => {
        for (const change of changes) {
          if (change.type === 'characterData') localize(change.target);
          else for (const node of change.addedNodes) localize(node);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    }
  }

  window.CaneloI18n = Object.freeze({ locale, t: translate });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
