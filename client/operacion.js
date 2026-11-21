// Visual structure follows dist/index.html; state is supplied by the controller.
export function render(data, context) {
  const { event, teams, players } = data;
  const { escape, labels, initials, statusTag, playerForm, empty, positions, selected, operationRow, eventQuery, eventId, demoState, params } = context;
  const approved = players.filter(player => player.status === "approved");

      const assigned = approved.filter(player => player.team_id);
      const active = teams.some(team => team.id === params.get('equipo')) ? params.get('equipo') : assigned[0]?.team_id;
      return `<div class="teams ops-team-tabs">${teams.map(team => `<a class="btn ${team.id === active ? '' : 'light'}" href="/admin/${eventQuery}&vista=operacion&equipo=${team.id}">${escape(team.name)}</a>`).join('')}
        <a class="btn light" href="/admin/${eventQuery}&vista=rosters">+ Nuevo equipo</a></div>
        <p class="notice">El sistema advierte si un número de camiseta ya está en uso dentro del equipo.</p>
        <div class="card ops-table"><table><thead><tr><th>Check-in</th><th>Jugador</th><th>Posición</th><th># Chaqueta</th>
        <th>60 yd</th><th>Velocidad</th><th>Estado</th></tr></thead><tbody>${assigned.filter(player => player.team_id === active).map(operationRow).join('') || '<tr><td colspan="7">Todavía no hay jugadores asignados a equipos.</td></tr>'}</tbody></table></div>`;
    
}
