// Estructura definitiva (14/10): Inicio ligero · Movimientos (Lista|Resumen) · Juntos · Dinero (Agenda dentro de Inicio) + Papelera
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const HOY=new Date(),p=n=>String(n).padStart(2,'0'),mk=HOY.getFullYear()+'-'+p(HOY.getMonth()+1),hoyISO=mk+'-'+p(HOY.getDate());
const movs=[{id:'g1',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',importe:50,fecha:mk+'-01'},{id:'n1',tipo:'Ingreso',categoria:'Nómina',importe:2000,fecha:mk+'-01'}];
const mkcfg=(x)=>Object.assign({app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:30}],ahorro:[],cuentas:[{id:'c1',nombre:'Banco',saldo:1000,fecha:mk+'-01'}]},meta:{onboarded:true}},x||{});
async function env(c,m,t){
  const e=makeEnv({cfg:JSON.parse(JSON.stringify(c||mkcfg())),movs:m||movs,url:'https://x.test/',session:{user:{email:'t@t.com',id:'otro'}}});
  (t||[]).forEach(x=>{e.store.tareas[x.id]=x});
  await sleep(150);return e;
}
const tabs=e=>[...e.doc.querySelectorAll('.tabbar [data-tab]')].map(b=>b.getAttribute('data-tab')).join(',');
(async()=>{
 let e=await env();let H=e.w.__APP__.H,A=e.w.__APP__,doc=e.doc,txt=()=>doc.querySelector('#content').textContent;
 ok(tabs(e)==='inicio,movimientos,juntos,dinero','pestañas: Inicio, Movimientos, Juntos, Dinero');
 ok(!doc.querySelector('.estr-aviso')&&!doc.querySelector('#donutWrap')&&!doc.querySelector('.inicio-seg')&&!!doc.querySelector('.dias-tit [data-click="setInicioVista|tareas"]'),'Inicio ligero: sin gráficos y con Hoy · Semana y tareas · Calendario');
 H.goTab(['tu']);await sleep(10);
 ok(!/Probar estructura/.test(txt())&&/Papelera/.test(txt()),'Tú: ya no hay selector de estructura y sí Papelera');
 H.onFab([]);await sleep(10);ok(!!doc.querySelector('[data-click="crearIr|inversion"]')&&!!doc.querySelector('[data-click="crearIr|deuda"]')&&!!doc.querySelector('[data-click="crearIr|factura"]'),'el + trae Invertir, Gasto fijo y Pago de deuda');
 H.closeSheet([]);await sleep(260);
 // Inicio: Pendiente con 3 filas como mucho
 const ayer=new Date(HOY.getTime()-864e5*3).toISOString().slice(0,10);
 const tareas=[{id:'t1',nombre:'Pedir cita médico',estado:'Pendiente',fechaLimite:ayer,prioridad:'Alta'},{id:'t2',nombre:'Pagar IBI',estado:'Pendiente',fechaLimite:ayer,prioridad:'Media'}];
 const cfg=mkcfg();cfg.app.categoriasGasto=[{nombre:'Supermercado',presupuesto:30},{nombre:'Ocio',presupuesto:10}];
 const m2=movs.concat([{id:'g2',tipo:'Gasto',categoria:'Ocio',importe:40,fecha:mk+'-02'}]);
 cfg.app.facturas=[{nombre:'Alquiler',importe:500,diaDelMes:HOY.getDate()}];cfg.app.ingresos=['Nómina'];
 e=await env(cfg,m2,tareas);H=e.w.__APP__.H;A=e.w.__APP__;doc=e.doc;txt=()=>doc.querySelector('#content').textContent;
 const filas=()=>doc.querySelectorAll('.dias-lista .dia-fila').length;
 ok(filas()===3&&/Ver los \d+/.test(txt()),'Estos días: se ven 3 filas y «Ver los N» ('+filas()+')');
 click(e,'verPendiente');await sleep(10);
 ok(filas()>3&&/Ver menos/.test(txt()),'al tocar «avisos más» se despliega todo');
 click(e,'verPendiente');await sleep(10);ok(filas()===3,'y se vuelve a plegar');
 ok(!!doc.querySelector('[data-click^="recSi"]'),'el cobro/pago de hoy se confirma desde Inicio');
 // Agenda dentro de Inicio
 click(e,'setInicioVista','tareas');await sleep(10);
 ok(/Pedir cita médico/.test(txt()),'Inicio → Semana y tareas muestra las tareas');
 click(e,'setInicioVista','calendario');await sleep(10);ok(!!doc.querySelector('[data-click^="calSelDia"]'),'Inicio → Calendario');
 click(e,'setInicioVista','hoy');await sleep(10);
 // Movimientos: lista y resumen; volver desde el resumen
 H.goTab(['movimientos']);await sleep(10);
 ok(/Mercadona/.test(txt())&&!!doc.querySelector('.mov-vista'),'Movimientos: la lista y el selector Lista | Resumen');
 click(e,'setMovVista','resumen');await sleep(15);ok(/En qué gastas/.test(txt()),'Movimientos → Resumen: en qué gastas y presupuestos');
 const bud=doc.querySelector('.budget-row.tappable');bud.click();await sleep(10);
 ok(/Volver a Resumen/.test(txt()),'al entrar en una categoría, «Volver a Resumen»');
 click(e,'volver');await sleep(10);ok(A.S.movVista==='resumen'&&/En qué gastas/.test(txt()),'«Volver» te deja en el Resumen donde estabas');
 // Dinero y Juntos
 H.goTab(['dinero']);await sleep(10);
 ok(doc.querySelectorAll('.chips-nav .chip-nav').length===3&&!!doc.querySelector('.pat-mini'),'Dinero: Metas, Inversiones, Deudas y Patrimonio plegado');
 H.goTab(['juntos']);await sleep(15);
 ok(A.S.tab==='juntos'&&/Juntos|Aún no compartes|compartes|disponible/.test(txt()),'pestaña Juntos');
 // Papelera: movimientos
 H.goTab(['movimientos']);click(e,'setMovVista','lista');await sleep(10);
 await A.H.openMovForm(['g1']);await sleep(20);
 click(e,'deleteMov');await sleep(5);click(e,'deleteMov');
 await sleep(120);
 ok(!e.store.movimientos.g1,'se borra el movimiento');
 ok((A.cfg().papelera||[]).some(x=>x.k==='mov'&&x.id==='g1'&&x.copia.importe===50),'…y queda en la papelera');
 H.goTab(['tu']);await sleep(10);H.openPapelera([]);await sleep(10);
 ok(/Mercadona/.test(doc.querySelector('#sheetHost').textContent)&&/se borra del todo en 15 días/.test(doc.querySelector('#sheetHost').textContent),'la papelera lo enseña con los días que le quedan (15)');
 click(e,'papeleraRecuperar','mov','g1');await sleep(120);
 ok(!!e.store.movimientos.g1&&e.store.movimientos.g1.importe===50&&!(A.cfg().papelera||[]).some(x=>x.id==='g1'),'«Recuperar» lo devuelve igual y lo saca de la papelera');
 // caducidad
 const viejo=Date.now()-16*864e5;await A.S.db.doc('config/app').update({papelera:[{k:'mov',id:'zz',copia:{tipo:'Gasto',importe:1,categoria:'X',fecha:mk+'-01'},en:viejo},{k:'mov',id:'yy',copia:{tipo:'Gasto',importe:2,categoria:'X',fecha:mk+'-01'},en:Date.now()}]});
 A.S.config=Object.assign({},A.cfg(),{papelera:[{k:'mov',id:'zz',copia:{tipo:'Gasto',importe:1,categoria:'X',fecha:mk+'-01'},en:viejo},{k:'mov',id:'yy',copia:{tipo:'Gasto',importe:2,categoria:'X',fecha:mk+'-01'},en:Date.now()}]});
 H.closeSheet([]);await sleep(260);H.openPapelera([]);await sleep(10);
 ok(!/>1,00/.test(doc.querySelector('#sheetHost').innerHTML.replace(/\s/g,''))&&doc.querySelectorAll('#sheetHost [data-click^="papeleraRecuperar"]').length===1,'lo de hace más de 15 días ya no sale');
 // tareas
 H.closeSheet([]);await sleep(260);
 A.H.openTareaForm(['t1']);await sleep(20);click(e,'deleteTarea');await sleep(5);click(e,'deleteTarea');
 await sleep(120);
 ok(!e.store.tareas.t1&&(A.cfg().papelera||[]).some(x=>x.k==='tarea'&&x.id==='t1'),'una tarea borrada también va a la papelera');
 H.openPapelera([]);await sleep(10);click(e,'papeleraRecuperar','tarea','t1');await sleep(120);
 ok(!!e.store.tareas.t1&&e.store.tareas.t1.nombre==='Pedir cita médico','y se recupera');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
