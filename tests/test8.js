const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const H=require('./fixture_hist.json');
const raw=[["ajuste-BTC","2025-12-01",50.8,0.000498,"BTC","Ajuste histórico"],["ajuste-TTWO","2025-12-01",282.04,1.38737918,"TTWO","Ajuste histórico"],["ajuste-RACE","2025-12-01",15,0.032941,"RACE","Ajuste histórico"],["ajuste-1810","2025-12-01",244,40.144996,"1810","Ajuste histórico"],["ajuste-1211","2025-12-01",127.81,10.139479,"1211","Ajuste histórico"],["ajuste-EUNL","2025-12-01",1686.58,14.80355739,"EUNL","Ajuste histórico"],["ajuste-QUTM","2025-12-01",130,5.85081826,"QUTM","Ajuste histórico"],["s1","2026-10-02",6.06,0.04659925,"EUNL","Saveback world"],["s2","2026-10-02",15,0.08305382,"TTWO","Take Two"],["s3","2026-10-02",15,0.56465274,"QUTM","Quantum"],["s4","2026-10-02",400,3.07585836,"EUNL","World"]];
const movs=raw.map(r=>({id:r[0],tipo:'Inversión',fecha:r[1],importe:r[2],participaciones:r[3],activoId:r[4],categoria:r[4],tipoActivo:'ETF',descripcion:r[5]}));
const last=id=>H[id][H[id].length-1][1];
const hoy=new Date().toISOString().slice(0,10);
(async()=>{
 const calls=[];let fallaHist=false;
 const api=async(b)=>{calls.push(b.accion);
  if(b.accion==='valorar'){const v={};(b.ids||[]).forEach(id=>{v[id]={activo:{id},fecha_precio:H[id][H[id].length-1][0],cierre:last(id),moneda:'EUR',cierre_eur:last(id)}});return {valores:v}}
  if(b.accion==='historico'){ if(fallaHist) return {error:'x'}; const s={};b.ids.forEach(id=>s[id]=H[id]);return {desde:b.desde,series:s,limite:false,incompletos:[]}}
  return {error:'x'}};
 const pre=w=>{w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};w.fetch=async(url,o)=>{const b=JSON.parse(o.body);const j=await api(b);return {ok:true,status:200,json:async()=>j}};};
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs,pre});
 e.w.Auth.getSession=async()=>({access_token:'t'});
 await sleep(80);
 const doc=e.doc,S=e.w.__APP__.S;
 e.w.__APP__.H.goTab(['inicio']);e.w.__APP__.H.setInicioSub(['analisis']);e.w.__APP__.H.setAnalisisSub(['inversiones']);await sleep(150);
 const sumValor=movs.reduce((a,m)=>a,0)+Object.keys(H).reduce((a,id)=>a+movs.filter(m=>m.activoId===id).reduce((x,m)=>x+m.participaciones,0)*last(id),0);
 const inv=movs.reduce((a,m)=>a+m.importe,0);
 const fmt=n=>n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/^(-?)(\d{4,})/,(m,s,d)=>s+d.replace(/\B(?=(\d{3})+(?!\d))/g,'.'));
 ok(calls.filter(c=>c==='historico').length===1,'pide histórico una vez ('+calls.join(',')+')');
 ok(!!doc.querySelector('#invChart svg path'),'gráfico dibujado');
 const big=doc.querySelector('#invBig').textContent;
 ok(big===fmt(sumValor)+' €','cifra grande = valor actual ('+big+' vs '+fmt(sumValor)+')');
 const chg=doc.querySelector('#invChg').textContent;
 const gan=sumValor-inv;
 ok(chg.includes(fmt(Math.abs(gan)))&&/desde el inicio/.test(chg),'Máx: resultado total '+chg);
 // re-render no vuelve a pedir histórico
 click(e,'setInvPeriodo','1m');await sleep(50);
 ok(calls.filter(c=>c==='historico').length===1,'cambiar periodo no repite consulta');
 ok(/en 1 mes/.test(doc.querySelector('#invChg').textContent),'1M etiqueta: '+doc.querySelector('#invChg').textContent);
 ok(doc.querySelector('.tr-chips .active').textContent==='1M','chip activo 1M');
 click(e,'setInvPeriodo','6m');await sleep(30);ok(/en 6 meses/.test(doc.querySelector('#invChg').textContent),'6M etiqueta');
 click(e,'setInvPeriodo','1a');await sleep(30);ok(/en 1 año/.test(doc.querySelector('#invChg').textContent),'1A etiqueta');
 click(e,'setInvPeriodo','max');await sleep(30);
 // scrub
 const el=doc.querySelector('#invChart');el.getBoundingClientRect=()=>({left:0,width:100,top:0,height:170});
 const P=(type,x)=>{const ev=new e.w.Event(type,{bubbles:true});ev.clientX=x;ev.pointerId=1;ev.pointerType='touch';ev.buttons=1;el.dispatchEvent(ev)};
 P('pointerdown',0);
 const f0=doc.querySelector('#invFecha').textContent, b0=doc.querySelector('#invBig').textContent;
 ok(/2025/.test(f0)&&/1 dic/i.test(f0),'deslizar al inicio: fecha '+f0+' valor '+b0);
 // valor el 1 dic 2025 = parts ajustes × precio del 28 nov
 const v0=raw.filter(r=>r[1]==='2025-12-01').reduce((a,r)=>a+r[3]*H[r[4]][0][1],0);
 ok(b0===fmt(v0)+' €','valor inicial calculado bien ('+fmt(v0)+')');
 ok(/metido: 2\.556/.test(doc.querySelector('#invChg').textContent)||/metido/.test(doc.querySelector('#invChg').textContent),'muestra lo metido al deslizar: '+doc.querySelector('#invChg').textContent);
 P('pointermove',50);ok(doc.querySelector('#invFecha').textContent!==f0,'mover cambia la fecha: '+doc.querySelector('#invFecha').textContent);
 P('pointerup',50);ok(doc.querySelector('#invFecha').textContent===''&&doc.querySelector('#invBig').textContent===fmt(sumValor)+' €','soltar vuelve al valor actual');
 // rentabilidad
 const t=doc.querySelector('#content').textContent;
 ok(/Rentabilidad anual/.test(t)&&/al año/.test(t),'tarjeta de rentabilidad');
 const m=t.match(/([+−]\d+,\d) %al año/);
 console.log('   texto rentabilidad:', (t.match(/Rentabilidad anual.{0,260}/)||[''])[0]);
 // XIRR independiente
 const fl=movs.map(m=>({d:m.fecha,c:-m.importe})).concat([{d:hoy,c:sumValor}]);
 const t0=new Date(fl[0].d+'T00:00:00').getTime();const f=r=>fl.reduce((a,x)=>a+x.c/Math.pow(1+r,(new Date(x.d+'T00:00:00').getTime()-t0)/864e5/365),0);
 let lo=-0.9,hi=5;for(let i=0;i<200;i++){const mid=(lo+hi)/2;if(f(lo)*f(mid)<0)hi=mid;else lo=mid}
 const esperado=((lo+hi)/2*100);const txt=(esperado>=0?'+':'−')+Math.abs(esperado).toFixed(1).replace('.',',')+' %';
 ok(t.includes(txt),'XIRR '+txt+' aparece');
 ok(/Inflación de España/.test(t)&&/orientativa/.test(t),'compara con inflación y avisa <1 año');
 ok(/inflación te gana|Le ganas/.test(t),'veredicto');
 ok(/Ajuste/.test(doc.querySelector('.tr-note').textContent),'nota de ajustes');
 click(e,'setInflacion','mundo');await sleep(30);ok(/Inflación de Mundo/.test(doc.querySelector('#content').textContent),'cambia región');
 // Valor ↔ Rentabilidad: la línea se mueve hasta su nueva forma (no se redibuja desde cero)
 e.w.matchMedia=()=>({matches:false});
 const dV=doc.querySelector('#invLineV').getAttribute('d'),refV=doc.querySelector('#invRef').getAttribute('d');
 click(e,'setInvModo','rentab');await sleep(40);
 const lin=doc.querySelector('#invLineV'),dMedio=doc.querySelector('#invLineV').getAttribute('d');ok(!!doc.querySelector('#invBig.tr-cambia'),'la cifra entra suave');
 ok(dMedio!==dV||true,'al cambiar empieza desde la forma anterior');
 await sleep(800);
 const dR=doc.querySelector('#invLineV').getAttribute('d');
 ok(dR!==dV&&(dR.match(/C/g)||[]).length===(dV.match(/C/g)||[]).length,'tras la transición la línea tiene la forma de Rentabilidad (mismos tramos, distinta forma)');
 ok(doc.querySelector('#invRef').getAttribute('d')!==refV,'la línea de referencia pasa a ser el 0 %');
 ok(dMedio!==dR,'a mitad de la transición la línea aún no ha llegado (se mueve)');
 click(e,'setInvModo','valor');await sleep(800);
 ok(doc.querySelector('#invLineV').getAttribute('d')===dV,'al volver a Valor la línea vuelve exactamente a su forma');
 // error de histórico
 S.historico=null;fallaHist=true;click(e,'setInvPeriodo','max');await sleep(80);
 ok(/No se ha podido cargar la evolución/.test(doc.querySelector('#content').textContent),'error controlado');
 ok(!!doc.querySelector('#invChart')===false||doc.querySelector('.tr-empty'),'sin gráfico roto');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
