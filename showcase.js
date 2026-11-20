
(() => {
  'use strict';
  const root=document.getElementById('showcase-profile');
  if(!root)return;
  const eventId=root.dataset.event,playerId=root.dataset.player;
  const endpoint='/api/showcase?'+new URLSearchParams({event:eventId,player:playerId});
  const container=document.getElementById('showcase-body');
  const refreshed=document.getElementById('showcase-updated');
  const status=document.getElementById('showcase-status');
  const reload=document.getElementById('showcase-refresh');
  const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
  const tr=(es,en)=>document.documentElement.lang==='en'?en:es;
  const unit={seconds:'s',mph:'mph',meters:'m',feet:'ft',count:'',score:'/10',percent:'%',reps:'reps'};
  const number=(n,u)=>Number(n).toLocaleString(document.documentElement.lang==='en'?'en-US':'es-DO',
    {maximumFractionDigits:3})+(unit[u]?' '+unit[u]:'');
  const date=v=>v?new Date(v).toLocaleDateString(document.documentElement.lang==='en'?'en-US':'es-DO',
    {day:'numeric',month:'short',year:'numeric'}):'—';
  const time=v=>v?new Date(v).toLocaleTimeString(document.documentElement.lang==='en'?'en-US':'es-DO',
    {hour:'2-digit',minute:'2-digit'}):'—';
  let busy=false;
  function draw(data) {
    if(!data.sessions.length) {
      container.innerHTML='<div class="scout-no-results">'+
        tr('Aún no hay resultados de showcase autorizados para publicar.',
          'No showcase results have been approved for publication yet.')+'</div>';
      return;
    }
    const all=data.sessions.flatMap(s=>s.drills.map(d=>({...d,session:s})));
    const highlighted=all.filter(d=>['Carrera de 60 yardas','Velocidad de recta','Velocidad de salida del bate',
      'Tiro del jardín derecho al home','Pop time a segunda base','Ponches (K)'].includes(d.name)).slice(0,4);
    const highlights=highlighted.map(d=>`<article class="scout-highlight">
      <span>${esc(d.name)}</span><strong>${number(d.best,d.unit)}</strong>
      <small>${esc(d.session.name)}</small></article>`).join('');
    const sections=data.sessions.map(session=>`<section class="scout-session">
      <header class="scout-session-title"><div><span class="scout-period">
        ${session.kind==='game'?tr('JUEGO','GAME'):'SHOWCASE'}
        ${session.status==='open'?'<span class="scout-live">● '+tr('EN CURSO','LIVE')+'</span>':''}
        </span><h4>${esc(session.name)}</h4><small>${date(session.session_date)}</small></div>
        <small>${session.drills.length} ${tr('pruebas con resultados','recorded tests')}</small></header>
      <div class="scout-results-table-wrap"><table class="scout-results-table">
        <thead><tr><th>${tr('Prueba','Drill')}</th><th>${tr('Grupo','Group')}</th>
          <th>${tr('Mejor marca','Best')}</th><th>${tr('Intentos','Attempts')}</th></tr></thead>
        <tbody>${session.drills.map(drill=>`<tr><td><strong>${esc(drill.name)}</strong>
            <small>${drill.position==='all'?'':esc(drill.position)}</small></td>
          <td>${esc(drill.group)}</td><td class="scout-best">${number(drill.best,drill.unit)}</td>
          <td><div class="scout-attempt-values">${drill.attempts.map(a=>`<span>
            <small>#${a.no}</small> ${number(a.value,drill.unit)}</span>`).join('')}</div></td>
          </tr>`).join('')}</tbody></table></div></section>`).join('');
    container.innerHTML=(highlights?'<div class="scout-highlights">'+highlights+'</div>':'')+sections;
  }
  async function load() {
    if(busy)return;
    busy=true;reload.disabled=true;status.textContent=tr('Actualizando…','Refreshing…');
    try{
      const response=await fetch(endpoint,{cache:'no-store'});
      if(!response.ok)throw Error(tr('Los resultados no están disponibles.','Results are unavailable.'));
      draw(await response.json());
      refreshed.textContent=tr('Actualizado: ','Updated: ')+time(new Date().toISOString());
      status.textContent=tr('Los resultados visibles son publicados por la organización.',
        'Results are published by the organizer.');
    }catch(e){status.textContent=e.message}
    finally{busy=false;reload.disabled=false}
  }
  reload.addEventListener('click',load);
  load();
  setInterval(()=>{if(!document.hidden)load()},30000);
})();
