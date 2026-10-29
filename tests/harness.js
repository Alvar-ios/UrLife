const {JSDOM}=require('jsdom'),fs=require('fs');
function makeEnv(seed){ // seed: {config:{app,meta}, movs:[]}
  const store={movimientos:{},tareas:{},golf:{},cfg:Object.assign({},seed.cfg||{})};
  if(store.cfg.app&&!seed.novedades&&!('novedadesVistas' in store.cfg.app))store.cfg.app=Object.assign({novedadesVistas:'9999-12-31'},store.cfg.app);
  (seed.movs||[]).forEach(m=>store.movimientos[m.id]=m);
  const subs=[];const notify=()=>subs.forEach(f=>f());
  const mkDoc=(k)=>({
    get:async()=>({exists:!!store.cfg[k],data:()=>store.cfg[k]}),
    set:async v=>{store.cfg[k]=v;notify()},
    update:async p=>{store.cfg[k]=Object.assign({},store.cfg[k]||{},p);notify()},
    onSnapshot:(cb)=>{const f=()=>cb({exists:!!store.cfg[k],data:()=>store.cfg[k]});subs.push(f);setTimeout(f,0);return()=>{}}});
  const Data={doc:p=>mkDoc(p.split('/')[1]),collection:n=>({onSnapshot:cb=>{setTimeout(()=>{cb({docs:Object.entries(store[n]).map(([id,v])=>({id:id,data:()=>v}))})},0);return()=>{}},add:async d=>{const id='n'+Math.random().toString(36).slice(2,8);store[n][id]=JSON.parse(JSON.stringify(d));return {id}},doc:id=>({id,set:async d=>{store[n][id]=JSON.parse(JSON.stringify(d))},delete:async()=>{delete store[n][id]}})})};
  const Auth={_f:[],onChange(f){this._f.push(f);setTimeout(()=>f(seed.session||{user:{email:'t@t.com'}}),0)},signIn(){},signOut(){},resetPassword(){}};
  const dom=new JSDOM('<div id="app"></div>',Object.assign({runScripts:'outside-only',pretendToBeVisual:true},seed.url?{url:seed.url}:{}));
  const w=dom.window;w.Auth=Auth;w.Data=Data;w.scrollTo=()=>{};
  if(seed.pre)seed.pre(w);
  w.eval(fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8'));
  w.__APP__.S.verAnterior=Object.assign({tu:1,agenda:1,crear:1,importe:1,movResumen:0,dinero:4,balance:1},w.__APP__.S.verAnterior||{}); // 22/10: las pruebas antiguas miran Tú, Agenda y + de antes (las nuevas pasan version:{tu:0,…})
  if(seed.abrirVersiones)Object.values(w.__APP__.VERSIONES).forEach(v=>{delete v.cerrada;}); // pruebas del propio botón «Antes»
  if(seed.version)w.__APP__.S.verAnterior=Object.assign(w.__APP__.S.verAnterior||{},seed.version); // p. ej. {movResumen:2}
  if(seed.verAnteriorInicio)w.__APP__.S.verAnterior=Object.assign(w.__APP__.S.verAnterior,{inicio:2}); // pruebas de la versión anterior de Inicio (botón «Antes»)
  return {w,store,doc:w.document};
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const click=(e,name,...a)=>{const sel='[data-click^="'+name+'"]';const el=[...e.doc.querySelectorAll(sel)].find(x=>a.length?x.getAttribute('data-click')===[name,...a.map(encodeURIComponent)].join('|'):true);if(!el)throw new Error('no '+name+' '+a);el.click();};
const change=(e,el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};


module.exports={makeEnv,sleep,ok:(c,m)=>{ok(c,m)},click,change,fails:()=>fails};
