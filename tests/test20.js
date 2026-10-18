// Bloque 9A: nueva estructura (4 secciones + botón +, Tú, buscador global)
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),ym=d.getFullYear()+'-'+pad(d.getMonth()+1);
(async()=>{
 const e=makeEnv({version:{dinero:3},cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:300},{nombre:'Ocio'}],ingresos:['Nómina'],ahorro:[{id:'m1',nombre:'Colchón',objetivo:1000}],metodosPago:['Tarjeta']},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Ingreso',categoria:'Nómina',importe:2000,fecha:ym+'-01'},{id:'b',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',importe:42.5,fecha:ym+'-01'},{id:'c',tipo:'Gasto',categoria:'Ocio',descripcion:'Cine',importe:18,fecha:ym+'-01'}]});
 e.store.tareas.t1={nombre:'Renovar seguro',estado:'Pendiente',fechaLimite:ym+'-'+pad(Math.min(28,d.getDate()+1)),prioridad:'Alta'};
 await sleep(80);
 const A=e.w.__APP__,H=A.H,doc=e.doc,txt=()=>doc.querySelector('#content').textContent,sh=()=>doc.querySelector('#sheetHost').textContent;
 // Inicio
 ok(/Te queda este mes/.test(txt())&&/1939,50|1.939,50/.test(doc.querySelector('.hero-v').textContent),'Inicio: «Te queda este mes» con lo que queda ('+doc.querySelector('.hero-v').textContent+')');
 ok(/Renovar seguro/.test(txt()),'Lo próximo incluye la tarea de mañana');
 ok(!!doc.querySelector('[data-click="tuMesAbrir"]')&&!doc.querySelector('[data-click^="moveMes"]'),'Inicio: el mes se ve en una píldora (sin flechas: los meses anteriores están en el Resumen)');
 // botón +
 click(e,'onFab');await sleep(10);
 ok(/¿Qué quieres apuntar\?/.test(sh())&&doc.querySelectorAll('#sheetHost .crear-op').length>=8,'el + abre «¿Qué quieres apuntar?» con todas las opciones (incluye Invertir, Gasto fijo y Pago de deuda)');
 click(e,'crearIr','ingreso');await sleep(20);
 ok(/Nuevo movimiento/.test(sh())&&doc.querySelector('#tipoToggle .active').textContent==='Ingreso','Ingreso abre el formulario ya en Ingreso');
 H.closeSheet([]);await sleep(250);
 click(e,'onFab');await sleep(5);click(e,'crearIr','tarea');await sleep(20);
 ok(/Nueva tarea/.test(sh()),'Tarea abre el formulario de tarea');
 H.closeSheet([]);await sleep(250);
 // Dinero
 click(e,'goTab','dinero');await sleep(10);
 ok(/Colchón/.test(txt())&&doc.querySelectorAll('.chips-nav .chip-nav').length===3,'Dinero: metas y los 3 apartados (lo compartido tiene su pestaña)');
 click(e,'setDineroSub','deudas');ok(/Todavía no tienes deudas/.test(txt()),'Dinero → Deudas');
 // Agenda
 H.goTab(['agenda']);await sleep(10);
 ok(A.S.tab==='inicio'&&/Renovar seguro/.test(txt())&&/Calendario/.test(txt()),'Agenda (dentro de Inicio): tareas y acceso a Calendario');
 click(e,'setInicioVista','calendario');ok(!!doc.querySelector('[data-click^="calSelDia"]'),'Inicio → Calendario');
 // Tú
 click(e,'goTab','tu');await sleep(10);
 ok(A.S.tab==='tu'&&doc.body.classList.contains('en-tu')&&/Tú/.test(doc.querySelector('#pageTitle').textContent),'tu inicial abre «Tú» con botón de volver');
 ok(['Compartir','Tu dinero','Herramientas','Tareas','App'].every(g=>new RegExp(g).test(txt()))&&!/Próximamente/.test(txt())&&!/Pestañas de Análisis/.test(txt()),'Tú: 5 grupos, sin «Próximamente» ni «Pestañas de Análisis»');
 const q=doc.querySelector('#tuBuscar');q.value='banco';q.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 const vis=[...doc.querySelectorAll('#content .menu-item')].filter(b=>b.style.display!=='none').map(b=>b.textContent.trim());
 ok(vis.length>=1&&vis.every(v=>/Cuentas y saldos|Importar/.test(v)),'buscador de ajustes: «banco» → '+vis.join(', '));
 q.value='zzzz';q.dispatchEvent(new e.w.Event('input',{bubbles:true}));ok(doc.querySelector('#tuNada').style.display==='','sin resultados lo dice');
 // nombres antiguos de pestañas siguen funcionando
 H.goTab(['mas']);ok(A.S.tab==='tu','«mas» → Tú');H.goTab(['tareas']);ok(A.S.tab==='inicio'&&A.S.agendaSub==='tareas','«tareas» → Agenda (dentro de Inicio)');
 H.goTab(['analisis']);ok(A.S.tab==='inicio','«analisis» → Inicio');H.irAnalisis(['inversiones']);ok(A.S.tab==='dinero'&&A.S.dineroSub==='inversiones','Análisis → Inversiones → Dinero');
 // buscador global
 click(e,'openBuscar');await sleep(10);
 ok(/Atajos/.test(sh()),'buscador: atajos al abrir');
 const b=doc.querySelector('#qBuscar');b.value='mercadona';b.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 ok(/Movimientos/.test(sh())&&/Mercadona/.test(sh())&&!/Cine/.test(sh()),'buscar «mercadona» encuentra el movimiento');
 b.value='42,50';b.dispatchEvent(new e.w.Event('input',{bubbles:true}));ok(/Mercadona/.test(sh()),'buscar por importe');
 b.value='metas';b.dispatchEvent(new e.w.Event('input',{bubbles:true}));ok(/Ir a/.test(sh())&&/Metas/.test(sh()),'buscar «metas» ofrece ir a Metas');
 click(e,'buscarIr','irDinero','metas');await sleep(10);ok(A.S.tab==='dinero'&&A.S.dineroSub==='metas','y te lleva');
 click(e,'openBuscar');await sleep(10);const b2=doc.querySelector('#qBuscar');b2.value='supermercado';b2.dispatchEvent(new e.w.Event('input',{bubbles:true}));
 ok(/Categorías/.test(sh())&&/Este mes: .*ver todos sus movimientos/.test(sh()),'buscar una categoría dice lo que llevas este mes');
 click(e,'buscarIr','irMovs','_gastos','todo','Supermercado');await sleep(10);ok(A.S.tab==='movimientos'&&A.S.movCat==='Supermercado','categoría → sus movimientos');

 // 9B: Agenda con la semana
 H.goTab(['agenda']);await sleep(10);
 ok(doc.querySelectorAll('.semana .dia').length===7&&!!doc.querySelector('.semana .dia.sel'),'Agenda: tira de la semana con el día elegido');
 const manana=e.w.__APP__.S.tareas[0].fechaLimite;
 if(!e.doc.querySelector('[data-click="agendaDia|'+manana+'"]'))click(e,'agendaSemana','1'); // domingo: mañana está en la semana siguiente
 click(e,'agendaDia',manana);await sleep(5);ok(/Renovar seguro/.test(doc.querySelector('#content .list').textContent),'al elegir el día se ven sus tareas');
 click(e,'agendaSemana','1');ok(/Nada para este día/.test(txt()),'semana siguiente');
 // 9B: Movimientos con iconos, totales por día y filtros rápidos
 H.goTab(['movimientos']);H.setMovVista(['lista']);await sleep(10);
 ok(doc.querySelectorAll('#movList .mov-ic').length===3&&/\+1\.939,50/.test(doc.querySelector('.date-sep').textContent),'Movimientos: icono por categoría y total del día ('+doc.querySelector('.date-sep').textContent+')');
 click(e,'movFiltrosAbrir');await sleep(5);ok(!!doc.querySelector('#movList .mov-ic.t-expense')&&/Tienen ticket/.test(doc.querySelector('#sheetHost').textContent),'«Tienen ticket» en la hoja Filtros');
 click(e,'movSoloTicket');await sleep(5);ok(/Sin movimientos/.test(txt())&&/No hay movimientos con estos filtros/.test(doc.querySelector('#sheetHost').textContent),'sin tickets todavía (y el botón lo dice)');click(e,'movFiltrosQuitar');await sleep(5);ok(/3 movimientos/.test(txt()),'«Quitar todos» deja la lista como al entrar');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
