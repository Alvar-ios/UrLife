// Prueba de data-layer.js con un cliente de Supabase simulado: paginación, agrupación de recargas, inserción en bloque y borrado por lote.
const {JSDOM}=require('jsdom'),fs=require('fs');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rows=Array.from({length:2500},(_,i)=>({id:'r'+String(i).padStart(5,'0'),user_id:'u1',tipo:'Gasto',importe:i,fecha:'2026-01-01',creado_en:i}));
const calls=[];let rtHandler=null;
function builder(table){
  const st={table,ops:[]};
  const b={
    select(){st.ops.push('select');return b},eq(k,v){st.ops.push('eq:'+k+'='+v);return b},order(k){st.ops.push('order:'+k);return b},
    range(a,z){st.range=[a,z];return b},
    upsert(chunk,opts){calls.push({op:'upsert',n:Array.isArray(chunk)?chunk.length:1,opts,chunk});return Promise.resolve({error:null})},
    delete(){st.del=true;return b},
    then(res,rej){
      if(st.del){calls.push({op:'delete',ops:st.ops.slice()});return Promise.resolve({error:null}).then(res,rej)}
      const [a,z]=st.range||[0,999];calls.push({op:'select',range:[a,z]});
      return Promise.resolve({data:rows.slice(a,Math.min(z,a+999)+1),error:null}).then(res,rej);
    }};
  return b;
}
const fakeSb={from:builder,channel(){const c={on(_e,_f,h){rtHandler=h;return c},subscribe(){return c}};return c},removeChannel(){},
  auth:{onAuthStateChange(cb){setTimeout(()=>cb('SIGNED_IN',{user:{id:'u1'}}),0)},getSession:async()=>({data:{session:{user:{id:'u1'}}}})}};
const dom=new JSDOM('',{runScripts:'outside-only'});const w=dom.window;
w.supabase={createClient:()=>fakeSb};w.SUPABASE_CONFIG={url:'x',anonKey:'y'};
w.eval(fs.readFileSync(require('path').join(__dirname,'..','data-layer.js'),'utf8'));
(async()=>{
 await sleep(10);
 let snaps=[];
 w.Data.collection('movimientos').onSnapshot(s=>snaps.push(s.docs.length));
 await sleep(30);
 ok(snaps[0]===2500,'lee 2500 filas en páginas de 1000 ('+snaps[0]+')');
 ok(calls.filter(c=>c.op==='select').map(c=>c.range[0]).join()==='0,1000,2000','tres páginas');
 // ráfaga de 50 cambios en tiempo real → una sola recarga
 const antes=calls.filter(c=>c.op==='select').length;
 for(let i=0;i<50;i++)rtHandler();
 await sleep(400);
 ok(calls.filter(c=>c.op==='select').length-antes===3&&snaps.length===2,'50 avisos de cambio → una sola recarga');
 // inserción en bloque
 const items=Array.from({length:450},(_,i)=>({id:'imp-'+i,data:{tipo:'Gasto',importe:1,fecha:'2026-01-01',creadoEn:1,lote:'L1'}}));
 const n=await w.Data.collection('movimientos').bulkInsert(items);
 const ups=calls.filter(c=>c.op==='upsert');
 ok(n===450&&ups.map(u=>u.n).join()==='200,200,50','450 filas en 3 bloques');
 ok(ups[0].opts.ignoreDuplicates===true&&ups[0].opts.onConflict==='id','no pisa filas existentes');
 ok(ups[0].chunk[0].user_id==='u1'&&ups[0].chunk[0].creado_en===1&&ups[0].chunk[0].lote==='L1','columnas en snake_case con usuario');
 // borrado por lote
 await w.Data.collection('movimientos').deleteWhere('lote','L1');
 const del=calls.find(c=>c.op==='delete');
 ok(del&&del.ops.includes('eq:user_id=u1')&&del.ops.includes('eq:lote=L1'),'borra solo tus filas de ese lote');
 let err=null;try{await w.Data.collection('movimientos').deleteWhere('tipo','Gasto')}catch(e){err=e}
 ok(!!err,'no permite borrar por otro campo');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})();
