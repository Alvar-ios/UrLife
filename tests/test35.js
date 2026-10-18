// Varias cuentas, fase 1 · entrega 3: «En tus cuentas», Dinero → Cuentas, asignar movimientos, filtro por cuenta
// y reglas del saldo: apartar no toca la cuenta; en un compartido cuenta lo que pagaste o recibiste de verdad
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const iso=d=>d.toISOString().slice(0,10),hace=n=>iso(new Date(Date.now()-n*864e5));
const d5=hace(5),d3=hace(3);
const cuentas=[{id:'c1',nombre:'Banco A',saldo:1000,fecha:'2020-01-01'},{id:'c2',nombre:'Banco B',saldo:300,fecha:'2020-01-01'},{id:'c3',nombre:'Hucha',tipo:'ahorro',saldo:2000,fecha:'2020-01-01'}];
const movs=[
  {id:'g1',tipo:'Gasto',categoria:'Supermercado',importe:40,fecha:d5},
  {id:'g2',tipo:'Gasto',categoria:'Ocio',importe:20,fecha:d5,cuentaId:'c2'},
  {id:'i1',tipo:'Ingreso',categoria:'Nómina',importe:100,fecha:d3},
  {id:'a1',tipo:'Ahorro',categoria:'Apartado',importe:500,fecha:d3},
  {id:'v1',tipo:'Inversión',categoria:'VWCE',tipoActivo:'ETF',importe:60,fecha:d3},
];
const t1={id:'t1',tipo:'Traspaso',categoria:'Traspaso',importe:200,fecha:d3,cuentaId:'c1',cuentaDestinoId:'c2'};
async function env(cs,m){
  const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:30},{nombre:'Ocio',presupuesto:10}],ahorro:[],cuentas:JSON.parse(JSON.stringify(cs))},meta:{onboarded:true}},movs:JSON.parse(JSON.stringify(m)),url:'https://x.test/',session:{user:{email:'t@t.com',id:'yo'}}});
  await sleep(150);return e;
}
const txt=e=>e.doc.querySelector('#content').textContent,sh=e=>e.doc.querySelector('#sheetHost').textContent;
(async()=>{
 let e=await env(cuentas,movs.concat([t1])),A=e.w.__APP__,H=A.H,doc=e.doc;
 // 1. Reglas del saldo
 const c=()=>A.cfg().cuentas;
 ok(A.saldoCuenta(c()[0])===1000-40+100-60-200,'principal: apartar no resta, invertir sí ('+A.saldoCuenta(c()[0])+')');
 ok(A.saldoCuenta(c()[1])===300-20+200,'Banco B: 480');
 ok(A.enTusCuentas()===800+480,'«En tus cuentas» suma las corrientes y no la hucha: '+A.enTusCuentas());
 ok(A.patrimonio().banco===800+480+2000,'«Dinero en el banco» del patrimonio = suma calculada de todas: '+A.patrimonio().banco);
 // compartidos: pagas tú 100 de una cena a medias → la cuenta baja 100; tu parte (50) no se cuenta dos veces
 A.S.compartidos=[{id:'s1',grupoId:'gr',fecha:d3,tipo:'Gasto',categoria:'Restaurantes y bares',importe:100,pagadoPor:'yo',reparto:{yo:50,otro:50}},
   {id:'s2',grupoId:'gr',fecha:d3,tipo:'Gasto',categoria:'Restaurantes y bares',importe:30,pagadoPor:'otro',reparto:{yo:15,otro:15}},
   {id:'s3',grupoId:'gr',fecha:d3,tipo:'Liquidación',categoria:'Liquidación',importe:35,pagadoPor:'otro',reparto:{yo:35}}];
 A.S.movimientos=A.S.movimientos.concat([{id:'p1',tipo:'Gasto',categoria:'Restaurantes y bares',importe:50,fecha:d3,compartidoId:'s1'}]);
 ok(A.saldoCuenta(c()[0])===800-100+35,'compartido: baja lo que pagaste (100), no baja lo que pagó otro y sube el Bizum recibido ('+A.saldoCuenta(c()[0])+')');
 A.S.compartidos=[];A.S.movimientos=A.S.movimientos.filter(m=>m.id!=='p1');

 // 2. Inicio: línea «En tus cuentas»
 const linea=doc.querySelector('.hero-cuentas, .h2-dato');
 ok(linea&&/En tus cuentas/.test(linea.textContent)&&/1\.280/.test(linea.textContent),'Inicio: «En tus cuentas: 1.280 €» debajo de la cifra grande');
 click(e,'cuentasHoja');await sleep(10);
 ok(/Banco A/.test(sh(e))&&/Banco B/.test(sh(e))&&/Hucha/.test(sh(e))&&/no suma/.test(sh(e)),'al tocarla, una hoja con cada cuenta');
 H.closeSheet([]);await sleep(260);
 const una=await env(cuentas.slice(0,1),movs);
 ok(!una.doc.querySelector('.hero-cuentas'),'con una cuenta, Inicio no cambia');

 // 3. Dinero → Cuentas (el primero)
 H.goTab(['dinero']);await sleep(10);
 const chips=[...doc.querySelectorAll('.chips-nav .chip-nav')].map(b=>b.textContent);
 ok(chips[0]==='Cuentas'&&doc.querySelector('.chips-nav .chip-nav.active').textContent==='Cuentas'&&!!doc.querySelector('.cuentas-card'),'Dinero abre en «Cuentas», el primer apartado');
 una.w.__APP__.H.goTab(['dinero']);await sleep(10);
 ok(![...una.doc.querySelectorAll('.chips-nav .chip-nav')].some(b=>b.textContent==='Cuentas'),'con una cuenta no aparece');

 // 4. Vista de una cuenta y «Asignar movimientos»
 click(e,'cuentaVer','c2');await sleep(10);
 ok(/480,00/.test(sh(e))&&!!doc.querySelector('[data-click="cuadrarAbrir|1|c2"]')&&/3 movimientos sin cuenta/.test(sh(e)),'la cuenta enseña saldo, «Cuadrar» y cuántos movimientos no tienen cuenta (apartar no cuenta)');
 click(e,'asigCuentaAbrir','c2');await sleep(10);
 ok(doc.querySelectorAll('.asignar-fila').length===3&&!/Apartado/.test(sh(e)),'la lista solo trae los que no tienen cuenta');
 click(e,'asigCuentaMarcar','g1');await sleep(5);ok(/Asignar 1/.test(sh(e)),'se marcan uno a uno');
 click(e,'asigCuentaTodos');await sleep(5);ok(/Asignar 3/.test(sh(e)),'o con «Seleccionar todos»');
 click(e,'asigCuentaMarcar','v1');await sleep(5);
 click(e,'asigCuentaOk');await sleep(20);
 ok(/Toca otra vez para asignar 2/.test(sh(e))&&!e.store.movimientos.g1.cuentaId,'pide confirmación antes de cambiar nada');
 click(e,'asigCuentaOk');await sleep(100);
 ok(e.store.movimientos.g1.cuentaId==='c2'&&e.store.movimientos.i1.cuentaId==='c2'&&!e.store.movimientos.v1.cuentaId&&e.store.movimientos.g1.importe===40,'asigna solo los marcados y no toca nada más');
 doc.querySelector('#toast .toast-btn').click();await sleep(100);
 ok(e.store.movimientos.g1.cuentaId===null&&e.store.movimientos.i1.cuentaId===null,'«Deshacer» los deja otra vez sin cuenta');

 // 5. Movimientos: filtro por cuenta y punto de color
 H.goTab(['movimientos']);await sleep(5);H.setMovModo(['todo']);await sleep(10);
 ok(!!doc.querySelector('.cuenta-filtro')&&doc.querySelectorAll('#movList .row .cuenta-dot').length===4,'cada fila lleva el punto de su cuenta (apartar no): '+doc.querySelectorAll('#movList .row .cuenta-dot').length);
 ok(/Todas las cuentas/.test(doc.querySelector('.cuenta-filtro').textContent),'las cuentas, en una píldora bajo el mes');click(e,'movCuentaElegir');await sleep(5);click(e,'setMovCuenta','c2');await sleep(10);ok(/Banco B/.test(doc.querySelector('.cuenta-filtro').textContent),'la píldora dice la cuenta elegida');
 const ttl=[...doc.querySelectorAll('#movList .row .ttl')].map(x=>x.textContent);
 ok(ttl.length===2&&ttl.some(t=>/Ocio/.test(t))&&ttl.some(t=>/Banco A → Banco B/.test(t)),'filtrar por «Banco B» enseña su gasto y el traspaso que le entra: '+ttl.join(' | '));
 una.w.__APP__.H.goTab(['movimientos']);una.w.__APP__.H.setMovVista(['lista']);await sleep(10);
 ok(!una.doc.querySelector('.cuenta-filtro')&&!una.doc.querySelector('.cuenta-dot'),'con una cuenta, Movimientos no cambia');

 // 6. Apartar no pregunta la cuenta
 H.openMovForm([]);await sleep(10);ok(!!doc.querySelector('#cuentaChips'),'un gasto pregunta la cuenta');
 click(e,'pickTipo','Ahorro');await sleep(5);ok(!doc.querySelector('#cuentaChips'),'«Apartar» no la pregunta');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
