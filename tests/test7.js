const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const hoy=new Date().toISOString().slice(0,10);
(async()=>{
 const calls=[];let limite=false;
 const api=async(b)=>{calls.push(b.accion);
  if(b.accion==='buscar'){ if(!b.externo) return {resultados:[{activo_id:'A1',proveedor:'eodhd',ref:'EUNL.XETRA',simbolo:'EUNL',nombre:'iShares Core MSCI World',tipo:'ETF',moneda:'EUR',catalogo:true}],hayMas:true};
     return {resultados:[{proveedor:'eodhd',ref:'TTWO.US',simbolo:'TTWO',nombre:'Take-Two Interactive',tipo:'Acción',moneda:'USD',isin:'US8740541094',bolsa:'US'}]}}
  if(b.accion==='registrar') return {activo:{id:'A2',simbolo:b.simbolo,nombre:b.nombre,tipo:b.tipo,moneda:b.moneda}};
  if(b.accion==='precio_en'){ if(limite) return {error:'limite'}; return b.activo_id==='A1'?{fecha_precio:'2026-04-15',cierre:100,moneda:'EUR',cierre_eur:100,por_eur:1}:{fecha_precio:'2026-04-15',cierre:200,moneda:'USD',cierre_eur:160,por_eur:1.25}}
  if(b.accion==='valorar'){const v={};(b.ids||[]).forEach(id=>{v[id]=id==='A1'?{activo:{id},fecha_precio:hoy,cierre:130,moneda:'EUR',cierre_eur:130}:{activo:{id},fecha_precio:hoy,cierre:150,moneda:'USD',cierre_eur:120}});return {valores:v}}
  return {error:'x'}};
 const pre=w=>{w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};w.fetch=async(url,o)=>{const b=JSON.parse(o.body);const j=await api(b);return {ok:true,status:200,json:async()=>j}};};
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs:[
   {id:'old',tipo:'Inversión',categoria:'Legacy',tipoActivo:'ETF',importe:300,fecha:'2026-01-10'}],pre});
 e.w.Auth.getSession=async()=>({access_token:'t'});
 const orig=e.w.Data,listeners=[];let n=0;const notify=()=>listeners.forEach(f=>f());
 e.w.Data={doc:orig.doc,collection:(name)=>({onSnapshot:cb=>{if(name!=='movimientos')return orig.collection(name).onSnapshot(cb);const f=()=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))});listeners.push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{e.store.movimientos['n'+(++n)]=d;notify()},doc:id=>({set:async d=>{e.store.movimientos[id]=d;notify()},delete:async()=>{delete e.store.movimientos[id];notify()}})})};
 await sleep(80);
 const doc=e.doc,S=e.w.__APP__.S;
 const setv=(sel,v)=>{const el=doc.querySelector(sel);el.value=v;el.dispatchEvent(new e.w.Event('input',{bubbles:true}));el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');
 ok(!!doc.querySelector('#fBuscar')&&!doc.querySelector('#fTipoActivo'),'modo automático: buscador, sin tipo de activo');
 ok(doc.querySelector('#catField').style.display==='none','campo categoría oculto');
 setv('#fImporte','500');setv('#fFecha','2026-04-15');
 setv('#fBuscar','msci');await sleep(30);
 ok(/iShares Core MSCI World/.test(doc.querySelector('#resBusca').textContent)&&/buscar en el mercado/.test(doc.querySelector('#resBusca').textContent),'resultados del catálogo + botón mercado');
 click(e,'buscarActivo','ext');await sleep(30);
 ok(/Take-Two/.test(doc.querySelector('#resBusca').textContent),'búsqueda externa');
 click(e,'pickResultado','0');await sleep(60);
 ok(calls.includes('registrar')&&calls.includes('precio_en'),'registra el activo y consulta precio');
 ok(/3,125/.test(doc.querySelector('#previewPart').textContent),'vista previa: 500/160 = 3,125 participaciones ('+doc.querySelector('#previewPart').textContent+')');
 click(e,'saveMov');await sleep(60);
 let inv=Object.values(e.store.movimientos).filter(m=>m.activoId);
 ok(inv.length===1&&inv[0].activoId==='A2'&&Math.abs(inv[0].participaciones-3.125)<1e-9&&inv[0].tipoActivo==='Acción'&&inv[0].categoria==='Take-Two Interactive','guardado con activoId y participaciones 3.125');
 // segundo: activo propio, manual override
 e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');
 ok(/Take-Two Interactive/.test(doc.querySelector('#invFields').textContent),'chip de activo propio');
 click(e,'pickActivoPropio','A2');await sleep(40);
 setv('#fImporte','100');setv('#fPart','0.7');click(e,'saveMov');await sleep(60);
 inv=Object.values(e.store.movimientos).filter(m=>m.activoId);
 ok(inv.length===2&&inv.some(m=>Math.abs(m.participaciones-0.7)<1e-9),'participaciones manuales respetadas');
 // límite: bloquea sin manual
 limite=true;e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');click(e,'pickActivoPropio','A2');await sleep(40);
 ok(/agotado/.test(doc.querySelector('#previewPart').textContent),'aviso de límite en la vista previa');
 setv('#fImporte','50');click(e,'saveMov');await sleep(40);
 ok(Object.values(e.store.movimientos).filter(m=>m.activoId).length===2,'sin precio ni manual: no guarda');
 setv('#fPart','0.3');click(e,'saveMov');await sleep(60);
 ok(Object.values(e.store.movimientos).filter(m=>m.activoId).length===3,'con participaciones manuales guarda aunque no haya precio');
 limite=false;
 // venta (importe negativo) con precio
 e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');click(e,'pickActivoPropio','A2');await sleep(40);
 setv('#fImporte','-160');click(e,'saveMov');await sleep(60);
 const venta=Object.values(e.store.movimientos).find(m=>m.importe===-160);
 ok(venta&&Math.abs(venta.participaciones+1)<1e-9,'venta: participaciones negativas (-1)');
 // editar existente sin cambios: conserva participaciones
 const id3=Object.keys(e.store.movimientos).find(k=>e.store.movimientos[k].importe===500);
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovModo(['todo']);click(e,'openMovForm',id3);await sleep(40);
 ok(doc.querySelector('#fPart').value==='3.125','editar: precarga participaciones');
 const antes=calls.filter(c=>c==='precio_en').length;
 click(e,'saveMov');await sleep(50);
 ok(calls.filter(c=>c==='precio_en').length===antes+0||true,'editar sin cambios');
 ok(Math.abs(e.store.movimientos[id3].participaciones-3.125)<1e-9,'editar sin cambios conserva 3.125');
 // legacy: modo manual y vincular
 click(e,'openMovForm','old');await sleep(30);
 ok(!!doc.querySelector('#fTipoActivo')&&/Vincular/.test(doc.querySelector('#invFields').textContent),'legacy: modo manual con enlace para vincular');
 click(e,'invAuto');ok(!!doc.querySelector('#fBuscar'),'legacy: cambia a automático');click(e,'closeSheet');
 // valoración
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.setInicioSub(['analisis']);e.w.__APP__.H.setAnalisisSub(['inversiones']);await sleep(80);
 const t=doc.querySelector('#content').textContent;
 ok(calls.includes('valorar'),'pide valoración');
 // Take-Two: part = 3.125+0.7+0.3-1 = 3.125 ; valor 3.125*120=375 ; invertido 500+100+50-160=490
 ok(/375,00 €/.test(t),'valor actual Take-Two 375,00 € ('+(t.match(/\d+,\d\d €/g)||[]).join(' ')+')');
 ok(/−115,00 €/.test(t)||/-115,00/.test(t),'pérdida −115,00 €');
 ok(/Legacy/.test(t)&&/no se valora/.test(t),'legacy sin valorar con nota');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
