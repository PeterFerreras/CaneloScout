// Shared workflow invariants for Solicitudes, Profundidad, Operación and Publicación.
export function updateOperation({ db, id, event, patch, res, invalid }) {
  const existing = db.prepare('SELECT * FROM operations WHERE id = ?').get(id);
  const allowed = ['status','note','team_id','jersey','checked','sprint','velocity','published','payment_status'];
  if (!patch || typeof patch !== 'object' || Object.keys(patch).some(key => !allowed.includes(key))) return invalid(res, 'Cambio no permitido.');
  const next = { ...existing, ...patch };
  if (!['pending','validated','rejected'].includes(next.payment_status)) return invalid(res, 'Estado de pago inválido.');
  if (next.status === 'correction' && (typeof next.note !== 'string' || !next.note.trim())) return invalid(res, 'Escribe qué debe corregirse en la nota.');
  const registration = db.prepare('SELECT details FROM registrations WHERE id = ?').get(id);
  if (next.published && !JSON.parse(registration.details).consent) return invalid(res, 'Falta autorización para publicar.');
  if (!['review', 'correction', 'rejected', 'approved'].includes(next.status) ||
      typeof next.note !== 'string' || next.note.length > 2000 ||
      typeof next.checked !== 'boolean' && ![0, 1].includes(next.checked) ||
      typeof next.published !== 'boolean' && ![0, 1].includes(next.published)) {
    return invalid(res, 'Revisa el estado y la nota de la solicitud.');
  }
  if (next.team_id !== null && (typeof next.team_id !== 'string' ||
      !db.prepare('SELECT 1 FROM teams WHERE id = ? AND event_id = ?').get(next.team_id, event.id))) {
    return invalid(res, 'Selecciona un equipo de este evento.');
  }
  if (next.status !== 'approved') {
    Object.assign(next, { team_id: null, jersey: null, checked: 0, sprint: null, velocity: null, published: 0 });
  }
  if (next.team_id !== existing.team_id) Object.assign(next, { jersey: null, published: 0, checked: 0, sprint: null, velocity: null });
  if ((next.checked || next.sprint !== null || next.velocity !== null) && !next.team_id) return invalid(res, 'Asigna un equipo antes de registrar asistencia o mediciones.');
  if (patch.published === true && next.payment_status !== 'validated') return invalid(res, 'Valida el pago antes de publicar.');
  if (next.payment_status !== 'validated') next.published = 0;
  if (next.published && !next.team_id) return invalid(res, 'Asigna un equipo antes de publicar.');
  if (next.jersey !== null && (!next.team_id || !Number.isInteger(next.jersey) || next.jersey < 0 || next.jersey > 999)) {
    return invalid(res, 'Usa un número de camiseta entre 0 y 999 para un jugador con equipo.');
  }
  if ([next.sprint, next.velocity].some(value => value !== null && !(typeof value === 'number' && Number.isFinite(value) && value > 0))) {
    return invalid(res, 'Las mediciones deben ser números positivos.');
  }
  if (next.jersey !== null && db.prepare('SELECT 1 FROM operations WHERE team_id = ? AND jersey = ? AND id <> ?')
      .get(next.team_id, next.jersey, id)) return invalid(res, 'Ese número ya está en uso en el equipo.');
  db.prepare('UPDATE operations SET status = ?, note = ?, team_id = ?, jersey = ?, checked = ?, sprint = ?, velocity = ?, published = ?, payment_status = ? WHERE id = ?')
    .run(next.status, next.note, next.team_id, next.jersey, Number(next.checked), next.sprint, next.velocity, Number(next.published), next.payment_status, id);

  return true;
}
