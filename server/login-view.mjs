/**
 * Pantalla de inicio de sesión separada del portal público y del panel operativo.
 * Sin lógica de autenticación en el navegador: el servidor conserva la autoridad.
 */
export function renderLoginPage({ root, escape, error = '', next = '/admin/' }) {
  const head = root.slice(0, root.indexOf('</head>'))
    .replace('<title>Canelo Scout Invitational · MVP</title>',
      '<title>Acceso al back office | Canelo Scout</title>');

  return `${head}<link rel="stylesheet" href="/login.css"></head>
<body class="login-body">
  <div class="stripe"></div>
  <header class="login-header">
    <div class="login-header-inner">
      <a class="login-brand" href="/" aria-label="Canelo Scout, ir al portal público">
        <span class="mark" aria-hidden="true">CS</span>
        <span><small>PLATAFORMA DE SCOUTING</small><strong>CANELO SCOUT</strong></span>
      </a>
      <a href="/" class="login-public-link">Ir al portal público <span aria-hidden="true">↗</span></a>
    </div>
  </header>

  <main class="login-layout">
    <section class="login-intro" aria-label="Presentación del centro de control">
      <div class="login-intro-content">
        <span class="login-kicker">CANELO SCOUT · ORGANIZACIÓN</span>
        <div class="login-orbit" aria-hidden="true"><span>CS</span></div>
        <h2>TODO EL EVENTO.<br><em>UN SOLO CONTROL.</em></h2>
        <p>Gestiona inscripciones, evalúa prospectos y coordina los rósters desde un espacio de trabajo centralizado.</p>
        <div class="login-capabilities"><span>Solicitudes</span><span>Equipos y operación</span><span>Media Center</span></div>
      </div>
    </section>

    <section class="login-access" aria-labelledby="login-title">
      <div class="login-card">
        <span class="login-eyebrow"><span class="login-status-dot" aria-hidden="true"></span> ACCESO RESTRINGIDO</span>
        <h1 id="login-title">Bienvenido de nuevo</h1>
        <p class="login-description">Inicia sesión para acceder al centro de control de Canelo Scout.</p>
        ${error ? `<div class="login-alert" role="alert"><strong>No pudimos iniciar sesión</strong><span>${escape(error)}</span></div>` : ''}

        <form id="login-form" method="post" action="/admin/login" novalidate>
          <input type="hidden" name="next" value="${escape(next)}">
          <div class="login-field">
            <label for="login-user">Usuario <span aria-hidden="true">*</span></label>
            <input id="login-user" name="username" type="text" autocomplete="username" inputmode="text"
              spellcheck="false" autocapitalize="none" required maxlength="80"
              placeholder="Ingresa tu usuario" aria-describedby="login-user-error" autofocus>
            <small id="login-user-error" class="login-field-error" aria-live="polite"></small>
          </div>
          <div class="login-field">
            <label for="login-password">Contraseña <span aria-hidden="true">*</span></label>
            <div class="login-password-control">
              <input id="login-password" name="password" type="password" autocomplete="current-password"
                required minlength="12" maxlength="512" placeholder="Ingresa tu contraseña"
                aria-describedby="login-password-error login-caps-warning">
              <button type="button" id="login-toggle-password" class="login-password-toggle"
                aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button>
            </div>
            <small id="login-password-error" class="login-field-error" aria-live="polite"></small>
            <small id="login-caps-warning" class="login-caps" hidden>Bloq Mayús está activado.</small>
          </div>
          <div class="login-form-feedback" id="login-form-feedback" role="alert" hidden></div>
          <button id="login-submit" class="login-submit" type="submit">
            <span id="login-submit-text">Entrar al panel</span><span aria-hidden="true">→</span>
          </button>
        </form>
        <div class="login-help">
          <p>¿Tienes problemas para acceder? Contacta al administrador de la plataforma.</p>
          <a href="/">← Volver a Canelo Scout</a>
        </div>
      </div>
    </section>
  </main>
  <footer class="login-footer">CANELO SCOUT · ACCESO EXCLUSIVO PARA PERSONAL AUTORIZADO</footer>
  <script src="/login.js" defer></script>
</body></html>`;
}
