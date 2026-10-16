// Grupos: flujo completo con un «servidor» simulado que aplica las mismas reglas
const {JSDOM}=require('jsdom');const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const DB={grupos:[],miembros:[],inv:[]};let seq=0;
function server(uid){
  const esMiembro=g=>DB.miembros.some(m=>m.grupo_id===g&&m.user_id===uid&&!m.baja)&&!DB.grupos.find(x=>x.id===g).cerrado;
  const err=m=>{const e=new Error(m);throw e};
  return {
    grupos:{
      listar:async()=>({grupos:DB.grupos.filter(g=>esMiembro(g.id)),miembros:DB.miembros.filter(m=>esMiembro(m.grupo_id))}),
      invitaciones:async g=>esMiembro(g)?DB.inv.filter(i=>i.grupo_id===g):[],
      renombrar:async(g,n)=>{const x=DB.grupos.find(y=>y.id===g);if(DB.miembros.some(m=>m.grupo_id===g&&m.user_id===uid&&m.rol==='admin'))x.nombre=n;return []},
      miNombre:async(g,n)=>{const m=DB.miembros.find(y=>y.grupo_id===g&&y.user_id===uid);if(m)m.nombre=n;return []}},
    rpc:async(fn,p)=>{
      if(fn==='crear_grupo'){const id='g'+(++seq);DB.grupos.push({id,nombre:p.p_nombre,tipo:'grupo',creado_por:uid,created_at:new Date().toISOString()});DB.miembros.push({grupo_id:id,user_id:uid,nombre:p.p_mi_nombre,rol:'admin',created_at:new Date().toISOString()});return id}
      if(fn==='crear_invitacion'){if(!esMiembro(p.p_grupo))err('no_autorizado');const t='TOKEN'+(++seq)+'abcdefghijklmnop';DB.inv.push({token:t,grupo_id:p.p_grupo,creado_por:uid,expira:new Date(Date.now()+7*864e5).toISOString(),created_at:new Date().toISOString()});return t}
      if(fn==='ver_invitacion'){const i=DB.inv.find(x=>x.token===p.p_token);if(!i)return {valida:false,motivo:'no_existe'};const g=DB.grupos.find(x=>x.id===i.grupo_id);if(esMiembro(g.id))return {valida:false,motivo:'ya_miembro',grupo:g.id,nombre:g.nombre};if(i.usada_en)return {valida:false,motivo:'usada'};return {valida:true,nombre:g.nombre,tipo:g.tipo,invita:DB.miembros.find(m=>m.grupo_id===g.id&&m.user_id===i.creado_por).nombre,miembros:DB.miembros.filter(m=>m.grupo_id===g.id&&!m.baja).length}}
      if(fn==='unirse'){const i=DB.inv.find(x=>x.token===p.p_token);if(!i||i.usada_en)err('invitacion_no_valida');DB.miembros.push({grupo_id:i.grupo_id,user_id:uid,nombre:p.p_nombre,rol:'miembro',created_at:new Date().toISOString()});i.usada_en=new Date().toISOString();return i.grupo_id}
      if(fn==='salir_grupo'){const m=DB.miembros.find(x=>x.grupo_id===p.p_grupo&&x.user_id===uid);m.baja=new Date().toISOString();return null}
      if(fn==='quitar_miembro'){const m=DB.miembros.find(x=>x.grupo_id===p.p_grupo&&x.user_id===p.p_user);m.baja='x';return null}
      if(fn==='anular_invitacion'){const i=DB.inv.find(x=>x.token===p.p_token);i.expira=new Date().toISOString();return null}
      if(fn==='cerrar_grupo'){DB.grupos.find(x=>x.id===p.p_grupo).cerrado='x';return null}
      err('?')}};
}
function env(uid,email,url){
  const e=makeEnv({url:url||'https://urlife-zeta.vercel.app/',cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},session:{user:{email,id:uid}},pre:w=>{
    w.history.replaceState=(a,b,u)=>{w.__nuevaUrl=u};
    const ls={};Object.defineProperty(w,'localStorage',{value:{getItem:k=>ls[k]==null?null:ls[k],setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},configurable:true});w.__ls=ls;
    w.open=(u)=>{w.__abierto=u};
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async t=>{w.__copiado=t}},configurable:true});
  }});
  const s=server(uid);e.w.Data.grupos=s.grupos;e.w.Data.rpc=s.rpc;e.w.Data.uid=()=>uid;return e;
}
(async()=>{
 // Álvaro crea el grupo e invita por WhatsApp
 const a=env('uA','alvaro@ejemplo.com');await sleep(120);
 const A=a.w.__APP__,H=A.H,da=a.doc,sh=()=>da.querySelector('#sheetHost').textContent;
 a.w.__APP__.H.goTab(['mas']);await sleep(20);
 ok(/Compartir/.test(da.querySelector('#content').textContent)&&/Grupos/.test(da.querySelector('#content').textContent),'Más → Compartir → Grupos');
 click(a,'openGrupos');await sleep(20);ok(/Aún no estás en ningún grupo/.test(sh()),'sin grupos todavía');
 click(a,'grupoNuevo');await sleep(70);ok(da.querySelector('#gMiNombre').value==='Alvaro','nombre sugerido a partir del correo');
 da.querySelector('#gNombre').value='Casa';click(a,'grupoCrear');await sleep(60);
 ok(DB.grupos.length===1&&DB.miembros[0].rol==='admin'&&/Casa/.test(sh())&&/Administrador/.test(sh()),'grupo «Casa» creado, Álvaro administrador');
 click(a,'grupoInvitar','g1');await sleep(40);
 const wa=da.querySelector('a.wa-btn');const url=wa&&decodeURIComponent(wa.getAttribute('href').split('text=')[1]);
 ok(wa&&/^https:\/\/wa\.me\/\?text=/.test(wa.getAttribute('href'))&&/urlife-zeta\.vercel\.app\/\?unirse=TOKEN/.test(url)&&/«Casa»/.test(url),'botón de WhatsApp con el mensaje y el enlace');
 click(a,'grupoCopiar');await sleep(10);ok(/unirse=TOKEN/.test(a.w.__copiado||''),'copiar enlace');
 ok(/1 enlace pendiente/.test(sh())&&/unirse=TOKEN/.test(sh()),'muestra el enlace y que está pendiente');
 const enlace=url.match(/https:\S+/)[0];
 // Paloma abre el enlace con la sesión ya iniciada
 const p=env('uP','paloma@ejemplo.com',enlace);await sleep(150);
 const dp=p.doc,shp=()=>dp.querySelector('#sheetHost').textContent;
 ok(p.w.__nuevaUrl==='/','quita el código de la dirección');
 ok(/Te han invitado a un grupo/.test(shp())&&/Casa/.test(shp())&&/Te invita Alvaro/.test(shp())&&/paloma@ejemplo\.com/.test(shp()),'pantalla de invitación con grupo, quién invita y la cuenta');
 dp.querySelector('#uNombre').value='Paloma';click(p,'unirseConfirmar');await sleep(80);
 ok(DB.miembros.some(m=>m.user_id==='uP'&&m.nombre==='Paloma')&&/Miembros \(2\)/.test(shp()),'Paloma se une y ve el grupo con 2 miembros');
 ok(!p.w.__ls.unirse,'la invitación pendiente se borra');
 ok(!/Quitar/.test(shp())&&!/Cerrar el grupo/.test(shp()),'Paloma (no admin) no ve Quitar ni Cerrar');
 // el mismo enlace otra vez (otra persona) ya no vale
 const x=env('uX','otro@x.com',enlace);await sleep(150);
 ok(/ya se ha usado/.test(x.doc.querySelector('#sheetHost').textContent),'un enlace usado avisa de que no vale');
 // Álvaro ve a Paloma, cambia su nombre y la quita
 click(a,'openGrupos');await sleep(40);ok(/Alvaro, Paloma/.test(sh()),'Álvaro ve a Paloma en la lista');
 click(a,'grupoVer','g1');await sleep(40);
 da.querySelector('#gMiNombreEd').value='Álvaro';click(a,'grupoMiNombre','g1');await sleep(40);ok(DB.miembros[0].nombre==='Álvaro','cambiar mi nombre en el grupo');
 const q=da.querySelector('[data-click^="grupoQuitar"]');q.click();q.click();await sleep(60);
 ok(DB.miembros.find(m=>m.user_id==='uP').baja,'quitar a un miembro (con doble toque)');
 // sin sesión: el código se guarda para después de iniciar sesión
 const d=new JSDOM('<div id="app"></div>',{runScripts:'outside-only',url:'https://urlife-zeta.vercel.app/?unirse=TOKENxyzabcdefghijkl'});
 const ls={};Object.defineProperty(d.window,'localStorage',{value:{setItem:(k,v)=>{ls[k]=v},getItem:k=>ls[k]||null},configurable:true});d.window.history.replaceState=()=>{};
 d.window.Auth={onChange(f){setTimeout(()=>f(null),0)},signIn(){},signOut(){},resetPassword(){}};d.window.Data={collection(){},doc(){}};
 d.window.eval(require('fs').readFileSync(require('path').join(__dirname,'..','app.js'),'utf8'));await sleep(40);
 ok(ls.unirse==='TOKENxyzabcdefghijkl','sin sesión: guarda la invitación para después de entrar');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
