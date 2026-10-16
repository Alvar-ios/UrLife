// Gastos compartidos (8.2): servidor simulado con las mismas reglas que la base de datos y dos usuarios a la vez
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const MES=new Date().toISOString().slice(0,7),HOY=new Date().toISOString().slice(0,10);
const DB={grupos:[{id:'g1',nombre:'Casa',tipo:'grupo',reparto:null,creado_por:'uA',created_at:'2026-10-01'}],
  miembros:[{grupo_id:'g1',user_id:'uA',nombre:'Alvaro',rol:'admin',created_at:'2026-10-01'},{grupo_id:'g1',user_id:'uP',nombre:'Paloma',rol:'miembro',created_at:'2026-10-02'}],
  inv:[],comp:[],movs:{uA:{},uP:{},uX:{}}};
let seq=0;const LIST=[];const notifyComp=()=>LIST.forEach(f=>f());
const err=m=>{throw new Error(m)};
const activo=(g,u)=>DB.miembros.some(m=>m.grupo_id===g&&m.user_id===u&&!m.baja)&&!DB.grupos.find(x=>x.id===g).cerrado;
const saldo=(g,u)=>DB.comp.filter(c=>c.grupoId===g&&!c.borrado).reduce((a,c)=>a+(c.pagadoPor===u?c.importe:0)-(c.reparto[u]||0),0);
function validar(c,ins){
  if(!DB.miembros.some(m=>m.grupo_id===c.grupoId&&m.user_id===c.pagadoPor&&(!m.baja||!ins)))err('pagador_no_valido');
  const ks=Object.keys(c.reparto||{});let t=0;
  ks.forEach(k=>{const v=c.reparto[k];if(typeof v!=='number'||v<0)err('reparto_no_valido');if(!DB.miembros.some(m=>m.grupo_id===c.grupoId&&m.user_id===k&&(!m.baja||!ins)))err('reparto_no_valido');t+=v});
  if(!ks.length||Math.abs(t-c.importe)>0.01)err('reparto_no_cuadra');
  if(c.tipo==='Liquidación'&&(ks.length!==1||ks[0]===c.pagadoPor))err('reparto_no_valido');
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
  const e=makeEnv({url:url||'https://urlife-zeta.vercel.app/',cfg:{app:{categoriasGasto:[{nombre:'Super'},{nombre:'Restaurantes'}],facturas:[{nombre:'Luz'}]},meta:{onboarded:true}},session:{user:{email,id:uid}},pre:w=>{
    w.history.replaceState=()=>{};
    const ls={};Object.defineProperty(w,'localStorage',{value:{getItem:k=>ls[k]==null?null:ls[k],setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},configurable:true});
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async t=>{w.__copiado=t}},configurable:true});
  }});
  const orig=e.w.Data,L=[],st=DB.movs[uid],notify=()=>L.forEach(f=>f());
  const s=server(uid);
  e.w.Data={doc:orig.doc,grupos:s.grupos,compartidos:s.compartidos,rpc:s.rpc,uid:()=>uid,
    collection:n=>n!=='movimientos'?orig.collection(n):({onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(st).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))});L.push(f);setTimeout(f,0);return()=>{}},
      add:async d=>{st['n'+(++seq)]=d;notify()},doc:id=>{const k=id||'n'+(++seq);return {id:k,set:async d=>{st[k]=JSON.parse(JSON.stringify(d));notify()},delete:async()=>{delete st[k];notify()}}}})};
  return e;
}
const toastTxt=e=>(e.doc.querySelector('#toast')||{}).textContent||'';
(async()=>{
 const a=env('uA','alvaro@ejemplo.com'),p=env('uP','paloma@ejemplo.com');await sleep(200);
 const A=a.w.__APP__,P=p.w.__APP__,da=a.doc,dp=p.doc,sha=()=>da.querySelector('#sheetHost').textContent,shp=()=>dp.querySelector('#sheetHost').textContent;
 const gastos=(X)=>{const d=new Date();return X.kpisMes(d.getFullYear(),d.getMonth()+1)};
 // --- 1. Álvaro apunta una cena de 60 € y la comparte a medias con Paloma
 A.H.openMovForm([]);await sleep(20);
 da.querySelector('#fImporte').value='60';da.querySelector('#fCategoria').value='Restaurantes';da.querySelector('#fDesc').value='Cena';
 ok(/Compartir este gasto/.test(sha())&&/NUEVO/.test(da.querySelector('#compField').innerHTML),'el formulario ofrece «Compartir este gasto» (con etiqueta NUEVO)');
 click(a,'compOn');await sleep(10);
 ok(/Casa/.test(sha())&&/Paloma/.test(sha())&&da.querySelector('#compField .chip.active'),'con un solo grupo, se elige solo; también aparece Paloma como persona');
 ok(/Tu parte: 30,00/.test(sha())&&/te deben 30,00/.test(sha()),'reparto a medias: tu parte 30 y te deben 30');
 click(a,'saveMov');await sleep(60);
 const c1=DB.comp[0];
 ok(DB.comp.length===1&&c1.importe===60&&c1.reparto.uA===30&&c1.reparto.uP===30&&c1.pagadoPor==='uA'&&c1.grupoId==='g1','se guarda el gasto compartido (60, 30/30, pagó Álvaro)');
 const mirror=Object.values(DB.movs.uA)[0];
 ok(Object.keys(DB.movs.uA).length===1&&mirror.compartidoId===c1.id&&mirror.importe===60,'Álvaro guarda su cargo del banco (60 €) enlazado al compartido');
 ok(gastos(A).gastos===30,'en los números de Álvaro cuenta solo su parte (30 €), no 60 ni 90 ('+gastos(A).gastos+')');
 a.w.__APP__.H.goTab(['movimientos']);await sleep(20);
 const fila=da.querySelector('#movList .row');
 ok(da.querySelectorAll('#movList .row').length===1&&/tu parte de 60,00/.test(fila.textContent)&&/−30,00/.test(fila.textContent)&&/pagaste tú/.test(fila.textContent),'en Movimientos: una sola fila, −30 €, «tu parte de 60 €»');
 await sleep(30);
 ok(gastos(P).gastos===30,'Paloma también ve 30 € de gasto en sus números ('+gastos(P).gastos+')');
 p.w.__APP__.H.goTab(['movimientos']);await sleep(20);
 ok(/pagó Alvaro/.test(dp.querySelector('#movList').textContent),'Paloma ve «pagó Alvaro»');
 // --- 2. cuentas del grupo
 P.H.grupoVer(['g1']);await sleep(30);
 ok(/Debes 30,00\s*€ a Alvaro/.test(shp()),'Paloma ve «Debes 30 € a Alvaro»');
 A.H.grupoVer(['g1']);await sleep(30);
 ok(/Paloma te debe 30,00/.test(sha())&&/Reparto habitual/.test(sha())&&/A partes iguales/.test(sha()),'Álvaro ve «Paloma te debe 30 €» y el reparto habitual');
 // --- 3. Paloma paga la luz (90 €) y reparte por porcentaje 60/40
 P.H.closeSheet([]);await sleep(250);
 P.H.openMovForm([]);await sleep(20);
 click(p,'pickFijo','1');await sleep(5);
 dp.querySelector('#fImporte').value='90';dp.querySelector('#fCategoria').value='Suministros';dp.querySelector('#fSub').value='Luz';
 click(p,'compOn');await sleep(5);click(p,'compModo','porcentaje');await sleep(5);
 const ins=dp.querySelectorAll('#compReparto input.comp-val');
 ok(ins.length===2&&ins[0].value==='50'&&ins[1].value==='50'&&/Yo/.test(dp.querySelector('#compReparto .comp-row').textContent),'al pasar a «Por %» empieza en 50/50 (tú primero)');
 ins[0].value='40';ins[0].dispatchEvent(new p.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/suman 90/.test(shp()),'avisa si los porcentajes no suman 100');
 ins[1].value='60';ins[1].dispatchEvent(new p.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/Tu parte: 36,00/.test(shp())&&/te deben 54,00/.test(shp()),'60/40: tu parte 36 y te deben 54');
 click(p,'saveMov');await sleep(60);
 const c2=DB.comp[1];
 ok(c2&&c2.tipo==='Factura'&&c2.reparto.uA===54&&c2.reparto.uP===36&&c2.modo==='porcentaje','factura compartida 54/36');
 await sleep(30);
 ok(gastos(A).facturas===54&&gastos(P).facturas===36,'cada uno ve su parte de la factura (54 / 36)');
 A.H.grupoVer(['g1']);await sleep(30);
 ok(/Debes 24,00\s*€ a Paloma/.test(sha()),'deudas simplificadas: Álvaro debe 24 € a Paloma (54 − 30)');
 // --- 4. saldar
 click(a,'saldarAbrir');await sleep(10);
 ok(/Saldar cuentas/.test(sha())&&da.querySelector('#sImporte').value==='24','pantalla Saldar con 24 €');
 da.querySelector('#sImporte').value='30';click(a,'saldarGuardar');await sleep(20);
 ok(/más de lo que se debe/.test(toastTxt(a))&&DB.comp.length===2,'no deja pagar más de lo que se debe');
 da.querySelector('#sImporte').value='24';click(a,'saldarGuardar');await sleep(60);
 ok(DB.comp[2].tipo==='Liquidación'&&DB.comp[2].pagadoPor==='uA'&&DB.comp[2].reparto.uP===24,'pago registrado');
 ok(/Estáis en paz/.test(sha())&&/Pagaste a Paloma/.test(sha()),'cuentas a cero y el pago aparece en la lista');
 ok(gastos(A).gastos===30&&gastos(A).facturas===54&&gastos(A).ingresos===0,'saldar no cuenta como gasto ni ingreso');
 // --- 5. editar: la cena pasa a 80 €
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm(['c:'+c1.id]);await sleep(20);
 ok(/Gasto compartido/.test(sha())&&da.querySelector('#fImporte').value==='60'&&/Eliminar gasto compartido/.test(sha()),'al abrir la cena se ve el compartido con su total');
 da.querySelector('#fImporte').value='80';da.querySelector('#fImporte').dispatchEvent(new a.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/Tu parte: 40,00/.test(sha()),'el reparto se recalcula al cambiar el importe');
 click(a,'saveMov');await sleep(60);
 ok(DB.comp[0].importe===80&&DB.comp[0].reparto.uA===40&&Object.values(DB.movs.uA)[0].importe===80&&Object.keys(DB.movs.uA).length===1,'compartido y copia personal actualizados, sin duplicar');
 ok(Math.abs(A.saldosDe('g1').uA-1000)<1,'Paloma vuelve a deber 10 €');
 // abrir el movimiento personal enlazado lleva al compartido
 const mid=Object.keys(DB.movs.uA)[0];A.H.openMovForm([mid]);await sleep(20);
 ok(/Gasto compartido/.test(sha()),'abrir tu cargo enlazado abre el gasto compartido');
 // --- 6. Álvaro no puede dejar de compartir la luz (la pagó Paloma)
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm(['c:'+c2.id]);await sleep(20);click(a,'compOff');await sleep(5);
 ok(/Solo quien lo pagó/.test(toastTxt(a))&&da.querySelector('.comp-box'),'solo quien pagó puede dejar de compartir');
 // --- 7. dejar de compartir la cena: cuenta entera como suya
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm(['c:'+c1.id]);await sleep(20);click(a,'compOff');await sleep(5);click(a,'saveMov');await sleep(60);
 ok(DB.comp[0].borrado&&Object.values(DB.movs.uA)[0].compartidoId===null&&gastos(A).gastos===80,'dejar de compartir: cuenta entera (80 €) y el compartido se retira');
 await sleep(30);ok(gastos(P).gastos===0,'Paloma deja de verlo');
 // --- 8. salir del grupo con cuentas pendientes
 A.H.grupoVer(['g1']);await sleep(30);
 ok(/Debes 30,00\s*€ a Paloma/.test(sha()),'tras retirar la cena, Álvaro debe 30 €');
 const bs=da.querySelector('[data-click^="grupoSalir"]');bs.click();bs.click();await sleep(40);
 ok(/cuentas pendientes/.test(toastTxt(a))&&!DB.miembros.find(m=>m.user_id==='uA'&&m.grupo_id==='g1').baja,'no se puede salir con cuentas pendientes');
 // --- 9. Paloma elimina la luz
 P.H.openMovForm(['c:'+c2.id]);await sleep(20);
 const del=dp.querySelector('[data-click^="deleteComp"]');del.click();del.click();await sleep(60);
 ok(DB.comp[1].borrado&&/eliminado/.test(toastTxt(p)),'Paloma elimina la factura compartida');
 await sleep(30);ok(gastos(A).facturas===0,'desaparece de los números de Álvaro');
 // --- 10. compartir con una persona sin grupo
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm([]);await sleep(20);
 da.querySelector('#fImporte').value='20';da.querySelector('#fCategoria').value='Supermercado';
 click(a,'compOn');await sleep(5);
 click(a,'compDest','u:uP');await sleep(5);
 click(a,'compPagador','uP');await sleep(5);
 ok(/debes 10,00\s*€ a Paloma/.test(sha()),'pagó Paloma: debes 10 €');
 click(a,'saveMov');await sleep(60);
 const d1=DB.grupos.find(g=>g.tipo==='directo');
 ok(d1&&DB.comp[3].grupoId===d1.id&&DB.comp[3].pagadoPor==='uP',"se crea la relación directa Álvaro–Paloma y el gasto va ahí");
 ok(Object.keys(DB.movs.uA).length===1,'si pagó la otra persona no se crea movimiento en tu banco');
 ok(gastos(A).gastos===90,'tu parte (10 €) se suma a tus gastos ('+gastos(A).gastos+')');
 A.H.openGrupos([]);await sleep(40);
 ok(/Amigos/.test(sha())&&/Paloma/.test(sha())&&/debes 10,00/.test(sha()),'en Grupos y personas aparece Paloma (amigos) con lo que le debes');
 // --- 11. invitar a una persona nueva
 click(a,'personaNueva');await sleep(10);click(a,'personaCrear');await sleep(40);
 const wa=da.querySelector('a.wa-btn'),msg=wa&&decodeURIComponent(wa.getAttribute('href').split('text=')[1]);
 ok(wa&&/compartir gastos conmigo/.test(msg)&&/\?unirse=TOKEN/.test(msg),'enlace de WhatsApp para invitar a una persona');
 const x=env('uX','otro@x.com',msg.match(/https:\S+/)[0]);await sleep(200);
 const shx=()=>x.doc.querySelector('#sheetHost').textContent;
 ok(/Te invitan a compartir gastos/.test(shx())&&/Alvaro/.test(shx())&&/Aceptar/.test(shx()),'la persona invitada ve «Te invitan a compartir gastos»');
 x.doc.querySelector('#uNombre').value='Rober';click(x,'unirseConfirmar');await sleep(60);
 const d2=DB.grupos.filter(g=>g.tipo==='directo')[1];
 ok(DB.miembros.filter(m=>m.grupo_id===d2.id).length===2,'acepta y ya pueden compartir');
 // --- 12. reparto habitual del grupo
 A.H.grupoVer(['g1']);await sleep(30);click(a,'grupoRepartoAbrir','g1');await sleep(10);
 da.getElementById('rep_uA').value='70';da.getElementById('rep_uP').value='30';click(a,'grupoRepartoGuardar','g1');await sleep(40);
 ok(DB.grupos[0].reparto.uA===70&&/Alvaro 70 %/.test(sha()),'reparto habitual 70/30 guardado');
 A.H.closeSheet([]);await sleep(250);A.H.openMovForm([]);await sleep(20);
 da.querySelector('#fImporte').value='100';click(a,'compOn');await sleep(5);click(a,'compDest','g1'.replace(/^/,'g:'));await sleep(5);
 ok(/Tu parte: 70,00/.test(sha()),'un gasto nuevo en «Casa» empieza con 70/30');
 // --- 13. Dashboard
 A.H.closeSheet([]);await sleep(250);a.w.__APP__.H.goTab(['inicio']);await sleep(20);
 const cont=da.querySelector('#content').textContent;
 ok(/Te deben 14,00/.test(cont),'Inicio avisa de lo que te deben (Pendiente)');a.w.__APP__.H.goTab(['juntos']);await sleep(20);ok(/Te deben 14,00/.test(da.querySelector('#content').textContent),'pestaña Juntos con el total');
 // --- 14. reparto exacto al céntimo
 const ms=[{uid:'a'},{uid:'b'},{uid:'c'}];
 const r1=A.calcReparto({modo:'igual',incl:{a:1,b:1,c:1}},10,ms).reparto;
 ok(r1.a===3.34&&r1.b===3.33&&r1.c===3.33,'10 € entre 3: 3,34 + 3,33 + 3,33');
 const r2=A.calcReparto({modo:'porcentaje',vals:{a:'33.33',b:'33.33',c:'33.34'}},100,ms).reparto;
 ok(Math.round((r2.a+r2.b+r2.c)*100)===10000,'por porcentaje suma exacto');
 ok(!!A.calcReparto({modo:'importe',vals:{a:'5',b:'4'}},10,ms).error,'por importes avisa si no suma el total');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
