// Inversiones (13/10): se ven todas sin vincular; una inversión puede estar en varias metas; botón «Todas las inversiones»
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const movs=[
 {id:'i1',tipo:'Inversión',categoria:'MSCI World',activoId:'EUNL',participaciones:10,importe:1000,fecha:'2026-09-01',tipoActivo:'ETF'},
 {id:'i2',tipo:'Inversión',categoria:'Bitcoin',activoId:'BTC',participaciones:0.001,importe:60,fecha:'2026-09-02',tipoActivo:'Cripto',metaId:'a'},
 {id:'i3',tipo:'Inversión',categoria:'MSCI World',activoId:'EUNL',participaciones:5,importe:500,fecha:'2026-09-03',tipoActivo:'ETF'},
 {id:'s1',tipo:'Ahorro',categoria:'Casa',metaId:'b',importe:2000,fecha:'2026-09-04'}];
(async()=>{
 const P={EUNL:130,BTC:70000};
 const pre=w=>{w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};w.fetch=async(u,o)=>{const b=JSON.parse(o.body);let j={};if(b.accion==='valorar'){const v={};b.ids.forEach(id=>v[id]={activo:{id},cierre_eur:P[id],cierre:P[id],moneda:'EUR',fecha_precio:'2026-10-13'});j={valores:v}}else if(b.accion==='historico')j={series:{}};return {ok:true,status:200,json:async()=>j}}};
 const e=makeEnv({cfg:{app:{ahorro:[{id:'a',nombre:'Libertad',objetivo:60000,fechaObjetivo:'2035-01-01'},{id:'b',nombre:'Casa',objetivo:30000,fechaObjetivo:'2030-01-01'}]},meta:{onboarded:true}},movs,pre});
 e.w.Auth.getSession=async()=>({access_token:'t'});
 const orig=e.w.Data,L=[];const notify=()=>L.forEach(f=>f());
 e.w.Data={doc:orig.doc,collection:n=>n!=='movimientos'?orig.collection(n):({onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))});L.push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{e.store.movimientos.n1=d;notify();return {id:'n1'}},doc:id=>({set:async d=>{e.store.movimientos[id]=d;notify()},delete:async()=>{delete e.store.movimientos[id];notify()}})})};
 await sleep(150);
 const A=e.w.__APP__,H=A.H,doc=e.doc,txt=()=>doc.querySelector('#content').textContent,sh=()=>doc.querySelector('#sheetHost').textContent;
 H.goTab(['dinero']);H.setDineroSub(['inversiones']);await sleep(150);
 ok(/1\.560 €|1\.560,00/.test(txt())&&/MSCI World/.test(txt())&&/Bitcoin/.test(txt()),'Inversiones enseña TODAS (vinculadas o no): total 1.560');
 H.setDineroSub(['metas']);await sleep(100);
 let r=A.metasStats().find(x=>x.id==='b');
 ok(r.invAport===0,'la meta Casa no tiene inversiones aún');
 H.metaAsignar(['b']);await sleep(20);
 ok(!!doc.querySelector('[data-click="asigTodasInv"]')&&/Todas las inversiones \(3\)/.test(sh()),'botón «Todas las inversiones (3)» en el vínculo');
 click(e,'asigTodasInv');await sleep(10);
 ok([...doc.querySelectorAll('#sheetHost .asig-row input')].filter(i=>i.checked).length===4,'marca las 3 inversiones (+ el apartado ya vinculado)');
 ok(/también en «Libertad»/.test(sh()),'avisa de que Bitcoin también está en «Libertad»');
 click(e,'asigGuardar');await sleep(80);
 const m=e.store.movimientos;
 ok(JSON.stringify(m.i2.metaIds)==='["a","b"]'&&m.i2.metaId==='a','Bitcoin queda en Libertad Y en Casa (no pierde la primera)');
 ok(JSON.stringify(m.i1.metaIds)==='["b"]'&&m.i1.metaId==='b','las otras, en Casa');
 H.closeSheet([]);await sleep(250);
 const rb=A.metasStats().find(x=>x.id==='b'),ra=A.metasStats().find(x=>x.id==='a');
 ok(rb.invAport===1560&&ra.invAport===60,'Casa cuenta 1.560 invertidos y Libertad sigue contando su Bitcoin: '+rb.invAport+' / '+ra.invAport);
 H.goTab(['dinero']);H.setDineroSub(['inversiones']);await sleep(100);
 ok(/1\.560/.test(txt()),'Inversiones sigue enseñando el mismo total (no se duplica)');
 const pat=A.patrimonio?A.patrimonio():null;
 // quitar de una sola meta
 H.setDineroSub(['metas']);await sleep(50);
 H.metaAsignar(['a']);await sleep(20);
 {const el=[...doc.querySelectorAll('#sheetHost .asig-row input')].find(i=>/asigMov\|i2/.test(i.getAttribute('data-change')||''));el.checked=false;el.dispatchEvent(new e.w.Event('change',{bubbles:true}));}await sleep(10);click(e,'asigGuardar');await sleep(80);
 ok(JSON.stringify(e.store.movimientos.i2.metaIds)==='["b"]'&&e.store.movimientos.i2.metaId==='b','quitarla de Libertad la deja solo en Casa');
 H.closeSheet([]);await sleep(250);
 // formulario: varias metas con chips
 H.openMovForm([]);await sleep(10);click(e,'pickTipo','Inversión');await sleep(10);
 click(e,'pickMeta','a');click(e,'pickMeta','b');await sleep(5);
 ok([...doc.querySelectorAll('#metaChips .chip.active')].length===2,'en el formulario de inversión se pueden marcar varias metas');
 click(e,'pickMeta','');await sleep(5);
 ok([...doc.querySelectorAll('#metaChips .chip.active')].length===1&&/Sin meta/.test(doc.querySelector('#metaChips .chip.active').textContent),'«Sin meta» las quita todas');
 click(e,'pickMeta','a');click(e,'pickMeta','b');
 console.log(fails?'FALLOS '+fails:'TODO OK');process.exit(fails?1:0)})();
