const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
 // alguien que ya vio el Parche 2: le salen el 8, el 7 y el 6 (máximo tres)
 let e=makeEnv({version:{dinero:3},novedades:true,cfg:{app:{categoriasGasto:[{nombre:'X'}],novedadesVistas:'2026-10-09'},meta:{onboarded:true}}});
 e.w.SUPABASE_CONFIG={url:'https://x.supabase.co',anonKey:'k'};e.w.Auth.getSession=async()=>({access_token:'t'});
 await sleep(700);
 let sh=e.doc.querySelector('#sheetHost').textContent;
 ok(/PalomApp se ha actualizado/.test(sh)&&/Parche 8/.test(sh),'la ventana de novedades (Parche 8) sale al abrir');
 const dest=[...e.doc.querySelectorAll('.nov-dest')];
 ok(dest.length===6&&/Juntos, más claro/.test(dest[0].textContent)&&/Dinero, de un vistazo/.test(dest[1].textContent)&&/como en el banco/.test(dest[2].textContent)&&/Movimientos, más claro/.test(dest[3].textContent)&&/quién debe a quién/.test(dest[4].textContent)&&!/iguales para todos/.test(sh),'destacados del Parche 8 y, como no vio el 7 ni el 6, también los suyos (máximo tres versiones)');
 ok(dest.every(d=>/NUEVO/.test(d.textContent))&&dest.slice(0,2).every(d=>d.querySelector('[data-click^="novIr"]'))&&!dest[2].querySelector('[data-click^="novIr"]'),'todos con NUEVO; botón para probar solo en los de la versión nueva');
 ok(e.doc.querySelectorAll('.nov-it').length===18&&/Y además/.test(sh),'y debajo las novedades de las tres versiones');
 ok(dest[0].querySelector('.nov-dest-em svg.i')&&e.doc.querySelectorAll('.nov-it .nov-em svg.i').length===6,'el Parche 8 lleva iconos de la app, no emojis');
 ok(e.store.cfg.app.novedadesVistas==='2026-10-23','queda marcada como vista');
 click(e,'novIr','juntos');await sleep(400);
 ok(e.w.__APP__.S.tab==='juntos'&&!e.doc.querySelector('#sheetHost .nov-hero'),'«Ir a Juntos» cierra la ventana y lleva a Juntos');
 e.w.__APP__.H.goTab(['inicio']);await sleep(20);
 e.w.__APP__.H.goTab(['mas']);await sleep(20);click(e,'verNovedades','1');await sleep(20);
 sh=e.doc.querySelector('#sheetHost').textContent;
 ok(/Parche 8/.test(sh)&&/Parche 7/.test(sh)&&/Parche 6/.test(sh)&&/Parche 5/.test(sh)&&/Parche 4/.test(sh)&&/Parche 3/.test(sh)&&/Parche 2/.test(sh)&&e.doc.querySelectorAll('.nov-dest .nov-dest-btn').length===2,'Más → Novedades: todas las versiones (botones solo en la última)');
 click(e,'novIr','tumes');await sleep(400);
 ok(/Tu mes/.test(e.doc.querySelector('#sheetHost').textContent)&&!!e.doc.querySelector('#sheetHost [data-click^="tuMesModo"],#sheetHost .tumes-op,#sheetHost h2'),'tocar una novedad te lleva allí («Tu mes»)');
 ok(e.store.cfg.app.badgesVistos&&e.store.cfg.app.badgesVistos.tumes,'y quita la etiqueta de ese apartado');
 e.w.__APP__.H.closeSheet([]);await sleep(300);
 ok(e.doc.querySelector('#tbAvatar').classList.contains('con-novedad'),'punto en tu inicial (Tú) mientras haya algo nuevo');
 e.w.__APP__.H.goTab(['mas']);await sleep(20);
 let t=e.doc.querySelector('#content').innerHTML;
 ok(/Cobros y pagos recurrentes <span class="badge-new/.test(t),'Tú: cobros sigue con etiqueta hasta que entres');
 ok(e.doc.querySelectorAll('#content .badge-new').length===3,'Tú: como mucho 3 etiquetas a la vez (las de arriba)');
 { const v=Object.assign({},e.store.cfg.app.badgesVistos);['grupos','categorias','cobros','compartir','importar','reglas','fijo','detalle'].forEach(k=>v[k]='2026-10-13');delete v.cuentas;delete v.patrimonio;e.w.__APP__.S.config.badgesVistos=v;e.w.__APP__.render();await sleep(10);
   t=e.doc.querySelector('#content').innerHTML;ok(/Cuentas y saldos <span class="badge-new ">NUEVO/.test(t)&&/Metas <span class="badge-new mejor">MEJORADO/.test(t),'al ver las primeras, salen las siguientes (NUEVO en cuentas, MEJORADO en metas)');
   ok(!/Tu mes <span class="badge-new/.test(t),'«Tu mes» ya no lleva etiqueta: se entró desde las novedades'); }
 e.w.__APP__.H.goTab(['dinero']);await sleep(20);
 const btn=n=>[...e.doc.querySelectorAll('#content .chips-nav button')].find(b=>b.textContent.startsWith(n));
 ok(/badge-dot/.test(btn('Inversiones').innerHTML)&&/badge-dot/.test(btn('Metas').innerHTML),'puntos en las pestañas Inversiones y Metas');
 e.w.__APP__.H.setAnalisisSub(['inversiones']);await sleep(20);
 ok(!/badge-dot/.test(btn('Inversiones').innerHTML),'al entrar desaparece');
 // quien ya la vio no la vuelve a ver
 const e2=makeEnv({version:{dinero:3},novedades:true,cfg:{app:{categoriasGasto:[{nombre:'X'}],novedadesVistas:'2026-10-23'},meta:{onboarded:true}}});
 await sleep(700);
 ok(!e2.doc.querySelector('#sheetHost .nov-hero'),'si ya la viste, no sale otra vez');

 // la configuración llega antes que los movimientos (lo normal en el móvil): la ventana tiene que salir igual
 const e3=makeEnv({version:{dinero:3},novedades:true,cfg:{app:{categoriasGasto:[{nombre:'X'}],novedadesVistas:'2026-10-09'},meta:{onboarded:true}}});
 const o3=e3.w.Data;e3.w.Data=Object.assign({},o3,{collection:n=>n!=='movimientos'?o3.collection(n):({onSnapshot:cb=>{setTimeout(()=>cb({docs:[]}),900);return()=>{}}})});
 await sleep(500);
 ok(!e3.doc.querySelector('#sheetHost .nov-hero')&&e3.store.cfg.app.novedadesVistas==='2026-10-09','mientras cargan los movimientos aún no sale ni se marca como vista');
 await sleep(1100);
 ok(!!e3.doc.querySelector('#sheetHost .nov-hero')&&e3.store.cfg.app.novedadesVistas==='2026-10-23','cuando termina de cargar, sale y se marca como vista');
 // con otra ventana abierta espera a que se cierre
 const e4=makeEnv({version:{dinero:3},novedades:true,cfg:{app:{categoriasGasto:[{nombre:'X'}],novedadesVistas:'2026-10-09'},meta:{onboarded:true}}});
 await sleep(150);e4.w.__APP__.H.openMovForm([]);await sleep(700);
 ok(!e4.doc.querySelector('#sheetHost .nov-hero')&&e4.store.cfg.app.novedadesVistas==='2026-10-09','con un formulario abierto no la tapa ni la da por vista');
 e4.w.__APP__.H.closeSheet([]);await sleep(300);e4.w.__APP__.render();await sleep(600);
 ok(!!e4.doc.querySelector('#sheetHost .nov-hero'),'al cerrar el formulario, sale');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
