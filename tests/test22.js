// Parche 3b: Movimientos mes a mes, presupuestos en la misma escala, curva anual sin meses por llegar, rentabilidad pura
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const pad=n=>String(n).padStart(2,'0');const d=new Date(),Y=d.getFullYear(),M=d.getMonth()+1,ym=Y+'-'+pad(M);
const prevYm=M===1?(Y-1)+'-12':Y+'-'+pad(M-1);
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const addD=(iso,n)=>{const x=new Date(iso+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const hoy=new Date().toISOString().slice(0,10);
(async()=>{
 // ---------- Movimientos y presupuestos
 {
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Casa',presupuesto:100},{nombre:'Supermercado',presupuesto:300},{nombre:'Ocio'},{nombre:'Ropa',presupuesto:50}],ingresos:['Nómina'],metodosPago:['Tarjeta']},meta:{onboarded:true}},
   movs:[{id:'a',tipo:'Ingreso',categoria:'Nómina',importe:2000,fecha:ym+'-01'},
         {id:'b',tipo:'Gasto',categoria:'Supermercado',descripcion:'Mercadona',importe:250,fecha:ym+'-01'},
         {id:'c',tipo:'Gasto',categoria:'Ocio',descripcion:'Cine',importe:150,fecha:ym+'-01'},
         {id:'f',tipo:'Gasto',categoria:'Ropa',descripcion:'Zara',importe:80,fecha:ym+'-01'},
         {id:'p',tipo:'Gasto',categoria:'Ocio',descripcion:'Bolera',importe:20,fecha:prevYm+'-10'}]});
 await sleep(80);
 const A=e.w.__APP__,H=A.H,doc=e.doc,txt=()=>doc.querySelector('#content').textContent;
 H.goTab(['movimientos']);await sleep(10);
 const lbl=()=>doc.querySelector('.mov-per-lbl').textContent.replace(/\s*NUEVO$/,'');
 ok(lbl()===MESES[M-1]+' '+Y,'Movimientos abre en el mes actual: '+lbl());
 ok(/4 movimientos/.test(txt())&&!/Bolera/.test(txt()),'solo los del mes (4)');
 ok(!doc.querySelector('[data-click^="setMovPeriodo"]'),'ya no están «Todo / Este mes / Mes anterior / Este año»');
 ok(doc.querySelector('.mov-flecha[aria-label="Mes siguiente"]').disabled,'no deja ir a meses sin nada más allá de hoy');
 click(e,'movPerMover','-1');await sleep(10);
 ok(/1 movimiento/.test(txt())&&/Bolera/.test(txt())&&lbl().startsWith(MESES[(M+10)%12]),'flecha ← mes anterior: '+lbl());
 ok(doc.querySelector('#movList').className==='','(sin animación en modo reducido)');
 ok(doc.querySelector('.mov-flecha[aria-label="Mes anterior"]').disabled,'no hay nada antes: flecha ← desactivada');
 click(e,'movPerHoy');await sleep(10);ok(lbl()===MESES[M-1]+' '+Y,'tocar el nombre vuelve al mes actual');
 // búsqueda que no está en este mes
 H.onMovSearch?0:0;
 A.S.movQuery='bolera';A.render();await sleep(5);
 ok(/Sin movimientos en /.test(txt())&&!!doc.querySelector('[data-click="setMovModo|todo"]'),'búsqueda sin resultados en el mes ofrece ver todo');
 click(e,'setMovModo','todo');await sleep(10);
 ok(/1 movimiento/.test(txt())&&/Bolera/.test(txt())&&/^Todo/.test(lbl()),'«Todo» encuentra la bolera');
 A.S.movQuery='';A.render();
 click(e,'setMovModo','anio');await sleep(10);
 ok(lbl()===Y+' el año entero'&&new RegExp((M===1?4:5)+' movimientos').test(txt()),'modo Año: '+lbl());
 click(e,'setMovModo','mes');await sleep(10);ok(lbl()===MESES[M-1]+' '+Y,'vuelve a Mes');
 // atajo desde Análisis sigue funcionando
 H.irMovs(['_gastos',prevYm.replace(/^/,'m:'),'Ocio']);await sleep(10);
 ok(A.S.movCat==='Ocio'&&lbl().startsWith(MESES[(M+10)%12])&&/1 movimiento/.test(txt()),'atajo de Análisis abre ese mes y categoría');
 // ---------- presupuesto por categoría
 H.irResumen([]);await sleep(10);
 const filas=[...doc.querySelectorAll('.budget-row')];
 const nombres=filas.map(f=>f.querySelector('.cat').textContent);
 ok(nombres.join(',')==='Supermercado,Ocio,Ropa,Casa','ordenadas por lo gastado: '+nombres.join(','));
 ok(filas[3].classList.contains('cero'),'la que va a 0 queda al final y apagada');
 const w=(f,s)=>parseFloat((f.querySelector(s)||{style:{}}).style.width||'0'),l=(f,s)=>parseFloat(f.querySelector(s).style.left);
 // escala = 300 (presupuesto de Super es lo mayor)
 ok(Math.abs(w(filas[0],'.pb-f')-250/300*100)<0.1&&Math.abs(l(filas[0],'.pb-tick')-100)<0.1,'Súper: 250 de 300 → barra 83% y marca al final');
 ok(Math.abs(w(filas[1],'.pb-f')-50)<0.1&&!filas[1].querySelector('.pb-tick'),'Ocio sin presupuesto: 150 → 50% de la escala, sin marca');
 ok(Math.abs(w(filas[2],'.pb-f')-50/300*100)<0.1&&Math.abs(l(filas[2],'.pb-tick')-50/300*100)<0.1&&Math.abs(w(filas[2],'.pb-over')-30/300*100)<0.1&&/30,00 € de más/.test(filas[2].textContent),'Ropa 80 de 50: barra hasta la marca + 30 € en rojo');
 ok(w(filas[3],'.pb-f')===0&&Math.abs(l(filas[3],'.pb-tick')-100/300*100)<0.1&&/quedan 100,00 €/.test(filas[3].textContent),'Casa 0 de 100: solo la marca, «quedan 100 €»');
 // ---------- anual
 H.verAnio([]);await sleep(10);
 const svg=doc.querySelector('#trendWrap svg');
 ok(svg.querySelectorAll('circle').length===2*M,'solo se dibujan los meses que ya han empezado ('+svg.querySelectorAll('circle').length+' puntos)');
 ok(svg.querySelectorAll('text[opacity="0.4"]').length===12-M,'meses por llegar en gris');
 ok(M===12||!!svg.querySelector('rect[rx]'),'zona de meses por llegar sombreada');
 ok([...svg.querySelectorAll('path')].some(p=>/ C/.test(p.getAttribute('d'))),'línea suave (curvas)');
 ok(doc.querySelectorAll('#content .row.futuro').length===12-M,'en el detalle, los meses por llegar van apagados');
 e.w.__APP__.S.movPeriodo='y:'+(e.w.__APP__.S.anioSel-1);e.w.__APP__.render();await sleep(10);
 ok(doc.querySelector('#trendWrap svg').querySelectorAll('circle').length===24&&!doc.querySelector('#trendWrap svg rect[rx]'),'año pasado: los 12 meses');
 e.w.__APP__.S.movPeriodo='y:'+(e.w.__APP__.S.anioSel+2);e.w.__APP__.render();await sleep(10);
 ok(/aún no ha empezado/.test(doc.querySelector('#trendWrap').textContent),'año que viene: aviso en vez de una línea a 0');
 }
 // ---------- inversiones: rentabilidad pura
 {
 const d0=addD(hoy,-60),d1=addD(hoy,-30);
 // 10 part a 100 (1000 €) el d0; sube a 110 el d1 y ese día metes otros 1100 € (10 part a 110); luego no se mueve.
 const serie=[];for(let i=-62;i<=0;i++){const dd=addD(hoy,i);serie.push([dd,dd<d1?100:110])}
 const H={X1:serie};
 const movs=[{id:'i1',tipo:'Inversión',fecha:d0,importe:1000,participaciones:10,activoId:'X1',categoria:'X1',tipoActivo:'ETF',descripcion:'Compra'},
             {id:'i2',tipo:'Inversión',fecha:d1,importe:1100,participaciones:10,activoId:'X1',categoria:'X1',tipoActivo:'ETF',descripcion:'Compra'}];
 const api=async(b)=>{
  if(b.accion==='valorar'){return {valores:{X1:{activo:{id:'X1'},fecha_precio:hoy,cierre:110,moneda:'EUR',cierre_eur:110}}}}
  if(b.accion==='historico'){return {desde:b.desde,series:{X1:H.X1},limite:false,incompletos:[]}}
  return {error:'x'}};
 const pre=w=>{w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};w.fetch=async(url,o)=>{const j=await api(JSON.parse(o.body));return {ok:true,status:200,json:async()=>j}};};
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs,pre});
 e.w.Auth.getSession=async()=>({access_token:'t'});
 await sleep(80);
 const A=e.w.__APP__,doc=e.doc;
 A.H.goTab(['dinero']);A.H.setDineroSub(['inversiones']);await sleep(150);
 ok(/2200,00 €|2\.200,00 €/.test(doc.querySelector('#invBig').textContent),'Valor: 2.200 € ('+doc.querySelector('#invBig').textContent+')');
 ok(!!doc.querySelector('[data-click="setInvModo|rentab"]'),'hay selector Valor / Rentabilidad');
 click(e,'setInvModo','rentab');await sleep(20);
 ok(doc.querySelector('#invBig').textContent==='+10,0 %','Rentabilidad: +10,0 % aunque metieras 1.100 € más ('+doc.querySelector('#invBig').textContent+')');
 ok(/Has ganado 100,00 €/.test(doc.querySelector('#invChg').textContent),'y lo que has ganado en euros: '+doc.querySelector('#invChg').textContent);
 ok(e.w.__APP__.S.invModo==='rentab','queda elegida');
 ok(!!doc.querySelector('.tr-cero')&&/ C/.test(doc.querySelector('#invChart g path:last-child').getAttribute('d')),'línea del 0 % y curva suave');
 // deslizar al principio: 0 %
 const el=doc.querySelector('#invChart');el.getBoundingClientRect=()=>({left:0,width:100,top:0,height:170});
 const P=(type,x)=>{const ev=new e.w.Event(type,{bubbles:true});ev.clientX=x;ev.pointerId=1;ev.pointerType='touch';ev.buttons=1;el.dispatchEvent(ev)};
 P('pointerdown',0);ok(doc.querySelector('#invBig').textContent==='+0,0 %','al principio, 0 %');
 P('pointerup',0);ok(doc.querySelector('#invBig').textContent==='+10,0 %','al soltar vuelve a +10 %');
 click(e,'setInvPeriodo','1m');await sleep(20);
 ok(/^\+0,0 %|^\+10,0 %/.test(doc.querySelector('#invBig').textContent),'1M: '+doc.querySelector('#invBig').textContent);
 click(e,'setInvModo','valor');await sleep(20);ok(/€/.test(doc.querySelector('#invBig').textContent),'vuelve a Valor');
 }
 console.log(fails?'FAILS '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(err=>{console.error(err);process.exit(1)});
