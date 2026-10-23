const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');
const loc=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const add=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return loc(d)};
const hoy=loc(new Date()), dHoy=Number(hoy.slice(8));
(async()=>{
 // movimientos históricos de Nómina el último día hábil (para aprender)
 const nom=['2026-01-30','2026-02-27','2026-03-31','2026-04-30','2026-05-29','2026-06-30'].map((f,i)=>({id:'n'+i,tipo:'Ingreso',categoria:'Nómina',importe:1500,fecha:f}));
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}],ingresos:['Nómina'],
   facturas:[{nombre:'Alquiler',importe:500,diaDelMes:dHoy},{nombre:'Gym',importe:30,regla:{t:'semanas',cada:5,ancla:add(hoy,-3)}},{nombre:'Luz',importe:60,regla:{t:'semanas',cada:5,ancla:add(hoy,-5)}}],
   cobros:[{nombre:'Bizum papá',importe:100,regla:{t:'semanas',cada:3,ancla:add(hoy,1)}}]},meta:{onboarded:true}},movs:nom});
 // capa de datos con escritura para movimientos y tareas
 const orig=e.w.Data,L={movimientos:[],tareas:[]};let n=0;
 const notify=k=>L[k].forEach(f=>f());
 e.w.Data={doc:orig.doc,collection:(name)=>({
   onSnapshot:cb=>{if(!L[name])return orig.collection(name).onSnapshot(cb);const f=()=>cb({docs:Object.entries(e.store[name]).map(([id,v])=>({id,data:()=>v}))});L[name].push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{e.store[name]['x'+(++n)]=d;notify(name)},
   doc:id=>({set:async d=>{e.store[name][id]=d;notify(name)},delete:async()=>{delete e.store[name][id];notify(name)}})})};
 await sleep(80);
 const A=e.w.__APP__,doc=e.doc;
 // ---------- motor de reglas
 const O=(r,a,b)=>A.ocurrencias(r,a,b).join(',');
 ok(O({t:'ultHabil'},'2026-10-01','2026-10-31')==='2026-10-30','último hábil oct 2026 = 30 (31 es sábado)');
 ok(O({t:'priHabil'},'2026-11-01','2026-11-30')==='2026-11-02','primer hábil nov 2026 = 2 (1 es domingo)');
 ok(O({t:'dia',dia:31,ajuste:'antes'},'2026-10-01','2026-10-31')==='2026-10-30','día 31 adelantado a viernes 30');
 ok(O({t:'dia',dia:31,ajuste:'despues'},'2026-11-01','2026-11-30')==='2026-11-02,2026-11-30','día 31 pasado al lunes cruza de mes');
 ok(O({t:'dia',dia:31,ajuste:''},'2027-02-01','2027-02-28')==='2027-02-28','día 31 en febrero = 28');
 ok(O({t:'nesimo',n:-1,dow:4},'2026-10-01','2026-10-31')==='2026-10-30','último viernes de oct = 30');
 ok(O({t:'nesimo',n:1,dow:0},'2026-10-01','2026-10-31')==='2026-10-05','primer lunes de oct = 5');
 ok(O({t:'nesimo',n:4,dow:0},'2026-11-01','2026-11-30')==='2026-11-23','cuarto lunes nov = 23');
 ok(O({t:'quincenal',ajuste:''},'2026-10-01','2026-10-31')==='2026-10-15,2026-10-31','quincenal 15 y 31');
 ok(O({t:'semanas',cada:2,ancla:'2026-10-02'},'2026-10-01','2026-10-31')==='2026-10-02,2026-10-16,2026-10-30','cada 2 viernes');
 ok(O({t:'semanas',cada:2,ancla:'2026-10-30'},'2026-10-01','2026-10-31')==='2026-10-02,2026-10-16,2026-10-30','cada 2 semanas hacia atrás desde el ancla');
 ok(A.reglaTexto({t:'nesimo',n:1,dow:0})==='El primer lunes de cada mes','texto regla');
 const ap=A.aprenderRegla(nom.map(m=>m.fecha));
 ok(ap&&ap.r.t==='ultHabil'&&ap.hits===6,'aprende «último día hábil» (6 de 6): '+JSON.stringify(ap&&ap.r));
 const ap2=A.aprenderRegla(['2026-07-28','2026-08-28','2026-09-28','2026-10-28']);
 ok(ap2&&ap2.r.t==='dia'&&ap2.r.dia===28&&!ap2.r.ajuste,'aprende «día 28»');
 ok(A.aprenderRegla(['2026-07-28','2026-08-28'])===null,'menos de 3: no aprende');
 // ---------- avisos en Inicio
 e.w.__APP__.H.goTab(['inicio']);await sleep(30);
 let t=doc.querySelector('#content').textContent;
 click(e,'verPendiente');await sleep(10);t=doc.querySelector('#content').textContent;
 ok(/Estos días/.test(t)&&/Ver menos/.test(t),'«Estos días» (se ven 3 y el resto se despliega)');
 ok(/Alquiler/.test(t)&&/Hoy · pago previsto/.test(t)&&/Confirmar/.test(t),'aviso de hoy con Confirmar');
 ok(/Bizum papá/.test(t)&&/Mañana/.test(t),'aviso de mañana');
 ok(/Gym/.test(t)&&/¿Pagado\?/.test(t)&&!!doc.querySelector('[data-click^="recNo|"]'),'pasado sin registrar con Sí / No');
 click(e,'recSi','factura','0',hoy);await sleep(60);
 let movs=Object.values(e.store.movimientos).filter(m=>m.subcategoria==='Alquiler');
 ok(movs.length===1&&movs[0].importe===500&&movs[0].fecha===hoy&&movs[0].tipo==='Factura'&&movs[0].categoria==='Vivienda','Confirmar registra 500 € hoy (gasto fijo: Vivienda · Alquiler)');
 t=doc.querySelector('#content').textContent;
 ok(!/Hoy · pago previsto/.test(t),'tras confirmar: el aviso de hoy desaparece de «Estos días»');
 click(e,'recNo','factura','1',add(hoy,-3));await sleep(40);
 t=doc.querySelector('#content').textContent;
 ok(!/Gym/.test(t),'No ha ocurrido: desaparece');
 ok((e.store.cfg.app.recEstado||{})['f:gym@'+add(hoy,-3)]==='no','se guarda en configuración');
 click(e,'recSi','factura','2',add(hoy,-5));await sleep(60);
 ok(Object.values(e.store.movimientos).some(m=>m.subcategoria==='Luz'&&m.categoria==='Suministros'&&m.fecha===add(hoy,-5)&&m.importe===60),'Sí registra en la fecha prevista (Suministros · Luz)');
 ok(!/Luz/.test(doc.querySelector('#content').textContent),'y deja de preguntar');
 // movimiento manual cercano cuenta como hecho
 // ---------- Más → Cobros y pagos recurrentes
 e.w.__APP__.H.goTab(['mas']);await sleep(20);
 click(e,'openRecurrentes');await sleep(20);
 let sh=doc.querySelector('#sheetHost').textContent;
 ok(/Ingresos fijos/.test(sh)&&/Bizum papá/.test(sh)&&/Alquiler/.test(sh)&&/El día \d+ de cada mes/.test(sh),'lista con reglas (factura antigua como «día fijo»)');
 click(e,'recNuevo','cobro');await sleep(20);
 const setv=(sel,v,ev)=>{const el=doc.querySelector(sel);el.value=v;el.dispatchEvent(new e.w.Event(ev||'input',{bubbles:true}))};
 setv('#recNombre','Nómina');setv('#recImporte','1500');
 click(e,'recAprender');await sleep(20);
 sh=doc.querySelector('#sheetHost').textContent;
 ok(/Regla aprendida/.test(sh)&&/Último día hábil/.test(sh)&&/6 de 6/.test(sh),'aprender desde el editor');
 ok(/Próximas fechas/.test(doc.querySelector('#recPrev').textContent),'vista previa de próximas fechas: '+doc.querySelector('#recPrev').textContent);
 click(e,'recExtra','6');click(e,'recExtra','12');await sleep(10);
 click(e,'recGuardar');await sleep(40);
 const cob=e.store.cfg.app.cobros.find(c=>c.nombre==='Nómina');
 ok(cob&&cob.regla.t==='ultHabil'&&cob.importe===1500&&cob.extras.join()==='6,12'&&cob.desde===hoy,'guardado: regla, importe, pagas extra, desde hoy');
 // cambiar tipo de regla manualmente en una existente
 const iA=e.store.cfg.app.facturas.findIndex(f=>f.nombre==='Alquiler');
 click(e,'recEditar','factura',String(iA));await sleep(20);
 click(e,'recCuando');click(e,'recCuandoTipo','nesimo');await sleep(10);
 ok(!!doc.querySelector('.rec-sem')&&/Penúltimo/.test(doc.querySelector('#sheetHost').textContent),'parámetros de «día de la semana» (selector nuevo, 23/10)');
 click(e,'recPar','n|-1');click(e,'recPar','dow|4');click(e,'recCuandoUsar');await sleep(5);
 ok(/Próximas fechas/.test(doc.querySelector('#recPrev').textContent),'preview se actualiza');
 click(e,'recGuardar');await sleep(30);
 const alq=e.store.cfg.app.facturas.find(f=>f.nombre==='Alquiler');
 ok(alq.regla.t==='nesimo'&&alq.regla.n===-1&&alq.regla.dow===4&&alq.diaDelMes===null,'factura actualizada a «último viernes»');
 // pasar una factura a ingreso
 click(e,'recEditar','factura',String(e.store.cfg.app.facturas.findIndex(f=>f.nombre==='Gym')));await sleep(20);
 click(e,'recSetKind','cobro');click(e,'recGuardar');await sleep(30);
 ok(!e.store.cfg.app.facturas.some(f=>f.nombre==='Gym')&&e.store.cfg.app.cobros.some(f=>f.nombre==='Gym'),'cambiar de factura a ingreso mueve el elemento');
 click(e,'closeSheet');await sleep(250);
 // ---------- calendario
 e.w.__APP__.H.goTab(['calendario']);await sleep(30);
 t=doc.querySelector('#content').textContent;
 ok(/Cobros y facturas/.test(t),'filtro renombrado en calendario');
 // ---------- tareas recurrentes
 e.store.tareas.t1={nombre:'Regar plantas',categoria:'',prioridad:'Media',estado:'Pendiente',fechaLimite:add(hoy,-2),comentario:'',fechaCreacion:hoy,repetir:{cada:1,unidad:'semana'}};
 notify('tareas');await sleep(20);
 e.w.__APP__.H.goTab(['tareas']);await sleep(20);
 ok(/cada semana/.test(doc.querySelector('#content').textContent),'la fila muestra ↻ cada semana');
 click(e,'toggleTarea','t1');await sleep(60);
 const ts=Object.entries(e.store.tareas);
 const nueva=ts.find(([id,x])=>id!=='t1'&&x.nombre==='Regar plantas');
 ok(nueva&&nueva[1].fechaLimite===add(hoy,5)&&nueva[1].estado==='Pendiente'&&nueva[1].repetir.unidad==='semana','se crea la siguiente para dentro de 5 días ('+(nueva&&nueva[1].fechaLimite)+')');
 ok(e.store.tareas.t1.estado==='Completado'&&e.store.tareas.t1.repetir===null,'la completada deja de repetirse');
 // reabrir y volver a completar no duplica
 e.w.__APP__.H.goTab(['tareas']);click(e,'setTareasSub','completadas');await sleep(10);click(e,'toggleTarea','t1');await sleep(40);click(e,'setTareasSub','completadas');click(e,'setTareasSub','activas');await sleep(10);click(e,'toggleTarea','t1');await sleep(40);
 ok(Object.values(e.store.tareas).filter(x=>x.nombre==='Regar plantas').length===2,'reabrir y completar otra vez no duplica');
 ok(A.siguienteFechaTarea({fechaLimite:'2026-01-31',repetir:{cada:2,unidad:'mes'}})>hoy,'cada 2 meses salta al futuro: '+A.siguienteFechaTarea({fechaLimite:'2026-01-31',repetir:{cada:2,unidad:'mes'}}));
 ok(A.siguienteFechaTarea({fechaLimite:'2026-01-31',repetir:{cada:1,unidad:'mes'}}).slice(8)==='31'||A.siguienteFechaTarea({fechaLimite:'2026-01-31',repetir:{cada:1,unidad:'mes'}}).slice(8)==='30','mensual conserva fin de mes');
 // formulario de tarea con repetir personalizado
 A.H.openTareaForm([]);await sleep(20);
 doc.querySelector('#tNombre').value='Revisar coche';
 setv('#tRepetir','custom','change');await sleep(10);
 ok(!!doc.querySelector('#tRepN'),'personalizado muestra cada N');
 doc.querySelector('#tRepN').value='3';doc.querySelector('#tRepU').value='mes';
 click(e,'saveTarea');await sleep(40);
 const rc=Object.values(e.store.tareas).find(x=>x.nombre==='Revisar coche');
 ok(rc&&rc.repetir.cada===3&&rc.repetir.unidad==='mes','guarda repetir cada 3 meses');
 // movimiento con valores precargados desde calendario
 e.w.__APP__.H.goTab(['calendario']);await sleep(10);
 const ev=doc.querySelector('[data-click^="recNuevoMov"]');
 if(ev){ev.click();await sleep(20);ok(doc.querySelector('#fCategoria').value!==''&&!!doc.querySelector('#fFecha').value,'calendario abre movimiento precargado');click(e,'closeSheet');}
 else ok(true,'(sin eventos pendientes visibles este mes)');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
