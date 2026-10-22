// Gastos compartidos (8.2): servidor simulado con las mismas reglas que la base de datos y dos usuarios a la vez
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const MES=new Date().toISOString().slice(0,7),HOY=new Date().toISOString().slice(0,10);
const DB={grupos:[{id:'g1',nombre:'Casa',tipo:'grupo',reparto:null,creado_por:'uA',created_at:'2026-10-01'}],
  miembros:[{grupo_id:'g1',user_id:'uA',nombre:'Alvaro',rol:'admin',created_at:'2026-10-01'},{grupo_id:'g1',user_id:'uP',nombre:'Paloma',rol:'miembro',created_at:'2026-10-02'}],
  inv:[],comp:[],objs:[],movs:{uA:{},uP:{},uX:{}}};
let seq=0;const LIST=[],LISTO=[];const notifyComp=()=>LIST.forEach(f=>f());const notifyObj=()=>LISTO.forEach(f=>f());
const err=m=>{throw new Error(m)};
const activo=(g,u)=>DB.miembros.some(m=>m.grupo_id===g&&m.user_id===u&&!m.baja)&&!DB.grupos.find(x=>x.id===g).cerrado;
const saldo=(g,u)=>DB.comp.filter(c=>c.grupoId===g&&!c.borrado).reduce((a,c)=>a+(c.pagadoPor===u?c.importe:0)-(c.reparto[u]||0),0);
function validar(c,ins){
  if(!DB.miembros.some(m=>m.grupo_id===c.grupoId&&m.user_id===c.pagadoPor&&(!m.baja||!ins)))err('pagador_no_valido');
  const ks=Object.keys(c.reparto||{});let t=0;
  ks.forEach(k=>{const v=c.reparto[k];if(typeof v!=='number'||v<0)err('reparto_no_valido');if(!DB.miembros.some(m=>m.grupo_id===c.grupoId&&m.user_id===k&&(!m.baja||!ins)))err('reparto_no_valido');t+=v});
  if(!ks.length||Math.abs(t-c.importe)>0.01)err('reparto_no_cuadra');
  if(c.tipo==='Liquidación'&&(ks.length!==1||ks[0]===c.pagadoPor))err('reparto_no_valido');
  if(c.tipo==='Ahorro'||c.tipo==='Deuda'){const o=DB.objs.find(x=>x.id===c.objetivoId);if(!o||o.grupoId!==c.grupoId||o.tipo!==c.tipo.toLowerCase()||(o.borrado&&ins))err('objetivo_no_valido')}
  else if(c.objetivoId)err('objetivo_no_valido');
}
function server(uid){
  const ver=c=>!c.borrado&&(activo(c.grupoId,uid)||c.pagadoPor===uid||c.reparto[uid]!=null);
  return {
    grupos:{
      listar:async()=>({grupos:DB.grupos.filter(g=>activo(g.id,uid)),miembros:DB.miembros.filter(m=>activo(m.grupo_id,uid))}),
      invitaciones:async g=>activo(g,uid)?DB.inv.filter(i=>i.grupo_id===g):[],
      renombrar:async()=>[],miNombre:async()=>[],
      reparto:async(g,r)=>{if(!DB.miembros.some(m=>m.grupo_id===g&&m.user_id===uid&&m.rol==='admin'&&!m.baja))err('no_autorizado');DB.grupos.find(x=>x.id===g).reparto=r;return [{id:g}]}},
    compartidos:{
      suscribir:(next)=>{const f=()=>next(DB.comp.filter(ver).map(c=>JSON.parse(JSON.stringify(c))));LIST.push(f);setTimeout(f,0);return()=>{}},
      crear:async o=>{if(!activo(o.grupoId,uid))err('new row violates row-level security policy');const c=Object.assign({id:'c'+(++seq),creadoPor:uid,createdAt:new Date(Date.now()+seq).toISOString()},JSON.parse(JSON.stringify(o)));validar(c,true);DB.comp.push(c);setTimeout(notifyComp,5);return JSON.parse(JSON.stringify(c))},
      editar:async(id,o)=>{const c=DB.comp.find(x=>x.id===id);if(!c||!activo(c.grupoId,uid))err('JSON object requested, multiple (or no) rows returned');if(c.borrado)err('compartido_borrado');const n=Object.assign({},c,JSON.parse(JSON.stringify(o)),{grupoId:c.grupoId,editadoPor:uid});validar(n,false);Object.assign(c,n);setTimeout(notifyComp,5);return JSON.parse(JSON.stringify(c))},
      borrar:async id=>{const c=DB.comp.find(x=>x.id===id);if(!c||!activo(c.grupoId,uid))err('no_autorizado');if(c.borrado)err('compartido_borrado');c.borrado=new Date().toISOString();setTimeout(notifyComp,5);return [{id}]}},
    objetivos:{
      suscribir:(next)=>{const f=()=>next(DB.objs.filter(o=>!o.borrado&&activo(o.grupoId,uid)).map(o=>JSON.parse(JSON.stringify(o))));LISTO.push(f);setTimeout(f,0);return()=>{}},
      crear:async o=>{if(!activo(o.grupoId,uid))err('row-level security');const n=Object.assign({id:'o'+(++seq),previo:0,creadoPor:uid},JSON.parse(JSON.stringify(o)));n.nombre=n.nombre.trim();DB.objs.push(n);setTimeout(notifyObj,5);return JSON.parse(JSON.stringify(n))},
      editar:async(id,o)=>{const x=DB.objs.find(y=>y.id===id);if(!x||!activo(x.grupoId,uid))err('JSON object requested');if(x.borrado)err('objetivo_borrado');const c=JSON.parse(JSON.stringify(o));delete c.grupoId;delete c.tipo;Object.assign(x,c);setTimeout(notifyObj,5);return JSON.parse(JSON.stringify(x))},
      borrar:async id=>{const x=DB.objs.find(y=>y.id===id);if(!x||!activo(x.grupoId,uid))err('no_autorizado');x.borrado='x';setTimeout(notifyObj,5);return [{id}]}},
    rpc:async(fn,p)=>{
      if(fn==='crear_directo'){
        const ya=DB.grupos.find(g=>g.tipo==='directo'&&!g.cerrado&&activo(g.id,uid)&&activo(g.id,p.p_user));if(ya)return ya.id;
        const com=DB.grupos.find(g=>activo(g.id,uid)&&activo(g.id,p.p_user));if(!com)err('no_autorizado');
        const id='d'+(++seq),mn=DB.miembros.find(m=>m.grupo_id===com.id&&m.user_id===uid).nombre,sn=DB.miembros.find(m=>m.grupo_id===com.id&&m.user_id===p.p_user).nombre;
        DB.grupos.push({id,nombre:mn+' y '+sn,tipo:'directo',creado_por:uid,created_at:new Date().toISOString()});
        DB.miembros.push({grupo_id:id,user_id:uid,nombre:mn,rol:'admin',created_at:'a'},{grupo_id:id,user_id:p.p_user,nombre:sn,rol:'admin',created_at:'b'});return id}
      if(fn==='invitar_persona'){const id='d'+(++seq);DB.grupos.push({id,nombre:p.p_mi_nombre,tipo:'directo',creado_por:uid,created_at:new Date().toISOString()});DB.miembros.push({grupo_id:id,user_id:uid,nombre:p.p_mi_nombre,rol:'admin',created_at:'a'});const t='TOKEN'+(++seq)+'abcdefghijklmnop';DB.inv.push({token:t,grupo_id:id,creado_por:uid,expira:new Date(Date.now()+7*864e5).toISOString(),created_at:new Date().toISOString()});return t}
      if(fn==='ver_invitacion'){const i=DB.inv.find(x=>x.token===p.p_token);if(!i)return {valida:false,motivo:'no_existe'};const g=DB.grupos.find(x=>x.id===i.grupo_id);if(i.usada_en)return {valida:false,motivo:'usada'};return {valida:true,nombre:g.nombre,tipo:g.tipo,invita:DB.miembros.find(m=>m.grupo_id===g.id&&m.user_id===i.creado_por).nombre,miembros:DB.miembros.filter(m=>m.grupo_id===g.id&&!m.baja).length}}
      if(fn==='unirse'){const i=DB.inv.find(x=>x.token===p.p_token);if(!i||i.usada_en)err('invitacion_no_valida');DB.miembros.push({grupo_id:i.grupo_id,user_id:uid,nombre:p.p_nombre,rol:'miembro',created_at:'c'});i.usada_en=new Date().toISOString();return i.grupo_id}
      if(fn==='salir_grupo'){if(Math.abs(saldo(p.p_grupo,uid))>0.01)err('saldo_pendiente');DB.miembros.find(x=>x.grupo_id===p.p_grupo&&x.user_id===uid).baja='x';return null}
      err('?'+fn)}};
}
function env(uid,email,url){
  const e=makeEnv({url:url||'https://urlife-zeta.vercel.app/',cfg:{app:Object.assign({categoriasGasto:[{nombre:'Super'},{nombre:'Restaurantes'}],facturas:[{nombre:'Luz'}]},uid==='uA'?{ahorro:[{id:'mJ',nombre:'Viaje a Japón',objetivo:1000}],deudas:[{nombre:'Coche',objetivo:5000}]}:{}),meta:{onboarded:true}},session:{user:{email,id:uid}},pre:w=>{
    w.history.replaceState=()=>{};w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};
    const ls={};Object.defineProperty(w,'localStorage',{value:{getItem:k=>ls[k]==null?null:ls[k],setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},configurable:true});
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async t=>{w.__copiado=t}},configurable:true});
  }});
  const orig=e.w.Data,L=[],st=DB.movs[uid],notify=()=>L.forEach(f=>f());
  const s=server(uid);
  e.w.Data={doc:orig.doc,grupos:s.grupos,compartidos:s.compartidos,objetivos:s.objetivos,rpc:s.rpc,uid:()=>uid,
    collection:n=>n!=='movimientos'?orig.collection(n):({onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(st).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))});L.push(f);setTimeout(f,0);return()=>{}},
      add:async d=>{st['n'+(++seq)]=d;notify()},doc:id=>{const k=id||'n'+(++seq);return {id:k,set:async d=>{st[k]=JSON.parse(JSON.stringify(d));notify()},delete:async()=>{delete st[k];notify()}}}})};
  e.w.Auth.getSession=async()=>({access_token:'t'});
  return e;
}
const toastTxt=e=>(e.doc.querySelector('#toast')||{}).textContent||'';
const futuro=(m)=>{const d=new Date();d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10)};

