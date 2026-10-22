const {JSDOM}=require('jsdom'),fs=require('fs');
function makeEnv(seed){ // seed: {config:{app,meta}, movs:[]}
  const store={movimientos:{},tareas:{},golf:{},cfg:Object.assign({},seed.cfg||{})};
  (seed.movs||[]).forEach(m=>store.movimientos[m.id]=m);
  const subs=[];const notify=()=>subs.forEach(f=>f());
  const mkDoc=(k)=>({
    get:async()=>({exists:!!store.cfg[k],data:()=>store.cfg[k]}),
    set:async v=>{store.cfg[k]=v;notify()},
    update:async p=>{store.cfg[k]=Object.assign({},store.cfg[k]||{},p);notify()},
    onSnapshot:(cb)=>{const f=()=>cb({exists:!!store.cfg[k],data:()=>store.cfg[k]});subs.push(f);setTimeout(f,0);return()=>{}}});
  const Data={doc:p=>mkDoc(p.split('/')[1]),collection:n=>({onSnapshot:cb=>{setTimeout(()=>{cb({docs:Object.entries(store[n]).map(([id,v])=>({id:id,data:()=>v}))})},0);return()=>{}}})};
  const Auth={_f:[],onChange(f){this._f.push(f);setTimeout(()=>f({user:{email:'t@t.com'}}),0)},signIn(){},signOut(){},resetPassword(){}};
  const dom=new JSDOM('<div id="app"></div>',{runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.Auth=Auth;w.Data=Data;w.scrollTo=()=>{};
  w.eval(fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8'));
  w.__APP__.S.verAnterior=Object.assign({tu:1,agenda:1,crear:1},w.__APP__.S.verAnterior||{}); // 22/10: las pruebas antiguas miran Tú, Agenda y + de antes (las nuevas pasan version:{tu:0,…})
  if(seed.version)w.__APP__.S.verAnterior=Object.assign(w.__APP__.S.verAnterior,seed.version);
  return {w,store,doc:w.document};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const click=(e,name,...a)=>{const sel='[data-click^="'+name+'"]';const el=[...e.doc.querySelectorAll(sel)].find(x=>a.length?x.getAttribute('data-click')===[name,...a.map(encodeURIComponent)].join('|'):true);if(!el)throw new Error('no '+name+' '+a);el.click();};
const change=(e,el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};
(async()=>{
 // 1 existing user
 let e=makeEnv({version:{dinero:3},cfg:{app:{categoriasGasto:[{nombre:'Comida',presupuesto:100}],ingresos:['Nómina']}}});
 await sleep(60);
 const A=()=>e.w.__APP__, ob=()=>e.w.__APP__.S.onboarding, txt=()=>e.doc.querySelector('#app').textContent;
 ok(!ob(),'existing user: no wizard');
 ok(e.store.cfg.meta&&e.store.cfg.meta.onboarded&&e.store.cfg.meta.auto,'existing user: grandfathered meta');
 ok(JSON.stringify(e.store.cfg.app.categoriasGasto)==='[{"nombre":"Comida","presupuesto":100}]','existing config untouched');
 A().H.goTab(['mas']);await sleep(5);
 ok(/Volver a ver la bienvenida/.test(e.doc.querySelector('#content').innerHTML),'Tú: «Volver a ver la bienvenida»');
 ok(e.doc.querySelector('#content').innerHTML.indexOf('Volver a ver la bienvenida')>e.doc.querySelector('#content').innerHTML.indexOf('profile-tile'),'Tú: está en el grupo App');
 // manual: solo añade
 click(e,'startOnboardingManually');
 ok(ob()&&ob().manual&&/Así es PalomApp/.test(txt())&&/Paso 1 de 4/.test(txt()),'manual: 4 pasos, «Así es PalomApp»');
 A().H.obNext([]);
 ob().saldo='1.240,50';A().H.obNext([]);await sleep(10);
 let a=e.store.cfg.app;
 ok(a.cuentas&&a.cuentas.length===1&&a.cuentas[0].saldo===1240.5&&a.cuentas[0].principal&&a.cuentas[0].nombre==='Banco','paso banco: cuenta «Banco» con 1.240,50 € (entiende el punto de miles), principal');
 click(e,'obNomina');ob().nomina.importe='1850';ob().nomina.dia='28';click(e,'obFijo','Alquiler');ob().fijos[0].importe='720';ob().fijos[0].dia='1';
 A().render();ok(/Cobras el 28/.test(txt())&&/Del 1 al 31/.test(txt()),'cobra el 28: pregunta «tu mes» con «Del 1 al 31» marcado');
 A().H.obNext([]);await sleep(10);
 a=e.store.cfg.app;
 ok(a.cobros&&a.cobros[0].nombre==='Nómina'&&a.cobros[0].importe===1850&&a.cobros[0].diaDelMes===28&&a.cobros[0].regla.t==='dia'&&a.cobros[0].desde,'nómina guardada con importe, día y fecha de alta');
 ok(a.facturas&&a.facturas[0].nombre==='Alquiler'&&a.facturas[0].importe===720&&a.facturas[0].diaDelMes===1&&a.facturas[0].categoria,'pago fijo guardado con categoría');
 ok(!a.mesInicio||a.mesInicio.modo!=='cobro','«Del 1 al 31» por defecto: no cambia tu mes');
 ok(/Todo listo/.test(txt())&&/Así se mueve uno por la app/.test(txt()),'paso Listo con el mapa de la barra');
 click(e,'obFinish','');await sleep(30);a=e.store.cfg.app;
 ok(!ob()&&e.doc.querySelector('.tabbar'),'wizard closed, app shell restored');
 ok(a.categoriasGasto.length===1&&a.categoriasGasto[0].presupuesto===100&&a.ingresos[0]==='Nómina'&&a.compararVersiones===undefined&&!a.altaApp,'manual: no toca categorías, ingresos ni lo de usuarios nuevos');
 // repetir otra vez: no duplica, solo añade
 A().H.startOnboardingManually([]);A().H.obNext([]);
 ok(/Tus cuentas/.test(txt())&&/solo puedes añadir/.test(txt()),'al repetir: «Tus cuentas», solo añadir');
 click(e,'obExtra');ob().extra[0].saldo='50';A().H.obNext([]);await sleep(10);
 ok(/Ya tienes apuntado: Nómina/.test(txt())&&!e.doc.querySelector('[data-click^="obNomina"]'),'al repetir: la nómina ya apuntada no se vuelve a pedir');A().H.obFijo(['Alquiler']);A().H.obNext([]);click(e,'obFinish','');await sleep(30);a=e.store.cfg.app;
 ok(a.cuentas.length===2&&a.cuentas[0].saldo===1240.5&&a.cuentas[1].saldo===50&&!a.cuentas[1].principal,'añade el efectivo sin tocar el banco');
 ok(a.facturas.filter(f=>f.nombre==='Alquiler').length===1&&a.cobros.filter(f=>f.nombre==='Nómina').length===1,'sin duplicar Alquiler ni Nómina');
 // 2 new user
 e=makeEnv({version:{dinero:3},cfg:{}});await sleep(60);
 ok(ob()&&ob().step===0&&!ob().manual,'new user: wizard auto-shows');
 ok(/¡Hola!/.test(txt())&&/Comparte gastos en Juntos/.test(txt())&&/Tus cuentas, metas y deudas/.test(txt())&&/¿Cómo te llamas\?/.test(txt()),'paso 1: las 4 cosas grandes y el nombre');
 ok(!/👋|🏦|💼/.test(txt()),'sin emojis: iconos como en el resto de la app');
 ob().nombre='Lucía';A().H.obNext([]);await sleep(10);
 ok(e.store.cfg.app.nombre==='Lucía','se guarda el nombre');
 click(e,'obNext','no');await sleep(10);
 ok(!(e.store.cfg.app.cuentas||[]).length,'«Ahora no» en el banco: no se crea cuenta');
 click(e,'obNomina');A().H.obNomDia([],{value:'28'});click(e,'obMesModo','cobro');A().H.obNext([]);await sleep(10);
 ok(e.store.cfg.app.mesInicio&&e.store.cfg.app.mesInicio.modo==='cobro'&&e.store.cfg.app.mesInicio.dia===28,'eligió «Del 28 al 27»: tu mes va de nómina a nómina');
 ok(JSON.stringify(e.store.cfg.app.ingresos)===JSON.stringify(['Nómina','Transferencias','Wallapop/Vinted','Otros']),'ingresos de serie');
 ok(/¡Todo listo, Lucía!/.test(txt()),'«¡Todo listo, Lucía!»');
 click(e,'obFinish','');await sleep(600);
 a=e.store.cfg.app;
 ok(e.store.cfg.meta.onboarded&&a.altaApp&&a.compararVersiones===false&&a.novedadesVistas&&a.badgesVistos&&Object.keys(a.badgesVistos).length>10,'nuevo: sin novedades, etiquetas NUEVO ni botón «Antes»');
 ok(!e.doc.querySelector('#sheetHost .nov-hero'),'no sale la ventana de novedades');
 ok(/Pon el saldo de tu banco/.test(e.doc.querySelector('#content').textContent),'en Inicio, «Empieza aquí» propone poner el saldo del banco');
 // 3 skip at welcome
 e=makeEnv({version:{dinero:3},cfg:{}});await sleep(60);click(e,'obFinish','');await sleep(600);
 ok(e.store.cfg.meta.onboarded&&!ob()&&!(e.store.cfg.app.cuentas||[]).length&&!e.doc.querySelector('#sheetHost .nov-hero'),'saltar al principio: hecho, sin datos inventados y sin ventana de novedades');
 // 4 settings editor extras
 e=makeEnv({version:{dinero:3},cfg:{app:{categoriasGasto:[{nombre:'X'}],facturas:[{nombre:'Luz',importe:50}]},meta:{onboarded:true}}});await sleep(60);
 ok(!e.w.__APP__.S.onboarding,'onboarded user: no wizard');
 e.w.__APP__.H.goTab(['mas']);click(e,'openRecurrentes');click(e,'recEditar','factura','0');await sleep(10);
 const sel=e.doc.querySelector('#recTipo');sel.value='dia';sel.dispatchEvent(new e.w.Event('change',{bubbles:true}));
 const d=e.doc.querySelector('#recDia');ok(!!d,'editor shows día del mes');
 d.value='15';d.dispatchEvent(new e.w.Event('input',{bubbles:true}));click(e,'recGuardar');await sleep(20);
 ok(e.store.cfg.app.facturas[0].diaDelMes===15&&e.store.cfg.app.facturas[0].importe===50&&e.store.cfg.app.facturas[0].regla.t==='dia','editor saves día, keeps importe');
 click(e,'closeSheet');await sleep(250);click(e,'openListEditor','deudas');click(e,'listAdd','deudas');await sleep(20);
 ok(e.doc.querySelector('[data-change*="deudas|0|recurrencia"]')&&e.doc.querySelector('input[type=date]'),'deudas editor has fecha+recurrencia');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
