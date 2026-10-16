// Gastos compartidos (8.2): servidor simulado con las mismas reglas que la base de datos y dos usuarios a la vez
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const MES=new Date().toISOString().slice(0,7),HOY=new Date().toISOString().slice(0,10);
const DB={grupos:[{id:'g1',nombre:'Casa',tipo:'grupo',reparto:null,creado_por:'uA',created_at:'2026-10-01'}],
  miembros:[{grupo_id:'g1',user_id:'uA',nombre:'Alvaro',rol:'admin',created_at:'2026-10-01'},{grupo_id:'g1',user_id:'uP',nombre:'Paloma',rol:'miembro',created_at:'2026-10-02'},{grupo_id:'g1',user_id:'uT',nombre:'Tete',rol:'miembro',created_at:'2026-10-03'}],
  inv:[],comp:[],objs:[],movs:{uA:{},uP:{},uT:{},uX:{}}};
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

const LECTURA0={ticket:{es_ticket:true,comercio:'Pizzería Luigi',fecha:'2026-10-09',total:42,moneda:'EUR',categoria:'Restaurantes',notas:'',
  articulos:[{nombre:'Coca-Cola',cantidad:1,importe:2.5},{nombre:'Burrata',cantidad:2,importe:16},{nombre:'Pizza de queso',cantidad:1,importe:11},{nombre:'Pizza de jamón',cantidad:1,importe:12.5}]},modelo:'rapido',usados:3,limite:60};

const LECTURA={ticket:{es_ticket:true,comercio:'Bar Pepe',fecha:'2026-10-09',total:22,moneda:'EUR',categoria:'Restaurantes',notas:'',
  articulos:[{nombre:'Coca-Cola',cantidad:5,importe:10},{nombre:'Pizza',cantidad:1,importe:12}]},modelo:'rapido',usados:3,limite:60};
(async()=>{
 const a=env('uA','alvaro@ejemplo.com');await sleep(250);
 const A=a.w.__APP__,da=a.doc,sha=()=>da.querySelector('#sheetHost').textContent;
 a.w.__reducirFoto=async()=>({b64:'QUJD',tipo:'image/jpeg'});
 a.w.__ticketsApi=async()=>JSON.parse(JSON.stringify(LECTURA));
 await A.leerTicket({});await sleep(30);
 click(a,'tkRep','1');await sleep(10);
 ok(!!da.querySelector('.tk-unid'),'el artículo de 5 uds. muestra reparto por unidades');
 ok(da.querySelectorAll('.tk-quien').length===2&&!!da.querySelector('[data-click^="invAbrir"]'),'la pizza (1 ud.) usa chips y hay «+ Otra persona» aunque ya hay amigos');
 const txt=()=>da.querySelector('#tkResumen').textContent.replace(/\s/g,'');
 // por defecto: partes iguales (22/3 = 7,34 / 7,33 / 7,33)
 let tot=A.tkReparto(FORM());
 function FORM(){return A.form()}
 ok(tot.uA+tot.uP+tot.uT===2200,'por defecto todo suma 22,00 €');
 // Paloma 2, Álvaro 1 -> Tete automáticamente 2
 click(a,'artUnid','t','0','uP','1');click(a,'artUnid','t','0','uP','1');await sleep(5);
 click(a,'artUnid','t','0','uA','1');await sleep(5);
 const fila=[...da.querySelectorAll('.un-fila')].map(f=>f.textContent.replace(/\s+/g,' ').trim());
 ok(/Tete.*2.*auto/.test(fila.join('|')),'con Paloma 2 y yo 1, Tete queda con 2 solo ('+fila.join('|')+')');
 tot=A.tkReparto(FORM());
 // cola 10 € = 2 €/ud: yo 2, Paloma 4, Tete 4 ; pizza 12/3 = 4 c/u
 ok(tot.uA===600&&tot.uP===800&&tot.uT===800,'reparto: yo 6, Paloma 8, Tete 8 ('+JSON.stringify(tot)+')');
 { const segs=[...da.querySelectorAll('#tkBarra i')].map(i=>parseFloat(i.style.flexGrow)); ok(segs.length===3&&segs[0]===6&&segs[1]===8&&segs[2]===8,'barra viva del reparto con un tramo por persona proporcional ('+segs.join('/')+')'); }
 // me paso de unidades: aviso
 click(a,'artUnid','t','0','uA','1');click(a,'artUnid','t','0','uA','1');click(a,'artUnid','t','0','uA','1');await sleep(5);
 ok(/solo hay 5 unidades/.test(sha())||/Has repartido/.test(sha()),'si te pasas de unidades, avisa');
 click(a,'artUnidReset','t','0');await sleep(5);
 ok(!/auto/.test(da.querySelector('.tk-unid').textContent)&&A.tkReparto(FORM()).uA+A.tkReparto(FORM()).uP+A.tkReparto(FORM()).uT===2200,'«Volver a partes iguales» vuelve al reparto por defecto');
 click(a,'artUnid','t','0','uP','1');click(a,'artUnid','t','0','uP','1');click(a,'artUnid','t','0','uA','1');await sleep(5);
 // sin descuadre: cantidad que no es entera sigue por chips (cant 1,5)
 click(a,'tkContinuar');await sleep(20);
 ok(/Tu parte: 6,00/.test(sha())&&/te deben 16,00/.test(sha()),'en el formulario: tu parte 6, te deben 16');
 ok(!!da.querySelector('.tk-det')&&/cambiar reparto/.test(sha()),'el formulario deja cambiar el reparto por artículos');
 click(a,'saveMov');await sleep(60);
 let c=DB.comp[DB.comp.length-1];
 ok(c&&c.reparto.uA===6&&c.reparto.uP===8&&c.reparto.uT===8,'guardado: 6 / 8 / 8');
 ok(c.articulos[0].unid&&c.articulos[0].unid.uP===2&&c.articulos[0].unid.uA===1&&c.articulos[0].unid.uT===2,'se guarda cuántas unidades tomó cada uno');
 // editar después de guardar: abrir y cambiar a Álvaro 2, Paloma 1 (Tete 2)
 A.H.compAbrir([c.id,'g1']);await sleep(30);
 ok(/cambiar reparto/.test(sha())&&!!da.querySelector('#artq-f0 .un-fila'),'al reabrir el gasto se puede cambiar el reparto por artículos');
 click(a,'artUnid','f','0','uA','1');await sleep(5);
 click(a,'artUnid','f','0','uP','-1');await sleep(5);
 ok(/Tu parte: 8,00/.test(sha()),'al cambiar unidades, el reparto del gasto se actualiza (tu parte 8)');
 click(a,'saveMov');await sleep(60);
 c=DB.comp.find(x=>x.id===c.id);
 ok(c.reparto.uA===8&&c.reparto.uP===6&&c.reparto.uT===8&&c.articulos[0].unid.uA===2,'el cambio se guarda: 8 / 6 / 8');
 // invitar sin salir del formulario
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm([]);await sleep(20);
 click(a,'compOn');await sleep(20);
 ok(!!da.querySelector('[data-click^="invAbrir"]'),'gasto nuevo: «+ Otra persona» en «Con»');
 da.querySelector('#fImporte').value='30';
 click(a,'invAbrir','f');await sleep(10);click(a,'invCrear','f');await sleep(30);
 ok(/Enlace listo/.test(sha())&&da.querySelector('#fImporte').value==='30'&&!!da.querySelector('.wa-btn'),'crea el enlace de WhatsApp sin perder lo que estabas escribiendo');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
