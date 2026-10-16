const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const day=(o)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10)};
(async()=>{
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}],ahorro:[{nombre:'Viaje',objetivo:1000,fechaObjetivo:day(200)}],
   deudas:[{nombre:'Coche',objetivo:6000,fechaObjetivo:day(300)},{nombre:'Hipoteca',objetivo:100000},{nombre:'Vieja',objetivo:100,fechaObjetivo:day(-10)}]},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Deuda',categoria:'coche ',importe:2000,fecha:day(-20)},{id:'b',tipo:'Deuda',categoria:'Coche',importe:400,fecha:day(-10)},
         {id:'c',tipo:'Deuda',categoria:'Vieja',importe:100,fecha:day(-40)}]});
 await sleep(60);
 const S=e.w.__APP__.S,doc=e.doc,c=()=>doc.querySelector('#content'),txt=()=>c().textContent;
 e.w.__APP__.H.goTab(['dinero']);
 const bar=()=>[...doc.querySelectorAll('.chips-nav button')].map(b=>b.textContent).join('|');
 ok(/Metas\|Inversiones\|Deudas/.test(bar())&&!/Compartido/.test(bar()),'Dinero: Metas, Inversiones, Deudas (lo compartido tiene su pestaña) -> '+bar());
 ok(!/Proyectos/.test(bar())&&!/Golf/.test(txt()),'Proyectos oculto');
 S.dineroSub='proyectos';e.w.__APP__.render();
 ok(!/Golf/.test(txt())&&/Viaje/.test(txt()),'apartado desconocido cae en Metas');
 // Deudas
 e.w.__APP__.H.setAnalisisSub(['deudas']);
 let t=txt();
 ok(/Coche/.test(t)&&/Hipoteca/.test(t)&&/Vieja/.test(t),'lista deudas');
 ok(/2400,00 €|2\.400,00 €/.test(t),'Coche pagado 2400 (nombre insensible a mayúsc/espacios)');
 ok(/40%/.test(t),'Coche 40%');
 ok(/Deuda saldada/.test(t),'Vieja saldada');
 ok(/Sin fecha objetivo/.test(t),'Hipoteca sin fecha');
 ok(/Cuota necesaria/.test(t),'Coche cuota necesaria');
 // pendiente total = 3600 + 100000 + 0
 ok(/103\.?600/.test(t.replace(/\s/g,''))||/103,?6/.test(t),'pendiente total ~103600 -> '+(t.match(/Pendiente[^A-Z]{0,20}/)||[''])[0]);
 // inflación
 e.w.__APP__.H.setAnalisisSub(['inversiones']);t=txt();
 ok(/4,90 %/.test(t)&&/INE/.test(t)&&/septiembre de 2026/.test(t)&&/8 de octubre de 2026|8 oct/.test(t),'inflación España con fuente, periodo y fecha');
 click(e,'setInflacion','ue');await sleep(30);ok(/3,80 %/.test(txt())&&/Eurostat/.test(txt()),'zona euro');
 click(e,'setInflacion','mundo');await sleep(30);ok(/4,70 %/.test(txt())&&/FMI/.test(txt()),'mundo');
 ok(e.store.cfg.app.inflacionRegion==='mundo'&&e.store.cfg.app.deudas.length===3,'región guardada sin tocar el resto');
 ok(!doc.querySelector('[data-click^="openInflacion"]'),'sin entrada manual');
 // elegir pestañas desde la página de análisis
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.goMetas([]);ok(S.tab==='dinero'&&/Viaje/.test(txt()),'goMetas ok');
 // otra cuenta: por defecto todo visible
 const e2=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs:[]});await sleep(60);
 e2.w.__APP__.H.goTab(['dinero']);ok(/Metas\|Inversiones\|Deudas/.test([...e2.doc.querySelectorAll('.chips-nav button')].map(b=>b.textContent).join('|')),'cuenta nueva: todo visible');
 e2.w.__APP__.H.setAnalisisSub(['deudas']);ok(/Todavía no tienes deudas/.test(e2.doc.querySelector('#content').textContent),'vacío deudas');
 console.log(fails?'FAILED '+fails:'ALL PASS');
})().catch(x=>{console.error(x);process.exit(1)});
