// La ventana de novedades: versiones no vistas y recarga al volver si hay versión nueva
const {makeEnv,sleep}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const base={categoriasGasto:[{nombre:'X'}]};
(async()=>{
 // Alfredo / Patricia: vieron el Parche 2 → ven el 4 y también el 3
 const e=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-09'},base),meta:{onboarded:true}}});
 await sleep(700);
 let sh=e.doc.querySelector('#sheetHost').textContent;
 ok(/Parche 6/.test(sh)&&/Parche 5/.test(sh)&&/Parche 4/.test(sh)&&!/Parche 3 ·/.test(sh)&&!/Parche 2 ·/.test(sh),'quien vio el Parche 2 ve el 6, el 5 y el 4 (máximo tres)');
 ok(/quién debe a quién/.test(sh)&&/Categorías iguales/.test(sh),'y le salen Juntos y las categorías que se perdió');
 ok(e.doc.querySelectorAll('.nov-dest-btn').length===2,'los botones solo en la versión nueva');
 ok(e.store.cfg.app.novedadesVistas==='2026-10-14','queda vista');
 // Paloma: vio el Parche 3 → solo el 4
 const p=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-10'},base),meta:{onboarded:true}}});
 await sleep(700);
 sh=p.doc.querySelector('#sheetHost').textContent;
 ok(/Parche 6/.test(sh)&&/Parche 5/.test(sh)&&/Parche 4/.test(sh)&&!/Parche 3 ·/.test(sh),'quien vio el Parche 3 ve el 6, el 5 y el 4');
 // Álvaro ya la vio: no sale
 const a=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-14'},base),meta:{onboarded:true}}});
 await sleep(700);
 ok(!a.doc.querySelector('#sheetHost .nov-hero'),'si ya la viste, no vuelve a salir');

 // Recarga al volver si hay una versión nueva publicada
 let etag='"v1"',recargas=0,heads=0;
 const r=makeEnv({url:'https://urlife-zeta.vercel.app/',cfg:{app:base,meta:{onboarded:true}},pre:w=>{
   w.fetch=async(u,o)=>{heads++;return {ok:true,headers:{get:k=>k==='etag'?etag:null}}};
 }});
 // jsdom no deja recargar: lo interceptamos
 await sleep(80);
 const w=r.w;let hidden=false;Object.defineProperty(w.document,'hidden',{get:()=>hidden,configurable:true});
 const realNow=w.Date.now;let t=realNow();w.Date.now=()=>t;
 const vis=async(h,dt)=>{hidden=h;t+=dt||0;w.document.dispatchEvent(new w.Event('visibilitychange'));await sleep(20);};
 // espiar reload
 let recargo=false;const ce=console.error;console.error=(...x)=>{if(/navigation/i.test(String(x[0]&&x[0].message||x[0])))recargo=true;else ce(...x)};
 const reloadSpy=()=>recargo;
 ok(heads>=1,'al abrir mira qué versión hay');
 await vis(true);await vis(false,60000);
 ok(!reloadSpy(),'misma versión: no recarga');
 etag='"v2"';
 await vis(true);await vis(false,5000);
 ok(!reloadSpy(),'si vuelves enseguida (menos de 15 s), no mira');
 await vis(true);
 r.w.__APP__.H.openMovForm([]);await sleep(20);
 await vis(false,60000);
 ok(!reloadSpy(),'con un formulario abierto no recarga (no pierdes lo que escribías)');
 r.w.__APP__.H.closeSheet([]);await sleep(400);
 await vis(true);await vis(false,60000);
 ok(reloadSpy(),'hay versión nueva y vuelves a la app: se recarga sola');
 console.log(fails?'FAILS '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(err=>{console.error(err);process.exit(1)});
