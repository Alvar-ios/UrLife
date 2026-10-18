const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const P={EUNL:130,TTWO:180,BTC:72000};
const movs=[
 {id:'a1',tipo:'Inversión',categoria:'MSCI World',activoId:'EUNL',participaciones:14.8,importe:1686.58,fecha:'2025-12-01',tipoActivo:'ETF',descripcion:'Ajuste'},
 {id:'a2',tipo:'Inversión',categoria:'MSCI World',activoId:'EUNL',participaciones:3.08,importe:400,fecha:'2026-10-02',tipoActivo:'ETF'},
 {id:'a3',tipo:'Inversión',categoria:'Take-Two',activoId:'TTWO',participaciones:1.47,importe:297.04,fecha:'2025-12-01',tipoActivo:'Acción'},
 {id:'a4',tipo:'Inversión',categoria:'Bitcoin',activoId:'BTC',participaciones:0.0005,importe:50.8,fecha:'2025-12-01',tipoActivo:'Cripto'},
 {id:'s1',tipo:'Ahorro',categoria:'Colchón',importe:100,fecha:'2026-09-01'},
 {id:'s2',tipo:'Ahorro',categoria:'Colchón',importe:50,fecha:'2026-10-01'},
 {id:'d1',tipo:'Deuda',categoria:'Coche',importe:200,fecha:'2026-09-01'}];
