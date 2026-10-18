// Pruebas de uso simuladas (13/10): mejoras que salieron + amigos
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),ym=d.getFullYear()+'-'+pad(d.getMonth()+1);
function conGrupos(w,estado){ // estado: {grupos:[], miembros:[]} mutable
  const rpcs=[];w.__rpcs=rpcs;
  const base=w.Data;
  w.Data=Object.assign({},base,{uid:()=>'uA',
    grupos:{listar:async()=>JSON.parse(JSON.stringify(estado)),invitaciones:async()=>[],renombrar:async()=>[],miNombre:async()=>[],reparto:async()=>[]},
    compartidos:{suscribir:n=>{setTimeout(()=>n([]),0);return()=>{}},crear:async o=>o,editar:async(i,o)=>o,borrar:async()=>[]},
    objetivos:{suscribir:n=>{setTimeout(()=>n([]),0);return()=>{}}},
    rpc:async(fn,p)=>{rpcs.push([fn,p]);
      if(fn==='crear_grupo'){estado.grupos.push({id:'gN',nombre:p.p_nombre,tipo:'grupo',creado_por:'uA',created_at:'z'});estado.miembros.push({grupo_id:'gN',user_id:'uA',nombre:p.p_mi_nombre,rol:'admin',created_at:'a'});return 'gN'}
      if(fn==='anadir_a_grupo'){const n=estado.miembros.find(m=>m.user_id===p.p_user);estado.miembros.push({grupo_id:p.p_grupo,user_id:p.p_user,nombre:n?n.nombre:'?',rol:'miembro',created_at:'b'});return null}
      if(fn==='crear_invitacion_varios'||fn==='crear_invitacion'||fn==='invitar_persona')return 'TOKENxyz';
      return null}});
}
(async()=>{
 const est={grupos:[{id:'g1',nombre:'Casa',tipo:'grupo',creado_por:'uA',created_at:'a'},{id:'d1',nombre:'Álvaro y Paloma',tipo:'directo',creado_por:'uA',created_at:'b'}],
   miembros:[{grupo_id:'g1',user_id:'uA',nombre:'Álvaro',rol:'admin',created_at:'a'},{grupo_id:'g1',user_id:'uF',nombre:'Alfredo',rol:'miembro',created_at:'b'},
     {grupo_id:'d1',user_id:'uA',nombre:'Álvaro',rol:'admin',created_at:'a'},{grupo_id:'d1',user_id:'uP',nombre:'Paloma',rol:'admin',created_at:'b'}]};
 const e=makeEnv({version:{juntos:1},cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:300}]},meta:{onboarded:true}},session:{user:{email:'a@a.com',id:'uA'}},
   movs:[{id:'g1',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',importe:40,fecha:ym+'-02'},{id:'g2',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',importe:25,fecha:'2025-01-10'}],
   pre:w=>conGrupos(w,est)});
 await sleep(150);
 const A=e.w.__APP__,H=A.H,doc=e.doc,txt=()=>doc.querySelector('#content').textContent,sh=()=>doc.querySelector('#sheetHost').textContent;
 // 1. Movimientos filtrado → botón para apuntar justo eso
 H.irMovs(['_gastos',ym.replace(/^/,'m:')]);await sleep(10);
 ok(/Apuntar un gasto/.test(doc.querySelector('.mov-add-ctx').textContent),'Gastos filtrados: «Apuntar un gasto» arriba');
 H.irMovs(['_gastos',ym.replace(/^/,'m:'),'Supermercado']);await sleep(10);
 click(e,'movAddCtx');await sleep(20);
 ok(doc.querySelector('#tipoToggle .active').textContent==='Gasto'&&doc.querySelector('#fCategoria').value==='Supermercado','con categoría: abre el gasto ya en Supermercado');
 ok(!/NaN/.test(sh())&&!!doc.querySelector('#invFields'),'el formulario se pinta entero (sin «NaN»)');
 // 2. importe primero
 const ord=[...doc.querySelectorAll('#sheetHost .field label')].map(l=>l.textContent.split(' ')[0]);
 ok(ord.indexOf('Importe')<ord.indexOf('Tipo'),'el importe va antes que el tipo ('+ord.slice(0,3).join(', ')+')');
 H.closeSheet([]);await sleep(250);
 // 3. editar avisa y deja duplicar
 H.openMovForm(['g1']);await sleep(10);
 ok(/Estás cambiando un movimiento que ya existe/.test(sh())&&!!doc.querySelector('.edit-aviso [data-click^="movDuplicar"]'),'al editar avisa y ofrece «Apuntar uno nuevo igual»');
 H.closeSheet([]);await sleep(250);
 // 4. presupuesto desde Inicio
 H.irResumen([]);await sleep(10);
 H.irMovs(['_gastos',A.S.movPeriodo,'Supermercado']);await sleep(10);click(e,'presEditar','Supermercado');await sleep(10);
 ok(/Presupuesto de Supermercado/.test(sh())&&doc.querySelector('#presIn').value==='300','«Cambiar» en la fila abre su presupuesto');
 doc.querySelector('#presIn').value='350';click(e,'presGuardar');await sleep(30);
 ok(e.store.cfg.app.categoriasGasto.some(c=>c.nombre==='Supermercado'&&c.presupuesto===350),'y se guarda sin ir a Tú');
 // 5. buscador con total
 H.openBuscar([]);await sleep(10);const q=doc.querySelector('#qBuscar');q.value='mercadona';q.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(10);
 ok(/2 movimientos · gastado 65,00 € · este mes 40,00 €/.test(doc.querySelector('.buscar-total').textContent),'buscador: total de lo encontrado y de este mes');
 H.closeSheet([]);await sleep(250);
 // 6. Apartar sin metas → crear meta y volver
 H.openMovForm([null,{tipo:'Ahorro'}].slice(0,0));await sleep(5);H.closeSheet([]);await sleep(250);
 H.crearIr(['ahorro']);await sleep(20);
 doc.querySelector('#fImporte').value='50';
 click(e,'metaNuevaForm');await sleep(20);
 ok(/Nueva meta/.test(sh()),'«+ Nueva meta» desde Apartar abre el editor');
 doc.querySelector('#mNombre').value='Casa';doc.querySelector('#mObjetivo').value='200000';click(e,'metaGuardar');await sleep(40);
 const mid=(e.store.cfg.app.ahorro||[]).find(m=>m.nombre==='Casa').id;
 ok(/Nuevo movimiento/.test(sh())&&doc.querySelector('#fImporte').value==='50'&&!!doc.querySelector('[data-click="pickMeta|'+mid+'"].active'),'vuelve al formulario con los 50 € y la meta nueva elegida');
 H.closeSheet([]);await sleep(250);
 // 7. Amigos
 ok(A.S.grupos&&A.S.grupos.length===2,'grupos cargados');
 H.openGrupos([]);await sleep(30);
 ok(/Amigos/.test(sh())&&/Alfredo/.test(sh())&&/Paloma/.test(sh())&&/En Casa/.test(sh()),'Amigos: Paloma (directo) y Alfredo (del grupo Casa)');
 click(e,'grupoNuevo');await sleep(10);
 ok(doc.querySelectorAll('.amigo-chk').length===2,'nuevo grupo: puedes marcar a tus amigos');
 doc.querySelector('#gNombre').value='Viaje';const chk=[...doc.querySelectorAll('.amigo-chk')];chk.forEach(c=>{c.checked=true});
 click(e,'grupoCrear');await sleep(80);
 const r=e.w.__rpcs.map(x=>x[0]);
 ok(r.indexOf('crear_grupo')>=0&&r.filter(x=>x==='anadir_a_grupo').length===2,'se crea y se añaden los 2 amigos sin invitación ('+r.join(',')+')');
 ok(A.S.grupos.find(g=>g.id==='gN').miembros.length===3,'el grupo nuevo ya tiene 3 miembros');
 H.grupoVer(['g1']);await sleep(30);
 ok(/Añadir a tus amigos/.test(sh())&&!!doc.querySelector('[data-click="grupoAnadir|g1|uP"]'),'en un grupo: añadir a amigos que no están (Paloma)');
 click(e,'grupoAnadir','g1','uP');await sleep(60);
 ok(e.w.__rpcs.some(x=>x[0]==='anadir_a_grupo'&&x[1].p_grupo==='g1'&&x[1].p_user==='uP'),'Paloma añadida a Casa');
 click(e,'grupoInvitarVarios');await sleep(40);
 ok(e.w.__rpcs.some(x=>x[0]==='crear_invitacion_varios')&&/hasta 10 personas/.test(sh()),'enlace para varios (hasta 10)');
 H.closeSheet([]);await sleep(250);
 // 8. Compartido sin amigos: la caja de compartir arriba e invitar
 const e2=makeEnv({version:{juntos:1},cfg:{app:{categoriasGasto:[{nombre:'Supermercado'}]},meta:{onboarded:true}},session:{user:{email:'b@b.com',id:'uA'}},pre:w=>conGrupos(w,{grupos:[],miembros:[]})});
 await sleep(150);
 e2.w.__APP__.H.crearIr(['compartido']);await sleep(30);
 const ids=[...e2.doc.querySelectorAll('#sheetHost .field')].map(f=>f.id||'');
 ok(ids.indexOf('compField')===ids.indexOf('catField')+1&&ids.indexOf('compField')<ids.indexOf('subField'),'lo de compartir va justo después de la categoría (antes estaba al final)');
 ok(/Aún no compartes con nadie/.test(e2.doc.querySelector('#compField').textContent)&&!!e2.doc.querySelector('[data-click="compInvitar"]'),'sin amigos: botón «Invitar a una persona»');
 click(e2,'compInvitar');await sleep(10);
 ok(/Invitar a una persona/.test(e2.doc.querySelector('#sheetHost h2').textContent),'que abre la invitación');
 // 9. Empieza aquí
 ok(/Empieza aquí/.test(e2.doc.querySelector('#content').textContent),'usuario nuevo: «Empieza aquí»');
 H.goTab(['inicio']);await sleep(10);
 ok(!doc.querySelector('#content .empieza'),'con movimientos, meta, grupo y presupuesto: ya no sale (no falta nada)');
 const e3=makeEnv({version:{juntos:1},cfg:{app:{categoriasGasto:[{nombre:'Supermercado'}]},meta:{onboarded:true}},movs:[{id:'x',tipo:'Gasto',categoria:'Supermercado',importe:5,fecha:ym+'-01'}]});await sleep(80);
 ok(!e3.doc.querySelector('#content .empieza'),'a quien ya apunta no le quitan sitio en Inicio los primeros pasos');
 e2.w.__APP__.H.closeSheet([]);await sleep(260);e2.w.__APP__.H.goTab(['inicio']);await sleep(20);click(e2,'empiezaOcultar');await sleep(20);
 ok(!e2.doc.querySelector('#content .empieza')&&e2.store.cfg.app.empiezaOculto,'«Ocultar» lo quita para siempre');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
