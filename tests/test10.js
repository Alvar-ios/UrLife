const {makeEnv,sleep,click}=require('./harness.js');
const XLSX=require('xlsx');const {TextDecoder}=require('util');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const file=(name,buf)=>({name,size:buf.byteLength,arrayBuffer:async()=>buf});
const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
(async()=>{
 const movs=[{id:'m1',tipo:'Gasto',categoria:'Alimentación',importe:50,fecha:'2026-08-02',descripcion:'MERCADONA VALENCIA'},
   {id:'m2',tipo:'Gasto',categoria:'Alimentación',importe:20,fecha:'2026-08-09',descripcion:'Mercadona'},
   {id:'m3',tipo:'Gasto',categoria:'Ocio',importe:45.2,fecha:'2026-09-05',descripcion:'cena'}];
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Alimentación'},{nombre:'Ocio'},{nombre:'Restaurantes'},{nombre:'Suscripciones'}],ingresos:['Nómina'],facturas:[{nombre:'Netflix',importe:12.99,diaDelMes:10}],
   reglasCat:[{texto:'spotify',categoria:'Suscripciones',tipo:'Gasto'}]},meta:{onboarded:true}},movs,
   session:{user:{email:'t@t.com',id:'u-123'}},
   pre:w=>{w.XLSX=XLSX;w.TextDecoder=TextDecoder;}});
 const orig=e.w.Data,L=[];let n=0;const notify=()=>L.forEach(f=>f());
 e.w.Data={doc:orig.doc,collection:(name)=>name!=='movimientos'?orig.collection(name):({
   onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))});L.push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{e.store.movimientos['x'+(++n)]=d;notify()},
   bulkInsert:async items=>{items.forEach(it=>{if(!e.store.movimientos[it.id])e.store.movimientos[it.id]=it.data});notify();return items.length},
   deleteWhere:async(f,v)=>{Object.keys(e.store.movimientos).forEach(k=>{if(e.store.movimientos[k][f]===v)delete e.store.movimientos[k]});notify()},
   doc:id=>({set:async d=>{e.store.movimientos[id]=d;notify()},delete:async()=>{delete e.store.movimientos[id];notify()}})})};
 await sleep(80);
 const A=e.w.__APP__,H=A.H,doc=e.doc,S=A.S;
 const sh=()=>doc.querySelector('#sheetHost').textContent;
 // ---------- utilidades
 const P=A.parseNum;
 ok(P('1.234,56')===1234.56&&P('-32,40')===-32.4&&P('1,234.56')===1234.56&&P('(12.50)')===-12.5&&P('12,5 €')===12.5&&P('45-')===-45&&P('abc')===null&&P(7)===7,'números en formato español e inglés');
 const F=A.parseFechaImp;
 ok(F('03/09/2026','dmy')==='2026-09-03'&&F('2026-09-03')==='2026-09-03'&&F('09/03/2026','mdy')==='2026-09-03'&&F(46266)==='2026-09-01'&&F('31/02/2026','dmy')===null&&F('3-9-26','dmy')==='2026-09-03','fechas (texto, ISO, serie de Excel, inválidas)');
 // ---------- CSV de banco (; , coma decimal, Windows-1252, filas de cabecera previas)
 const csv=['Movimientos de la cuenta ES12 3456;;;;','','Fecha;Fecha valor;Concepto;Importe;Saldo',
  '03/09/2026;03/09/2026;COMPRA TARJ. MERCADONA ALICANTE;-32,40;1.234,56',
  '05/09/2026;05/09/2026;PAGO BIZUM A JUAN;-45,20;1.189,36',
  '07/09/2026;07/09/2026;SPOTIFY P1234;-10,99;1.178,37',
  '10/09/2026;10/09/2026;NETFLIX.COM;-12,99;1.165,38',
  '28/09/2026;28/09/2026;NÓMINA EMPRESA SL;1.850,00;3.015,38',
  '28/09/2026;28/09/2026;NÓMINA EMPRESA SL;1.850,00;4.865,38',
  '30/09/2026;30/09/2026;CAFETERÍA LA ESQUINA;-3,50;4.861,88',
  '30/09/2026;;TOTAL;;'].join('\r\n');
 const csvBuf=ab(Buffer.from(csv,'latin1'));
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovVista(['lista']);await sleep(10);
 e.w.__APP__.H.impAbrir([]);await sleep(10);
 ok(/Importar movimientos/.test(sh()),'abre el asistente desde Movimientos');
 await H.impArchivo([],{files:[file('extracto_septiembre.csv',csvBuf)]});await sleep(20);
 let I=A.imp();
 ok(I&&I.paso==='columnas','pasa a columnas');
 ok(I.cab===1&&I.map.fecha===0&&I.map.importe===3&&I.map.desc===2&&I.signo==='signo'&&I.fmtFecha==='dmy','detecta cabecera y columnas: '+JSON.stringify({cab:I.cab,map:I.map,signo:I.signo}));
 ok(/NÓMINA|Nómina|COMPRA/.test(JSON.stringify(I.hoja.filas)),'acentos de Windows-1252 bien leídos: '+JSON.stringify(I.hoja.filas[5]));
 H.impRevisar();await sleep(10);I=A.imp();
 const val=I.filas.filter(r=>r.id);
 ok(val.length===7&&I.filas.length===8,'7 filas válidas, 1 ilegible (TOTAL)');
 const by=t=>val.find(r=>r.desc.includes(t));
 ok(by('MERCADONA').categoria==='Alimentación'&&by('MERCADONA').origenCat==='historial','Mercadona → Alimentación por historial');
 ok(by('SPOTIFY').categoria==='Suscripciones'&&by('SPOTIFY').origenCat==='regla','Spotify → Suscripciones por regla');
 ok(by('NETFLIX').tipo==='Factura'&&by('NETFLIX').categoria==='Netflix','Netflix detectado como factura recurrente');
 const nom=val.filter(r=>r.desc.includes('MINA'));
 ok(nom.length===2&&nom[0].tipo==='Ingreso'&&nom[0].categoria==='Nómina'&&nom[0].id!==nom[1].id,'dos nóminas idénticas: ambas, con id distinto');
 ok(by('BIZUM').estado==='dup'&&!by('BIZUM').incluir,'posible duplicado desmarcado (misma fecha e importe)');
 ok(by('CAFET').categoria===''&&by('CAFET').incluir,'sin categoría pero incluida');
 ok(/A importar/.test(sh())&&/se parece/.test(sh())&&/no se ha podido leer/.test(sh()),'vista previa con resumen y avisos');
 // cambiar categoría de la cafetería → ofrece regla
 const kc=I.filas.indexOf(by('CAFET'));
 H.impCat([String(kc)],{value:'Restaurantes'});await sleep(5);
 ok(/Recordar: «cafeteria» → Restaurantes/.test(sh()),'ofrece recordar regla «cafeteria»');
 H.impRegla([String(kc)]);await sleep(5);
 ok(e.store.cfg.app.reglasCat.some(r=>r.texto==='cafeteria'&&r.categoria==='Restaurantes'),'regla guardada');
 await H.impEjecutar();await sleep(30);
 const imp=Object.entries(e.store.movimientos).filter(([id])=>id.startsWith('imp-'));
 ok(imp.length===6&&imp.every(([,m])=>m.lote&&m.lote===imp[0][1].lote),'6 importados con el mismo lote');
 const caf=imp.find(([,m])=>m.descripcion.includes('CAFET'))[1];
 ok(caf.categoria==='Restaurantes'&&caf.tipo==='Gasto'&&caf.importe===3.5&&caf.fecha==='2026-09-30','datos correctos (importe positivo, tipo por signo)');
 ok(imp.find(([,m])=>m.categoria==='Nómina')[1].importe===1850,'nómina 1.850');
 ok(e.store.cfg.app.importLotes.length===1&&Object.keys(e.store.cfg.app.importPerfiles).length===1,'lote y formato guardados');
 ok(/Importado/.test(sh()),'pantalla final');
 H.closeSheet([]);await sleep(250);
 // ---------- reimportar el mismo archivo: no duplica
 e.w.__APP__.H.impAbrir([]);await H.impArchivo([],{files:[file('extracto_septiembre.csv',csvBuf)]});await sleep(20);I=A.imp();
 ok(I.perfil===true,'reconoce el formato la segunda vez');
 H.impRevisar();await sleep(5);I=A.imp();
 ok(I.filas.filter(r=>r.estado==='importado').length===6&&I.filas.filter(r=>r.id&&r.incluir&&r.estado!=='importado').length===0,'todo ya importado: nada que importar');
 ok(/6 filas ya estaban importadas/.test(sh()),'lo indica');
 H.closeSheet([]);await sleep(250);
 // ---------- deshacer
 const lote=e.store.cfg.app.importLotes[0].id;
 e.w.__APP__.H.goTab(['mas']);click(e,'openLotes');await sleep(10);
 ok(/extracto_septiembre\.csv/.test(sh())&&/6 movimientos/.test(sh()),'Más → Importaciones lista el lote');
 const b=doc.querySelector('[data-click^="loteDeshacer"]');b.click();b.click();await sleep(500);
 ok(!Object.keys(e.store.movimientos).some(k=>k.startsWith('imp-'))&&Object.keys(e.store.movimientos).length===3&&e.store.cfg.app.importLotes.length===0,'deshacer borra solo ese lote');
 H.closeSheet([]);await sleep(250);
 // ---------- Excel personal con Tipo y Categoría
 const ws=XLSX.utils.aoa_to_sheet([['Mis gastos 2026'],[],['Fecha','Tipo','Categoría','Descripción','Importe'],[46235,'Gasto','Ocio','Cine',12],[46235,'Ingreso','Nómina','',1500],['15/08/2026','Factura','Luz','',60],['','','','','']]);
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['otra hoja']]),'Notas');XLSX.utils.book_append_sheet(wb,ws,'Movimientos');
 const xbuf=XLSX.write(wb,{type:'array',bookType:'xlsx'});
 e.w.__APP__.H.impAbrir([]);await H.impArchivo([],{files:[file('MisGastos.xlsx',xbuf)]});await sleep(20);I=A.imp();
 ok(I.hojas.length===2,'Excel con 2 hojas');
 H.impHoja([],{value:'1'});await sleep(5);I=A.imp();
 ok(I.map.fecha===0&&I.map.tipo===1&&I.map.cat===2&&I.map.desc===3&&I.map.importe===4,'columnas del Excel personal: '+JSON.stringify(I.map));
 H.impRevisar();await sleep(5);I=A.imp();
 const v2=I.filas.filter(r=>r.id);
 ok(v2.length===3&&v2[0].fecha==='2026-08-01'&&v2[0].tipo==='Gasto'&&v2[0].categoria==='Ocio'&&v2[1].tipo==='Ingreso'&&v2[1].importe===1500&&v2[2].tipo==='Factura'&&v2[2].categoria==='Luz','tipo y categoría del archivo respetados: '+JSON.stringify(v2.map(r=>[r.fecha,r.tipo,r.categoria,r.importe])));
 H.closeSheet([]);await sleep(250);
 // ---------- CSV inglés con cargos y abonos separados
 const csv2='Date,Description,Debit,Credit\n2026-09-01,"Coffee, shop",3.50,\n2026-09-02,Salary,,"2,000.00"\n';
 e.w.__APP__.H.impAbrir([]);await H.impArchivo([],{files:[file('bank.csv',ab(Buffer.from(csv2,'utf8')))]});await sleep(20);I=A.imp();
 ok(I.modoImporte==='dos'&&I.map.cargo===2&&I.map.abono===3&&I.map.desc===1,'cargos y abonos separados detectados: '+JSON.stringify(I.map));
 H.impRevisar();await sleep(5);I=A.imp();
 const v3=I.filas.filter(r=>r.id);
 ok(v3.length===2&&v3[0].desc==='Coffee, shop'&&v3[0].tipo==='Gasto'&&v3[0].importe===3.5&&v3[1].tipo==='Ingreso'&&v3[1].importe===2000,'comillas y signos correctos');
 H.closeSheet([]);await sleep(250);
 // ---------- formulario: autocategoría y «Recordar»
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovVista(['lista']);e.w.__APP__.H.onFabAntiguo([]);await sleep(10);
 const setv=(sel,v)=>{const el=doc.querySelector(sel);el.value=v;el.dispatchEvent(new e.w.Event('input',{bubbles:true}))};
 setv('#fImporte','18');setv('#fDesc','Mercadona centro');await sleep(5);
 ok(doc.querySelector('#fCategoria').value==='Alimentación','autocategoría por historial al escribir la descripción');
 ok(!!doc.querySelector('#fRegla')&&doc.querySelector('#fReglaTexto').value==='mercadona','ofrece «Recordar: mercadona → Alimentación»');
 doc.querySelector('#fRegla').checked=true;doc.querySelector('#fRegla').dispatchEvent(new e.w.Event('change',{bubbles:true}));
 click(e,'saveMov');await sleep(40);
 ok(Object.values(e.store.movimientos).some(m=>m.descripcion==='Mercadona centro'&&m.categoria==='Alimentación'),'movimiento guardado');
 ok(e.store.cfg.app.reglasCat.some(r=>r.texto==='mercadona'&&r.categoria==='Alimentación'&&r.tipo==='Gasto'),'regla creada desde el formulario');
 e.w.__APP__.H.onFabAntiguo([]);await sleep(10);setv('#fDesc','SPOTIFY familia');await sleep(5);
 ok(doc.querySelector('#fCategoria').value==='Suscripciones'&&/por tu regla/.test(doc.querySelector('#reglaBox').textContent),'aplica la regla y lo indica');
 click(e,'pickCat','Ocio');setv('#fDesc','SPOTIFY familia 2');await sleep(5);
 ok(doc.querySelector('#fCategoria').value==='Ocio','si eliges tú la categoría, no la pisa');
 H.closeSheet([]);await sleep(250);
 // ---------- Más → Reglas
 e.w.__APP__.H.goTab(['mas']);click(e,'openReglas');await sleep(5);
 ok(/«spotify» → Suscripciones/.test(sh())&&/«mercadona» → Alimentación/.test(sh()),'lista de reglas');
 doc.querySelector('#rgTexto').value='Repsol';doc.querySelector('#rgCat').value='Transporte';click(e,'reglaAnadir');await sleep(5);
 ok(e.store.cfg.app.reglasCat.some(r=>r.texto==='repsol'&&r.categoria==='Transporte'&&r.tipo===''),'añadir regla a mano');
 const nR=e.store.cfg.app.reglasCat.length;doc.querySelector('[data-click^="reglaQuitar"]').click();await sleep(5);
 ok(e.store.cfg.app.reglasCat.length===nR-1,'quitar regla');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
