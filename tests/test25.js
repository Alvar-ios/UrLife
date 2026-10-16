// Categorías estándar (12/10): estándar fijas, personalizadas con aviso, gasto fijo, detalle (subcategoría)
const {makeEnv,sleep,click,change}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),ym=d.getFullYear()+'-'+pad(d.getMonth()+1);
(async()=>{
 let added=[];
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:300},{nombre:'Golf',presupuesto:null}],facturas:[{nombre:'Spotify',importe:11,diaDelMes:5}],metodosPago:['Tarjeta']},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Gasto',categoria:'Salud y cuidado personal',subcategoria:'Uñas',importe:30,fecha:ym+'-01'},
         {id:'b',tipo:'Gasto',categoria:'Salud y cuidado personal',subcategoria:'Pelu',importe:20,fecha:ym+'-01'},
         {id:'c',tipo:'Factura',categoria:'Spotify',importe:11,fecha:ym+'-01'},           // factura antigua: categoría = recibo
         {id:'d',tipo:'Gasto',categoria:'Supermercado',importe:50,fecha:ym+'-02'}],
   pre:w=>{const base=w.Data;w.Data={doc:base.doc,collection:n=>{const c=base.collection(n);if(n!=='movimientos')return c;return Object.assign({},c,{add:async v=>{added.push(v)},doc:id=>({set:async v=>{added.push(Object.assign({id},v))}})})}};}});
 await sleep(80);
 const A=e.w.__APP__,H=A.H,doc=e.doc,sh=()=>doc.querySelector('#sheetHost').textContent;
 // lista de categorías
 const nombres=A.S.movimientos?null:null;
 H.openListEditor(['categoriasGasto']);await sleep(10);
 ok(doc.querySelectorAll('#sheetHost .cat-std-row .cn b').length===16,'16 estándar en el editor');
 ok([...doc.querySelectorAll('#sheetHost .cat-std-row')].filter(r=>r.querySelector('.cn b')).every(r=>!r.querySelector('.rm')),'las estándar no se pueden quitar');
 ok(!!doc.querySelector('[data-click="catQuitar|Golf"]')&&/no podrás compartir gastos/.test(sh()),'personalizadas con botón de quitar y aviso');
 change(e,doc.querySelector('[data-change="catPres|Ocio"]'),'80');await sleep(5);
 ok(e.store.cfg.app.categoriasGasto.some(c=>c.nombre==='Ocio'&&c.presupuesto===80),'presupuesto de una estándar se guarda');
 doc.querySelector('#catNuevaIn').value='gimnasio';click(e,'catNueva');await sleep(5);
 ok(!e.store.cfg.app.categoriasGasto.some(c=>/gimnasio/i.test(c.nombre))&&/ya está entre las estándar/.test(doc.querySelector('#toast').textContent),'«gimnasio» no se crea: es Deporte');
 doc.querySelector('#catNuevaIn').value='Pádel';click(e,'catNueva');await sleep(60);
 ok(e.store.cfg.app.categoriasGasto.some(c=>c.nombre==='Pádel'),'personalizada nueva añadida');
 H.closeSheet([]);await sleep(250);
 // factura antigua → categoría estándar + recibo como detalle
 const c=A.S.movimientos.find(m=>m.id==='c');
 ok(c.categoria==='Suscripciones'&&c.subcategoria==='Spotify','factura antigua «Spotify» se ve como Suscripciones · Spotify');
 // formulario
 H.openMovForm([]);await sleep(10);
 const tipos=[...doc.querySelectorAll('#tipoToggle button')].map(b=>b.textContent);
 ok(tipos.join()==='Ingreso,Gasto,Apartar,Inversión,Deuda','tipos sin «Factura» ('+tipos.join()+')');
 ok(!!doc.querySelector('[data-click="pickFijo|1"]')&&/Detalle/.test(sh()),'Gasto: «Del día a día / Fijo · recibo» y campo de detalle');
 click(e,'pickCat','Salud y cuidado personal');await sleep(5);
 ok([...doc.querySelectorAll('#subChips .chip')].map(b=>b.textContent).join()==='Uñas,Pelu'||[...doc.querySelectorAll('#subChips .chip')].map(b=>b.textContent).join()==='Pelu,Uñas','al elegir categoría, salen sus detalles usados');
 click(e,'pickSub','Uñas');doc.querySelector('#fImporte').value='25';
 click(e,'saveMov');await sleep(30);
 ok(added.some(v=>v.categoria==='Salud y cuidado personal'&&v.subcategoria==='Uñas'&&v.tipo==='Gasto'&&v.importe===25),'guarda categoría + detalle');
 H.openMovForm([]);await sleep(10);
 click(e,'pickFijo','1');await sleep(5);
 ok(/¿Qué recibo es\?/.test(sh()),'fijo: pregunta qué recibo es');
 click(e,'pickCat','Suscripciones');await sleep(5);
 ok([...doc.querySelectorAll('#subChips .chip')].some(b=>b.textContent==='Spotify'),'fijo en Suscripciones: propone «Spotify»');
 click(e,'pickSub','Spotify');doc.querySelector('#fImporte').value='11';click(e,'saveMov');await sleep(30);
 ok(added.some(v=>v.tipo==='Factura'&&v.categoria==='Suscripciones'&&v.subcategoria==='Spotify'),'gasto fijo: tipo Factura, Suscripciones · Spotify');
 // personalizada nueva desde el formulario: aviso y se añade
 H.openMovForm([]);await sleep(10);
 const inp=doc.querySelector('#fCategoria');inp.value='Cosas raras';inp.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/será una categoría personalizada nueva/.test(doc.querySelector('#catAviso').textContent)&&/no podrás compartir/.test(doc.querySelector('#catAviso').textContent),'aviso al escribir una categoría que no existe');
 inp.value='Restaurantes y bares';inp.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(5);
 ok(doc.querySelector('#catAviso').textContent==='','con una estándar no hay aviso');
 inp.value='Cosas raras';doc.querySelector('#fImporte').value='5';click(e,'saveMov');await sleep(60);
 ok(e.store.cfg.app.categoriasGasto.some(c=>c.nombre==='Cosas raras'),'al guardar, la personalizada nueva queda en tu lista');
 // chips: 8 + «Más»
 H.openMovForm([]);await sleep(10);
 ok(doc.querySelectorAll('#catChips .chip:not(.chip-mas)').length===8&&/Más \(\d+\)/.test(doc.querySelector('.chip-mas').textContent),'8 categorías a la vista (las que más usas) y «Más»');
 click(e,'catMas');await sleep(5);
 ok(doc.querySelectorAll('#catChips .chip:not(.chip-mas)').length>=18,'«Más» enseña todas');
 H.closeSheet([]);await sleep(250);
 // análisis: los fijos cuentan; las vacías escondidas
 H.irResumen([]);await sleep(10);
 const filas=[...doc.querySelectorAll('.budget-row .cat')].map(x=>x.textContent);
 ok(filas.includes('Suscripciones')&&filas.includes('Salud y cuidado personal'),'presupuestos: incluyen los gastos fijos (Suscripciones)');
 ok(!filas.includes('Mascotas')&&/Ver \d+ categorías sin gasto/.test(doc.querySelector('#content').textContent),'las que están a 0 se esconden tras un botón');
 click(e,'presTodas');await sleep(5);ok([...doc.querySelectorAll('.budget-row .cat')].some(x=>x.textContent==='Mascotas'),'y se pueden ver');
 // movimientos: Gastos incluye fijos; dentro de una categoría, chips de detalle
 H.goTab(['movimientos']);H.setMovVista(['lista']);await sleep(5);click(e,'setMovFiltro','_gastos');await sleep(5);
 ok(/4 movimientos/.test(doc.querySelector('#content').textContent),'«Gastos» incluye los fijos');
 click(e,'setMovFiltro','Factura');await sleep(5);ok(/1 movimiento\b/.test(doc.querySelector('#content').textContent),'«Fijos» solo los fijos');
 click(e,'setMovFiltro','Todos');H.irMovs(['_gastos',ym.replace(/^/,'m:'),'Salud y cuidado personal']);await sleep(5);
 ok(!!doc.querySelector('[data-click="setMovSub|U%C3%B1as"]'),'dentro de la categoría, chips de detalle');
 click(e,'setMovSub','Uñas');await sleep(5);ok(/1 movimiento\b/.test(doc.querySelector('#content').textContent),'filtrar por «Uñas»');
 console.log(fails?'FAILS '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(err=>{console.error(err);process.exit(1)});
