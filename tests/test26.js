// Metas híbridas (13/10): apartado + inversiones a valor de hoy + lo de antes − lo usado; hitos; «He usado dinero»; nombre «Apartar»
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const HOY=(()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())})();
const movs=[
 {id:'s1',tipo:'Ahorro',categoria:'Casa',metaId:'casa',importe:20000,fecha:'2026-06-01'},
 {id:'s2',tipo:'Ahorro',categoria:'Apartado',importe:5000,fecha:HOY},
 {id:'i1',tipo:'Inversión',categoria:'MSCI World',activoId:'EUNL',participaciones:10,importe:1000,fecha:'2026-09-01',tipoActivo:'ETF',metaId:'casa'},
 {id:'i2',tipo:'Inversión',categoria:'Bitcoin',activoId:'BTC',participaciones:0.001,importe:60,fecha:'2026-09-01',tipoActivo:'Cripto'}];
(async()=>{
 const P={EUNL:130,BTC:70000};
 const pre=w=>{w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};w.fetch=async(u,o)=>{const b=JSON.parse(o.body);let j={};if(b.accion==='valorar'){const v={};b.ids.forEach(id=>v[id]={activo:{id},cierre_eur:P[id],cierre:P[id],moneda:'EUR',fecha_precio:HOY});j={valores:v}}else if(b.accion==='precio_en')j={cierre:70000,cierre_eur:70000,moneda:'EUR',fecha_precio:'2026-09-01'};else if(b.accion==='historico')j={series:{}};return {ok:true,status:200,json:async()=>j}}};
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'Supermercado'}],ahorro:[{id:'casa',nombre:'Casa',objetivo:300000,yaAhorrado:50000,fechaObjetivo:'2031-06-01'}]},meta:{onboarded:true}},movs,pre});
 e.w.Auth.getSession=async()=>({access_token:'t'});
 const orig=e.w.Data,L=[];const notify=()=>L.forEach(f=>f());let seq=0;
 e.w.Data={doc:orig.doc,collection:n=>n!=='movimientos'?orig.collection(n):({onSnapshot:cb=>{const f=()=>cb({docs:Object.entries(e.store.movimientos).map(([id,v])=>({id,data:()=>v}))});L.push(f);setTimeout(f,0);return()=>{}},
   add:async d=>{const k='n'+(++seq);e.store.movimientos[k]=d;notify();return {id:k}},doc:id=>({set:async d=>{e.store.movimientos[id]=d;notify()},delete:async()=>{delete e.store.movimientos[id];notify()}})})};
 await sleep(100);
 const A=e.w.__APP__,H=A.H,doc=e.doc,cfgM=()=>e.store.cfg.app.ahorro[0],txt=()=>doc.querySelector('#content').textContent,sh=()=>doc.querySelector('#sheetHost').textContent;
 H.goTab(['dinero']);H.setDineroSub(['metas']);await sleep(100);
 // 1. cuentas de una meta híbrida
 let r=A.metasStats()[0];
 ok(Math.abs(r.valor-(50000+20000+10*130))<0.01,'valor = 50.000 de antes + 20.000 apartados + inversión a valor de hoy (1.300) = '+r.valor);
 ok(r.apartado===70000&&r.invAport===1000&&Math.abs(r.invValor-1300)<0.01&&Math.abs(r.gan-300)<0.01,'separa lo apartado, lo invertido y lo que ha ganado');
 ok(/Apartado/.test(txt())&&/Invertido/.test(txt())&&/vale 1300,00|vale 1\.300,00/.test(txt())&&/\+300,00/.test(txt()),'la tarjeta lo enseña: Apartado · Invertido → vale (+300 €)');
 ok(!!doc.querySelector('[data-click="metaAportar|casa"]')&&!!doc.querySelector('[data-click="metaAsignar|casa"]')&&!!doc.querySelector('[data-click="usoAbrir|casa"]'),'botones: Aportar, Vincular y He usado dinero');
 // 2. «Apartar» en lugar de «Ahorro»
 H.goTab(['movimientos']);await sleep(10);
 const metas=[...doc.querySelectorAll('#movList .row .meta')].map(x=>x.textContent).join(' | ');
 ok(/Apartar/.test(metas)&&!/\bAhorro\b/.test(metas),'en la lista se llama «Apartar» ('+metas+')');
 H.goTab(['dinero']);H.setDineroSub(['metas']);await sleep(10);
 click(e,'metaAportar','casa');await sleep(20);
 ok(doc.querySelector('#tipoToggle .active').textContent==='Apartar'&&!!doc.querySelector('[data-click="pickMeta|casa"].active')&&doc.querySelector('#fCategoria').closest('.field').style.display==='none','«Aportar»: Apartar, con la meta elegida y sin categoría');
 doc.querySelector('#fImporte').value='1000';click(e,'saveMov');await sleep(60);
 const nv=Object.values(e.store.movimientos).find(m=>m.importe===1000&&m.tipo==='Ahorro');
 ok(nv&&nv.metaId==='casa'&&nv.categoria==='Casa','guardado como Apartar → Casa');
 H.closeSheet([]);await sleep(250);
 H.openMovForm([]);await sleep(10);click(e,'pickTipo','Ahorro');await sleep(5);click(e,'pickMeta','');doc.querySelector('#fImporte').value='40';click(e,'saveMov');await sleep(60);
 const sin=Object.values(e.store.movimientos).find(m=>m.importe===40);
 ok(sin&&sin.tipo==='Ahorro'&&!sin.metaId&&sin.categoria==='Apartado','apartar sin meta: «Apartado»');
 H.closeSheet([]);await sleep(250);
 // 3. hitos
 H.goTab(['dinero']);H.setDineroSub(['metas']);await sleep(10);
 H.openMetas([]);await sleep(5);H.metaEditar(['casa']);await sleep(5);
 click(e,'hitoAdd');await sleep(5);click(e,'hitoAdd');await sleep(5);click(e,'hitoAdd');await sleep(5);
 const ins=[...doc.querySelectorAll('#hitosBox .hito-row input')];
 const setc=(el,v)=>{el.value=v;el.dispatchEvent(new e.w.Event('change',{bubbles:true}))};
 ok(ins.length===9&&ins[2].type==='date','cada hito: nombre, importe y fecha (opcional)');
 setc(ins[0],'Primeros 100k');setc(ins[1],'100000');setc(ins[2],'2028-06-01');setc(ins[3],'Primeros 50k');setc(ins[4],'50000');/* el tercero vacío: se descarta */
 click(e,'metaGuardar');await sleep(30);
 ok(cfgM().hitos.length===2&&cfgM().hitos[0].nombre==='Primeros 50k'&&cfgM().hitos[1].importe===100000&&cfgM().hitos[1].fecha==='2028-06-01'&&!cfgM().hitos[0].fecha,'hitos guardados, ordenados, con su fecha y sin el vacío');
 H.closeSheet([]);await sleep(250);
 H.goTab(['dinero']);H.setDineroSub(['metas']);await sleep(60);
 ok(cfgM().hitos[0].logrado===HOY&&!cfgM().hitos[1].logrado,'el hito ya superado queda como logrado (con fecha)');
 // vista por hito (por defecto, el siguiente por lograr)
 let card=()=>doc.querySelector('.meta-card').textContent;
 ok(!!doc.querySelector('.meta-card-hito')&&/🎯 Primeros 100k · hito 2 de 2/.test(card())&&/72\.?300,00 € de 100\.?000,00 €/.test(card()),'la tarjeta abre en el hito que toca: 72.300 de 100.000');
 ok(/Faltan 27\.?700,00\s*€ para este hito/.test(card())&&/Hasta el 1 de junio de 2028/.test(card())&&/aprox\. [\d.,]+\s*€\/mes para llegar a este hito/.test(card())&&/Ritmo \(últimos 3 meses\)/.test(card()),'el hito tiene sus estimaciones como una meta (fecha, al mes, ritmo)');
 ok(/Meta completa: 72\.?300,00\s*€ de 300\.?000,00\s*€ · 24 %/.test(card())&&doc.querySelector('.meta-vista .on').textContent==='🎯 Hito','resumen de la meta completa y el conmutador en «Hito»');
 doc.querySelector('.meta-card .hitos .hito.ok').click();await sleep(10);
 ok(/🎯 Primeros 50k · hito 1 de 2/.test(card())&&/Logrado el/.test(card())&&!/para este hito/.test(card()),'tocar un hito logrado: «Logrado el …»');
 click(e,'metaVista','casa','meta');await sleep(10);
 ok(!doc.querySelector('.meta-card-hito')&&doc.querySelector('.meta-vista .on').textContent==='Meta completa','«Meta completa» vuelve a la vista general');

 ok(doc.querySelectorAll('.meta-barra .hito-m').length===2&&doc.querySelectorAll('.meta-barra .hito-m.ok').length===1,'marcas de los hitos en la barra');
 H.openMetas([]);await sleep(5);H.metaEditar(['casa']);await sleep(5);click(e,'metaGuardar');await sleep(30);H.closeSheet([]);await sleep(250);
 ok(cfgM().hitos[0].logrado===HOY,'al volver a guardar, el hito conserva su fecha');
 // 4. He usado dinero: para otra cosa, apuntándolo como gasto
 const antesPat=A.patrimonio().ahorro,nMovs=Object.keys(e.store.movimientos).length;
 H.goTab(['dinero']);H.setDineroSub(['metas']);await sleep(10);
 click(e,'usoAbrir','casa');await sleep(10);
 ok(/Usar dinero de «Casa»/.test(sh())&&/no cuenta como gasto/.test(sh()),'hoja «Usar dinero»: por defecto no es gasto');
 doc.querySelector('#uImporte').value='2000';doc.querySelector('#uNota').value='Coche';
 const cb=doc.querySelector('.uso-gasto input');cb.checked=true;cb.dispatchEvent(new e.w.Event('change',{bubbles:true}));await sleep(5);
 ok(doc.querySelector('#uImporte').value==='2000'&&!!doc.querySelector('#uCat'),'al marcar «gasto» pide categoría y no pierde lo escrito');
 doc.querySelector('#uCat').value='Transporte';click(e,'usoGuardar');await sleep(60);
 r=A.metasStats()[0];
 ok(r.usado===2000&&Math.abs(r.valor-70300)<0.01,'la meta baja 2.000 € y sigue activa ('+r.valor+')');
 const g=Object.values(e.store.movimientos).find(m=>m.tipo==='Gasto'&&m.importe===2000);
 ok(g&&g.categoria==='Transporte'&&/De la meta «Casa» · Coche/.test(g.descripcion)&&Object.keys(e.store.movimientos).length===nMovs+1,'y se apunta como gasto del mes porque lo marcaste');
 ok(Math.abs(A.patrimonio().ahorro-(antesPat-2000))<0.01,'patrimonio: el ahorro baja lo usado');
 ok(/Usado/.test(txt())&&/para otra cosa · Coche/.test(txt()),'la tarjeta enseña lo usado');
 const u1=cfgM().usos[0].id;
 doc.querySelector('[data-click="usoQuitar|casa|'+u1+'"]').click();doc.querySelector('[data-click="usoQuitar|casa|'+u1+'"]')?.click();await sleep(40);
 ok(!(cfgM().usos||[]).length&&A.metasStats()[0].usado===0,'«Quitar» lo deshace');
 // 5. para el objetivo → conseguida, sin gasto
 const n2=Object.keys(e.store.movimientos).length;
 click(e,'usoAbrir','casa');await sleep(10);click(e,'usoPara','objetivo');await sleep(5);
 ok(/quedará como <b>conseguida<\/b>|quedará como conseguida/.test(doc.querySelector('#sheetHost').innerHTML.replace(/<\/?b>/g,''))||/conseguida/.test(sh()),'explica que la meta queda conseguida');
 doc.querySelector('#uImporte').value='70000';click(e,'usoGuardar');await sleep(60);
 ok(cfgM().conseguida===HOY&&Object.keys(e.store.movimientos).length===n2,'meta conseguida, sin apuntar gasto');
 ok(/Conseguida el/.test(txt())&&!doc.querySelector('[data-click="metaAportar|casa"]'),'tarjeta: «Conseguida el …» y sin «Aportar»');
 const u2=cfgM().usos[0].id;
 const q=doc.querySelector('[data-click="usoQuitar|casa|'+u2+'"]');q.click();doc.querySelector('[data-click="usoQuitar|casa|'+u2+'"]')?.click();await sleep(40);
 ok(!cfgM().conseguida,'quitar ese uso la reactiva');
 // 6. formulario de inversión: «¿Para qué meta?»
 H.openMovForm(['i2']);await sleep(10);
 ok(!!doc.querySelector('[data-click="pickMeta|"].active')&&!!doc.querySelector('[data-click="pickMeta|casa"]'),'inversión: «¿Para qué meta?» con «Sin meta»');
 click(e,'pickMeta','casa');click(e,'saveMov');await sleep(60);
 ok(e.store.movimientos.i2.metaId==='casa'&&e.store.movimientos.i2.activoId==='BTC'&&e.store.movimientos.i2.participaciones===0.001,'vincular una inversión no toca sus datos');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
