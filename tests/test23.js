// La ventana de novedades: versiones no vistas y recarga al volver si hay versión nueva
const {makeEnv,sleep}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const base={categoriasGasto:[{nombre:'X'}]};
(async()=>{
 // vieron el Parche 2 → ven el 8, el 7 y el 6 (máximo tres)
 const e=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-09'},base),meta:{onboarded:true}}});
 await sleep(700);
 let sh=e.doc.querySelector('#sheetHost').textContent;
 ok(/Parche 8/.test(sh)&&/Parche 7/.test(sh)&&/Parche 6/.test(sh)&&!/Parche 5 ·/.test(sh)&&!/Parche 4 ·/.test(sh)&&!/Parche 3 ·/.test(sh)&&!/Parche 2 ·/.test(sh),'quien vio el Parche 2 ve el 8, el 7 y el 6 (máximo tres)');
 ok(/Juntos, más claro/.test(sh)&&/como en el banco/.test(sh)&&/quién debe a quién/.test(sh)&&!/Categorías iguales/.test(sh),'y le salen Juntos con planes, las cuentas y Juntos que se perdió');
 ok(e.doc.querySelectorAll('.nov-dest-btn').length===2,'los botones solo en la versión nueva');
 ok(e.store.cfg.app.novedadesVistas==='2026-10-23','queda vista');
 // vio el Parche 6 → el 8 y el 7
 const p6=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-14'},base),meta:{onboarded:true}}});
 await sleep(700);
 sh=p6.doc.querySelector('#sheetHost').textContent;
 ok(/Parche 8/.test(sh)&&/Parche 7 ·/.test(sh)&&!/Parche 6 ·/.test(sh),'quien vio el Parche 6 ve el 8 y el 7');
 // vio el Parche 7 → solo el 8
 const p=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-17'},base),meta:{onboarded:true}}});
 await sleep(700);
 sh=p.doc.querySelector('#sheetHost').textContent;
 ok(/Parche 8/.test(sh)&&!/Parche 7 ·/.test(sh)&&/Ver novedades anteriores/.test(sh),'quien vio el Parche 7 ve solo el 8 (y puede ver las anteriores)');
 // ya la vio: no sale
 const a=makeEnv({novedades:true,cfg:{app:Object.assign({novedadesVistas:'2026-10-23'},base),meta:{onboarded:true}}});
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
