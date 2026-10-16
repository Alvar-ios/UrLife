const {makeEnv,sleep}=require('./harness.js');const XLSX=require('xlsx');const {TextDecoder}=require('util');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const file=(name,buf)=>({name,size:buf.byteLength,arrayBuffer:async()=>buf});
const xl=aoa=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'Movimientos');return XLSX.write(wb,{type:'array',bookType:'xlsx'})};
(async()=>{
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Ropa'}]},meta:{onboarded:true}},movs:[],session:{user:{email:'t@t.com',id:'u1'}},pre:w=>{w.XLSX=XLSX;w.TextDecoder=TextDecoder}});
 await sleep(80);const A=e.w.__APP__,H=A.H;
 // formato del prompt: gastos en positivo, devolución en negativo
 H.impAbrir([]);await H.impArchivo([],{files:[file('formato.xlsx',xl([['Fecha','Tipo','Categoría','Descripción','Importe'],['01/10/2026','Gasto','Ropa','ZARA',40],['05/10/2026','Gasto','Ropa','DEVOLUCION ZARA',-20],['28/10/2026','Ingreso','Nómina','NOMINA',1500]]))]});await sleep(20);
 H.impRevisar();await sleep(5);let r=A.imp().filas.filter(x=>x.id);
 ok(r[0].importe===40&&r[1].importe===-20&&r[2].importe===1500,'positivo normal, devolución negativa: '+r.map(x=>x.importe));
 ok(/devolución/.test(e.doc.querySelector('#sheetHost').textContent),'la vista previa marca la devolución');
 H.closeSheet([]);await sleep(300);
 // extracto con tipo y gastos en negativo
 H.impAbrir([]);await H.impArchivo([],{files:[file('banco.xlsx',xl([['Fecha','Tipo','Concepto','Importe'],['01/10/2026','Gasto','ZARA',-40],['02/10/2026','Gasto','MERCADO',-12],['05/10/2026','Gasto','DEVOLUCION ZARA',20]]))]});await sleep(20);
 H.impRevisar();await sleep(5);r=A.imp().filas.filter(x=>x.id);
 ok(r[0].importe===40&&r[1].importe===12&&r[2].importe===-20,'gastos negativos → positivos; el positivo es devolución: '+r.map(x=>x.importe));
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
