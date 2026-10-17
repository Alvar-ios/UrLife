// Varias cuentas, fase 1 · entrega 2: traspasos, saldo calculado y «Cuadrar»
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const iso=d=>d.toISOString().slice(0,10),hace=n=>iso(new Date(Date.now()-n*864e5)),hoy=iso(new Date());
const d5=hace(5),d3=hace(3);
const cuentas=[{id:'c1',nombre:'Banco A',saldo:1000,fecha:'2020-01-01'},{id:'c2',nombre:'Banco B',saldo:300,fecha:'2020-01-01'}];
const movs=[
  {id:'g1',tipo:'Gasto',categoria:'Supermercado',importe:50,fecha:'2020-01-01'}, // del mismo día que el saldo: ya estaba dentro
  {id:'g2',tipo:'Gasto',categoria:'Ocio',importe:20,fecha:d5,cuentaId:'c2'},
  {id:'i1',tipo:'Ingreso',categoria:'Nómina',importe:100,fecha:d5}, // sin cuenta = la principal
];
const t1={id:'t1',tipo:'Traspaso',categoria:'Traspaso',importe:200,fecha:d3,cuentaId:'c1',cuentaDestinoId:'c2',descripcion:'Para gastos'};
async function env(cs,m){
  const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:30},{nombre:'Ocio',presupuesto:10}],ahorro:[],cuentas:JSON.parse(JSON.stringify(cs))},meta:{onboarded:true}},movs:JSON.parse(JSON.stringify(m)),url:'https://x.test/'});
  await sleep(150);return e;
}
const txt=e=>e.doc.querySelector('#content').textContent,sh=e=>e.doc.querySelector('#sheetHost').textContent;
(async()=>{
 // 1. Un traspaso no cambia ninguna suma del mes
 const sin=await env(cuentas,movs),con=await env(cuentas,movs.concat([t1]));
 const [y,mo]=d3.split('-').map(Number);
 ok(JSON.stringify(sin.w.__APP__.kpisMes(y,mo))===JSON.stringify(con.w.__APP__.kpisMes(y,mo)),'un traspaso no cambia ingresos, gastos ni «Te queda este mes»');
 const A=con.w.__APP__,H=A.H;
 ok(A.S.movimientos.length===3&&A.S.traspasos.length===1,'los traspasos van aparte de los movimientos');
 ok(A.patrimonio().total===sin.w.__APP__.patrimonio().total,'ni el patrimonio');

 // 2. Saldo calculado
 const c=A.cfg().cuentas;
 ok(A.saldoCuenta(c[0])===900,'saldo de la principal: 1000 + 100 de nómina sin cuenta − 200 traspasados = '+A.saldoCuenta(c[0]));
 ok(A.saldoCuenta(c[1])===480,'saldo de la otra: 300 − 20 + 200 = '+A.saldoCuenta(c[1]));
 ok(A.saldoCuenta({id:'x',nombre:'Nueva',saldo:null})===null,'sin saldo de partida no hay cálculo');

 // 3. En Movimientos: el traspaso se ve en gris, sin sumar al balance
 H.goTab(['movimientos']);await sleep(5);H.setMovModo(['todo']);await sleep(10);
 const fila=con.doc.querySelector('.row.traspaso');
 ok(fila&&/Banco A → Banco B/.test(fila.textContent)&&/Para gastos/.test(fila.textContent),'la fila dice «Banco A → Banco B»');
 ok(/1 traspaso/.test(txt(con))&&/balance \+30,00/.test(txt(con)),'el resumen cuenta el traspaso aparte y el balance no cambia');
 H.setMovFiltro(['Ingreso']);await sleep(5);ok(!con.doc.querySelector('.row.traspaso'),'con el filtro «Ingresos» no sale');
 H.setMovFiltro(['Todos']);await sleep(5);

 // 4. Botón +: «Traspaso» solo con 2 o más cuentas
 H.onFab([]);await sleep(5);ok(!!con.doc.querySelector('[data-click="crearIr|traspaso"]'),'el + trae «Traspaso» con 2 cuentas');
 const una=await env(cuentas.slice(0,1),movs);una.w.__APP__.H.onFab([]);await sleep(5);
 ok(!una.doc.querySelector('[data-click="crearIr|traspaso"]'),'con una cuenta no aparece');

 // 5. Apuntar un traspaso
 click(con,'crearIr','traspaso');await sleep(10);
 ok(/Traspaso entre cuentas/.test(sh(con))&&con.doc.querySelector('#tras-desde .chip.active').textContent==='Banco A'&&con.doc.querySelector('#tras-a .chip.active').textContent==='Banco B','el formulario propone de la principal a la otra');
 const antes=Object.keys(con.store.movimientos).length;
 click(con,'saveTraspaso');await sleep(50);ok(Object.keys(con.store.movimientos).length===antes,'sin importe no se guarda');
 con.doc.querySelector('#fImporte').value='50';click(con,'pickTrasCuenta','a','c1');await sleep(5);
 click(con,'saveTraspaso');await sleep(50);ok(Object.keys(con.store.movimientos).length===antes&&/distintas/.test(con.doc.body.textContent),'la misma cuenta en los dos lados no se guarda');
 click(con,'pickTrasCuenta','a','c2');await sleep(5);click(con,'saveTraspaso');await sleep(300);
 const nuevo=Object.values(con.store.movimientos).find(m=>m.tipo==='Traspaso'&&m.importe===50);
 ok(nuevo&&nuevo.cuentaId==='c1'&&nuevo.cuentaDestinoId==='c2'&&nuevo.categoria==='Traspaso'&&nuevo.fecha===hoy,'el traspaso se guarda con las dos cuentas');

 // 6. Editar y borrar
 H.openMovForm(['t1']);await sleep(10);ok(/Editar traspaso/.test(sh(con))&&con.doc.querySelector('#fImporte').value==='200','tocar un traspaso abre su formulario');
 H.closeSheet([]);await sleep(260);
 H.movBorrar(['t1']);await sleep(50);
 ok(!con.store.movimientos.t1&&(A.cfg().papelera||[]).some(x=>x.id==='t1'),'borrar un traspaso lo lleva a la papelera');

 // 7. Cuadrar
 const e=await env(cuentas,movs.concat([t1])),B=e.w.__APP__;
 B.H.openCuentas([]);await sleep(5);
 click(e,'cuentaEditar','0');await sleep(5);ok([...e.doc.querySelectorAll('#sheetHost .cuenta-ed input.amt')].some((i)=>Number(i.value)===900)&&/Calculado desde el saldo del/.test(sh(e))&&!!e.doc.querySelector('[data-click^="cuadrarAbrir|0"]'),'el editor enseña el saldo calculado (ahora en una casilla que se puede escribir) y «Cuadrar»');
 click(e,'cuadrarAbrir','0','','ed');await sleep(10);
 const inp=e.doc.querySelector('#fBanco');inp.value='950';inp.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/Diferencia: \+50,00/.test(sh(e)),'escribe lo que dice el banco y enseña la diferencia');
 inp.value='900';inp.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(5);ok(/Cuadra/.test(sh(e)),'si coincide, lo dice');
 inp.value='950';click(e,'cuadrarOk');await sleep(20);
 const c0=e.store.cfg.app.cuentas[0];
 ok(c0.saldo===950&&c0.fecha===hoy&&c0.cuadre&&c0.cuadre.dif===50&&B.saldoCuenta(c0)===950,'al guardar, la diferencia queda como ajuste y el saldo cuenta desde hoy');
 ok(/Cuadrado el/.test(sh(e)),'el editor dice cuándo se cuadró');
 const ts=c0.ts;
 B.S.movimientos=B.S.movimientos.concat([{id:'h1',tipo:'Gasto',categoria:'Ocio',importe:10,fecha:hoy,creadoEn:ts-1000},{id:'h2',tipo:'Gasto',categoria:'Ocio',importe:7,fecha:hoy,creadoEn:ts+1000}]);
 ok(B.saldoCuenta(B.cfg().cuentas[0])===943,'de hoy solo cuenta lo apuntado después de cuadrar');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
