// Uso: node crudas.js <carpeta-del-repo> <carpeta-crudas> [ancho=390] [alto=640]. Ver docs/marketing/12-ficha-google-play.md §3.
// Capturas crudas de PalomApp con datos inventados (tests/capturas/datos-falsos.js), para la ficha de Google Play.
const path = require('path'), fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const RAIZ = process.argv[2], SALIDA = process.argv[3];
const FALSOS = path.join(RAIZ, 'tests', 'capturas', 'datos-falsos.js');
// Sin logos de bancos (son marcas de otros) y un ticket inventado
const PREP = `if(!window.__prep){window.__prep=1;
const st=document.createElement('style');st.textContent='.badge-new,.badge-dot{display:none!important}';document.head.appendChild(st); // sin etiquetas NUEVO/MEJORADO (Google no quiere «nuevo» en las capturas)
const c=Object.assign({},A.S.config);c.cuentas=(c.cuentas||[]).map(x=>Object.assign({},x,{banco:""}));
c.ahorro=[{id:"mt1",nombre:"Viaje a Japón",objetivo:3000,fechaObjetivo:A.uAdd?undefined:undefined},{id:"mt2",nombre:"Colchón para imprevistos",objetivo:4000}];
c.informes={on:false};A.S.config=c;
const hoy=new Date(),Y=hoy.getFullYear(),M=hoy.getMonth(),D=hoy.getDate();
const f=(m,d)=>{const x=new Date(Y,M+m,Math.min(d,28));return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
const L=[];let n=0;const add=(m,d,tipo,cat,imp,desc)=>{if(m===0&&d>D)return;L.push({id:"pf"+(++n),tipo,categoria:cat,importe:imp,fecha:f(m,d),descripcion:desc,metodoPago:"Tarjeta"});};
for(const m of [0,-1,-2,-3]){
 add(m,1,"Ingreso","Nómina",1850,"Nómina");add(m,1,"Gasto","Hogar",620,"Alquiler");add(m,2,"Ahorro","Viaje a Japón",150,"");add(m,2,"Inversión","Fondo indexado",100,"");add(m,2,"Ahorro","Colchón para imprevistos",250,"");
 add(m,2,"Gasto","Suscripciones",12.99,"Música");add(m,3,"Factura","Luz",48.3,"Luz");add(m,5,"Gasto","Supermercado",47.1,"Mercado");add(m,6,"Gasto","Transporte",42.5,"Gasolina");
 add(m,7,"Gasto","Ocio",18.9,"Cine");add(m,8,"Gasto","Restaurantes",36,"Cena con amigos");add(m,9,"Gasto","Supermercado",84.35,"Compra semanal");add(m,10,"Gasto","Restaurantes",9.5,"Desayuno");
 add(m,14,"Gasto","Salud",23.4,"Farmacia");add(m,16,"Gasto","Supermercado",71.2,"Compra semanal");add(m,18,"Gasto","Ropa",59.95,"Zapatillas");add(m,21,"Gasto","Restaurantes",31,"Comida");add(m,24,"Gasto","Supermercado",66.8,"Compra semanal");add(m,26,"Gasto","Ocio",25,"Concierto");
}
A.S.movimientos=L;}
`;
const TICKET = `window.__reducirFoto=async()=>({b64:"x",tipo:"image/jpeg"});
window.__ticketsApi=async()=>({usados:3,limite:10,modelo:"rapido",ticket:{es_ticket:true,comercio:"Supermercado La Plaza",fecha:A.todayISO(),total:31.4,categoria:"Supermercado",
articulos:[{nombre:"Cervezas",cantidad:1,importe:5.4},{nombre:"Champú",cantidad:1,importe:3.95},{nombre:"Pan de pueblo",cantidad:1,importe:1.8},{nombre:"Fruta variada",cantidad:1,importe:6.25},{nombre:"Pasta y tomate",cantidad:1,importe:4.6},{nombre:"Detergente",cantidad:1,importe:9.4}]}});
A.leerTicket(new Blob(["x"]));
setTimeout(()=>{A.H.tkRep(["1"]);A.H.tkDest(["g:"+C.G1]);setTimeout(()=>{
 const q=(i,u)=>{const b=document.querySelector('#sheetHost [data-click="tkQuien|'+i+'|'+u+'"]');if(b)b.click();};
 const t=(i,u)=>{const b=document.querySelector('#sheetHost [data-click="artQuien|t|'+i+'|'+u+'"]');if(b)b.click();};
 t(0,"u-yo");t(0,"u-bea");t(1,"u-ana");t(1,"u-bea");t(5,"u-yo");t(5,"u-ana");
 setTimeout(()=>{const h=document.querySelector('#sheetHost .tk-cab');let e=h;while(e&&e!==document.body){const s=getComputedStyle(e);if(/(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight){window.__tkScroll=e;e.scrollTop=h.getBoundingClientRect().top-e.getBoundingClientRect().top+e.scrollTop-70;break;}e=e.parentElement;}},150);
},200);},400);`;
const PANTALLAS = [
  ['inicio', 'A.S.tab="inicio";A.render()'],
  ['movimientos', 'A.S.tab="movimientos";A.render()'],
  ['juntos', 'A.S.tab="juntos";A.render()'],
  ['grupo', 'A.S.tab="juntos";A.render();A.H.grupoVer([C.G1])'],
  ['dinero', 'A.S.tab="dinero";A.render()'],
  ['agenda', 'A.S.tab="agenda";A.render()'],
  ['ticket', TICKET],
  ['ticket2', 'const e=window.__tkScroll;const r=document.querySelector("#sheetHost .tk-list .tk-item:nth-child(4)");if(e&&r)e.scrollTop=r.getBoundingClientRect().top-e.getBoundingClientRect().top+e.scrollTop-10;'],
  ['origen', 'A.S.tab="juntos";A.render();A.H.grupoVer([C.G1]);setTimeout(()=>A.H.origenVer([C.G1]),200)'],
  ['metas', 'A.S.tab="dinero";A.render();A.H.dm3Tab(["metas"])'],
  ['mov-gastas', 'A.S.tab="movimientos";A.render();setTimeout(()=>{const t=[...document.querySelectorAll("#app *")].find(e=>e.children.length===0&&/En qué gastas/.test(e.textContent));if(t)window.scrollTo(0,t.getBoundingClientRect().top+scrollY-70);},300)'],
  ['historial', 'A.S.tab="juntos";A.render();A.H.histVer([C.G1])'],
];
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const ancho = +(process.argv[4] || 390), alto = +(process.argv[5] || 640);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, colorScheme: 'dark', deviceScaleFactor: 3 });
  const p = await ctx.newPage(); const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  await p.route('**/*', (r) => {
    const u = r.request().url();
    if (/data-layer\.js$/.test(u)) return r.fulfill({ path: FALSOS, contentType: 'text/javascript' });
    if (/config\.js$/.test(u)) return r.fulfill({ body: 'window.SUPABASE_CONFIG={url:"https://ejemplo.invalid",anonKey:"inventada"};', contentType: 'text/javascript' });
    if (/supabase|auth-signup\.js$|fonts\.g/.test(u)) return r.fulfill({ body: '', contentType: /css|fonts/.test(u) ? 'text/css' : 'text/javascript' });
    return r.continue();
  });
  await p.goto('file://' + path.join(RAIZ, 'index.html'));
  await p.waitForFunction(() => window.__APP__ && document.querySelector('#app').textContent.length > 50, null, { timeout: 15000 });
  await p.waitForTimeout(800);
  for (const [id, js] of PANTALLAS) {
    if (id !== 'ticket2') await p.evaluate(() => { try { window.__APP__.H.closeSheet([]); } catch (e) {} });
    await p.waitForTimeout(400);
    try { await p.evaluate((code) => { const A = window.__APP__, C = window.__CAPTURAS__; eval(code); }, (id === 'ticket2' ? '' : 'window.scrollTo(0,0);') + PREP + js); } catch (e) { errores.push(id + ': ' + e.message); }
    await p.waitForTimeout(1400);
    await p.screenshot({ path: path.join(SALIDA, id + '.png') });
  }
  if (errores.length) console.log('Errores:', errores);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
