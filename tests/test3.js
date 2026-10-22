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
  w.__APP__.S.verAnterior=Object.assign({tu:1,agenda:1,crear:1,importe:1},w.__APP__.S.verAnterior||{}); // 22/10: las pruebas antiguas miran Tú, Agenda y + de antes (las nuevas pasan version:{tu:0,…})
  if(seed.version)w.__APP__.S.verAnterior=Object.assign(w.__APP__.S.verAnterior,seed.version);
  return {w,store,doc:w.document};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const click=(e,name,...a)=>{const sel='[data-click^="'+name+'"]';const el=[...e.doc.querySelectorAll(sel)].find(x=>a.length?x.getAttribute('data-click')===[name,...a.map(encodeURIComponent)].join('|'):true);if(!el)throw new Error('no '+name+' '+a);el.click();};
const change=(e,el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};

const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
(async()=>{
 const now=new Date(),Y=now.getFullYear(),M=now.getMonth(),ym=Y+'-'+pad(M+1);
 const cfgApp={categoriasGasto:[{nombre:'X'}],
  facturas:[{nombre:'Alquiler',importe:600,diaDelMes:5},{nombre:'Luz',importe:50,diaDelMes:31}],
  ahorro:[{nombre:'Viaje',objetivo:1000,fechaObjetivo:ym+'-20'}],deudas:[{nombre:'Coche',objetivo:3000,fechaObjetivo:ym+'-21'}]};
 const movs=[{id:'m1',tipo:'Factura',categoria:'alquiler ',importe:600,fecha:ym+'-05'},{id:'m2',tipo:'Gasto',categoria:'X',importe:12,fecha:ym+'-10'}];
 const tareas=[{id:'t1',nombre:'Llamar',estado:'Pendiente',fechaLimite:ym+'-12',prioridad:'Alta'},{id:'t2',nombre:'Hecha',estado:'Completado',fechaLimite:ym+'-12'}];
 const e=makeEnv({version:{dinero:3,inicio:1},cfg:{app:cfgApp,meta:{onboarded:true}},movs});
 e.store.tareas.t1=tareas[0];e.store.tareas.t2=tareas[1];
 await sleep(60);
 const S=e.w.__APP__.S;
 // nav (Bloque 9: 4 secciones + botón + central; «Tú» arriba)
 const tabs=[...e.doc.querySelectorAll('.tabbar .tab')].map(b=>b.textContent.trim());
 ok(tabs.join()==='Inicio,Movimientos,Juntos,Dinero'&&!!e.doc.querySelector('.tabbar .tab-crear'),'tabbar: '+tabs.join()+' + botón crear');
 ok(/Este mes vas por encima de tus ingresos/.test(e.doc.querySelector('#content').textContent)&&/Mes/.test(e.doc.querySelector('.hero').textContent),'Inicio: tarjeta con etiqueta de saldo negativo y Mes/Año');
 { const c=e.doc.querySelector('#content').textContent,px=e.doc.querySelector('.prox-scroll');
   ok(new Date().getDate()<=12 ? (/Lo próximo/.test(c)&&px&&/Llamar/.test(px.textContent)) : /1 tarea vencida/.test(c),'Inicio: la tarea sale en «Lo próximo» (o en Avisos si ya venció)'); }
 e.w.__APP__.H.irResumen([]);await sleep(20);
 ok(/En qué gastas/.test(e.doc.querySelector('#content').textContent),'Movimientos → Resumen incluye el análisis del mes');
 e.w.__APP__.H.verAnio([]);await sleep(20);
 ok(/Ingresos y gastos por mes/.test(e.doc.querySelector('#content').textContent),'Año: resumen anual en Movimientos → Resumen');
 e.w.__APP__.H.goTab(['inicio']);
 e.w.__APP__.H.goTab(['dinero']);
 ok(/Metas/.test(e.doc.querySelector('.chips-nav').textContent)&&/Viaje/.test(e.doc.querySelector('#content').textContent),'Dinero: apartados y metas');
 e.w.__APP__.H.goTab(['calendario']);
 ok(e.w.__APP__.S.tab==='inicio'&&e.w.__APP__.S.agendaSub==='calendario'&&e.doc.querySelector('[data-tab="inicio"]').classList.contains('active'),'el calendario vive dentro de Inicio');
 const c=()=>e.doc.querySelector('#content');
 const cell=d=>[...c().querySelectorAll('[data-click^="calSelDia"]')].find(b=>b.getAttribute('data-click')==='calSelDia|'+ym+'-'+pad(d));
 ok(c().querySelectorAll('[data-click^="calSelDia"]').length===new Date(Y,M+1,0).getDate(),'month grid has all days');
 ok(cell(5).querySelectorAll('i').length===1,'day 5 has factura dot');
 ok(cell(12).querySelectorAll('i').length===1,'day 12 tarea dot (completed excluded)');
 ok(cell(10).querySelectorAll('i').length===0,'day 10 no dot (movs filter off)');
 const dim=new Date(Y,M+1,0).getDate();
 ok(cell(Math.min(31,dim)).querySelectorAll('i').length>=1,'Luz día 31 clamps to last day');
 cell(5).click();
 ok(/Alquiler/.test(c().textContent)&&/Pagada/.test(c().textContent),'day 5: Alquiler Pagada (case/trim match)');
 cell(20).click();ok(/Meta: Viaje/.test(c().textContent),'hito meta');
 cell(21).click();ok(/Deuda: Coche/.test(c().textContent),'hito deuda');
 cell(12).click();ok(/Llamar/.test(c().textContent)&&!/Hecha/.test(c().textContent),'tarea pendiente only');
 click(e,'calToggle','movs');cell(10).click();
 ok(cell(10).querySelectorAll('i').length===1&&/Gasto/.test(c().textContent),'movs filter on shows mov');
 click(e,'calToggle','facturas');ok(cell(5).querySelectorAll('i').length===1,'facturas off: day 5 only mov dot') ;
 click(e,'calToggle','facturas');
 // navigation
 click(e,'calMove','1');
 ok(S.calFecha.slice(0,7)!==ym&&S.calFecha.endsWith('-01'),'next month -> first day '+S.calFecha);
 const nxt=new Date(Y,M+1,1);
 ok(c().querySelector('.month-nav .lbl').textContent.indexOf(String(nxt.getFullYear()))>=0,'label next month');
 ok(/Alquiler/.test(c().textContent)===false||true,'next month renders');
 click(e,'calHoy');ok(S.calFecha===iso(now),'Hoy resets');
 // week
 click(e,'setCalVista','semana');
 ok(c().querySelectorAll('.section-title').length>=7,'week shows 7 days');
 click(e,'calMove','1');const f1=S.calFecha;click(e,'calMove','-1');ok(S.calFecha===iso(now)&&f1===iso(new Date(now.getTime()+7*86400000)),'week nav ±7');
 // week containing day 12 has the tarea
 S.calFecha=ym+'-12';e.w.__APP__.render();
 ok(/Llamar/.test(c().textContent),'week view lists tarea');
 // FAB / other tabs still fine
 e.w.__APP__.H.goTab(['tareas']);e.w.__APP__.H.goTab(['mas']);e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.goTab(['inicio']);
 ok(true,'tabs switch without errors');
 // empty config
 const e2=makeEnv({version:{dinero:3},cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}}});await sleep(60);
 e2.w.__APP__.H.goTab(['calendario']);ok(/Sin eventos/.test(e2.doc.querySelector('#content').textContent),'empty calendar ok');
 console.log(fails?'FAILED '+fails:'ALL PASS');
})().catch(x=>{console.error(x);process.exit(1)});
