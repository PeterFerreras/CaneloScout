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
    const press=await request('/prensa?event='+event);
    assert.match(press,/Jugador de prueba/); assert.doesNotMatch(press,/test@example.com|0000000000|TEST/);
    await request(playerPath(player),{team_id:red.id});
    data=await request('/admin/event?event='+event);
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
