// Visual structure follows dist/index.html; state is supplied by the controller.
export function render(data, context) {
  const { event, teams, players } = data;
  const { escape, labels, initials, statusTag, playerForm, empty, positions, selected, operationRow, eventQuery, eventId, demoState } = context;
  const approved = players.filter(player => player.status === "approved");
return `<p><a href="/prensa${eventQuery}" target="_blank" rel="noopener">Abrir Media Center</a></p>` +
        (approved.filter(player => player.team_id && player.details.consent).map(player => playerForm(player, 'publish', `
          <p>${escape(player.team)}</p><p>${player.payment_status === 'validated' ? 'Pago validado' : 'Valida el pago en Solicitudes antes de publicar.'}</p><label class="check"><input type="checkbox" name="published" ${player.published ? 'checked' : ''} ${player.payment_status !== 'validated' ? 'disabled' : ''}> Publicar perfil deportivo</label>`)).join('') ||
          empty('Los jugadores con autorización de publicación y equipo asignado aparecerán aquí.'));
}
