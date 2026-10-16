// Gastos compartidos (8.2): servidor simulado con las mismas reglas que la base de datos y dos usuarios a la vez
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const MES=new Date().toISOString().slice(0,7),HOY=new Date().toISOString().slice(0,10);
const DB={grupos:[{id:'g1',nombre:'Casa',tipo:'grupo',reparto:null,creado_por:'uA',created_at:'2026-10-01'}],
  miembros:[{grupo_id:'g1',user_id:'uA',nombre:'Alvaro',rol:'admin',created_at:'2026-10-01'},{grupo_id:'g1',user_id:'uP',nombre:'Paloma',rol:'miembro',created_at:'2026-10-02'}],
  inv:[],comp:[],objs:[],aps:[],movs:{uA:{},uP:{pi1:{tipo:'Inversión',categoria:'Fondo indexado',importe:100,fecha:HOY}},uX:{}}};
let seq=0;const LIST=[],LISTO=[],LISTA=[];const notifyAp=()=>LISTA.forEach(f=>f());const notifyComp=()=>LIST.forEach(f=>f());const notifyObj=()=>LISTO.forEach(f=>f());
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
    aportes:{
      suscribir:(next)=>{const f=()=>next(DB.aps.filter(a=>!a.borrado&&(()=>{const o=DB.objs.find(x=>x.id===a.objetivo_id);return o&&activo(o.grupoId,uid)})()).map(a=>({id:a.id,objetivoId:a.objetivo_id,userId:a.user_id,movId:a.mov_id,fecha:a.fecha,tipo:a.tipo,importe:a.importe,activoId:a.activo_id,participaciones:a.participaciones})));LISTA.push(f);setTimeout(f,0);return()=>{}},
      guardar:async o=>{const ob=DB.objs.find(x=>x.id===o.objetivoId);if(!ob||!activo(ob.grupoId,uid))err('row-level security');let a=DB.aps.find(x=>x.user_id===uid&&x.mov_id===o.movId);
        if(!a){a={id:'ap'+(++seq),user_id:uid,mov_id:o.movId};DB.aps.push(a)}Object.assign(a,{objetivo_id:o.objetivoId,fecha:o.fecha,tipo:o.tipo,importe:o.importe,activo_id:o.tipo==='Ahorro'?null:o.activoId,participaciones:o.participaciones,borrado:null});setTimeout(notifyAp,5);return JSON.parse(JSON.stringify(a))},
      quitar:async movId=>{DB.aps.filter(x=>x.user_id===uid&&x.mov_id===movId&&!x.borrado).forEach(x=>{x.borrado='x'});setTimeout(notifyAp,5);return []}},
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
    w.history.replaceState=()=>{};
    const ls={};Object.defineProperty(w,'localStorage',{value:{getItem:k=>ls[k]==null?null:ls[k],setItem:(k,v)=>{ls[k]=String(v)},removeItem:k=>{delete ls[k]}},configurable:true});
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async t=>{w.__copiado=t}},configurable:true});
  }});
  const orig=e.w.Data,L=[],st=DB.movs[uid],notify=()=>L.forEach(f=>f());
  const s=server(uid);
  e.w.Data={doc:orig.doc,grupos:s.grupos,compartidos:s.compartidos,objetivos:s.objetivos,aportes:s.aportes,rpc:s.rpc,uid:()=>uid,
    collection:n=>n!=='movimientos'?orig.collection(n):({onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(st).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))});L.push(f);setTimeout(f,0);return()=>{}},
      add:async d=>{const k='n'+(++seq);st[k]=d;notify();return {id:k}},doc:id=>{const k=id||'n'+(++seq);return {id:k,set:async d=>{st[k]=JSON.parse(JSON.stringify(d));notify()},delete:async()=>{delete st[k];notify()}}}})};
  return e;
}
const toastTxt=e=>(e.doc.querySelector('#toast')||{}).textContent||'';
const futuro=(m)=>{const d=new Date();d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10)};
(async()=>{
 const a=env('uA','alvaro@ejemplo.com'),p=env('uP','paloma@ejemplo.com');await sleep(200);
 const A=a.w.__APP__,P=p.w.__APP__,da=a.doc,dp=p.doc,sha=()=>da.querySelector('#sheetHost').textContent,shp=()=>dp.querySelector('#sheetHost').textContent;
 const k=(X)=>{const d=new Date();return X.kpisMes(d.getFullYear(),d.getMonth()+1)};
 const cont=()=>da.querySelector('#content').textContent;
 // --- 1. Álvaro crea una meta compartida desde Análisis → Metas
 A.S.tab='dinero';A.S.dineroSub='metas';A.render();await sleep(10);
 ok(/Meta compartida/.test(cont()),'Dinero → Metas ofrece «Meta compartida»');
 click(a,'objNueva','ahorro');await sleep(10);
 ok(/Nueva meta compartida/.test(sha())&&da.querySelector('[data-click="objDest|g%3Ag1"].active'),'editor: se elige solo el único grupo (Casa)');
 da.querySelector('#oNombre').value='Viaje a Japón';da.querySelector('#oObjetivo').value='3000';da.querySelector('#oFecha').value=futuro(10);da.querySelector('#oPrevio').value='200';
 click(a,'objGuardar');await sleep(40);
 const o1=DB.objs[0];
 ok(o1&&o1.grupoId==='g1'&&o1.tipo==='ahorro'&&o1.objetivo===3000&&o1.previo===200,'meta compartida creada en Casa (3.000 €, 200 € de antes)');
 await sleep(20);
 ok(/Compartidas/.test(cont())&&/Viaje a Japón/.test(cont())&&/200,00\s*€ de 3\.?000,00/.test(cont()),'aparece en Metas → Compartidas con 200 € de 3.000 €');
 // --- 2. aportar: es un «Apartar» tuyo vinculado a la meta compartida
 click(a,'metaAportar','g:'+o1.id);await sleep(20);
 ok(da.querySelector('#tipoToggle .active').getAttribute('data-t')==='Ahorro'&&da.querySelector('#tipoToggle .active').textContent==='Apartar'&&da.querySelector('[data-click="pickMeta|g%3A'+o1.id+'"].active'),'«Aportar» abre Apartar con la meta compartida elegida');
 ok(!da.querySelector('.comp-toggle')&&!da.querySelector('.comp-box'),'apartar no es un gasto compartido: no hay reparto');
 da.querySelector('#fImporte').value='300';click(a,'saveMov');await sleep(80);
 const mA=Object.entries(DB.movs.uA).find(([,m])=>m.tipo==='Ahorro');
 ok(mA&&mA[1].metaId==='g:'+o1.id&&mA[1].categoria==='Viaje a Japón'&&mA[1].importe===300,'se guarda como movimiento tuyo, vinculado a la meta');
 const ap1=DB.aps[0];
 ok(ap1&&ap1.user_id==='uA'&&ap1.mov_id===mA[0]&&ap1.tipo==='Ahorro'&&ap1.importe===300&&ap1.objetivo_id===o1.id,'y la meta compartida recibe su reflejo (300 € de Álvaro)');
 ok(DB.comp.length===0,'no crea ningún gasto compartido');
 ok(k(A).ahorro===300,'en sus números cuenta 300 € apartados ('+k(A).ahorro+')');
 ok(Math.abs(A.saldosDe('g1').uA||0)<0.001,'aportar a la meta no crea deudas entre vosotros');
 ok(A.metasStats().find(r=>r.id==='mJ').acum===0,'no se suma a su meta personal con el mismo nombre');
 // --- 3. Paloma aparta y vincula una inversión suya
 await sleep(30);P.H.objAportar([o1.id]);await sleep(20);
 dp.querySelector('#fImporte').value='250';click(p,'saveMov');await sleep(80);
 P.H.metaAsignar(['g:'+o1.id]);await sleep(10);
 ok(/Vincular a «Viaje a Japón»/.test(shp())&&/Fondo indexado/.test(shp())&&/Lo verán los de la meta compartida/.test(shp()),'Paloma ve sus inversiones para vincular');
 const chkI=dp.querySelector('[data-change="asigMov|pi1"]');chkI.checked=true;chkI.dispatchEvent(new p.w.Event('change',{bubbles:true}));await sleep(5);
 await P.H.asigGuardar([]);await sleep(80);
 ok(DB.movs.uP.pi1.metaId==='g:'+o1.id&&DB.aps.some(x=>x.user_id==='uP'&&x.mov_id==='pi1'&&x.tipo==='Inversión'&&!x.borrado),'su inversión queda vinculada (híbrida)');
 await sleep(40);
 const r1=A.objStatsAny(DB.objs[0]);
 ok(Math.abs(r1.valor-850)<0.01&&r1.porPersona.uA===300&&r1.porPersona.uP===350&&r1.apartado===750&&r1.invAport===100,'progreso: 200 de antes + 300 + 250 apartados + 100 invertidos = 850 €');
 A.render();await sleep(10);
 ok(/Lo que pone cada uno: Tú 300,00\s*€ · Paloma 350,00\s*€ · antes de la app 200,00/.test(cont()),'la tarjeta dice cuánto ha puesto cada uno');
 ok(/Necesitáis aportar entre todos/.test(cont())&&/Invertido/.test(cont()),'calcula cuánto necesitáis al mes y separa lo invertido');
 // --- 4. deuda compartida desde el grupo
 A.H.grupoVer(['g1']);await sleep(30);
 ok(/Metas y deudas compartidas/.test(sha())&&/Viaje a Japón/.test(sha()),'la hoja del grupo muestra sus metas y deudas');
 click(a,'objNueva','deuda','g1');await sleep(10);
 da.querySelector('#oNombre').value='Hipoteca';da.querySelector('#oObjetivo').value='150000';da.querySelector('#oPrevio').value='30000';
 click(a,'objGuardar');await sleep(40);
 const o2=DB.objs[1];
 ok(o2&&o2.tipo==='deuda'&&o2.grupoId==='g1'&&/Hipoteca/.test(sha())&&/Casa/.test(sha()),'deuda compartida creada y se vuelve al grupo');
 click(a,'objEditar',o2.id,'g1');await sleep(10);click(a,'objAportar',o2.id);await sleep(20);
 ok(da.querySelector('#tipoToggle .active').getAttribute('data-t')==='Deuda'&&da.querySelector('[data-click="compObjetivo|'+o2.id+'"].active'),'«Apuntar un pago» abre el formulario de Deuda con la hipoteca');
 ok([...da.querySelectorAll('#compReparto input[type=checkbox]')].every(x=>x.checked),'el pago de una deuda se reparte entre todos por defecto');
 da.querySelector('#fImporte').value='800';click(a,'saveMov');await sleep(60);
 ok(/Hipoteca/.test(sha())&&/Paloma te debe 400,00/.test(sha()),'tras pagar la cuota se vuelve al grupo: Paloma te debe 400 €');
 ok(k(A).deuda===400,'en tus números cuenta tu parte de la cuota (400 €)');
 await sleep(30);ok(k(P).deuda===400,'y en los de Paloma la suya (400 €)');
 // --- 5. Análisis → Deudas
 A.H.closeSheet([]);await sleep(250);
 A.S.tab='dinero';A.S.dineroSub='deudas';A.render();await sleep(10);
 ok(/Coche/.test(cont())&&/Compartidas/.test(cont())&&/Pagado 30\.800,00\s*€ de 150\.000,00\s*€ · pendiente 119\.200,00/.test(cont())&&/Parte de cada uno: Tú 400,00\s*€ · Paloma 400,00/.test(cont()),'Deudas: tus deudas y debajo la hipoteca compartida');
 ok(A.deudasDe('g1').length===1,'');
 // --- 6. patrimonio: tu parte
 const pt=A.patrimonio();
 ok(Math.round(pt.ahorro)===300&&Math.round(pt.deudas)===5000+59600,'patrimonio: tus 300 € apartados y tu mitad de lo pendiente (59.600 €) ('+pt.ahorro+' / '+pt.deudas+')');
 // --- 7. cambiar de tipo en el formulario
 A.H.openMovForm([]);await sleep(20);click(a,'compOn');await sleep(5);
 click(a,'pickTipo','Ahorro');await sleep(5);
 ok(!da.querySelector('.comp-toggle')&&!da.querySelector('.comp-box')&&/👥 Viaje a Japón/.test(da.querySelector('#metaChips').textContent),'al pasar a Apartar no hay reparto, y la meta compartida se elige en «¿Para qué meta?»');
 click(a,'pickTipo','Gasto');await sleep(5);click(a,'pickFijo','1');await sleep(5);
 ok(!da.querySelector('[data-click^="compObjetivo"]')&&A.S&&true,'al volver a Gasto fijo desaparece la meta');
 click(a,'pickTipo','Inversión');await sleep(5);
 ok(!da.querySelector('.comp-box')&&!da.querySelector('.comp-toggle'),'las inversiones no se comparten');
 // --- 8. editar una aportación, desvincularla, volver a vincularla y renombrar la meta
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm([mA[0]]);await sleep(20);
 ok(da.querySelector('[data-click="pickMeta|g%3A'+o1.id+'"].active')&&da.querySelector('#fImporte').value==='300','editar una aportación: mantiene su meta');
 da.querySelector('#fImporte').value='350';click(a,'saveMov');await sleep(80);
 ok(ap1.importe===350&&!ap1.borrado&&DB.aps.filter(x=>x.user_id==='uA').length===1,'aportación cambiada a 350 € (sin duplicar)');
 A.H.closeSheet([]);await sleep(250);A.H.openMovForm([mA[0]]);await sleep(20);click(a,'pickMeta','');click(a,'saveMov');await sleep(80);
 ok(ap1.borrado&&!DB.movs.uA[mA[0]].metaId,'quitar la meta: deja de contar en la compartida');
 A.H.closeSheet([]);await sleep(250);A.H.openMovForm([mA[0]]);await sleep(20);click(a,'pickMeta','g:'+o1.id);click(a,'saveMov');await sleep(80);
 ok(!ap1.borrado&&ap1.importe===350&&DB.aps.filter(x=>x.user_id==='uA').length===1,'volver a vincularla la recupera (mismo registro)');
 A.H.closeSheet([]);await sleep(250);
 A.H.objEditar([o1.id]);await sleep(10);
 da.querySelector('#oNombre').value='Japón 2027';click(a,'objGuardar');await sleep(40);
 await sleep(30);
 ok(DB.objs[0].nombre==='Japón 2027'&&Math.abs(A.objStatsAny(DB.objs[0]).valor-900)<0.01&&A.metaOpciones().some(o=>o.k==='g:'+o1.id&&o.nombre==='Japón 2027'),'al renombrar la meta, las aportaciones siguen contando (900 €)');
 // --- 9. Paloma elimina la hipoteca: lo pagado sigue contando
 await sleep(30);P.H.objEditar([o2.id]);await sleep(10);
 const del=dp.querySelector('[data-click^="objEliminar"]');del.click();del.click();await sleep(40);
 ok(DB.objs[1].borrado&&!DB.comp.find(c=>c.objetivoId===o2.id).borrado,'Paloma elimina la hipoteca compartida; los pagos no se borran');
 await sleep(30);A.render();await sleep(5);
 ok(!/Hipoteca/.test(cont())&&k(A).deuda===400&&Math.abs((A.saldosDe('g1').uA||0)-40000)<1,'desaparece de Deudas, pero tu parte y la deuda entre vosotros siguen');
 // --- 10. sin deudas compartidas: el formulario lo explica
 A.H.openMovForm([]);await sleep(20);click(a,'pickTipo','Deuda');await sleep(5);click(a,'compOn');await sleep(5);
 ok(/Aún no tienes deudas compartidas/.test(sha())&&da.querySelector('[data-click="objNueva|deuda"]'),'sin deudas compartidas: lo explica y ofrece crear una');
 // --- 11. Inicio: la meta compartida aparece en Metas
 A.H.closeSheet([]);await sleep(250);a.w.__APP__.H.irDinero(['metas']);await sleep(10);
 ok(/Japón 2027/.test(cont()),'la meta compartida sale en Dinero → Metas');
 a.w.__APP__.H.setDineroSub(['compartido']);await sleep(10);
 ok(/Japón 2027/.test(cont())&&/Casa/.test(cont()),'y en Dinero → Compartido, con los grupos');

 // --- 12. (revisión) cambiar Gasto ↔ Factura no pisa un reparto hecho a mano
 A.H.openMovForm([]);await sleep(20);da.querySelector('#fImporte').value='100';da.querySelector('#fCategoria').value='Supermercado';
 click(a,'compOn');await sleep(5);click(a,'compModo','importe');await sleep(5);
 let iv=da.querySelectorAll('#compReparto input.comp-val');iv[0].value='70';iv[0].dispatchEvent(new a.w.Event('input',{bubbles:true}));iv[1].value='30';iv[1].dispatchEvent(new a.w.Event('input',{bubbles:true}));await sleep(5);
 click(a,'pickFijo','1');await sleep(5);
 iv=da.querySelectorAll('#compReparto input.comp-val');
 ok(iv.length===2&&iv[0].value==='70'&&iv[1].value==='30','pasar a Gasto fijo mantiene el reparto 70/30');
 click(a,'saveMov');await sleep(60);
 const cf=DB.comp[DB.comp.length-1];ok(cf.tipo==='Factura'&&cf.reparto.uA===70&&cf.reparto.uP===30,'y se guarda 70/30');
 // --- 13. (revisión) compartir → no compartir → Ahorro → compartir: prepara la meta y la aportación individual
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm([]);await sleep(20);click(a,'compOn');await sleep(5);click(a,'compOff');await sleep(5);
 click(a,'pickTipo','Ahorro');await sleep(5);
 ok(!da.querySelector('.comp-box')&&!!da.querySelector('#metaChips'),'compartir → no compartir → Apartar: sin reparto y con «¿Para qué meta?»');
 // --- 14. (revisión) crear una deuda desde el formulario no pierde lo escrito
 A.H.closeSheet([]);await sleep(250);
 A.H.openMovForm([]);await sleep(20);click(a,'pickTipo','Deuda');await sleep(5);
 da.querySelector('#fImporte').value='99';da.querySelector('#fDesc').value='cuota octubre';
 click(a,'compOn');await sleep(5);click(a,'objNueva','deuda');await sleep(10);
 da.querySelector('#oNombre').value='Préstamo';da.querySelector('#oObjetivo').value='6000';click(a,'objGuardar');await sleep(40);
 const o3=DB.objs.find(x=>x.nombre==='Préstamo');
 ok(o3&&/Nuevo movimiento/.test(sha())&&da.querySelector('#fImporte').value==='99'&&da.querySelector('#fDesc').value==='cuota octubre'&&da.querySelector('[data-click="compObjetivo|'+o3.id+'"].active'),'tras crear la deuda vuelve al formulario con lo escrito y la deuda elegida');
 click(a,'saveMov');await sleep(60);
 ok(DB.comp[DB.comp.length-1].objetivoId===o3.id&&DB.comp[DB.comp.length-1].importe===99,'y el pago se guarda en esa deuda');
 // --- 15. (revisión) «Aportar» desde Análisis no te devuelve a un grupo antiguo
 A.H.grupoVer(['g1']);await sleep(20);click(a,'objEditar',o1.id,'g1');await sleep(10);A.H.closeSheet([]);await sleep(250);
 A.H.objAportar([o1.id]);await sleep(20);da.querySelector('#fImporte').value='10';click(a,'saveMov');await sleep(60);await sleep(250);
 ok(!da.querySelector('#sheetHost .sheet'),'tras aportar desde Análisis se cierra (no abre un grupo de antes)');
 // --- 16. (revisión) un pago de una deuda eliminada se puede seguir editando
 const pagoHip=DB.comp.find(c=>c.objetivoId===o2.id);
 A.H.openMovForm(['c:'+pagoHip.id]);await sleep(20);
 ok(/Hipoteca \(eliminada\)/.test(sha()),'muestra la deuda eliminada');
 da.querySelector('#fDesc').value='cuota septiembre';click(a,'saveMov');await sleep(60);
 ok(pagoHip.descripcion==='cuota septiembre'&&pagoHip.objetivoId===o2.id,'se guarda sin moverlo a otra deuda');
 // --- 17. (13/10) borrar un movimiento vinculado lo quita de la meta compartida; deshacer lo devuelve
 P.H.closeSheet([]);await sleep(250);
 P.H.movBorrar(['pi1']);await sleep(80);
 const apI=DB.aps.find(x=>x.user_id==='uP'&&x.mov_id==='pi1');
 ok(!DB.movs.uP.pi1&&apI.borrado,'Paloma borra su inversión: deja de contar en la meta');
 dp.querySelector('#toast .toast-btn').click();await sleep(100);
 ok(DB.movs.uP.pi1&&!apI.borrado&&DB.aps.filter(x=>x.mov_id==='pi1').length===1,'«Deshacer» la devuelve a la meta');
 // --- 18. (13/10) hitos y «He usado dinero» en la meta compartida
 A.H.objEditar([o1.id]);await sleep(10);
 ok(/Hitos/.test(sha()),'el editor de la meta compartida tiene hitos');
 click(a,'hitoAdd');await sleep(5);
 const hi=[...da.querySelectorAll('#hitosBox .hito-row input')];const setc=(el,v)=>{el.value=v;el.dispatchEvent(new a.w.Event('change',{bubbles:true}))};
 setc(hi[0],'Primeros 500');setc(hi[1],'500');click(a,'objGuardar');await sleep(40);
 ok((DB.objs[0].hitos||[]).length===1&&DB.objs[0].hitos[0].importe===500,'hito guardado en la meta compartida');
 A.H.closeSheet([]);await sleep(250);A.H.irDinero(['metas']);await sleep(80);
 ok(DB.objs[0].hitos[0].logrado,'se marca logrado para los dos (ya hay más de 500 €)');
 const ahAntes=A.patrimonio().ahorro,vAntes=A.objStatsAny(DB.objs[0]).valor;
 click(a,'usoAbrir','g:'+o1.id);await sleep(10);da.querySelector('#uImporte').value='100';click(a,'usoGuardar');await sleep(60);
 ok((DB.objs[0].usos||[]).length===1&&DB.objs[0].usos[0].por==='uA'&&!DB.objs[0].conseguida,'uso apuntado en la meta compartida (por Álvaro)');
 await sleep(30);
 ok(Math.abs(A.objStatsAny(DB.objs[0]).valor-(vAntes-100))<0.01&&Math.abs(P.objStatsAny(DB.objs[0]).valor-(vAntes-100))<0.01,'la meta baja 100 € para los dos');
 ok(Math.abs(A.patrimonio().ahorro-(ahAntes-100))<0.01,'y baja el ahorro de quien lo usó');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
