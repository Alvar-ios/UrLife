// Arreglos rápidos de la fase 1 (13/10)
const {makeEnv,sleep}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),ym=d.getFullYear()+'-'+pad(d.getMonth()+1);
(async()=>{
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:300}],ahorro:[{id:'mC',nombre:'Colchón',objetivo:1000}]},meta:{onboarded:true}},
  movs:[{id:'g1',tipo:'Gasto',categoria:'Supermercado',importe:100,fecha:ym+'-02'},{id:'g2',tipo:'Factura',categoria:'Vivienda',subcategoria:'Alquiler',importe:850,fecha:ym+'-02'},
        {id:'a1',tipo:'Ahorro',categoria:'Colchón',metaId:'mC',importe:200,fecha:ym+'-02'},{id:'a2',tipo:'Ahorro',categoria:'Colchón',metaId:'mC',importe:50,fecha:ym+'-01'},
        {id:'i1',tipo:'Ingreso',categoria:'Nómina',importe:3240,fecha:ym+'-01'}]});
 await sleep(100);
 const A=e.w.__APP__,H=A.H,doc=e.doc,txt=()=>doc.querySelector('#content').textContent;
 // números con separador de miles
 ok(/\+3\.240,00 €/.test((H.goTab(['movimientos']),txt())),'4 cifras con punto de miles: +3.240,00 €');
 // Apartar en Movimientos
 const fila=[...doc.querySelectorAll('#movList .row')].find(r=>/Colchón/.test(r.textContent)&&/200,00/.test(r.textContent));
 const amt=fila.querySelector('.amt');
 ok(amt.classList.contains('sav')&&!amt.classList.contains('neg')&&/→\s*200,00 €/.test(amt.textContent)&&!/−/.test(amt.textContent),'Apartar: color de ahorro y flecha, sin signo menos ('+amt.textContent+')');
 const seps=[...doc.querySelectorAll('.date-sep')].map(s=>s.textContent);
 ok(seps.some(s=>/−950,00 €/.test(s)),'el total del día no resta lo apartado: −950 (100 + 850), no −1.150 ('+seps.join(' | ')+')');
 ok(seps.some(s=>/\+3\.240,00 €/.test(s)),'el día con nómina y un apartado suma solo la nómina');
 ok(/balance \+2\.290,00 €/.test(txt())&&/apartado e invertido 250,00 €/.test(txt()),'resumen: balance sin lo apartado y lo apartado aparte');
 // Presupuestos
 H.irResumen([]);await sleep(20);
 const res=doc.querySelector('.budget-row').closest('.card').querySelector('.summary-line').textContent;
 ok(/En lo presupuestado llevas 100,00 € de 300,00 € · quedan 200,00 €/.test(res)&&/Sin presupuesto: 850,00 €/.test(res),'presupuestos: compara solo lo presupuestado ('+res+')');
 // Inicio: rótulos
 H.goTab(['inicio']);await sleep(10);
 ok(/Apartado e invertido/.test(doc.querySelector('.hero-tiles').textContent)&&!/Ahorro/.test(doc.querySelector('.hero-tiles').textContent),'Inicio: «Apartado e invertido» en lugar de «Ahorro»');
 H.verAnio([]);await sleep(20);
 ok(/\d+ %Apartado \/ ingresos/.test(txt())&&!/Tasa de ahorro/.test(txt()),'año: frase de lo apartado sobre lo ingresado');
 // Tú: tema dentro de la tarjeta
 H.goTab(['tu']);await sleep(10);
 ok(!!doc.querySelector('.tema-seg')&&doc.querySelectorAll('.tema-seg button').length===3,'Tema con su selector propio');
 ok(doc.querySelectorAll('#content .badge-new').length<=3,'como mucho 3 etiquetas NUEVO a la vez');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