const LECTURA={ticket:{es_ticket:true,comercio:'Pizzería Luigi',fecha:'2026-10-09',total:42,moneda:'EUR',categoria:'Restaurantes',notas:'',
  articulos:[{nombre:'Coca-Cola',cantidad:1,importe:2.5},{nombre:'Burrata',cantidad:2,importe:16},{nombre:'Pizza de queso',cantidad:1,importe:11},{nombre:'Pizza de jamón',cantidad:1,importe:12.5}]},modelo:'rapido',usados:3,limite:60};
(async()=>{
 const a=env('uA','alvaro@ejemplo.com'),p=env('uP','paloma@ejemplo.com');await sleep(200);
 const A=a.w.__APP__,P=p.w.__APP__,da=a.doc,sha=()=>da.querySelector('#sheetHost').textContent;
 const k=(X)=>{const d=new Date();return X.kpisMes(d.getFullYear(),d.getMonth()+1)};
 const pedidas=[];let respuesta=LECTURA;
 a.w.__reducirFoto=async()=>({b64:'QUJD',tipo:'image/jpeg'});
 a.w.__ticketsApi=async(b)=>{pedidas.push(b);return JSON.parse(JSON.stringify(typeof respuesta==='function'?respuesta(b):respuesta))};
 // --- accesos
 A.H.openMovForm([]);await sleep(20);
 ok(/Leer un ticket con una foto/.test(sha())&&/NUEVO/.test(da.querySelector('.tk-btn').innerHTML),'el formulario nuevo ofrece leer un ticket (NUEVO)');
 A.H.closeSheet([]);await sleep(250);
 a.w.__APP__.H.goTab(['movimientos']);a.w.__APP__.H.setMovVista(['lista']);await sleep(20);
 ok(/Foto de ticket/.test(da.querySelector('#content').textContent),'acceso «Foto de ticket» en Movimientos');
 // --- 1. sin clave configurada
 respuesta={error:'sin_clave'};
 await A.leerTicket({});await sleep(20);
 ok(/aún no está activada/.test(sha())&&/Apuntar a mano/.test(sha()),'sin clave: lo explica y ofrece apuntar a mano');
 // --- 2. no es un ticket
 respuesta={ticket:{es_ticket:false,articulos:[]},usados:1,limite:60};
 await A.leerTicket({});await sleep(20);
 ok(/No parece un ticket/.test(sha())&&/Otra foto/.test(sha()),'si no es un ticket, pide otra foto');
 // --- 3. lectura con una línea mal: no cuadra
 respuesta=()=>{const r=JSON.parse(JSON.stringify(LECTURA));r.ticket.articulos[1].importe=8;return r};
 await A.leerTicket({});await sleep(20);
 ok(pedidas[pedidas.length-1].preciso===false&&pedidas[pedidas.length-1].categorias.includes('Restaurantes'),'primero lee en modo rápido y manda tus categorías');
 ok(/Revisa el ticket/.test(sha())&&da.querySelectorAll('.tk-item').length===4&&da.querySelector('#tkComercio').value==='Pizzería Luigi','pantalla de revisión con los 4 artículos');
 ok(/no cuadr|suman/.test(sha())&&/Leer con más precisión/.test(sha()),'avisa de que no cuadra y ofrece leer con más precisión');
 respuesta=LECTURA;
 click(a,'tkPreciso');await sleep(30);
 ok(pedidas[pedidas.length-1].preciso===true,'la segunda lectura es la precisa');
 ok(/cuadra con el total/.test(sha())&&!/Leer con más precisión/.test(sha()),'tras la lectura precisa cuadra');
 // corregir a mano: cambiar importe y ver aviso, luego volver
 const imp=da.querySelectorAll('.tk-i')[0];imp.value='3';imp.dispatchEvent(new a.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/diferencia 0,50/.test(sha()),'al corregir un importe se recalcula la diferencia');
 imp.value='2.5';imp.dispatchEvent(new a.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/cuadra con el total/.test(sha()),'vuelve a cuadrar');
 // --- 4. repartir por artículos con Paloma
 click(a,'tkRep','1');await sleep(10);
 ok(da.querySelectorAll('.tk-quien').length===4&&/A cada uno le toca/.test(sha()),'reparto por artículos: cada artículo con sus personas');
 // la Coca-Cola es solo de Paloma, la pizza de jamón solo mía
 click(a,'artQuien','t','0','uA');await sleep(5);
 click(a,'artQuien','t','3','uP');await sleep(5);
 const res=da.querySelector('#tkResumen').textContent;
 // Yo: burrata 8 + queso 5.5 + jamón 12.5 = 26 ; Paloma: coca 2.5 + burrata 8 + queso 5.5 = 16 → total 42? (41.5: queso 11/2=5.5)
 ok(/Yo26,00/.test(res.replace(/\s/g,''))&&/Paloma16,00/.test(res.replace(/\s/g,'')),'cada uno paga lo suyo y lo común a medias ('+res.replace(/\s+/g,' ')+')');
 click(a,'tkContinuar');await sleep(20);
 ok(/Nuevo (movimiento|gasto|ingreso|gasto fijo)|Nueva inversión|Apartar dinero|Pago de deuda/.test(sha())&&da.querySelector('#fImporte').value==='42'&&da.querySelector('#fCategoria').value==='Restaurantes'&&da.querySelector('#fDesc').value==='Pizzería Luigi'&&da.querySelector('#fFecha').value==='2026-10-09','pasa al formulario con importe, categoría, comercio y fecha');
 ok(/4 artículos del ticket/.test(sha())&&/Tu parte: 26,00/.test(sha())&&/te deben 16,00/.test(sha()),'el formulario muestra los artículos y el reparto (tu parte 26, te deben 16)');
 click(a,'saveMov');await sleep(60);
 const c=DB.comp[DB.comp.length-1];
 ok(c&&c.importe===42&&c.reparto.uA===26&&c.reparto.uP===16&&c.modo==='importe'&&c.articulos.length===4,'se guarda el gasto compartido con sus artículos');
 ok(c.articulos[0].quien.join()==='uP'&&c.articulos[1].quien.length===2,'cada artículo guarda quién lo tomó');
 const mir=Object.values(DB.movs.uA).find(m=>m.compartidoId===c.id);
 ok(mir&&mir.importe===42&&mir.articulos.length===4,'tu cargo del banco (42 €) también lleva los artículos');
 await sleep(30);
 ok(k(A).gastos===26&&k(P).gastos===16,'en los números de cada uno cuenta su parte (26 / 16)');
 // --- 5. análisis por artículo
 A.S.mesSel=new Date().getMonth()+1;A.S.anioSel=new Date().getFullYear();
 // la cena tiene fecha del 9/10: miramos ese mes
 A.S.mesSel=10;A.S.anioSel=2026;A.H.verMes(['2026','10']);await sleep(20);
 const an=da.querySelector('#content').textContent;
 ok(/Lo que más compras/.test(an)&&/Pizza de jamón/.test(an)&&!/Coca-Cola/.test(an),'Análisis: lo que más compras (tu parte; la Coca-Cola de Paloma no cuenta para ti)');
 // --- 6. ticket solo para mí (sin repartir)
 respuesta=LECTURA;await A.leerTicket({});await sleep(20);
 click(a,'tkContinuar');await sleep(20);click(a,'saveMov');await sleep(60);
 const mio=Object.values(DB.movs.uA).find(m=>!m.compartidoId&&m.articulos);
 ok(mio&&mio.importe===42&&mio.articulos.length===4&&mio.descripcion==='Pizzería Luigi','ticket sin repartir: gasto normal con sus artículos');
 // abrirlo muestra los artículos
 A.H.openMovForm([Object.keys(DB.movs.uA).find(id=>DB.movs.uA[id]===mio)]);await sleep(20);
 ok(/4 artículos del ticket/.test(sha())&&/Burrata/.test(sha()),'al abrir el gasto se ven sus artículos');
 // --- 7. límite
 A.H.closeSheet([]);await sleep(250);
 respuesta={error:'limite',usados:60,limite:60};await A.leerTicket({});await sleep(20);
 ok(/lecturas de este mes. Vuelven el 1 de/.test(sha()),'límite mensual alcanzado: lo explica');
 // --- 8. reparto con descuento repartido y céntimos
 const F={rep:{dest:'g:g1'},t:{articulos:[{importe:10,quien:null},{importe:-1,quien:null},{importe:0.01,quien:['uA']}]}};
 const r=A.tkReparto(F);ok(r.uA+r.uP===901&&r.uA===451&&r.uP===450,'reparto al céntimo con descuento (9,01 € → 4,51 + 4,50)');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
