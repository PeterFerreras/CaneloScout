// Publicación de perfiles: panel con indicadores, controles y próximos pasos claros.
export function render(data, context) {
  const { players = [] } = data;
  const { escape, eventId } = context;
  const href = vista => '/admin/?' + new URLSearchParams({
    ...(eventId ? { event: eventId } : {}), vista
  }).toString();
  const approved = players.filter(player => player.status === 'approved');
  const ready = approved.filter(player =>
    player.team_id && player.details?.consent && player.payment_status === 'validated');
  const candidates = approved.filter(player => player.team_id && player.details?.consent);
  const published = ready.filter(player => !!player.published);
  const paymentValidated = players.filter(player => player.payment_status === 'validated');

  const stats = [
    ['Aprobados', approved.length, 'Evaluación deportiva'],
    ['Pagos validados', paymentValidated.length, 'Comprobantes revisados'],
    ['Listos para publicar', ready.length, 'Cumplen los requisitos'],
    ['Perfiles publicados', published.length, 'Visibles en Media Center']
  ];
  const cards = stats.map(([label, number, detail]) =>
    `<article class="card publish-stat"><span>${label}</span>
      <strong>${number}</strong><small>${detail}</small></article>`).join('');

  const rows = candidates.map(player => {
    const valid = player.payment_status === 'validated';
    const isPublished = !!player.published;
    const label = isPublished ? 'Publicado' : valid ? 'Listo para publicar' : 'Pendiente de pago';
    return `<form class="card publish-player" data-action="publish" data-player="${escape(player.id)}">
      <div class="publish-player-details">
        <span class="avatar" aria-hidden="true">${escape(player.details.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase())}</span>
        <div class="publish-player-name"><strong>${escape(player.details.name)}</strong>
          <small>${escape(player.team || 'Sin equipo')} · ${escape(player.details.primary || '')}</small></div>
      </div>
      <span class="tag ${isPublished ? 'ok' : valid ? 'blue' : ''}">${label}</span>
      <label class="check publish-toggle">
        <input type="checkbox" name="published" ${isPublished ? 'checked' : ''} ${valid ? '' : 'disabled'}>
        Visible en Media Center
      </label>
      <button type="submit" ${valid ? '' : 'disabled'}>Guardar</button>
    </form>`;
  }).join('');

  const empty = `<div class="card publish-empty">
    <span class="publish-empty-symbol" aria-hidden="true">CS</span>
    <h3>Sin jugadores preparados para publicación</h3>
    <p>${players.length ?
      'Primero verifica la aprobación deportiva, el pago y la asignación a un equipo. Los jugadores elegibles aparecerán aquí.' :
      'Aún no hay solicitudes para mostrar. Cuando recibas inscripciones, podrás aprobar jugadores y publicar sus perfiles deportivos.'}</p>
    <div class="publish-actions">
      <a class="btn light" href="${href('solicitudes')}">Revisar solicitudes</a>
      <a class="btn light" href="${href('rosters')}">Organizar equipos</a>
    </div>
  </div>`;

  return `<div class="publishing-dashboard">
    <div class="publish-metrics">${cards}</div>
    <section class="card publish-overview">
      <div><span class="eyebrow">PUBLICACIÓN CONTROLADA</span>
        <h3>Perfiles para prensa y scouts</h3>
        <p>Solo serán visibles los jugadores aprobados, con pago validado, equipo asignado y autorización de publicación.</p></div>
      <a class="btn red" href="/prensa${eventId ? '?event=' + encodeURIComponent(eventId) : ''}" target="_blank" rel="noopener">
        Ver Media Center ↗</a>
    </section>
    <div class="publish-layout">
      <section class="publish-primary">
        <div class="publish-heading"><div><h3>Control de perfiles</h3>
          <p>Activa o retira los perfiles autorizados para su publicación.</p></div>
          <span class="publish-count">${candidates.length} candidatos</span>
        </div>
        ${rows || empty}
      </section>
      <aside class="card publish-checklist">
        <span class="eyebrow">ANTES DE PUBLICAR</span><h3>Proceso de preparación</h3>
        <ol>
          <li><strong>Validar solicitudes</strong><span>Comprueba los datos y la documentación.</span></li>
          <li><strong>Confirmar pagos</strong><span>Autoriza el comprobante por separado.</span></li>
          <li><strong>Asignar un equipo</strong><span>Organiza a los jugadores aprobados.</span></li>
          <li><strong>Publicar el perfil</strong><span>Habilita el acceso para prensa y scouts.</span></li>
        </ol>
        <a href="${href('solicitudes')}">Ir a solicitudes →</a>
      </aside>
    </div>
  </div>`;
}
