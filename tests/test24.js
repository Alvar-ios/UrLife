// Pruebas de uso (12/10): Empieza aquí, metas vacías, meses abreviados, lista sin «Gasto», buscador con total del mes
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),ym=d.getFullYear()+'-'+pad(d.getMonth()+1);
(async()=>{
 const v=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:300}]},meta:{onboarded:true}}});
 await sleep(80);
 let A=v.w.__APP__,doc=v.doc,txt=()=>doc.querySelector('#content').textContent;
 ok(/Empieza aquí/.test(txt())&&doc.querySelectorAll('.empieza-paso').length===2,'usuario nuevo: «Empieza aquí» con sus dos primeros pasos');
 click(v,'crearIr','gasto');await sleep(20);ok(/Nuevo movimiento/.test(doc.querySelector('#sheetHost').textContent),'«Apunta tu primer gasto» abre el formulario');
 A.H.closeSheet([]);await sleep(250);
 A.H.goTab(['movimientos']);await sleep(10);
 ok(!/Ver todo el historial/.test(txt())&&/Apunta el primero/.test(txt()),'Movimientos vacío: sin «Ver todo el historial» y con pista');
 A.H.goTab(['dinero']);A.H.setDineroSub(['metas']);await sleep(10);
 ok(!!doc.querySelector('[data-click="metaNueva"]')&&/Crear mi primera meta/.test(txt()),'metas vacías: botón «Crear mi primera meta»');
 A.H.verAnio([]);await sleep(10);
 ok(!/1,00 €/.test(doc.querySelector('#trendWrap').textContent),'gráfico anual vacío: sin escala de 1,00 €');
 ok(doc.querySelector('.anio-fila .mes-l').textContent==='Enero'&&doc.querySelector('.anio-fila .mes-c').textContent.length<=4,'meses en largo y en corto (para pantallas pequeñas)');

 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado'}],metodosPago:['Tarjeta']},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',metodoPago:'Tarjeta',importe:40,fecha:ym+'-01'},
         {id:'b',tipo:'Gasto',categoria:'Supermercado',importe:10,fecha:ym+'-02'},
         {id:'c',tipo:'Factura',categoria:'Luz',descripcion:'Iberdrola',importe:60,fecha:ym+'-03'}]});
 await sleep(80);A=e.w.__APP__;doc=e.doc;
 ok(!/Empieza aquí/.test(doc.querySelector('#content').textContent),'con movimientos ya no sale «Empieza aquí»');
 A.H.goTab(['movimientos']);await sleep(10);
 const metas=[...doc.querySelectorAll('#movList .row .meta')].map(x=>x.textContent);
 ok(metas.includes('Mercadona · Tarjeta')&&metas.includes('Gasto')&&metas.includes('Luz · Iberdrola · Fijo'),'lista: «Gasto» solo cuando no hay nada más; los fijos dicen su recibo y «Fijo» ('+metas.join(' | ')+')');
 A.H.openBuscar([]);await sleep(10);const q=doc.querySelector('#qBuscar');q.value='super';q.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(10);
 ok(/Este mes: 50,00 €/.test(doc.querySelector('#sheetHost').textContent),'buscador: «Supermercado · Este mes: 50,00 €»');
 console.log(fails?'FAILS '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(err=>{console.error(err);process.exit(1)});
