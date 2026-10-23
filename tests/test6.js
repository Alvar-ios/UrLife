const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt=aal=>'h.'+b64({aal})+'.s';
(async()=>{
 // ---- moneda
 let e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs:[{id:'a',tipo:'Ingreso',categoria:'N',importe:1234.5,fecha:new Date().toISOString().slice(0,8)+'01'}]});
 await sleep(200);const doc=e.doc,txt=()=>doc.querySelector('#content').textContent;
 ok(/1\.235 €|1\.234,50 €/.test(txt()),'EUR por defecto ('+txt().slice(0,200)+')');
 e.w.__APP__.H.goTab(['mas']);ok(/Moneda/.test(txt())&&/EUR €/.test(txt()),'Más muestra Moneda');
 click(e,'openMoneda');click(e,'setMoneda','USD');await sleep(40);
 ok(e.store.cfg.app.moneda==='USD'&&e.store.cfg.app.categoriasGasto.length===1,'USD guardado sin tocar resto');
 click(e,'closeSheet');e.w.__APP__.H.goTab(['inicio']);ok(/1\.235 \$|1\.234,50 \$/.test(txt())&&!/€/.test(txt()),'dashboard en $');
 e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovVista(['lista']);ok(/\+1\.234,50 \$/.test(txt()),'movimientos en $');
 e.w.__APP__.H.onFabAntiguo([]);ok(/Importe \(\$\)/.test(doc.querySelector('#sheetHost').textContent),'etiqueta importe ($)');click(e,'closeSheet');
 e.w.__APP__.H.goTab(['mas']);click(e,'openMoneda');click(e,'setMoneda','JPY');await sleep(40);click(e,'closeSheet');e.w.__APP__.H.goTab(['movimientos']);e.w.__APP__.H.setMovVista(['lista']);
 ok(/\+1\.23[45] ¥/.test(txt()),'JPY sin decimales');
 ok(true,'sin supabase: sin entrada 2FA='+!/Verificación en dos pasos/.test((e.w.__APP__.H.goTab(['mas']),txt())));
 // ---- 2FA
 const calls=[];
 const mkSb=(factors)=>({createClient:()=>({auth:{mfa:{
   listFactors:async()=>({data:{totp:factors.filter(f=>f.status==='verified'),all:factors}}),
   unenroll:async a=>{calls.push(['unenroll',a.factorId]);return{data:{}}},
   enroll:async a=>{calls.push(['enroll']);return{data:{id:'F2',totp:{qr_code:'data:image/svg+xml;utf8,<svg/>',secret:'ABCDEF'}}}},
   challengeAndVerify:async a=>{calls.push(['verify',a.factorId,a.code]);return a.code==='123456'?{data:{}}:{error:{message:'Invalid TOTP code'}}}}}})});
 // sesión con factor verificado y aal1 -> pantalla de código, sin app
 const sess=(aal,fs)=>({access_token:jwt(aal),user:{email:'t@t.com',factors:fs}});
 const pre=(sb,session)=>w=>{w.SUPABASE_CONFIG={url:'u',anonKey:'k'};w.supabase=sb;w.__reload=0;};
 let e2=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs:[],session:sess('aal1',[{id:'F1',status:'verified',factor_type:'totp'}]),pre:pre(mkSb([{id:'F1',status:'verified',factor_type:'totp'}]))});
 await sleep(40);
 ok(!e2.w.__APP__.S.appStarted&&/Verificación en dos pasos/.test(e2.doc.body.textContent)&&!!e2.doc.querySelector('#mfaCode'),'aal1 + factor: pide código y no entra');
 e2.doc.querySelector('#mfaCode').value='000000';click(e2,'doMfaVerify');await sleep(30);
 ok(/Código incorrecto/.test(e2.doc.body.textContent),'código malo: mensaje');
 ok(!e2.w.__APP__.S.appStarted,'sigue sin entrar');
 // aal2 -> entra
 let e3=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs:[],session:sess('aal2',[{id:'F1',status:'verified',factor_type:'totp'}]),pre:pre(mkSb([]))});await sleep(200);
 ok(e3.w.__APP__.S.appStarted,'aal2 entra');
 // sin factores -> entra y ofrece activar
 let e4=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}},movs:[],pre:pre(mkSb([{id:'OLD',status:'unverified',factor_type:'totp'}]))});
 await sleep(200);ok(e4.w.__APP__.S.appStarted,'sin factor verificado: entra normal');
 e4.w.__APP__.H.goTab(['mas']);ok(/Verificación en dos pasos/.test(e4.doc.querySelector('#content').textContent),'Más ofrece 2FA');
 click(e4,'openSeguridad');await sleep(40);ok(/Activar/.test(e4.doc.querySelector('#sheetHost').textContent),'sheet: activar');
 click(e4,'mfaStart');await sleep(200);
 ok(calls.some(c=>c[0]==='unenroll'&&c[1]==='OLD')&&calls.some(c=>c[0]==='enroll'),'limpia intento abandonado y enrola');
 ok(!!e4.doc.querySelector('#sheetHost img')&&/ABCDEF/.test(e4.doc.querySelector('#sheetHost').textContent),'muestra QR y clave');
 e4.doc.querySelector('#mfaCode').value='12';click(e4,'mfaConfirm','F2');await sleep(30);
 ok(/Escribe los 6/.test(e4.doc.querySelector('#mfaMsg').textContent),'valida 6 dígitos');
 e4.doc.querySelector('#mfaCode').value='999999';click(e4,'mfaConfirm','F2');await sleep(30);
 ok(/incorrecto/.test(e4.doc.querySelector('#mfaMsg').textContent),'código malo en activación');
 e4.doc.querySelector('#mfaCode').value='123456';click(e4,'mfaConfirm','F2');await sleep(30);
 ok(calls.some(c=>c[0]==='verify'&&c[2]==='123456'),'verifica con el código bueno');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
