const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),Y=d.getFullYear(),M=d.getMonth()+1,hoy=Y+'-'+pad(M)+'-'+pad(d.getDate());
const movs=[{id:'i1',tipo:'Ingreso',categoria:'Nómina',importe:1500,fecha:hoy},{id:'g1',tipo:'Gasto',categoria:'Ocio',importe:40,fecha:hoy},{id:'f1',tipo:'Factura',categoria:'Luz',importe:60,fecha:hoy},
 {id:'g2',tipo:'Gasto',categoria:'Ocio',importe:25,fecha:'2026-06-10'},{id:'i2',tipo:'Ingreso',categoria:'Nómina',importe:1400,fecha:'2026-06-01'},{id:'a1',tipo:'Ahorro',categoria:'Casa',importe:100,fecha:'2026-06-02'}];
(async()=>{
 const e=makeEnv({version:{dinero:3},cfg:{app:{categoriasGasto:[{nombre:'Ocio',presupuesto:30}],ahorro:[{nombre:'Casa',objetivo:1000}],deudas:[{nombre:'Coche',objetivo:500}]},meta:{onboarded:true}},movs});
 await sleep(100);const A=e.w.__APP__,S=A.S,H=A.H,doc=e.doc;const list=()=>doc.querySelector('#movList').textContent,txt=()=>doc.querySelector('#content').textContent;
 // Dashboard: Ingresos del mes
 e.w.__APP__.H.goTab(['inicio']);await sleep(10);
 ok(!doc.querySelector('#content .hero-tile')&&!!doc.querySelector('#content .hero-main.tappable'),'Inicio: la cifra principal se puede pinchar (ingresos, gastos y apartado están en el Resumen)');
 H.irMovs(['Ingreso','m:'+Y+'-'+pad(M)]);await sleep(10);
 ok(S.tab==='movimientos'&&/1 movimiento/.test(list())&&/Nómina/.test(list()),'Ingresos → movimientos de ingresos de este mes');
 ok(/Volver a Inicio/.test(txt())&&new RegExp(['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][M-1]+'.*'+Y).test(txt()),'mes y botón Volver');
 click(e,'volver');await sleep(10);ok(S.tab==='inicio'&&S.inicioSub==='dashboard','Volver regresa al Dashboard');
 // Gastos (gastos + facturas)
 H.irMovs(['_gastos','m:'+Y+'-'+pad(M)]);await sleep(10);
 ok(/2 movimientos/.test(list())&&/Gastos/.test(doc.querySelector('.mov-tipos .pill.active').textContent),'Gastos → gastos y facturas del mes (con «Gastos» marcado)');
 click(e,'setMovFiltro','Todos');await sleep(5);ok(/3 movimientos/.test(list()),'quitar el filtro de grupo');
 // Análisis mensual de junio
 e.w.__APP__.H.verMes(['2026','6']);await sleep(10);
 const bud=doc.querySelector('.gc-fila .gc-cab');ok(!!bud,'cada categoría se puede abrir');
 bud.click();await sleep(10);doc.querySelector('.gc-fila.abierta .gc-ver').click();await sleep(10);
 ok(S.movCat==='Ocio'&&S.movPeriodo==='m:2026-06'&&/1 movimiento/.test(list())&&/Junio.*2026/.test(txt()),'categoría Ocio en junio');
 click(e,'quitarMovCat');await sleep(5);ok(!S.movCat,'quitar la categoría');
 click(e,'volver');await sleep(10);ok(S.tab==='movimientos'&&S.movVista==='resumen'&&S.generalSub==='mensual','Volver regresa al Resumen');
 // Anual
 e.w.__APP__.H.verAnio([]);S.anioSel=2026;e.w.__APP__.H.irAnalisis(['general']);S.movPeriodo='y:2026';A.render();await sleep(10);
 click(e,'irMovs','_ahorro','y:2026');await sleep(10);ok(/1 movimiento/.test(list())&&/2026\s*el año entero/.test(txt()),'tasa de ahorro → ahorro e inversión del año');
 click(e,'volver');await sleep(10);
 click(e,'verMes','2026','6');await sleep(10);ok(S.generalSub==='mensual'&&S.mesSel===6,'tocar un mes del detalle anual abre ese mes');
 // Cambiar de pestaña a mano limpia el «Volver»
 H.irMovs(['Ingreso','todo']);await sleep(5);e.w.__APP__.H.goTab(['tareas']);e.w.__APP__.H.goTab(['movimientos']);await sleep(5);ok(!/Volver a/.test(txt()),'sin «Volver» al entrar a mano');
 // Patrimonio con saldo del banco (ahora en Dinero)
 e.w.__APP__.H.goTab(['dinero']);await sleep(10);e.w.__APP__.H.patToggle([]);await sleep(5);
 ok(/Añadir saldo/.test(txt()),'patrimonio invita a añadir el saldo del banco');
 click(e,'openCuentas');await sleep(5);click(e,'cuentaAnadir');await sleep(5);
 const ins=doc.querySelector('#fCuentaNombre');ins.value='Santander';ins.dispatchEvent(new e.w.Event('change',{bubbles:true}));await sleep(5);
 const ins2=doc.querySelector('#sheetHost .cuenta-ed input.amt');ins2.value='2500';ins2.dispatchEvent(new e.w.Event('change',{bubbles:true}));await sleep(5);
 click(e,'cuentasVolver');await sleep(5);click(e,'cuentasListo');await sleep(260);
 const c=e.store.cfg.app.cuentas;ok(c.length===1&&c[0].nombre==='Santander'&&c[0].saldo===2500&&c[0].fecha===hoy,'cuenta guardada con fecha de actualización');
 const p=A.patrimonio();ok(p.banco===2500&&p.total===2500-500&&p.ahorro===100&&p.ahorroDentro,'lo que tienes = banco − deudas; lo apartado (100) ya está dentro del banco y no se suma dos veces: '+p.total);
 ok(/Dinero en el banco/.test(txt())&&/2\.500,00 €/.test(txt()),'fila del banco en la tarjeta');
 // Hojas: botón ✕ y arrastrar hacia abajo
 click(e,'openCuentas');await sleep(5);ok(!!doc.querySelector('#sheetHost .sheet-x'),'las hojas tienen botón ✕');
 const sh=doc.querySelector('#sheetHost .sheet');const T=(type,y)=>{const ev=new e.w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(ev,'touches',{value:y==null?[]:[{clientY:y}]});sh.dispatchEvent(ev)};
 T('touchstart',100);T('touchmove',140);T('touchmove',260);ok(/translateY\(160px\)/.test(sh.style.transform),'la hoja sigue al dedo');T('touchend');console.log('   tras soltar:',sh.style.transform,!!doc.querySelector('#sheetBackdrop.open'));await sleep(300);
 console.log('   host:',doc.querySelector('#sheetHost').innerHTML.slice(0,200));ok(!doc.querySelector('#sheetHost .sheet'),'arrastrar hacia abajo la cierra');
 click(e,'openCuentas');await sleep(5);const sh2=doc.querySelector('#sheetHost .sheet');const T2=(type,y)=>{const ev=new e.w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(ev,'touches',{value:y==null?[]:[{clientY:y}]});sh2.dispatchEvent(ev)};
 T2('touchstart',100);T2('touchmove',150);T2('touchend');await sleep(300);ok(!!doc.querySelector('#sheetHost .sheet')&&sh2.style.transform==='','un arrastre corto no la cierra');
 click(e,'closeSheet');await sleep(250);
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
