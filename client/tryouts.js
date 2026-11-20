
const GROUPS=[['general','General'],['infield','Infield'],['outfield','Outfield'],['pitcher','Pitchers'],['catcher','Catchers']];
const UNITS={seconds:'s',mph:'mph',meters:'m',feet:'ft',count:'',score:'/10',percent:'%',reps:'reps'};
const link=(event,session,group,drill)=>{
  const q=new URLSearchParams({event,vista:'tryouts'});
  if(session)q.set('session',session);
  if(group)q.set('group',group);
  if(drill)q.set('drill',drill);
  return '/admin/?'+q.toString();
};
const relevant=(p,d,groups)=>d.group_key==='general'||[p.primary,p.secondary].some(position=>
  (groups[d.group_key]||[]).includes(position)&&(d.position_key==='all'||d.position_key===position));
const best=(attempts,d)=>!attempts.length?null:d.best_by==='min'?
  Math.min(...attempts.map(a=>a.value)):Math.max(...attempts.map(a=>a.value));
const display=(n,unit)=>Number(n).toLocaleString('es-DO',{maximumFractionDigits:3})+
  (UNITS[unit]?' '+UNITS[unit]:'');

export function render(data,{escape,eventId,params}) {
  const {sessions,session,drills,attempts,players,groups,stats,canCreateGame,phase}=data;
  const group=GROUPS.some(([key])=>key===params.get('group'))?params.get('group'):'general';
  const list=drills.filter(d=>d.group_key===group);
  const drill=list.find(d=>d.id===params.get('drill'))||list[0];
  const eligible=drill?players.filter(p=>relevant(p,drill,groups)):[];
  const createSession=`<form class="card try-create-form" data-action="tryout-session">
    <h3>Nueva jornada de evaluación</h3>
    <div class="try-form-grid">
      <label>Nombre<input name="name" maxlength="100" required placeholder="Ej. Showcase Día 1"></label>
      <label>Fecha<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label>
      <label>Tipo<select name="kind"><option value="showcase">Showcase · Pruebas físicas y de campo</option>
        <option value="game" ${canCreateGame?"":"disabled"}>Juego · Estadísticas de partido ${canCreateGame?"":"(termina primero los tryouts)"}</option></select></label>
      <label>Nota interna<input name="note" maxlength="500" placeholder="Observaciones de la jornada"></label>
    </div><button class="btn red">Crear sesión</button></form>`;
  const phaseRail = `<nav class="try-phase-rail" aria-label="Orden del showcase">
      <div class="try-phase ${phase==='game'?'completed':'current'}"><strong>01</strong>
        <span><b>TRYOUTS</b><small>Pruebas físicas, pitcheo y tiros</small></span></div>
      <span class="try-phase-arrow" aria-hidden="true">→</span>
      <div class="try-phase ${phase==='game'?'current':phase==='ready_for_game'?'ready':''}"><strong>02</strong>
        <span><b>JUEGO</b><small>Ponches (K), hits y RBI</small></span></div>
    </nav>`;
  if(!session) return `<div class="try-dashboard">${phaseRail}<section class="card try-hero">
    <span class="eyebrow">TRYOUTS / SHOWCASE</span>
    <h3>Sesiones de evaluación por posición</h3>
    <p>Organiza infield, outfield, pitchers y catchers; registra cada intento y conserva el historial deportivo.</p>
    </section>${createSession}</div>`;

  const sessionsNav=sessions.map(s=>`<a class="try-session-link ${s.id===session.id?'active':''}"
    href="${link(eventId,s.id,group)}" ${s.id===session.id?'aria-current="page"':''}>
    <strong>${escape(s.name)}</strong><small>${escape(s.session_date)} · ${s.kind==='game'?'Juego':'Showcase'}</small></a>`).join('');
  const metrics=[['Jugadores aprobados',stats.players],['Pruebas',stats.drills],
    ['Intentos guardados',stats.attempts],['Jugadores evaluados',stats.evaluated]]
    .map(([name,count])=>`<article class="card try-metric"><span>${name}</span><strong>${count}</strong></article>`).join('');
  const statusForm=`<form class="card try-status-form" data-action="tryout-status">
    <div><strong>${escape(session.name)}</strong><small>${escape(session.session_date)} · ${session.kind==='game'?'Juego':'Showcase'}</small>
      <span class="tag ${session.published?'ok':''}">${session.published?'Visible en Media Center':'Resultados privados'}</span></div>
    <label>Estado<select name="status"><option value="open" ${session.status==='open'?'selected':''}>Abierta</option>
      <option value="closed" ${session.status==='closed'?'selected':''}>Cerrada</option></select></label>
    <label class="check"><input type="checkbox" name="published" ${session.published?'checked':''}>
      Publicar resultados para scouts</label>
    <button class="btn red">Actualizar sesión</button>
  </form>`;
  const groupNav=GROUPS.map(([key,name])=>`<a href="${link(eventId,session.id,key)}"
    class="${group===key?'active':''}" ${group===key?'aria-current="page"':''}>${name}
    <span>${drills.filter(d=>d.group_key===key).length}</span></a>`).join('');
  const drillNav=list.map(d=>`<a class="${drill?.id===d.id?'active':''}" href="${link(eventId,session.id,group,d.id)}">
    ${escape(d.name)} <small>${d.attempts_allowed} ${d.attempts_allowed===1?'intento':'intentos'}</small></a>`).join('');
  const posOptions=Object.entries(groups).flatMap(([group,positions])=>
    positions.map(p=>`<option value="${escape(p)}" data-group="${group}">${escape(p)}</option>`)).join('');
  const drillForm=session.status!=='open'?'':`<details class="card try-custom-drill">
    <summary>+ Agregar prueba personalizada</summary>
    <form data-action="tryout-drill" class="try-form-grid">
      <label>Nombre<input name="name" required maxlength="110" placeholder="Ej. Tiempo de home a primera"></label>
      <label>Grupo<select name="group" data-try-group>${GROUPS.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label>
      <label>Posición<select name="position" data-try-position>
        <option value="all">Todas las posiciones del grupo</option>${posOptions}</select></label>
      <label>Unidad<select name="unit"><option value="seconds">Segundos</option><option value="mph">mph</option>
        <option value="count">Conteo</option><option value="meters">Metros</option>
        <option value="feet">Pies</option><option value="score">Puntuación / 10</option>
        <option value="percent">Porcentaje</option><option value="reps">Repeticiones</option></select></label>
      <label>Intentos<input type="number" name="attempts" value="3" min="1" max="12" required></label>
      <label>Mejor valor<select name="best"><option value="max">Mayor marca</option><option value="min">Menor marca</option></select></label>
      <button class="btn red">Agregar prueba</button>
    </form></details>`;
  const playerRows=drill?eligible.map(p=>{
    const scores=attempts.filter(a=>a.player_id===p.id&&a.drill_id===drill.id);
    const record=best(scores,drill);
    const attemptsForms=Array.from({length:drill.attempts_allowed},(_,index)=>{
      const n=index+1,a=scores.find(item=>item.attempt_no===n);
      return `<form class="try-attempt" data-action="tryout-attempt" data-player="${escape(p.id)}">
        <input type="hidden" name="drillId" value="${escape(drill.id)}">
        <input type="hidden" name="attemptNo" value="${n}">
        <label>Intento ${n}<input name="value" type="number" min="0"
          step="${['count','reps'].includes(drill.unit)?'1':'any'}"
          value="${escape(a?.value??'')}" ${session.status==='open'?'required':'disabled'}></label>
        <details><summary>Nota</summary><input name="note" maxlength="300"
          value="${escape(a?.note??'')}" placeholder="Observación" ${session.status==='open'?'':'disabled'}></details>
        ${session.status==='open'?`<div class="try-attempt-buttons">
          <button class="btn light" type="submit">Guardar</button>
          ${a?'<button type="submit" name="delete" value="true" formnovalidate class="try-delete">Eliminar</button>':''}
        </div>`:''}</form>`;
    }).join('');
    return `<article class="card try-player">
      <div class="try-player-head"><div><strong>${escape(p.name)}</strong>
        <small>${escape(p.primary)}${p.secondary?' · '+escape(p.secondary):''}${p.team?' · '+escape(p.team):''}</small></div>
        <div class="try-best"><small>${drill.best_by==='min'?'MENOR TIEMPO':'MEJOR MARCA'}</small>
          <strong>${record===null?'—':display(record,drill.unit)}</strong></div></div>
      <div class="try-attempt-list">${attemptsForms}</div></article>`;
  }).join(''):'';
  return `<div class="try-dashboard">
    <header class="card try-hero"><div><span class="eyebrow">SHOWCASE / TRYOUTS</span>
      <h3>Evaluaciones por intento y posición</h3>
      <p>Fase 1: mediciones y varios intentos por jugador. Fase 2: estadísticas del juego; los ponches (K) se registran solamente durante el partido.</p></div>
      <a class="btn light" target="_blank" rel="noopener" href="/prensa?event=${encodeURIComponent(eventId)}">Media Center ↗</a></header>
    ${phaseRail}
    <div class="try-metrics">${metrics}</div>
    ${phase==='ready_for_game'?'<div class="card try-next-phase"><strong>Tryouts completados.</strong> Ya puedes crear una sesión de Juego y registrar las estadísticas del partido.</div>':''}
    <div class="try-workspace"><aside class="try-sessions card"><h3>Jornadas</h3>
      <div class="try-session-links">${sessionsNav}</div>
      <details class="try-new-session"><summary>+ Nueva sesión</summary>${createSession}</details></aside>
      <section class="try-main">${statusForm}
        <div class="try-group-nav">${groupNav}</div>
        <div class="card try-drills"><div class="try-heading"><h3>Pruebas · ${GROUPS.find(x=>x[0]===group)?.[1]}</h3>
          <small>Selecciona una medición</small></div>
          <div class="try-drill-nav">${drillNav||'<p>No hay pruebas para este grupo.</p>'}</div>${drillForm}</div>
        ${drill?`<div class="try-heading try-heading-player"><div><span class="eyebrow">REGISTRO POR JUGADOR</span>
          <h3>${escape(drill.name)}</h3>
          <small>${drill.attempts_allowed} intentos · Unidad ${UNITS[drill.unit]||drill.unit} ·
            ${drill.best_by==='min'?'menor resultado':'mayor resultado'} = mejor marca</small></div>
          <span class="tag blue">${eligible.length} jugadores</span></div>
          <div class="try-players">${playerRows||'<div class="card try-blank"><h3>No hay jugadores elegibles</h3><p>Aprueba jugadores con esta posición en Solicitudes.</p></div>'}</div>`:''}
      </section></div></div>`;
}
