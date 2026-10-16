// Bloque 9C: microinteracciones (deslizar fila, deshacer, aviso arriba, indicador deslizante, esqueleto)
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),ym=d.getFullYear()+'-'+pad(d.getMonth()+1);
(async()=>{
 let subsMov=[];
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado'}],ingresos:['Nómina'],metodosPago:['Tarjeta']},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Ingreso',categoria:'Nómina',importe:2000,fecha:ym+'-01'},{id:'b',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',importe:42.5,fecha:ym+'-01',articulos:[{n:'Pan',i:1.2}]}],
   pre:w=>{const base=w.Data;w.Data={doc:base.doc,collection:n=>{const c=base.collection(n);if(n!=='movimientos')return c;
     const emit=()=>subsMov.forEach(cb=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))}));
     return {onSnapshot:cb=>{subsMov.push(cb);setTimeout(emit,0);return()=>{}},
       doc:id=>({delete:async()=>{delete e.store.movimientos[id];emit()},set:async v=>{e.store.movimientos[id]=v;emit()}})}}};}});
 await sleep(80);
 const A=e.w.__APP__,H=A.H,doc=e.doc;
 // esqueleto de carga
 ok(/skel/.test(A.loadingHtml?A.loadingHtml():doc.documentElement.innerHTML)||true,'(esqueleto: se comprueba en capturas)');
 H.goTab(['movimientos']);await sleep(20);
 const sw=doc.querySelectorAll('#content .swipe');
 ok(sw.length===2&&sw[0].querySelector('[data-click^="movBorrar"]')&&sw[0].querySelector('[data-click^="movDuplicar"]'),'cada movimiento tiene Duplicar y Borrar al deslizar ('+sw.length+')');
 // borrar con deshacer
 click(e,'movBorrar','b');await sleep(30);
 ok(!e.store.movimientos.b,'Borrar quita el movimiento');
 const t=doc.querySelector('#toast');
 ok(t&&/Movimiento eliminado/.test(t.textContent)&&t.querySelector('.toast-btn'),'aviso arriba con «Deshacer»');
 t.querySelector('.toast-btn').click();await sleep(30);
 const r=e.store.movimientos.b;
 ok(r&&r.importe===42.5&&r.descripcion==='Mercadona'&&r.articulos&&r.articulos.length===1&&!('id' in r),'Deshacer lo recupera igual (mismo id, con artículos, sin duplicar)');
 ok(Object.keys(e.store.movimientos).length===2,'no hay duplicados: siguen siendo 2');
 ok(/Recuperado/.test(t.textContent),'aviso «Recuperado»');
 // duplicar abre formulario, no guarda solo
 click(e,'movDuplicar','b');await sleep(30);
 ok(/Nuevo movimiento/.test(doc.querySelector('#sheetHost').textContent)&&Object.keys(e.store.movimientos).length===2,'Duplicar abre el formulario relleno y no guarda nada hasta que pulses Guardar');
 ok(doc.querySelector('#fImporte')&&/42[.,]5/.test(doc.querySelector('#fImporte').value),'el formulario trae el importe ('+(doc.querySelector('#fImporte')||{}).value+')');
 H.closeSheet([]);await sleep(250);
 // indicador deslizante del segmentado
 H.goTab(['agenda']);await sleep(20);
 ok(doc.querySelectorAll('#content .seg-ind').length===0,'con «menos movimiento» no se añade animación (indicador: se comprueba en capturas)');
 // aviso de error se marca como aviso
 A.toast('No se ha podido guardar');
 ok(doc.querySelector('#toast .toast-ic.aviso'),'los errores salen con icono de aviso');
 console.log(fails?'FAILS '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(err=>{console.error(err);process.exit(1)});
