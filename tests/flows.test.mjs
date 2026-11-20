import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('real HTTP workflow on an isolated SQLite database', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'canelo-test-'));
  const port = 18972;
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.mjs'], { cwd: new URL('../', import.meta.url), env: {
    ...process.env, DATA_DIR: directory, PORT: String(port), ADMIN_PASSWORD: 'test-password-only', PUBLIC_ORIGIN: origin
  }, stdio: ['ignore','pipe','pipe'] });
  let logs = '';
  child.stderr.on('data', b => { logs += b; });
  try {
    await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(() => { throw Error(logs); }),
      new Promise((_, reject) => { const timer = setTimeout(() => reject(Error('Server startup timed out: ' + logs)), 10000); timer.unref(); })]);
    let cookie = '';
    async function request(path, payload, status = 200) {
      const response = await fetch(origin + path, { method: payload === undefined ? 'GET' : 'POST',
        headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload), redirect: 'manual' });
      const text = await response.text();
      assert.equal(response.status, status, path + ': ' + text.slice(0,300));
      return response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : text;
    }
    await request('/admin/events', undefined, 401);
    await request('/admin/site', undefined, 401);
    await request('/admin/site/preview', undefined, 303);
    const loginHtml = await request('/admin/login');
    assert.match(loginHtml, /login\.css|login\.js/);
    assert.match(loginHtml, /id="login-user"/);
    assert.match(loginHtml, /id="login-password"/);
    assert.match(await request('/login.js'), /login-form/);
    assert.match(await request('/login.css'), /login-layout/);
    const invalidLogin = await fetch(origin + '/admin/login', {method: 'POST',redirect: 'manual',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Origin: origin},
      body: new URLSearchParams({username: '', password: 'corta'})});
    assert.equal(invalidLogin.status, 422);
    assert.match(await invalidLogin.text(), /Completa ambos campos/);
    const wrongLogin = await fetch(origin + '/admin/login', {method: 'POST',redirect: 'manual',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Origin: origin},
      body: new URLSearchParams({username: 'admin', password: 'contraseña-incorrecta'})});
    assert.equal(wrongLogin.status, 401);
    assert.match(await wrongLogin.text(), /usuario o la contraseña son incorrectos/);
    const login = await fetch(origin + '/admin/login', { method:'POST', redirect:'manual',
      headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:origin},
      body:new URLSearchParams({username:'admin',password:'test-password-only'}) });
    assert.equal(login.status,303); cookie=login.headers.get('set-cookie').split(';')[0];
    const adminLayout = await request('/admin/?vista=prensa');
    assert.match(adminLayout, /admin-logout/);
    assert.match(adminLayout, /site-footer admin-footer/);
    assert.match(adminLayout, /shell\.css/);
    assert.doesNotMatch(adminLayout, /session-actions/);
    const publicLayout = await request('/');
    assert.match(publicLayout, /nav-admin-access/);
    assert.match(publicLayout, /site-footer public-footer/);
    assert.match(await request('/shell.css'), /footer-inner/);
    assert.match(loginHtml, /i18n\.js/);
    assert.match(adminLayout, /i18n\.js/);
    assert.match(publicLayout, /i18n\.js/);
    const registerI18nScript = await request('/i18n.js');
    assert.match(registerI18nScript, /canelo_lang/);
    assert.match(registerI18nScript, /language-switch/);
    assert.match(registerI18nScript, /container\.setAttribute\('value', container\.value\)/);
    assert.match(await request('/operations.js'), /admin-sidebar/);
    assert.match(await request('/client/publicacion.js'), /publish-metrics/);
    assert.match(await request('/client/sitio.js'), /site-settings-form/);
    assert.match(await request('/operations.js'), /vista=sitio/);
    const siteState = await request('/admin/site');
    assert.equal(siteState.draft.heroTitleEs, 'CANELO SCOUT');
    assert.equal(siteState.hasUnpublishedChanges, false);
    const draftSite = { ...siteState.draft, heroTitleEs: 'CANELO SCOUT DEMO ES',
      heroTitleEn: 'CANELO SCOUT DEMO EN', seoTitleEs: 'Demostración Canelo Scout' };
    await request('/admin/site', { ...draftSite, heroTitleEn: '' , action: 'save' }, 422);
    const savedSite = await request('/admin/site', { ...draftSite, action: 'save' });
    assert.equal(savedSite.hasUnpublishedChanges, true);
    assert.match(await request('/admin/site/preview'), /CANELO SCOUT DEMO ES/);
    assert.doesNotMatch(await request('/'), /CANELO SCOUT DEMO ES/);
    const sitePublished = await request('/admin/site', { ...draftSite, action: 'publish' });
    assert.equal(sitePublished.hasUnpublishedChanges, false);
    assert.match(await request('/'), /CANELO SCOUT DEMO ES/);
    assert.match(await request('/'), /Demostración Canelo Scout/);

    assert.equal((await request('/admin/event')).players.length,0);
    assert.doesNotMatch(await request('/prensa'), /jugadores ficticios|ejemplo@example/);
    await request('/prensa?event=');
    await request('/eventos/inexistente',undefined,404);
    const config={name:'Invitational 2027',starts:'2027-01-12',ends:'2027-01-14',venue:'Sede de prueba',accepting:true,
      description:'Edición configurable',fee_label:'US$125',contact:'Organización de prueba',payment_instructions:'Consultar referencia'};
    const {id:event}=await request('/admin/events',config);
    const page=await request('/registro?event='+event);
    assert.match(page,/US\$125/); assert.match(page,/Organización de prueba/);
    assert.doesNotMatch(page,/11761090034|2026|onclick=|id="admin"/);
    assert.match(await request('/'),/3 DÍAS/);
    const image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVZkAAAAASUVORK5CYII=';
    const fields={name:'Jugador de prueba',birth:'2005-01-01',nationality:'Dominicana',city:'Santo Domingo',phone:'0000000000',
      email:'test@example.com',primary:'Pitcher',secondary:'Catcher',bats:'Derecha',throws:'Derecha',academy:'Prueba',level:'College',
      attendance:'Todo el evento',passport:'Sí',payref:'TEST',consent:'on',truth:'on'};
    const register=()=>request('/api/registrations',{eventId:event,fields,photo:image,receipt:image},201);
    const {id:player}=await register();
    const {id:second}=await register();
    const playerPath=id=>`/admin/registrations/${id}?event=${event}`;
    await request(playerPath(player),{status:'approved'});
    let data=await request('/admin/event?event='+event);
    assert.equal(data.players.find(p=>p.id===player).payment_status,'pending');
    await request(playerPath(player),{published:true},422);
    await request(playerPath(player),{checked:true},422);
    await request('/admin/teams?event='+event,{name:'Azul'},201);
    await request('/admin/teams?event='+event,{name:'Rojo'},201);
    data=await request('/admin/event?event='+event);
    const [blue,red]=data.teams;
    await request(playerPath(player),{team_id:blue.id,payment_status:'validated'});
    await request(playerPath(player),{jersey:12,checked:true,sprint:6.8,velocity:88});
    await request(playerPath(second),{status:'approved',team_id:blue.id});
    await request(playerPath(second),{jersey:12},422);
    await request(playerPath(player),{published:true});
    // Showcase phase must be completed before the game phase.
    await request('/admin/tryouts?event='+event,undefined,200);
    await request('/admin/tryouts/sessions?event='+event,
      {name:'Juego temprano',date:'2027-01-12',kind:'game',note:''},422);
    const {id:showcase}=await request('/admin/tryouts/sessions?event='+event,
      {name:'Tryouts Día 1',date:'2027-01-12',kind:'showcase',note:'Pruebas y mediciones'},201);
    const scorecard=await request('/admin/tryouts?event='+event+'&session='+showcase);
    assert.equal(scorecard.phase,'showcase');
    assert.equal(scorecard.drills.length>=10,true);
    assert.equal(scorecard.players.some(p=>p.id===player),true);
    const pitch=scorecard.drills.find(d=>d.name==='Velocidad de recta');
    const outfield=scorecard.drills.find(d=>d.name==='Tiro del jardín derecho al home');
    assert.ok(pitch && outfield);
    const attempt=(drillId,attemptNo,value,note='') =>
      request('/admin/tryouts/sessions/'+showcase+'/attempts?event='+event,
        {playerId:player,drillId,attemptNo,value,note});
    await attempt(outfield.id,1,89,'Tiro no autorizado por posición'),422;
    await attempt(pitch.id,1,83,'Velocidad de recta — prueba interna');
    await attempt(pitch.id,2,91);
    await attempt(pitch.id,2,92);
    await attempt(pitch.id,3,220, 'Fuera del rango'),422;
    const privateProfile=await request('/api/showcase?event='+event+'&player='+player);
    assert.equal(privateProfile.sessions.length,0,'Draft tryout statistics must not be public');
    await request('/admin/tryouts/sessions?event='+event,
      {name:'Juego antes del cierre',date:'2027-01-13',kind:'game',note:''},422);
    await request('/admin/tryouts/sessions/'+showcase+'/status?event='+event,
      {status:'closed',published:true});
    await request('/admin/tryouts/sessions/'+showcase+'/attempts?event='+event,
      {playerId:player,drillId:pitch.id,attemptNo:3,value:93},422);
    const scoutAfterTryout=await request('/api/showcase?event='+event+'&player='+player);
    assert.equal(scoutAfterTryout.sessions[0].kind,'showcase');
    assert.equal(scoutAfterTryout.sessions[0].drills.find(d=>d.name==='Velocidad de recta').best,92);
    assert.equal(scoutAfterTryout.sessions[0].drills.find(d=>d.name==='Velocidad de recta').attempts.length,2);
    assert.doesNotMatch(JSON.stringify(scoutAfterTryout), /Tiro no autorizado|prueba interna|test@example.com|payref/);
    const {id:game}=await request('/admin/tryouts/sessions?event='+event,
      {name:'Juego 1',date:'2027-01-13',kind:'game',note:'Scrimmage'},201);
    await request('/admin/tryouts/sessions?event='+event,
      {name:'Tryout tardío',date:'2027-01-14',kind:'showcase',note:''},422);
    const gameData=await request('/admin/tryouts?event='+event+'&session='+game);
    assert.equal(gameData.phase,'game');
    assert.equal(gameData.drills.some(d=>d.name==='Ponches (K)'),true);
    const strikeouts=gameData.drills.find(d=>d.name==='Ponches (K)');
    await request('/admin/tryouts/sessions/'+game+'/attempts?event='+event,
      {playerId:player,drillId:strikeouts.id,attemptNo:1,value:6,note:'6 ponches'});
    await request('/admin/tryouts/sessions/'+game+'/status?event='+event,
      {status:'open',published:true});
    const scout=await request('/api/showcase?event='+event+'&player='+player);
    assert.deepEqual(scout.sessions.map(s=>s.kind),['showcase','game']);
    assert.equal(scout.sessions[1].drills.find(d=>d.name==='Ponches (K)').best,6);
    const profileHtml=await request('/prensa?event='+event+'&jugador='+player);
    assert.match(profileHtml,/showcase-profile|showcase\.js/);
    assert.match(await request('/showcase.js'),/scout-highlights/);
    assert.match(await request('/client/tryouts.js'),/Intento/);
    const press=await request('/prensa?event='+event);
    assert.match(press,/Jugador de prueba/); assert.doesNotMatch(press,/test@example.com|0000000000|TEST/);
    await request(playerPath(player),{team_id:red.id});
    data=await request('/admin/event?event='+event);
    await request('/api/showcase?event='+event+'&player='+player,undefined,404);
    const changed=data.players.find(p=>p.id===player);
    assert.equal(changed.jersey,null); assert.equal(changed.checked,0); assert.equal(changed.sprint,null); assert.equal(changed.published,0);
    await request(playerPath(player),{status:'correction',note:''},422);
    await request(playerPath(player),{status:'correction',note:'Actualizar comprobante'});
    assert.match(await request('/seguimiento?codigo='+player),/Requiere corrección/);
    assert.match(await request('/corregir?codigo='+player),/Se conservará tu código/);
    const corrected=await request('/api/registrations',{eventId:event,correctionCode:player,fields,photo:image,receipt:image},201);
    assert.equal(corrected.id,player);
    assert.match(await request('/seguimiento?codigo='+player),/En revisión/);
    await request('/api/registrations',{eventId:event,correctionCode:player,fields,photo:image,receipt:image},422);
    await request('/admin/events?event='+event,{...config,starts:'2027-01-13'},422);
    for(const screen of ['solicitudes','profundidad','operacion','publicacion']){
      const {render}=await import('../client/'+screen+'.js');
      const context={escape:v=>String(v??''),labels:{},initials:()=>'',statusTag:()=>'',playerForm:()=>'',empty:()=>'',positions:[],
        selected:()=>'',operationRow:()=>'',eventQuery:'?event='+event,eventId:event,params:new URLSearchParams()};
      assert.equal(typeof render(data,context),'string');
      assert.match(await request('/client/'+screen+'.js'),/export function render/);
    }
    await request('/admin/events?event='+event,{...config,accepting:false});
    await request('/api/registrations',{eventId:event,fields,photo:image,receipt:image},422);
    await request('/registro?event='+event,undefined,410);
    await request('/admin/logout',{},303);
    await request('/admin/events',undefined,401);
    for (let attempt = 0; attempt < 8; attempt++) {
      const denied = await fetch(origin + '/admin/login', {method: 'POST', redirect: 'manual',
        headers: {'Content-Type': 'application/x-www-form-urlencoded', Origin: origin},
        body: new URLSearchParams({username: 'admin', password: 'incorrect-password'})});
      assert.equal(denied.status, 401, 'Intento fallido ' + (attempt + 1));
    }
    const throttled = await fetch(origin + '/admin/login', {method: 'POST', redirect: 'manual',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', Origin: origin},
      body: new URLSearchParams({username: 'admin', password: 'incorrect-password'})});
    assert.equal(throttled.status, 429);
    assert.equal(throttled.headers.get('retry-after'), '60');
    t.diagnostic('Registration, review/payment, assignment, duplicate jerseys, measurements, publishing, event settings and logout passed.');
  } finally {
    child.kill();
    await once(child,'exit').catch(()=>{});
    rmSync(directory,{recursive:true,force:true});
  }
});
