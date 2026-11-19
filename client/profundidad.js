// Visual structure follows dist/index.html; state is supplied by the controller.
export function render(data, context) {
  const { event, teams, players } = data;
  const { escape, labels, initials, statusTag, playerForm, empty, positions, selected, operationRow, eventQuery, eventId, demoState } = context;
  const approved = players.filter(player => player.status === "approved");
return `<p class="notice warn">Selecciona una posición para consultar jugadores por su posición principal o secundaria.</p>
        <div class="diamondgrid"><div><div class="diamond" aria-label="Posiciones de béisbol">${positions.map(([position, short, left, top]) =>
          `<button class="pos" type="button" style="left:${left}%;top:${top}%" data-position="${position}" aria-label="${position}" aria-pressed="false">
          ${short} <span>${approved.filter(player => [player.details.primary, player.details.secondary].includes(position)).length}</span></button>`).join('')}</div>
          <p><button type="button" data-position="" aria-pressed="true">Todas las posiciones</button></p></div><div>
          <h3>Jugadores aprobados</h3><p>${approved.filter(p => !p.team_id).length} sin asignar · ${teams.length} equipos</p><p id="position-empty" hidden>Sin jugadores en esta posición.</p>` +
        (approved.map(player => `<form class="chip assignment" data-action="assign" data-player="${player.id}"><span class="avatar">${initials(player.details.name)}</span>
          <span><b>${escape(player.details.name)}</b><small>${escape(player.details.primary)} / ${escape(player.details.secondary || '—')}</small></span>
          <label class="sr-only" for="team-${player.id}">Equipo de ${escape(player.details.name)}</label><select id="team-${player.id}" name="team_id" data-autoassign>
          <option value="">Sin asignar</option>${teams.filter(team => !player.event_id || team.event_id === player.event_id).map(team =>
            `<option value="${team.id}" ${selected(player.team_id, team.id)}>${escape(team.name)}</option>`).join('')}</select><button class="sr-only">Guardar</button></form>`).join('') ||
          empty('Los jugadores aprobados aparecerán aquí.')) +
          `${eventId || demoState ? '<form class="team-create" data-action="team"><label>Nuevo equipo<input name="name" required maxlength="60" placeholder="Nombre del equipo"></label><button>+ Crear otro equipo</button></form>' : '<p class="notice">Selecciona un evento para crear equipos.</p>'}</div></div>`;
}
