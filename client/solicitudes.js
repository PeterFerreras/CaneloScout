// Visual structure follows dist/index.html; state is supplied by the controller.
export function render(data, context) {
  const { event, teams, players } = data;
  const { escape, labels, initials, statusTag, playerForm, empty, positions, selected, operationRow, eventQuery, eventId, demoState } = context;
  const approved = players.filter(player => player.status === "approved");
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
        ${statusTag(player.status)}<p>Pago: <strong>${escape(({pending:"Por validar",validated:"Validado",rejected:"Rechazado"})[player.payment_status] || "Por validar")}</strong></p><div class="data"><div><small>Edad</small><b>${escape(player.details.age)} años</b></div>
        <div><small>Batea / lanza</small><b>${escape(player.details.bats)} / ${escape(player.details.throws)}</b></div></div>
        <p>${escape(player.details.email)} · ${escape(player.details.phone)} · ${escape(player.details.age)} años</p>
        <h4>Documento cargado</h4><p class="receipt">Comprobante de pago · Ref. ${escape(player.details.payref || '—')}</p>
        ${demoState ? '<p class="notice">Comprobante de ejemplo · Sin valor contable</p>' : `<a class="btn light" href="/admin/registrations/${player.id}/receipt?ver=1" target="_blank" rel="noopener">Ampliar comprobante</a>`}
        <details><summary>Datos de inscripción</summary><dl>${Object.entries({
          'Código': player.id, 'Fecha de nacimiento': player.details.birth, 'Nacionalidad': player.details.nationality,
          'Ciudad': player.details.city, 'Tutor': player.details.guardian, 'Teléfono del tutor': player.details.guardianPhone,
          'Academia': player.details.academy, 'Nivel': player.details.level, 'Batea': player.details.bats, 'Lanza': player.details.throws,
          'Estatura': player.details.height, 'Peso': player.details.weight, 'Asistencia': player.details.attendance,
          'Referencia de pago': player.details.payref
        }).map(([label, value]) => `<dt>${label}</dt><dd>${escape(value || '—')}</dd>`).join('')}</dl></details>
        <label>Nota interna<textarea name="note" placeholder="Observaciones…" maxlength="2000">${escape(player.note)}</textarea></label>
        <label>Validación independiente del pago<select name="payment_status">${Object.entries({pending:"Por validar",validated:"Validado",rejected:"Rechazado"}).map(([value,label]) => `<option value="${value}" ${selected(player.payment_status || "pending",value)}>${label}</option>`).join("")}</select></label><div class="decisions"><button name="status" value="correction">Pedir corrección</button>
        <button name="status" value="rejected">No elegible</button><button name="status" value="approved">Aprobar solicitud</button>
        <button name="status" value="${player.status}">Guardar nota</button></div>`)).join('') ||
        empty('Todavía no se han recibido solicitudes.')) + '</section></div>';
}
