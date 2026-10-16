// Calidad · varias cuentas fase 1: casos límite (una cuenta, fechas futuras, asignar en lote, traspasos y papelera)
console.error=()=>{};
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const iso=d=>d.toISOString().slice(0,10),hace=n=>iso(new Date(Date.now()-n*864e5));
async function env(cs,m,extra){
  const e=makeEnv({cfg:{app:Object.assign({categoriasGasto:[{nombre:'Supermercado',presupuesto:null}],ahorro:[],cuentas:JSON.parse(JSON.stringify(cs))},extra||{}),meta:{onboarded:true}},movs:JSON.parse(JSON.stringify(m)),url:'https://x.test/',session:{user:{email:'t@t.com',id:'yo'}}});
  await sleep(150);return e;
}
const sh=e=>e.doc.querySelector('#sheetHost').textContent;
(async()=>{
 // 1. Usuario nuevo sin cuentas: nada nuevo a la vista y guardar un gasto no lleva cuentaId
 let e=await env([],[]),A=e.w.__APP__;
 ok(!e.doc.querySelector('.hero-cuentas')&&A.patrimonio().banco===0,'sin cuentas: Inicio igual y banco 0');
 A.H.openMovForm([]);await sleep(10);
 ok(!e.doc.querySelector('#cuentaChips'),'sin cuentas: el formulario no pregunta la cuenta');
 e.doc.querySelector('#fImporte').value='12';e.doc.querySelector('#fCategoria').value='Supermercado';
 await A.H.saveMov([]);await sleep(50);
 const nuevo=Object.values(e.store.movimientos)[0];
 ok(nuevo&&!('cuentaId' in nuevo),'sin cuentas: el movimiento se guarda sin el campo cuentaId');

 // 2. Una sola cuenta con saldo puesto hace tiempo: ¿cambia «Dinero en el banco»? (antes era el saldo tal cual)
 e=await env([{id:'c1',nombre:'Banco',saldo:1000,fecha:hace(30)}],[{id:'g',tipo:'Gasto',categoria:'Supermercado',importe:100,fecha:hace(5)}]);A=e.w.__APP__;
 console.log('INFO una cuenta: patrimonio().banco =',A.patrimonio().banco,'(antes de este cambio era 1000)');
 A.H.openCuentas([]);await sleep(10);
 console.log('INFO una cuenta: Cuentas y saldos enseña campo de saldo editable =',!!e.doc.querySelector('#sheetHost input.amt'));

 // 3. Movimiento con fecha futura y «Cuadrar»: tras cuadrar, ¿la app enseña lo que dice el banco?
 const fut=iso(new Date(Date.now()+10*864e5));
 e=await env([{id:'c1',nombre:'A',saldo:1000,fecha:hace(30)},{id:'c2',nombre:'B',saldo:0,fecha:hace(30)}],[{id:'n',tipo:'Ingreso',categoria:'Nómina',importe:1500,fecha:fut}]);A=e.w.__APP__;
 console.log('INFO saldo A con una nómina apuntada para dentro de 10 días =',A.saldoCuenta(A.cfg().cuentas[0]));
 A.H.openCuentas([]);await sleep(10);A.H.cuadrarAbrir([0]);await sleep(80);
 e.doc.querySelector('#fBanco').value='1000';A.H.cuadrarOk([]);await sleep(50);
 const tras=A.saldoCuenta(A.cfg().cuentas[0]);
 ok(tras===1000,'tras cuadrar a 1000 € la app enseña 1000 € (enseña '+tras+')');

 // 4. Asignar en lote: solo debe cambiar la cuenta
 const movs=[{id:'f1',tipo:'Factura',categoria:'Luz',importe:50,fecha:hace(3)},{id:'g1',tipo:'Gasto',categoria:'Supermercado',importe:10,fecha:hace(3)}];
 e=await env([{id:'c1',nombre:'A',saldo:0,fecha:hace(30)},{id:'c2',nombre:'B',saldo:0,fecha:hace(30)}],movs);A=e.w.__APP__;
 A.H.cuentaVer(['c2']);await sleep(10);click(e,'asigCuentaAbrir','c2');await sleep(10);
 click(e,'asigCuentaTodos');click(e,'asigCuentaOk');click(e,'asigCuentaOk');await sleep(100);
 const f1=e.store.movimientos.f1;
 ok(f1.cuentaId==='c2','asignado');
 ok(f1.categoria==='Luz'&&!f1.subcategoria,'asignar no cambia la categoría guardada (ahora: '+f1.categoria+' / '+f1.subcategoria+')');
 e.doc.querySelector('#toast .toast-btn').click();await sleep(100);
 ok(e.store.movimientos.f1.categoria==='Luz','deshacer deja la categoría como estaba (ahora: '+e.store.movimientos.f1.categoria+')');

 // 5. Asignar en lote con un fallo a mitad: ¿queda a medias sin poder deshacer?
 e=await env([{id:'c1',nombre:'A',saldo:0,fecha:hace(30)},{id:'c2',nombre:'B',saldo:0,fecha:hace(30)}],movs);A=e.w.__APP__;
 const orig=e.w.Data.collection;e.w.Data.collection=n=>{const c=orig(n),d0=c.doc;c.doc=id=>{const d=d0(id);if(id==='f1'){d.set=async()=>{const er=new Error('x');er.code='42501';throw er;};}return d;};return c;};
 A.H.cuentaVer(['c2']);await sleep(10);click(e,'asigCuentaAbrir','c2');await sleep(10);
 click(e,'asigCuentaTodos');click(e,'asigCuentaOk');click(e,'asigCuentaOk');await sleep(150);
 const tb=e.doc.querySelector('#toast .toast-btn');
 console.log('INFO fallo a mitad: g1.cuentaId =',e.store.movimientos.g1.cuentaId,'· f1.cuentaId =',e.store.movimientos.f1.cuentaId,'· botón deshacer =',!!tb);
 e.w.Data.collection=orig;
 ok(!!tb||(!e.store.movimientos.g1.cuentaId),'si falla a mitad, o no queda nada cambiado o se puede deshacer');

 // 6. Traspaso: borrar → papelera → recuperar
 e=await env([{id:'c1',nombre:'A',saldo:100,fecha:hace(30)},{id:'c2',nombre:'B',saldo:0,fecha:hace(30)}],[{id:'t1',tipo:'Traspaso',categoria:'Traspaso',importe:40,fecha:hace(2),cuentaId:'c1',cuentaDestinoId:'c2'}]);A=e.w.__APP__;
 ok(A.saldoCuenta(A.cfg().cuentas[1])===40&&A.kpisMes(new Date().getFullYear(),new Date().getMonth()+1).gastos===0,'el traspaso mueve saldo y no es gasto');
 A.H.movBorrar(['t1']);await sleep(60);
 ok(!e.store.movimientos.t1&&(A.cfg().papelera||[]).some(x=>x.id==='t1'),'borrar traspaso: va a la papelera');
 // recuperar desde papelera
 const item=(A.cfg().papelera||[]).find(x=>x.id==='t1');
 await e.w.Data.collection('movimientos').doc('t1').set(item.copia);
 ok(e.store.movimientos.t1.tipo==='Traspaso'&&e.store.movimientos.t1.cuentaDestinoId==='c2','la copia de la papelera conserva las dos cuentas');

 // 7. Editar un movimiento antiguo sin tocar la cuenta: no se le pone cuenta
 e=await env([{id:'c1',nombre:'A',saldo:0,fecha:hace(30)},{id:'c2',nombre:'B',saldo:0,fecha:hace(30)}],[{id:'v',tipo:'Gasto',categoria:'Supermercado',importe:5,fecha:hace(40)}],{cuentaPorCat:{supermercado:'c2'}});A=e.w.__APP__;
 A.H.openMovForm(['v']);await sleep(10);e.doc.querySelector('#fImporte').value='6';await A.H.saveMov([]);await sleep(50);
 ok(e.store.movimientos.v.importe===6&&!e.store.movimientos.v.cuentaId,'editar uno antiguo sin tocar la cuenta lo deja sin cuenta');
 // un movimiento nuevo propone la última cuenta usada con la categoría
 A.H.openMovForm([]);await sleep(10);click(e,'pickCat','Supermercado');await sleep(10);
 ok(A.form().cuenta==='c2','un gasto nuevo de Supermercado propone la cuenta B');

 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
