// Varias cuentas, fase 1 · entrega 1: editor de cuentas y «Desde / A la cuenta» en el movimiento
const {makeEnv,sleep,click,change}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const HOY=new Date(),p=n=>String(n).padStart(2,'0'),mk=HOY.getFullYear()+'-'+p(HOY.getMonth()+1);
const movs=[{id:'g1',tipo:'Gasto',categoria:'Supermercado',importe:50,fecha:mk+'-01'}];
const una=[{id:'c1',nombre:'Banco A',saldo:1000,fecha:mk+'-01'}];
const tres=una.concat([{id:'c2',nombre:'Banco B',saldo:300,fecha:mk+'-01'},{id:'c3',nombre:'Hucha',tipo:'ahorro',saldo:500,fecha:mk+'-01'}]);
async function env(cuentas,m){
  const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado',presupuesto:30},{nombre:'Ocio',presupuesto:10}],ahorro:[],cuentas:JSON.parse(JSON.stringify(cuentas))},meta:{onboarded:true}},movs:JSON.parse(JSON.stringify(m||movs)),url:'https://x.test/'});
  await sleep(150);return e;
}
const nuevos=e=>Object.entries(e.store.movimientos).filter(([id])=>id!=='g1').map(([,v])=>v);
async function guardar(e,importe,cat){e.doc.querySelector('#fImporte').value=String(importe);if(cat)click(e,'pickCat',cat);await sleep(5);click(e,'saveMov');await sleep(300);}
(async()=>{
 // 1. Una sola cuenta: todo igual que antes
 let e=await env(una),A=e.w.__APP__,H=A.H,doc=e.doc,sh=()=>doc.querySelector('#sheetHost').textContent;
 H.openCuentas([]);await sleep(5);
 click(e,'cuentaEditar','0');await sleep(5);ok(!/Principal/.test(sh())&&/Sumar en «En tus cuentas»/.test(sh())&&!!doc.querySelector('#sheetHost .cuenta-ed select'),'una cuenta: tipo e interruptor, sin «principal»');
 H.closeSheet([]);await sleep(260);
 H.openMovForm([]);await sleep(10);
 ok(!doc.querySelector('#cuentaChips')&&!/Desde la cuenta/.test(sh()),'una cuenta: el formulario no pregunta la cuenta');
 await guardar(e,12,'Ocio');
 const m1=nuevos(e)[0];ok(m1&&m1.importe===12&&!('cuentaId' in m1),'una cuenta: el movimiento se guarda sin el campo de cuenta (no necesita la columna nueva)');

 // 2. Editor con varias cuentas
 e=await env(tres);A=e.w.__APP__;H=A.H;doc=e.doc;
 H.openCuentas([]);await sleep(5);
 ok(doc.querySelectorAll('#sheetHost .cuentas-lista .cuenta-fila').length===3&&/no suma/.test(sh())&&!doc.querySelector('#sheetHost .switch'),'la lista de cuentas es limpia: una fila por cuenta (se editan por separado)');
 const swDe=async(i)=>{click(e,'cuentaEditar',String(i));await sleep(5);const on=doc.querySelector('#sheetHost .cuenta-ed .switch').classList.contains('on');click(e,'cuentasVolver');await sleep(5);return on;};
 const sw=[await swDe(0),await swDe(1),await swDe(2)];
 ok(sw[0]&&sw[1]&&!sw[2],'por defecto suman las corrientes y no la de ahorro');
 click(e,'cuentaEditar','0');await sleep(5);
 ok(/Es tu cuenta principal/.test(sh()),'la primera es la principal por defecto');
 click(e,'cuentasVolver');await sleep(5);click(e,'cuentaEditar','1');await sleep(5);
 click(e,'cuentaPrincipal','1');await sleep(5);
 ok(!!doc.querySelector('#popupBackdrop .popup')&&/Sí, cambiar/.test(doc.querySelector('#popupBackdrop').textContent),'«Hacer principal» pide confirmación en una ventana emergente');
 click(e,'cuentaPrincipalSi','1');await sleep(5);
 ok(!doc.querySelector('#popupBackdrop'),'al confirmar, la ventana se cierra');
 let cs=e.store.cfg.app.cuentas;ok(cs[1].principal===true&&cs[0].principal===false&&A.cfg().cuentas[1].principal,'«Hacer principal» marca solo esa');
 click(e,'cuentasVolver');await sleep(5);click(e,'cuentaEditar','2');await sleep(5);
 click(e,'cuentaTengo','2');await sleep(5);cs=e.store.cfg.app.cuentas;ok(cs[2].enTengo===true,'el interruptor de la hucha la suma');
 click(e,'cuentasVolver');await sleep(5);click(e,'cuentaEditar','0');await sleep(5);
 click(e,'cuentaColor','0','#C2416C');await sleep(5);cs=e.store.cfg.app.cuentas;ok(cs[0].color==='#C2416C'&&doc.querySelector('#sheetHost .cuenta-color.on[style*="#C2416C"]'),'se cambia el color de una cuenta');
 change(e,doc.querySelector('#sheetHost .cuenta-ed select'),'efectivo');await sleep(5);cs=e.store.cfg.app.cuentas;ok(cs[0].tipo==='efectivo','se cambia el tipo');
 click(e,'cuentasVolver');await sleep(5);
 ok(cs[0].saldo===1000&&cs[0].fecha===mk+'-01','cambiar tipo o color no toca el saldo ni su fecha');
 click(e,'cuentasListo');await sleep(260);

 // 3. Formulario: «Desde la cuenta», propone la principal y recuerda por categoría
 H.openMovForm([]);await sleep(10);
 ok(!!doc.querySelector('#cuentaChips')&&/Desde la cuenta/.test(sh()),'varias cuentas: el formulario pregunta «Desde la cuenta»');
 ok(doc.querySelector('#cuentaChips .chip.active').textContent==='Banco B','propone la principal');
 click(e,'pickTipo','Ingreso');await sleep(5);ok(/A la cuenta/.test(sh()),'en un ingreso dice «A la cuenta»');
 click(e,'pickTipo','Gasto');await sleep(5);
 click(e,'pickCuenta','c1');await sleep(5);
 await guardar(e,20,'Supermercado');
 let n=nuevos(e);ok(n.length===1&&n[0].cuentaId==='c1','el movimiento guarda la cuenta elegida');
 ok((A.cfg().cuentaPorCat||{}).supermercado==='c1','recuerda la cuenta usada con «Supermercado»');
 H.openMovForm([]);await sleep(10);click(e,'pickCat','Supermercado');await sleep(5);
 ok(doc.querySelector('#cuentaChips .chip.active').textContent==='Banco A','al elegir «Supermercado» propone esa misma cuenta');
 click(e,'pickCat','Ocio');await sleep(5);
 ok(doc.querySelector('#cuentaChips .chip.active').textContent==='Banco B','con otra categoría vuelve a la principal');
 H.closeSheet([]);await sleep(260);

 // 4. Editar un movimiento antiguo sin tocar la cuenta no se la asigna
 H.openMovForm(['g1']);await sleep(10);
 ok(doc.querySelector('#cuentaChips .chip.active').textContent==='Banco B','un movimiento antiguo se ve en la principal');
 doc.querySelector('#fImporte').value='55';click(e,'saveMov');await sleep(300);
 ok(e.store.movimientos.g1.importe===55&&!e.store.movimientos.g1.cuentaId,'al editarlo sin tocar la cuenta sigue «sin cuenta»');
 H.openMovForm(['g1']);await sleep(10);click(e,'pickCuenta','c3');await sleep(5);click(e,'saveMov');await sleep(300);
 ok(e.store.movimientos.g1.cuentaId==='c3','si eliges una cuenta al editar, se guarda');

 // 5. Quitar una cuenta con movimientos pide un segundo toque
 e=await env(tres,[Object.assign({},movs[0],{cuentaId:'c3'})]);A=e.w.__APP__;H=A.H;doc=e.doc;
 H.openCuentas([]);await sleep(5);click(e,'cuentaEditar','2');await sleep(5);
 const rm=()=>doc.querySelector('#sheetHost [data-click^="cuentaQuitar"]');
 rm().click();await sleep(5);
 ok(e.store.cfg.app.cuentas.length===3&&/Toca «Quitar» otra vez/.test(doc.body.textContent),'quitar una cuenta con movimientos avisa y pide otro toque');
 rm().click();await sleep(5);
 ok(e.store.cfg.app.cuentas.length===2&&e.store.movimientos.g1.cuentaId==='c3','al segundo toque se quita; el movimiento no se toca');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
