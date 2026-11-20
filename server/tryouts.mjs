import { randomUUID } from 'node:crypto';

/** Separate evaluations from roster/check-in and keep all individual attempts. */
export const POSITION_GROUPS = Object.freeze({
  infield: ['Primera base', 'Segunda base', 'Tercera base', 'Shortstop'],
  outfield: ['Left field', 'Center field', 'Right field'],
  pitcher: ['Pitcher'],
  catcher: ['Catcher']
});

export const SHOWCASE_DRILLS = Object.freeze([
  ['general','all','Carrera de 60 yardas','seconds',3,'min'],
  ['general','all','Carrera de 30 yardas','seconds',2,'min'],
  ['general','all','Velocidad de salida del bate','mph',3,'max'],
  ['infield','all','Velocidad de tiro del infield','mph',3,'max'],
  ['infield','all','Fildeo y control','score',3,'max'],
  ['outfield','Right field','Tiro del jardín derecho al home','mph',4,'max'],
  ['outfield','all','Velocidad de tiro del outfield','mph',3,'max'],
  ['outfield','all','Precisión al home (de 5)','count',2,'max'],
  ['pitcher','all','Velocidad de recta','mph',5,'max'],
  ['pitcher','all','Strikes en zona (de 10)','count',2,'max'],
  ['catcher','all','Pop time a segunda base','seconds',3,'min'],
  ['catcher','all','Velocidad del tiro del catcher','mph',3,'max']
]);
export const GAME_DRILLS = Object.freeze([
  ['pitcher','all','Ponches (K)','count',1,'max'],
  ['pitcher','all','Bases por bolas (BB)','count',1,'min'],
  ['pitcher','all','Hits permitidos (H)','count',1,'min'],
  ['general','all','Hits conectados (H)','count',1,'max'],
  ['general','all','Carreras impulsadas (RBI)','count',1,'max']
]);
const UNITS = new Set(['seconds','mph','meters','feet','count','score','percent','reps']);
const GROUPS = new Set(['general', ...Object.keys(POSITION_GROUPS)]);
const error = (message, status = 422) => { throw Object.assign(new Error(message), { status }); };
const trimmed = (v,max) => typeof v === 'string' && v.trim().length <= max ? v.trim() : null;
const dateOK = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d)) && new Date(d).toISOString().slice(0,10) === d;
const stamp = () => new Date().toISOString();
const isRelevant = (player, drill) => {
  if (drill.group_key === 'general') return true;
  const positions = [player.primary,player.secondary].filter(Boolean);
  return positions.some(p => POSITION_GROUPS[drill.group_key].includes(p) &&
    (drill.position_key === 'all' || p === drill.position_key));
};
function validValue(value,unit) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  if (unit === 'seconds') return value > 0 && value <= 600;
  if (unit === 'mph') return value > 0 && value <= 200;
  if (unit === 'score') return value >= 0 && value <= 10;
  if (unit === 'percent') return value >= 0 && value <= 100;
  if (unit === 'meters' || unit === 'feet') return value >= 0 && value <= 1000;
  if (unit === 'count' || unit === 'reps') return Number.isInteger(value) && value >= 0 && value <= 200;
  return false;
}

