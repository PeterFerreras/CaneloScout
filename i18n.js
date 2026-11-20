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

  // Copy used by the original public-page composition, including the event flow.
  Object.assign(translations, {
    '🇺🇸 TRYOUT PARA BECAS · COLLEGE · HIGH SCHOOL': '🇺🇸 SCHOLARSHIP TRYOUT · COLLEGE · HIGH SCHOOL',
    'Una sola plataforma para captar talento, validar solicitudes, completar equipos durante el evento y publicar perfiles deportivos listos para prensa y scouts.': 'One platform to scout talent, review applications, form teams during the event, and publish player profiles for media and scouts.',
    '01 / REGISTRO': '01 / REGISTRATION',
    '02 / REVISIÓN': '02 / REVIEW',
    '03 / EVENTO': '03 / EVENT',
    '04 / PRENSA': '04 / MEDIA',
    'Sin crear usuario: datos, posiciones, foto, comprobante y código de seguimiento.': 'No account required: player details, positions, photo, receipt, and tracking code.',
    'Foto, edad, autorización y comprobante visibles en una misma ficha.': 'Review photo, age, consent, and payment proof in one record.',
    'Equipos, check-in, números, mediciones y posiciones secundarias.': 'Teams, check-in, jersey numbers, measurements, and secondary positions.',
    'La validación inicial fue completada.': 'Initial verification is complete.',
    'Enviando solicitud…': 'Submitting application…',
    'Revisa los datos y autorizaciones de este paso.': 'Check the information and consents in this step.',
    'Revisa los campos marcados antes de continuar.': 'Review the highlighted fields before continuing.',
    'La solicitud quedó guardada.': 'Your application has been saved.',
    'Todos los eventos': 'All events',
    'Selecciona una edición': 'Select an event',
    'Volver a eventos': 'Back to events',
    'Inscripciones abiertas': 'Registration open',
    'Inscripciones cerradas': 'Registration closed',
    'Revisar solicitud': 'Review application',
    'Publicar para prensa': 'Publish for media',
    'Continuar al evento': 'Continue to event',
    'Armar equipos': 'Create teams',
    'Nombre del evento': 'Event name',
    'Guardar nota': 'Save note',
    'No elegible': 'Not eligible',
    'El código de seguimiento es privado.': 'Keep your tracking code private.',
    'Revisa el nombre, las fechas y los documentos de tu evento.': 'Check your event name, dates, and documents.',
    'Consultar estado': 'Check status',
    'Acceso administrativo ↗': 'Administrative access ↗',
    'Configuración': 'Settings',
    'Regresar al inicio': 'Back to home',
    'INFORMACIÓN DE PAGO': 'PAYMENT INFORMATION',
    'No hay solicitudes que coincidan.': 'No applications match your search.',
    'Cargar fotografía': 'Upload photo'
  });

  // The site settings editor stores each language independently.
  Object.assign(translations, {
    'SITIO WEB': 'WEBSITE',
    'Administración del sitio': 'Website administration',
    'Administración del sitio web': 'Website administration',
    'Sitio web': 'Website',
    'Configuración general': 'General settings',
    'Contenido público, idiomas, enlaces y metadatos de búsqueda.': 'Public content, languages, links and search metadata.',
    'GESTIÓN DE CONTENIDO': 'CONTENT MANAGEMENT',
    'Modifica el portal público de Canelo Scout sin editar archivos de código. La configuración de eventos se mantiene independiente.': 'Edit the Canelo Scout public website without changing source code. Event settings remain independent.',
    'Cambios sin publicar': 'Unpublished changes',
    'Sitio actualizado': 'Site up to date',
    'Última publicación:': 'Last published:',
    'Vista previa del borrador ↗': 'Preview draft ↗',
    'Ver sitio publicado ↗': 'View published site ↗',
    'Portada del sitio': 'Website homepage',
    'Configura los textos que se mostrarán según el idioma del visitante.': 'Configure the text displayed for each visitor language.',
    'Español': 'Spanish',
    'English': 'English',
    'Etiqueta superior': 'Eyebrow',
    'Título principal': 'Main title',
    'Título destacado': 'Highlighted title',
    'Descripción principal': 'Main description',
    'Presentación institucional': 'About the organization',
    'Título de la sección': 'Section heading',
    'Descripción institucional': 'About text',
    'Contenido del pie de página': 'Footer content',
    'Descripción del portal': 'Website description',
    'Posicionamiento SEO': 'Search engine optimization',
    'Título de la página': 'Page title',
    'Descripción para buscadores': 'Search description',
    'Contacto, redes sociales e imagen': 'Contact, social media and image',
    'Estos datos son comunes a las dos versiones del portal. Los enlaces externos deben comenzar con https://': 'These settings apply to both website languages. External links must begin with https://',
    'Correo de contacto': 'Contact email',
    'URL de imagen para la portada': 'Homepage image URL',
    'Imagen de portada configurada': 'Configured homepage image',
    'Sin imagen externa: se utilizará la composición gráfica original de Canelo Scout.': 'No external image: the original Canelo Scout artwork will be used.',
    'Borradores y publicación': 'Drafts and publishing',
    'Guardar borrador no altera lo que ven los visitantes. Publicar aplica los cambios al portal.': 'Saving a draft does not change the live website. Publishing makes the changes visible.',
    'Guardar borrador': 'Save draft',
    'Publicar cambios': 'Publish changes',
    'Sitio publicado correctamente.': 'Website published successfully.',
    'Borrador guardado correctamente.': 'Draft saved successfully.',
    'VISTA PREVIA DEL BORRADOR': 'DRAFT PREVIEW',
    'Estos cambios todavía no están publicados.': 'These changes are not published yet.',
    'Volver a administración del sitio': 'Back to website administration'
  });

  Object.assign(translations, {
    'Tryouts y juego': 'Tryouts and game',
    'TRYOUTS / SHOWCASE': 'TRYOUTS / SHOWCASE',
    'SHOWCASE / TRYOUTS': 'SHOWCASE / TRYOUTS',
    'EVALUACIÓN DE JUGADORES': 'PLAYER EVALUATIONS',
    'Sesiones de evaluación por posición': 'Position-specific evaluation sessions',
    'Nueva jornada de evaluación': 'New evaluation session',
    'Jornadas': 'Sessions',
    'Tryouts': 'Tryouts',
    'Juego': 'Game',
    'Tipo': 'Type',
    'Nueva sesión': 'New session',
    'Nueva jornada de evaluación': 'New evaluation session',
    'Pruebas': 'Tests',
    'Pruebas · General': 'Tests · General',
    'Pruebas · Infield': 'Tests · Infield',
    'Pruebas · Outfield': 'Tests · Outfield',
    'Pruebas · Pitchers': 'Tests · Pitchers',
    'Pruebas · Catchers': 'Tests · Catchers',
    'Carrera de 60 yardas': '60-yard dash',
    'Carrera de 30 yardas': '30-yard dash',
    'Velocidad de salida del bate': 'Exit velocity',
    'Velocidad de tiro del infield': 'Infield throwing velocity',
    'Fildeo y control': 'Fielding and control',
    'Tiro del jardín derecho al home': 'Right field to home throw',
    'Velocidad de tiro del outfield': 'Outfield throwing velocity',
    'Precisión al home (de 5)': 'Throwing accuracy to home (out of 5)',
    'Velocidad de recta': 'Fastball velocity',
    'Strikes en zona (de 10)': 'Strikes in zone (out of 10)',
    'Pop time a segunda base': 'Pop time to second base',
    'Velocidad del tiro del catcher': 'Catcher throwing velocity',
    'Ponches (K)': 'Strikeouts (K)',
    'Bases por bolas (BB)': 'Walks (BB)',
    'Hits permitidos (H)': 'Hits allowed (H)',
    'Hits conectados (H)': 'Hits (H)',
    'Carreras impulsadas (RBI)': 'Runs batted in (RBI)',
    'Jugadores aprobados': 'Approved players',
    'Intentos guardados': 'Saved attempts',
    'Jugadores evaluados': 'Players evaluated',
    'Sin jugadores elegibles': 'No eligible players',
    'Resultados por intento y posición': 'Results by attempt and position',
    'Evaluaciones por intento y posición': 'Evaluations by attempt and position',
    'Registro por jugador': 'Player scores',
    'REGISTRO POR JUGADOR': 'PLAYER SCORES',
    'Resultados privados': 'Private results',
    'Visible en Media Center': 'Visible in Media Center',
    'Publicar resultados para scouts': 'Publish results for scouts',
    'Actualizar sesión': 'Update session',
    'Abierta': 'Open',
    'Cerrada': 'Closed',
    'Selecciona una medición': 'Select a measurement',
    'Agregar prueba': 'Add test',
    'Agregar prueba personalizada': 'Add custom test',
    'Posición': 'Position',
    'Unidad': 'Unit',
    'Número de intentos': 'Number of attempts',
    'Intentos': 'Attempts',
    'Mejor valor': 'Best value',
    'Mayor marca': 'Highest value',
    'Menor marca': 'Lowest value',
    'Segundos': 'Seconds',
    'Conteo': 'Count',
    'Metros': 'Meters',
    'Pies': 'Feet',
    'Puntuación / 10': 'Score / 10',
    'Repeticiones': 'Repetitions',
    'Nota interna': 'Internal notes',
    'Nota': 'Note',
    'Observación': 'Observation',
    'Observaciones de la jornada': 'Session notes',
    'Crear sesión': 'Create session',
    'General': 'General',
    'Todos los grupos': 'All groups',
    'Todas las posiciones del grupo': 'All group positions',
    'Fase de tryouts': 'Tryouts phase',
    'Fase de juego': 'Game phase',
    'RESULTADOS DE SHOWCASE': 'SHOWCASE RESULTS',
    'ESTADÍSTICAS DEL JUEGO': 'GAME STATISTICS',
    'SCOUT REPORT · SHOWCASE': 'SCOUT REPORT · SHOWCASE',
    'Ficha deportiva y resultados de tryouts ↗': 'Player profile and tryout results ↗',
    'Actualizar resultados': 'Refresh results',
    'Cargando resultados…': 'Loading results…',
    'Mejor marca': 'Best mark',
    'Resultados de': 'Results for',
    'Jugadores': 'Players',
    'Tiro al home': 'Throw to home',
    'Juego · Estadísticas de partido': 'Game · Game statistics',
    'Showcase · Pruebas físicas y de campo': 'Showcase · Skills evaluations',
    'Tryouts completados.': 'Tryouts completed.',
    'Ya puedes crear una sesión de Juego y registrar las estadísticas del partido.': 'You can now create a Game session and record game statistics.'
  });

  Object.assign(translations, {
    'Split de 10 yardas': '10-yard split',
    'Tiempo de home a primera': 'Home-to-first time',
    'Velocidad del bate': 'Bat speed',
    'Ángulo de salida del batazo': 'Launch angle',
    'Distancia del batazo': 'Batted-ball distance',
    'Precisión de tiro del infield (de 5)': 'Infield throwing accuracy (of 5)',
    'Tiempo de tiro del jardín derecho al home': 'Right-field-to-home throw time',
    'Velocidad de curva': 'Curveball velocity',
    'Velocidad de slider': 'Slider velocity',
    'Velocidad de cambio': 'Changeup velocity',
    'Precisión de tiro a segunda (de 5)': 'Throwing accuracy to second (of 5)',
    'Recepción de lanzamientos': 'Receiving',
    'Bloqueo de pitcheos': 'Blocking',
    'Configurar prueba:': 'Configure test:',
    'Intentos permitidos': 'Allowed attempts',
    'Resultado principal': 'Main result',
    'Marca principal': 'Main score',
    'Promedio': 'Average',
    'Mínimo permitido': 'Minimum allowed',
    'Máximo permitido': 'Maximum allowed',
    'Prueba activa': 'Enabled test',
    'Guardar configuración': 'Save settings',
    'Desactivar no borra los resultados. Puedes reactivar la prueba mientras la sesión permanezca abierta.':
      'Disabling a test preserves its results. You can re-enable it while the session is open.',
    'Intento válido': 'Valid attempt',
    'Inválido / sin lectura': 'Invalid / no reading',
    'Nota / motivo': 'Note / reason',
    'Inválido': 'Invalid',
    'válidos': 'valid',
    'inválidos': 'invalid',
    'Intentos válidos': 'Valid attempts',
    'Intentos inválidos': 'Invalid attempts',
    'Añadir pruebas estándar faltantes': 'Restore missing standard tests',
    'Recupera las pruebas del catálogo sin modificar ni borrar resultados existentes.':
      'Restores standard tests without changing or removing existing results.',
    'prueba desactivada': 'disabled test',
    'Foul / lectura inválida': 'Foul / invalid reading',
    'Prom.': 'Avg.',
    'RESULTADO PROMEDIO': 'AVERAGE RESULT',
    'MENOR MARCA': 'LOWEST RESULT',
    'MEJOR MARCA': 'BEST RESULT',
    'Mínimo': 'Minimum',
    'Máximo': 'Maximum',
    'Grados (°)': 'Degrees (°)',
    'Opcional': 'Optional',
    'Observación': 'Observation',
    'Ej. foul, mal tiro, fallo de radar': 'e.g. foul, off-target throw, radar failure',
    'El catálogo de pruebas ya está completo.': 'The standard test catalogue is already complete.'
  });

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

  const translate = text => {
    if (locale !== 'en') return text;
    if (translations[text]) return translations[text];
    const duration = text.match(/^(\d+) DÍAS?$/);
    if (duration) return duration[1] + (duration[1] === '1' ? ' DAY' : ' DAYS');
    if (text === '1 SISTEMA') return '1 PLATFORM';
    const trial = text.match(/^Intento (\d+)$/);
    if (trial) return 'Attempt ' + trial[1];
    const attempts = text.match(/^(\d+) intentos?$/);
    if (attempts) return attempts[1] + (attempts[1] === '1' ? ' attempt' : ' attempts');
    return text;
  };
  // Display labels are not submitted as values: native options without a value
  // attribute receive their original canonical value before translating.
  function translateText(node) {
    const container = node.parentElement;
    if (!container || container.closest('script, style, textarea, code, pre, [data-no-translate]')) return;
    const source = node.nodeValue;
    const trimmed = source.trim();
    if (!trimmed || translate(trimmed) === trimmed) return;
    if (container.tagName === 'OPTION' && !container.hasAttribute('value')) {
      container.setAttribute('value', container.value);
    }
    node.nodeValue = source.replace(trimmed, translate(trimmed));
  }
  function translateElement(element) {
    if (!element || element.nodeType !== 1) return;
    // Published editorial copy is stored in Spanish and English in SQLite.
    // The client switches it without translating user-entered content.
    if (element.hasAttribute('data-site-en')) {
      const value = element.getAttribute('data-site-' + locale);
      if (value !== null && element.textContent !== value) element.textContent = value;
    }
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
