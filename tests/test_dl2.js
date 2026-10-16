// data-layer: API de gastos compartidos con un cliente de Supabase simulado
const {JSDOM}=require('jsdom'),fs=require('fs');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const calls=[];let rt=null;
function builder(table){
  const st={table,ops:[]};
  const b={select(x){st.ops.push('select:'+(x||'*'));return b},is(k,v){st.ops.push('is:'+k+'='+v);return b},eq(k,v){st.ops.push('eq:'+k+'='+v);return b},order(){return b},range(a,z){st.range=[a,z];return b},
    insert(row){st.ins=row;return b},update(row){st.upd=row;return b},single(){st.single=true;return b},
    then(res,rej){
      calls.push(st);
      if(st.ins)return Promise.resolve({data:Object.assign({id:'srv1',creado_por:'u1',created_at:'t'},st.ins),error:null}).then(res,rej);
      if(st.upd&&st.upd.borrado)return Promise.resolve({data:st.ops.includes('eq:id=ajeno')?[]:[{id:'x'}],error:null}).then(res,rej);
      if(st.upd)return Promise.resolve({data:Object.assign({id:'c1',grupo_id:'g1',pagado_por:'u1',reparto:{u1:5}},st.upd),error:null}).then(res,rej);
      return Promise.resolve({data:[{id:'c1',grupo_id:'g1',fecha:'2026-10-10',tipo:'Gasto',categoria:'Cena',descripcion:null,importe:'60.00',pagado_por:'u1',reparto:{u1:30,u2:30},modo:'igual'}],error:null}).then(res,rej);
    }};
  return b;
}
const fakeSb={from:builder,rpc(){return Promise.resolve({data:null,error:null})},channel(n){const c={on(_e,f,h){rt={n,f,h};return c},subscribe(){return c}};return c},removeChannel(){},
  auth:{onAuthStateChange(cb){setTimeout(()=>cb('SIGNED_IN',{user:{id:'u1'}}),0)},getSession:async()=>({data:{session:{user:{id:'u1'}}}})}};
const dom=new JSDOM('',{runScripts:'outside-only'});const w=dom.window;
w.supabase={createClient:()=>fakeSb};w.SUPABASE_CONFIG={url:'x',anonKey:'y'};
w.eval(fs.readFileSync(require('path').join(__dirname,'..','data-layer.js'),'utf8'));
(async()=>{
 await sleep(10);
 let got=null;w.Data.compartidos.suscribir(r=>{got=r});await sleep(20);
 ok(calls[0].table==='compartidos'&&calls[0].ops.includes('is:borrado=null'),'solo lee los no borrados');
 ok(got&&got[0].grupoId==='g1'&&got[0].pagadoPor==='u1'&&got[0].importe===60&&got[0].descripcion===''&&got[0].reparto.u2===30,'convierte las filas (importe como número)');
 ok(rt&&rt.f.table==='compartidos'&&!rt.f.filter,'escucha cambios en tiempo real (filtrados por las reglas de la base de datos)');
 const c=await w.Data.compartidos.crear({grupoId:'g1',fecha:'2026-10-10',tipo:'Gasto',categoria:'X',descripcion:'',importe:10,pagadoPor:'u1',reparto:{u1:10},modo:'igual',otro:'no'});
 const ins=calls.find(x=>x.ins).ins;
 ok(ins.grupo_id==='g1'&&ins.pagado_por==='u1'&&!('id' in ins)&&!('otro' in ins)&&!('user_id' in ins)&&!('creado_por' in ins),'crear: columnas en snake_case, sin id ni campos extra');
 ok(c.id==='srv1'&&c.grupoId==='g1','crear devuelve la fila del servidor');
 await w.Data.compartidos.editar('c1',{grupoId:'g2',importe:20,reparto:{u1:20}});
 const up=calls.filter(x=>x.upd&&!x.upd.borrado).pop();
 ok(!('grupo_id' in up.upd)&&up.upd.importe===20&&up.ops.includes('eq:id=c1'),'editar no cambia de grupo');
 await w.Data.compartidos.borrar('c1');
 const bo=calls.filter(x=>x.upd&&x.upd.borrado).pop();
 ok(bo&&bo.ops.includes('eq:id=c1'),'borrar = marcar como borrado');
 let e=null;try{await w.Data.compartidos.borrar('ajeno')}catch(x){e=x}
 ok(e&&/no_autorizado/.test(e.message),'si no se puede borrar (ajeno), da error');
 // metas y deudas compartidas
 await w.Data.objetivos.crear({grupoId:'g1',tipo:'ahorro',nombre:'Viaje',objetivo:3000,fechaObjetivo:'2027-06-01',previo:200,otro:1});
 const io=calls.filter(x=>x.ins).pop();
 ok(io.table==='objetivos_compartidos'&&io.ins.grupo_id==='g1'&&io.ins.fecha_objetivo==='2027-06-01'&&io.ins.previo===200&&!('otro' in io.ins)&&!('id' in io.ins),'objetivos: crear en snake_case');
 await w.Data.objetivos.editar('o1',{grupoId:'g2',tipo:'deuda',nombre:'Viaje 2'});
 const uo=calls.filter(x=>x.upd&&x.table==='objetivos_compartidos').pop();
 ok(uo&&!('grupo_id' in uo.upd)&&!('tipo' in uo.upd)&&uo.upd.nombre==='Viaje 2','objetivos: editar no cambia ni grupo ni tipo');
 const c2=await w.Data.compartidos.crear({grupoId:'g1',tipo:'Ahorro',importe:5,pagadoPor:'u1',reparto:{u1:5},objetivoId:'o1'});
 ok(calls.filter(x=>x.ins&&x.table==='compartidos').pop().ins.objetivo_id==='o1','aportación con su meta (objetivo_id)');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})();