export function createTryouts(db) {
  db.exec("CREATE TABLE IF NOT EXISTS tryout_sessions ("+
    "id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), "+
    "name TEXT NOT NULL, session_date TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'showcase', "+
    "note TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open', "+
    "published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
  db.exec("CREATE TABLE IF NOT EXISTS tryout_drills ("+
    "id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES tryout_sessions(id), "+
    "group_key TEXT NOT NULL, position_key TEXT NOT NULL DEFAULT 'all', "+
    "name TEXT NOT NULL, unit TEXT NOT NULL, attempts_allowed INTEGER NOT NULL, "+
    "best_by TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)");
  db.exec("CREATE TABLE IF NOT EXISTS tryout_attempts ("+
    "id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES tryout_sessions(id), "+
    "drill_id TEXT NOT NULL REFERENCES tryout_drills(id), player_id TEXT NOT NULL REFERENCES registrations(id), "+
    "attempt_no INTEGER NOT NULL, value REAL NOT NULL, note TEXT NOT NULL DEFAULT '', "+
    "measured_at TEXT NOT NULL, updated_at TEXT NOT NULL, "+
    "UNIQUE(drill_id,player_id,attempt_no))");
  db.exec('CREATE INDEX IF NOT EXISTS ix_tryout_session_event ON tryout_sessions(event_id,session_date)');
  db.exec('CREATE INDEX IF NOT EXISTS ix_tryout_drills_session ON tryout_drills(session_id,sort_order)');
  db.exec('CREATE INDEX IF NOT EXISTS ix_tryout_attempts_session ON tryout_attempts(session_id,drill_id)');

  const getSession = (eventId,id) => {
    const item = db.prepare('SELECT * FROM tryout_sessions WHERE event_id=? AND id=?').get(eventId,id);
    if (!item) error('La sesión no pertenece al evento.',404);
    return item;
  };
  const writable = (eventId,id) => {
    const item = getSession(eventId,id);
    if (item.status !== 'open') error('La sesión está cerrada y no admite cambios.');
    return item;
  };
  const getDrill = (sessionId,drillId) => {
    const item = db.prepare('SELECT * FROM tryout_drills WHERE session_id=? AND id=?').get(sessionId,drillId);
    if (!item) error('Prueba no encontrada.',404);
    return item;
  };
  const approved = eventId => db.prepare(
    "SELECT r.id,r.details,t.name AS team FROM registrations r "+
    "JOIN operations o ON o.id=r.id LEFT JOIN teams t ON t.id=o.team_id "+
    "WHERE r.event_id=? AND o.status='approved' ORDER BY r.created_at DESC").all(eventId)
    .map(row => {
      const details = JSON.parse(row.details);
      return { id:row.id,name:details.name??'',age:details.age??null,
        primary:details.primary??'',secondary:details.secondary??'',team:row.team??'' };
    });

  function list(eventId,sessionId='') {
    const sessions = db.prepare(
      'SELECT * FROM tryout_sessions WHERE event_id=? ORDER BY session_date DESC,created_at DESC').all(eventId);
    const session = sessionId ? getSession(eventId,sessionId) : sessions[0]??null;
    const drills = session ? db.prepare(
      'SELECT * FROM tryout_drills WHERE session_id=? ORDER BY sort_order,name').all(session.id) : [];
    const attempts = session ? db.prepare(
      'SELECT * FROM tryout_attempts WHERE session_id=? ORDER BY drill_id,player_id,attempt_no').all(session.id) : [];
    const players = approved(eventId);
    return {sessions,session,drills,attempts,players,groups:POSITION_GROUPS,
      stats:{players:players.length,drills:drills.length,attempts:attempts.length,
        evaluated:new Set(attempts.map(r=>r.player_id)).size}};
  }

  function createSession(eventId,input) {
    const name = trimmed(input?.name,100), note = trimmed(input?.note??'',500);
    const kind = input?.kind??'showcase', date = input?.date;
    if (!name || note===null || !dateOK(date) || !['showcase','game'].includes(kind)) {
      error('Completa el nombre, tipo y fecha de la sesión.');
    }
    const id = randomUUID(), time=stamp();
    db.exec('BEGIN');
    try {
      db.prepare('INSERT INTO tryout_sessions (id,event_id,name,session_date,kind,note,status,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?,0,?,?)')
        .run(id,eventId,name,date,kind,note,'open',time,time);
      const add = db.prepare('INSERT INTO tryout_drills (id,session_id,group_key,position_key,name,unit,attempts_allowed,best_by,sort_order) VALUES (?,?,?,?,?,?,?,?,?)');
      (kind==='game'?GAME_DRILLS:SHOWCASE_DRILLS).forEach(([group,position,title,unit,count,best],idx)=>
        add.run(randomUUID(),id,group,position,title,unit,count,best,idx));
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK');throw e; }
    return {id};
  }

  function createDrill(eventId,sessionId,input) {
    writable(eventId,sessionId);
    const name=trimmed(input?.name,110), group=input?.group,position=input?.position??'all';
    const unit=input?.unit,count=input?.attempts,best=input?.best;
    if (!name || !GROUPS.has(group) || !UNITS.has(unit) ||
      !Number.isInteger(count) || count<1 || count>12 || !['min','max'].includes(best) ||
      (position!=='all' && (!POSITION_GROUPS[group] || !POSITION_GROUPS[group].includes(position)))) {
      error('Revisa nombre, grupo, posición, unidad e intentos permitidos.');
    }
    const id=randomUUID(),sort=db.prepare(
      'SELECT COALESCE(MAX(sort_order),-1)+1 AS n FROM tryout_drills WHERE session_id=?').get(sessionId).n;
    db.prepare('INSERT INTO tryout_drills (id,session_id,group_key,position_key,name,unit,attempts_allowed,best_by,sort_order) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id,sessionId,group,position,name,unit,count,best,sort);
    return {id};
  }

  function setSession(eventId,sessionId,input) {
    const item=getSession(eventId,sessionId);
    if (!input || Object.keys(input).some(key=>!['published','status'].includes(key)) ||
      typeof input.published!=='boolean' || !['open','closed'].includes(input.status)) {
      error('Estado de sesión o publicación inválido.');
    }
    db.prepare('UPDATE tryout_sessions SET status=?,published=?,updated_at=? WHERE id=?')
      .run(input.status,Number(input.published),stamp(),item.id);
    return {ok:true};
  }

  function record(eventId,sessionId,input) {
    writable(eventId,sessionId);
    const drill=getDrill(sessionId,input?.drillId);
    const id=input?.playerId,no=input?.attemptNo,note=trimmed(input?.note??'',300);
    if (typeof id!=='string' || !Number.isInteger(no) || no<1 || no>drill.attempts_allowed ||
      note===null) error('Revisa el jugador, número de intento y observaciones.');
    const row=db.prepare("SELECT r.details FROM registrations r "+
      "JOIN operations o ON o.id=r.id WHERE r.id=? AND r.event_id=? AND o.status='approved'").get(id,eventId);
    if (!row) error('Selecciona un jugador aprobado de este evento.');
    const d=JSON.parse(row.details);
    if (!isRelevant({primary:d.primary,secondary:d.secondary},drill)) {
      error('La prueba no corresponde a las posiciones de este jugador.');
    }
    if (input.delete===true) {
      db.prepare('DELETE FROM tryout_attempts WHERE session_id=? AND drill_id=? AND player_id=? AND attempt_no=?')
        .run(sessionId,drill.id,id,no);
    } else {
      if (!validValue(input.value,drill.unit)) error('El resultado es inválido para la unidad de la prueba.');
      const time=stamp();
      db.prepare('INSERT INTO tryout_attempts (id,session_id,drill_id,player_id,attempt_no,value,note,measured_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) '+
        'ON CONFLICT(drill_id,player_id,attempt_no) DO UPDATE SET value=excluded.value,note=excluded.note,updated_at=excluded.updated_at')
        .run(randomUUID(),sessionId,drill.id,id,no,input.value,note,time,time);
    }
    db.prepare('UPDATE tryout_sessions SET updated_at=? WHERE id=?').run(stamp(),sessionId);
    return {ok:true};
  }

  function publicPlayer(eventId,playerId) {
    const row=db.prepare(
      "SELECT r.details,t.name AS team FROM registrations r JOIN operations o ON o.id=r.id "+
      "LEFT JOIN teams t ON t.id=o.team_id WHERE r.id=? AND r.event_id=? "+
      "AND o.status='approved' AND o.payment_status='validated' AND o.published=1").get(playerId,eventId);
    if (!row) return null;
    const person=JSON.parse(row.details);
    if (!person.consent) return null;
    const sessions=db.prepare('SELECT id,name,session_date,kind,status,updated_at FROM tryout_sessions '+
      'WHERE event_id=? AND published=1 ORDER BY session_date DESC,created_at DESC').all(eventId);
    const results=sessions.map(session=>{
      const tests=db.prepare(
        'SELECT d.id,d.name,d.group_key,d.position_key,d.unit,d.best_by,d.attempts_allowed '+
        'FROM tryout_drills d WHERE d.session_id=? ORDER BY d.sort_order').all(session.id);
      const drills=tests.filter(test=>isRelevant(person,test)).map(test=>{
        const trials=db.prepare(
          'SELECT attempt_no,value,measured_at,updated_at FROM tryout_attempts '+
          'WHERE session_id=? AND drill_id=? AND player_id=? ORDER BY attempt_no')
          .all(session.id,test.id);
        if (!trials.length) return null;
        const values=trials.map(x=>x.value);
        return {name:test.name,group:test.group_key,position:test.position_key,
          unit:test.unit,bestBy:test.best_by,attemptsAllowed:test.attempts_allowed,
          best:test.best_by==='min'?Math.min(...values):Math.max(...values),
          attempts:trials.map(x=>({no:x.attempt_no,value:x.value,updatedAt:x.updated_at}))};
      }).filter(Boolean);
      return {...session,drills};
    }).filter(x=>x.drills.length);
    return {playerId,name:person.name??'',position:person.primary??'',team:row.team??'',
      sessions:results,updatedAt:results.reduce((date,s)=>s.updated_at>date?s.updated_at:date,'')};
  }

  return {list,createSession,createDrill,setSession,record,publicPlayer};
}
