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
  w.__APP__.S.verAnterior=Object.assign({tu:1,agenda:1,crear:1,importe:1,dinero:4},w.__APP__.S.verAnterior||{}); // 22/10: las pruebas antiguas miran Tú, Agenda y + de antes (las nuevas pasan version:{tu:0,…})
  return {w,store,doc:w.document};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const click=(e,name,...a)=>{const sel='[data-click^="'+name+'"]';const el=[...e.doc.querySelectorAll(sel)].find(x=>a.length?x.getAttribute('data-click')===[name,...a.map(encodeURIComponent)].join('|'):true);if(!el)throw new Error('no '+name+' '+a);el.click();};
const change=(e,el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};

(async()=>{
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}],ahorro:[{nombre:'Inversions',objetivo:1000}]},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Ingreso',categoria:'Nómina',importe:2000,fecha:new Date().toISOString().slice(0,8)+'01'}]});
 // writable collection
 const orig=e.w.Data, listeners=[];let n=0;
 const notify=()=>listeners.forEach(f=>f());
 e.w.Data={doc:orig.doc,collection:(name)=>({
   onSnapshot:cb=>{ if(name!=='movimientos') return orig.collection(name).onSnapshot(cb);
     const f=()=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))});listeners.push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{e.store.movimientos['n'+(++n)]=d;notify()},
   doc:id=>({set:async d=>{e.store.movimientos[id]=d;notify()},delete:async()=>{delete e.store.movimientos[id];notify()}})})};
 await sleep(60);
 const S=e.w.__APP__.S,doc=e.doc,c=()=>doc.querySelector('#content');
 const setv=(sel,v)=>{const el=doc.querySelector(sel);el.value=v;el.dispatchEvent(new e.w.Event('input',{bubbles:true}));el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovVista(['lista']);
 ok([...doc.querySelectorAll('.pill')].some(b=>b.textContent==='Inversión'),'filtro Inversión existe');
 e.w.__APP__.H.onFabAntiguo([]);
 ok([...doc.querySelectorAll('#tipoToggle button')].some(b=>b.textContent==='Inversión'),'tipo Inversión en formulario');
 ok(!doc.querySelector('#fTipoActivo'),'sin tipo de activo para Gasto');
 click(e,'pickTipo','Inversión');
 ok(!!doc.querySelector('#fTipoActivo')&&/Activo/.test(doc.querySelector('#catLabel').textContent),'Inversión muestra tipo de activo y etiqueta Activo');
 ok([...doc.querySelectorAll('#fTipoActivo option')].map(o=>o.textContent).join()==='—,Acción,ETF,Bono,Criptomoneda,Otro','opciones de activo');
 // validation
 setv('#fImporte','500');setv('#fCategoria','VWCE');click(e,'saveMov');await sleep(20);
 ok(Object.keys(e.store.movimientos).length===1,'sin tipo de activo: no guarda');
 setv('#fTipoActivo','ETF');click(e,'saveMov');await sleep(30);
 let inv=Object.values(e.store.movimientos).filter(m=>m.tipo==='Inversión');
 ok(inv.length===1&&inv[0].categoria==='VWCE'&&inv[0].tipoActivo==='ETF'&&inv[0].importe===500,'inversión guardada con activo y tipo');
 // more
 for(const [imp,cat,ta] of [[300,'vwce ','ETF'],[200,'Bitcoin','Criptomoneda']]){
  e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');setv('#fImporte',String(imp));setv('#fCategoria',cat);setv('#fTipoActivo',ta);click(e,'saveMov');await sleep(30);}
 e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');
 ok(/VWCE/.test(doc.querySelector('#catChips').textContent)&&/Bitcoin/.test(doc.querySelector('#catChips').textContent),'chips sugieren activos previos');
 click(e,'closeSheet');
 // kpis
 const k=e.w.__APP__.kpisMes(new Date().getFullYear(),new Date().getMonth()+1);
 ok(k.inversion===1000&&k.disponible===1000,'kpis: inversión resta de disponible ('+k.inversion+','+k.disponible+')');
 // view
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.setInicioSub(['analisis']);e.w.__APP__.H.setAnalisisSub(['inversiones']);
 const t=c().textContent;
 ok(/1000,00 €|1\.000,00 €/.test(t)||/1000/.test(t),'total invertido 1000');
 ok(/VWCE/.test(t)&&/800,00 €/.test(t)&&/2 aportaciones/.test(t),'VWCE agrupa mayúsc/espacios: 800, 2 aportaciones');
 ok(/Bitcoin/.test(t)&&/Criptomoneda/.test(t)&&/ETF/.test(t),'por tipo de activo');
 // verActivo
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.setInicioSub(['analisis']);e.w.__APP__.H.setAnalisisSub(['inversiones']);click(e,'verActivo','VWCE');
 ok(S.tab==='movimientos'&&S.movFiltroTipo==='Inversión'&&doc.querySelectorAll('#movList .row').length===2,'verActivo filtra a 2 movimientos');
 // cambiar tipo de inversión a gasto limpia tipoActivo
 const id=Object.keys(e.store.movimientos).find(i=>e.store.movimientos[i].categoria==='Bitcoin');
 S.movQuery='';S.movFiltroTipo='Todos';e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovVista(['lista']);click(e,'openMovForm',id);ok(doc.querySelector('#fTipoActivo').value==='Criptomoneda','editar precarga tipo activo');
 click(e,'pickTipo','Gasto');ok(!doc.querySelector('#fTipoActivo'),'cambiar a Gasto oculta campo');click(e,'saveMov');await sleep(30);
 ok(e.store.movimientos[id].tipo==='Gasto'&&e.store.movimientos[id].tipoActivo===null,'tipoActivo limpiado al cambiar de tipo');
 // regresión: gasto normal no añade campo tipoActivo
 e.w.__APP__.H.onFabAntiguo([]);setv('#fImporte','10');setv('#fCategoria','X');click(e,'saveMov');await sleep(30);
 const g=Object.values(e.store.movimientos).find(m=>m.categoria==='X'&&m.importe===10);
 ok(g&&!('tipoActivo' in g),'gasto normal no lleva tipoActivo (no requiere columna)');
 console.log(fails?'FAILED '+fails:'ALL PASS');
})().catch(x=>{console.error(x);process.exit(1)});