(async()=>{
 const api=async b=>{ if(b.accion==='valorar'){const v={};b.ids.forEach(id=>v[id]={activo:{id},cierre_eur:P[id],cierre:P[id],moneda:'EUR',fecha_precio:'2026-10-09'});return {valores:v}} if(b.accion==='historico')return {series:{}};return {}};
 const pre=w=>{w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};w.fetch=async(u,o)=>{const j=await api(JSON.parse(o.body));return {ok:true,status:200,json:async()=>j}}};
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}],ahorro:[{nombre:'Inversions',objetivo:60000,yaAhorrado:3000,fechaObjetivo:'2030-08-01'},{nombre:'Colchón',objetivo:1000}],deudas:[{nombre:'Coche',objetivo:1000}]},meta:{onboarded:true}},movs,pre});
 e.w.Auth.getSession=async()=>({access_token:'t'});
 const orig=e.w.Data,L=[];const notify=()=>L.forEach(f=>f());
 e.w.Data={doc:orig.doc,collection:n=>n!=='movimientos'?orig.collection(n):({onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))});L.push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{e.store.movimientos['n'+Math.random().toString(36).slice(2,7)]=d;notify()},doc:id=>({set:async d=>{e.store.movimientos[id]=d;notify()},delete:async()=>{delete e.store.movimientos[id];notify()}})})};
 await sleep(100);
 const A=e.w.__APP__,H=A.H,doc=e.doc,cfgM=()=>e.store.cfg.app.ahorro;
 ok(cfgM().every(m=>m.id),'las metas existentes reciben identificador');
 const idInv=cfgM()[0].id,idCol=cfgM()[1].id;
 // convertir «Inversions» en meta de inversión y quitar los 3.000 €
 e.w.__APP__.H.goTab(['mas']);await sleep(10);click(e,'openMetas');click(e,'metaEditar',idInv);await sleep(5);
 ok(!doc.querySelector('[data-click^="metaTipo"]')&&!!doc.querySelector('#mRent')&&/Lo que ya tenías antes/.test(doc.querySelector('#sheetHost').textContent),'editor híbrido: sin «tipo», con rentabilidad y «lo que ya tenías antes»');
 doc.querySelector('#mFuera').value='';click(e,'metaGuardar');await sleep(20);
 ok(!cfgM()[0].tipo&&cfgM()[0].yaAhorrado===null&&cfgM()[0].id===idInv&&cfgM()[0].objetivo===60000,'meta guardada sin los 3.000 €, mismo id');
 H.closeSheet([]);await sleep(250);
 // asignar: todo el MSCI World + Take-Two; Bitcoin no
 H.metaAsignar([idInv]);await sleep(5);
 ok(/Vincular a «Inversions»/.test(doc.querySelector('#sheetHost').textContent),'pantalla de asignar');
 H.asigGrupo(['EUNL']);H.asigGrupo(['TTWO']);await sleep(5);
 ok(/Seleccionados: <?b?>?3/.test(doc.querySelector('#sheetHost').innerHTML.replace(/<\/?b>/g,''))||/Seleccionados: 3/.test(doc.querySelector('#sheetHost').textContent),'3 seleccionadas');
 await H.asigGuardar([]);await sleep(30);
 ok(['a1','a2','a3'].every(id=>e.store.movimientos[id].metaId===idInv)&&!e.store.movimientos.a4.metaId,'aportaciones asignadas (Bitcoin queda en General)');
 // estadísticas
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.setInicioSub(['analisis']);e.w.__APP__.H.setAnalisisSub(['metas']);await sleep(80);
 e.w.__APP__.H.goTab(['dinero']);e.w.__APP__.H.setDineroSub(['metas']);await sleep(80);
 const r=A.metasStats().find(x=>x.id===idInv);
 const valor=14.8*130+3.08*130+1.47*180;
 ok(Math.abs(r.valor-valor)<0.01&&Math.abs(r.invAport-(1686.58+400+297.04))<0.01,'valor de mercado '+r.valor.toFixed(2)+' y aportado '+r.aportado.toFixed(2));
 ok(/histórico/.test(r.fuente)&&r.rent>=0&&r.rent<=10,'usa la rentabilidad de su histórico: '+r.rent.toFixed(2)+' % ('+r.fuente+')');
 const t=doc.querySelector('#content').textContent;
 ok(/Invertido/.test(t)&&/→ vale/.test(t)&&/estimación/.test(t)&&/suben y bajan/.test(t)&&/Vincular/.test(t),'tarjeta con invertido → vale, aviso de estimación y botón vincular');
 ok(/Necesitas aportar aprox/.test(t)&&/Ritmo \(últimos 3 meses\)/.test(t),'aportación necesaria y ritmo');
 // meta nueva con poco histórico → 4 %
 click(e,'openMetas');click(e,'metaNueva');await sleep(5);
 doc.querySelector('#mNombre').value='Viaje Japón';doc.querySelector('#mObjetivo').value='5000';doc.querySelector('#mFecha').value='2028-06-01';click(e,'metaGuardar');await sleep(20);
 const jp=cfgM().find(m=>m.nombre==='Viaje Japón');
 ok(jp&&!jp.tipo&&jp.id,'meta nueva (híbrida)');
 H.closeSheet([]);await sleep(250);
 // formulario: inversión nueva con meta
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Inversión');await sleep(5);
 ok(/Sin meta/.test(doc.querySelector('#invFields').textContent)&&/Viaje Japón/.test(doc.querySelector('#invFields').textContent),'selector de meta en el formulario');
 click(e,'invManual');await sleep(5);
 click(e,'pickMeta',jp.id);
 const setv=(s,v)=>{const el=doc.querySelector(s);el.value=v;el.dispatchEvent(new e.w.Event('input',{bubbles:true}))};
 setv('#fImporte','100');doc.querySelector('#fCategoria').value='Fondo X';const ta=doc.querySelector('#fTipoActivo');if(ta)ta.value=ta.options[1].value;
 click(e,'saveMov');await sleep(30);
 const nv=Object.values(e.store.movimientos).find(m=>m.categoria==='Fondo X');
 ok(nv&&nv.metaId===jp.id,'la inversión se guarda con su meta');
 const rj=A.metasStats().find(m=>m.id===jp.id);
 ok(rj.rent===4&&/prudente/.test(rj.fuente),'poco histórico: 4 % prudente');
 // ahorro: guardar con nombre enlaza por id
 e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Ahorro');await sleep(5);
 ok(doc.querySelector('#tipoToggle .active').textContent==='Apartar'&&/¿Para qué meta\?/.test(doc.querySelector('#sheetHost').textContent),'«Apartar» pregunta para qué meta');
 click(e,'pickMeta',idCol);setv('#fImporte','30');click(e,'saveMov');await sleep(30);
 ok(Object.values(e.store.movimientos).some(m=>m.tipo==='Ahorro'&&m.importe===30&&m.metaId===idCol&&m.categoria==='Colchón'),'lo apartado se enlaza por identificador');
 // renombrar meta de ahorro: no pierde su historial
 e.w.__APP__.H.goTab(['mas']);click(e,'openMetas');click(e,'metaEditar',idCol);await sleep(5);
 doc.querySelector('#mNombre').value='Fondo emergencia';click(e,'metaGuardar');await sleep(40);
 const st=A.metasStats().find(x=>x.id===idCol);
 ok(st&&st.nombre==='Fondo emergencia'&&st.acum===180,'renombrada conserva su historial: '+(st&&st.acum));
 ok(e.store.movimientos.s1.metaId===idCol&&e.store.movimientos.s1.categoria==='Fondo emergencia','movimientos antiguos enlazados al renombrar');
 H.closeSheet([]);await sleep(250);
 // patrimonio
 const p=A.patrimonio();
 const invTot=valor+0.0005*72000+100;
 ok(Math.abs(p.inv-invTot)<0.01&&p.ahorro===180&&p.deudas===800&&Math.abs(p.total-(invTot+180-800))<0.01,'patrimonio = inversiones + ahorro − deudas: '+p.total.toFixed(2));
 e.w.__APP__.H.goTab(['dinero']);await sleep(20);e.w.__APP__.H.patToggle([]);await sleep(10);
 const td=doc.querySelector('#content').textContent;
 ok(/Lo que tienes/.test(td)&&/Dinero en el banco/.test(td)&&/Añadir saldo/.test(td),'tarjeta de patrimonio en Dinero');
 // Ahorro chips: solo metas de ahorro
 e.w.__APP__.H.onFabAntiguo([]);click(e,'pickTipo','Ahorro');await sleep(5);
 ok(/Inversions/.test(doc.querySelector('#metaChips').textContent)&&/Fondo emergencia/.test(doc.querySelector('#metaChips').textContent),'en Apartar salen todas las metas (son híbridas)');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
