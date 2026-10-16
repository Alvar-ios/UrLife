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
  return {w,store,doc:w.document};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const click=(e,name,...a)=>{const sel='[data-click^="'+name+'"]';const el=[...e.doc.querySelectorAll(sel)].find(x=>a.length?x.getAttribute('data-click')===[name,...a.map(encodeURIComponent)].join('|'):true);if(!el)throw new Error('no '+name+' '+a);el.click();};
const change=(e,el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};
(async()=>{
 // 1 existing user
 let e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Comida',presupuesto:100}],ingresos:['Nómina']}}});
 await sleep(60);
 ok(!e.w.__APP__.S.onboarding,'existing user: no wizard');
 ok(e.store.cfg.meta&&e.store.cfg.meta.onboarded&&e.store.cfg.meta.auto,'existing user: grandfathered meta');
 ok(JSON.stringify(e.store.cfg.app.categoriasGasto)==='[{"nombre":"Comida","presupuesto":100}]','existing config untouched');
 ok(/Repetir asistente/.test(e.doc.body.innerHTML.length?(e.w.__APP__.H.goTab(['mas']),e.doc.body.innerHTML):''),'Más has manual button first');
 ok(e.doc.querySelector('#content').innerHTML.indexOf('Repetir asistente')>e.doc.querySelector('#content').innerHTML.indexOf('profile-tile'),'Tú: el asistente está en el grupo App');
 // manual
 click(e,'startOnboardingManually');
 ok(e.w.__APP__.S.onboarding.cats.length===0&&e.w.__APP__.S.onboarding.catsCustom[0]==='Comida','manual: prefilled w/ existing (custom)');
 click(e,'obNext');click(e,'obNext');
 click(e,'obRowAdd','facturas');
 let inputs=[...e.doc.querySelectorAll('[data-change^="obRowChange|facturas|0"]')];
 change(e,inputs[0],'Alquiler');change(e,inputs[1],'600');change(e,inputs[2],'5');
 click(e,'obNext');
 click(e,'obRowAdd','ahorro');click(e,'obRowAdd','deudas');
 change(e,e.doc.querySelector('[data-change^="obRowChange|ahorro|0|nombre"]'),'Viaje');
 change(e,e.doc.querySelector('[data-change^="obRowChange|ahorro|0|objetivo"]'),'1500');
 change(e,e.doc.querySelector('[data-change^="obRowChange|ahorro|0|fechaObjetivo"]'),'2027-06-01');
 change(e,e.doc.querySelector('[data-change^="obRowChange|deudas|0|nombre"]'),'Coche');
 change(e,e.doc.querySelector('[data-change^="obRowChange|deudas|0|recurrencia"]'),'mensual');
 click(e,'obRowAdd','deudas');click(e,'obRowRemove','deudas','1');
 click(e,'obNext');
 click(e,'obToggleProyecto','Vinted');click(e,'obToggleProyecto','Otro');
 change(e,e.doc.querySelector('[data-change^="obProyectoOtroInput"]'),'eBay');
 click(e,'obFinish','save');await sleep(30);
 const a=e.store.cfg.app;
 ok(!e.w.__APP__.S.onboarding,'wizard closed');
 ok(a.categoriasGasto.length===1&&a.categoriasGasto[0].presupuesto===100,'manual: existing cat + presupuesto preserved');
 ok(a.facturas[0].nombre==='Alquiler'&&a.facturas[0].importe===600&&a.facturas[0].diaDelMes===5,'factura saved w/ día');
 ok(a.ahorro[0].fechaObjetivo==='2027-06-01'&&a.ahorro[0].objetivo===1500,'ahorro saved w/ fecha');
 ok(a.deudas.length===1&&a.deudas[0].recurrencia==='mensual','deuda saved, blank removed');
 ok(a.proyectosInteres.join()==='Vinted,eBay','proyectos saved');
 ok(a.ingresos[0]==='Nómina','ingresos preserved');
 ok(e.doc.querySelector('.tabbar'),'app shell restored');
 // 2 new user
 e=makeEnv({cfg:{}});await sleep(60);
 ok(e.w.__APP__.S.onboarding&&e.w.__APP__.S.onboarding.step===0,'new user: wizard auto-shows');
 click(e,'obNext');
 ok(/iguales para todos/.test(e.doc.querySelector('#app').textContent)&&/no podrás compartir/.test(e.doc.querySelector('#app').textContent),'categorías estándar de serie y aviso de personalizadas');
 e.doc.querySelector('#obCustomCat').value='Gimnasio';click(e,'obAddCustomCat');
 ok(!e.w.__APP__.S.onboarding.catsCustom.length,'«Gimnasio» ya está en las estándar (Deporte): no se añade');
 e.doc.querySelector('#obCustomCat').value='Golf';click(e,'obAddCustomCat');
 ok(e.w.__APP__.S.onboarding.catsCustom[0]==='Golf','custom cat added');
 click(e,'obNext');click(e,'obToggleIngreso','Nómina');
 click(e,'obFinish','save');await sleep(30);
 const c=e.store.cfg.app.categoriasGasto.map(x=>x.nombre);
 ok(c.length===1&&c[0]==='Golf','new: solo se guarda la personalizada (las estándar las tiene todo el mundo) '+c.join());
 ok(e.store.cfg.meta.onboarded,'new: meta onboarded');
 // 3 skip at welcome
 e=makeEnv({cfg:{}});await sleep(60);click(e,'obFinish','none');await sleep(30);
 ok(!e.store.cfg.app&&e.store.cfg.meta.onboarded&&!e.w.__APP__.S.onboarding,'skip at welcome: marks done, no data written');
 // 4 settings editor extras
 e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}],facturas:[{nombre:'Luz',importe:50}]},meta:{onboarded:true}}});await sleep(60);
 ok(!e.w.__APP__.S.onboarding,'onboarded user: no wizard');
 e.w.__APP__.H.goTab(['mas']);click(e,'openRecurrentes');click(e,'recEditar','factura','0');await sleep(10);
 const sel=e.doc.querySelector('#recTipo');sel.value='dia';sel.dispatchEvent(new e.w.Event('change',{bubbles:true}));
 const d=e.doc.querySelector('#recDia');ok(!!d,'editor shows día del mes');
 d.value='15';d.dispatchEvent(new e.w.Event('input',{bubbles:true}));click(e,'recGuardar');await sleep(20);
 ok(e.store.cfg.app.facturas[0].diaDelMes===15&&e.store.cfg.app.facturas[0].importe===50&&e.store.cfg.app.facturas[0].regla.t==='dia','editor saves día, keeps importe');
 click(e,'closeSheet');await sleep(250);click(e,'openListEditor','deudas');click(e,'listAdd','deudas');await sleep(20);
 ok(e.doc.querySelector('[data-change*="deudas|0|recurrencia"]')&&e.doc.querySelector('input[type=date]'),'deudas editor has fecha+recurrencia');
 console.log(fails?'FAILED '+fails:'ALL PASS');
})().catch(x=>{console.error(x);process.exit(1)});
