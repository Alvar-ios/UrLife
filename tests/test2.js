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
  return {w,store,doc:w.document};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const click=(e,name,...a)=>{const sel='[data-click^="'+name+'"]';const el=[...e.doc.querySelectorAll(sel)].find(x=>a.length?x.getAttribute('data-click')===[name,...a.map(encodeURIComponent)].join('|'):true);if(!el)throw new Error('no '+name+' '+a);el.click();};
const change=(e,el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};

const dago=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
(async()=>{
 const mv=(id,cat,imp,ago,tipo)=>({id,tipo:tipo||'Ahorro',categoria:cat,importe:imp,fecha:dago(ago)});
 const ahorro=[
  {nombre:'Viaje',objetivo:1200,fechaObjetivo:'2027-10-07'},
  {nombre:'Coche',objetivo:6000,fechaObjetivo:'2027-10-07'},
  {nombre:'Casa',objetivo:1500,fechaObjetivo:'2027-10-07',yaAhorrado:0},
  {nombre:'Hecha',objetivo:100,yaAhorrado:100,fechaObjetivo:'2027-10-07'},
  {nombre:'SinFecha',objetivo:500},
  {nombre:'Pasada',objetivo:500,fechaObjetivo:'2026-01-01'},
 ];
 const movs=[mv('a','viaje ',110,10),mv('b','Viaje',220,40),mv('c','Viaje',999,5,'Gasto'),mv('d','Coche',300,20),mv('e','Casa',240,30),mv('f','Casa',100,200),mv('g','Pasada',100,300)];
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}],ahorro},meta:{onboarded:true}},movs});await sleep(60);
 e.w.__APP__.H.goTab(['analisis']);e.w.__APP__.H.setAnalisisSub(['metas']);
 const cards=[...e.doc.querySelectorAll('#content .card')];
 const by=n=>cards.find(c=>c.querySelector('.meta-nom')&&c.querySelector('.meta-nom').textContent===n);
 const txt=n=>by(n)?by(n).textContent:'';
 const col=n=>by(n).querySelector('.anillo-v').getAttribute('stroke');
 ok(/Vas bien/.test(txt('Viaje'))&&/income/.test(col('Viaje')),'Viaje verde (case/trim match, Gasto ignorado)');
 ok(/330,00 € de 1\.200,00 €/.test(txt('Viaje'))&&/28%/.test(txt('Viaje')),'Viaje acumulado y %: '+txt('Viaje').slice(0,60));
 console.log(txt('Viaje'));ok(/\/mes/.test(txt('Viaje')),'Viaje cuota mensual ~100');
 ok(/Al ritmo actual no llegarías/.test(txt('Coche'))&&/expense/.test(col('Coche')),'Coche rojo');
 ok(/Ritmo justo/.test(txt('Casa'))&&/accent/.test(col('Casa')),'Casa amarillo (ritmo 80 vs ~97)');
 ok(/Casa/.test(txt('Casa'))&&/340,00 € de/.test(txt('Casa')),'Casa acumulado incluye movs antiguos (340)');
 ok(/Meta lograda/.test(txt('Hecha')),'Hecha lograda');
 ok(/Sin fecha objetivo/.test(txt('SinFecha'))&&/text-faint/.test(col('SinFecha')),'SinFecha gris');
 ok(/ya pasó/.test(txt('Pasada'))&&/expense/.test(col('Pasada')),'Pasada roja');
 // inicio
 e.w.__APP__.H.goTab(['dinero']);
 ok(/Colchón|Metas/.test(e.doc.querySelector('#content').innerHTML),'Dinero muestra metas');
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.goMetas([]);ok(e.w.__APP__.S.tab==='dinero'&&e.w.__APP__.S.dineroSub==='metas','goMetas navega a Dinero → Metas');
 // editor yaAhorrado
 e.w.__APP__.H.goTab(['mas']);await sleep(30);click(e,'openMetas');
 const id1=e.store.cfg.app.ahorro[1].id;ok(!!id1,'las metas reciben identificador');
 click(e,'metaEditar',id1);const y=e.doc.querySelector('#mFuera');ok(!!y,'editor yaAhorrado');
 y.value='500';click(e,'metaGuardar');await sleep(20);
 ok(e.store.cfg.app.ahorro[1].yaAhorrado===500&&e.store.cfg.app.ahorro[1].objetivo===6000,'yaAhorrado guardado sin tocar objetivo');
 // sin metas
 const e2=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}}});await sleep(60);
 ok(!/Metas de ahorro/.test(e2.doc.querySelector('#content').innerHTML),'Inicio sin metas: no sección');
 e2.w.__APP__.H.goTab(['analisis']);e2.w.__APP__.H.setAnalisisSub(['metas']);ok(/Todavía no tienes metas/.test(e2.doc.querySelector('#content').textContent),'vacío ok');
 console.log(fails?'FAILED '+fails:'ALL PASS');
})().catch(x=>{console.error(x);process.exit(1)});
