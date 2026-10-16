// Tareas: categoría como chips con sugerencia y «+ Nueva»
const {makeEnv,sleep,click}=require('./harness.js');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{
 const e=makeEnv({cfg:{app:{categoriasGasto:[{nombre:'X'}]},meta:{onboarded:true}}});await sleep(150);
 const A=e.w.__APP__,da=e.doc;e.w.console.error=(...x)=>console.log('CE',x.map(y=>y&&y.stack||y).join(' '));
 A.H.openTareaForm([]);await sleep(20);
 ok(da.querySelectorAll('#tCatChips .chip').length>=7,'categorías básicas como chips aunque no tengas ninguna');
 const n=da.querySelector('#tNombre');n.value='Pagar el IBI';n.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/Papeleo · sugerida/.test(da.querySelector('#tCatChips').textContent),'sugiere «Papeleo» por la palabra IBI');
 n.value='Cita con el médico';n.dispatchEvent(new e.w.Event('input',{bubbles:true}));await sleep(5);
 ok(/Salud · sugerida/.test(da.querySelector('#tCatChips').textContent),'«médico» sugiere Salud');
 click(e,'tCatPick','Casa');await sleep(5);
 ok(da.querySelector('#tCategoria').value==='Casa'&&!/sugerida/.test(da.querySelector('#tCatChips').textContent),'elegir una categoría la marca y quita la sugerencia');
 click(e,'tCatPick','Casa');await sleep(5);ok(da.querySelector('#tCategoria').value==='','tocarla otra vez la quita');
 click(e,'tCatNueva');await sleep(5);da.querySelector('#tCatNuevaIn').value='Coche';click(e,'tCatAdd');await sleep(5);
 ok(da.querySelector('#tCategoria').value==='Coche'&&/Coche/.test(da.querySelector('#tCatChips').textContent),'«+ Nueva» crea la categoría al momento');
 try{await A.H.saveTarea([]);}catch(x){console.log('ERR',x.stack)}await sleep(100);console.log('TOAST',(da.querySelector('#toast')||{}).textContent,JSON.stringify(e.store.tareas));
 const t=Object.values(e.store.tareas).find(x=>x.nombre==='Cita con el médico');
 ok(t&&t.categoria==='Coche','la tarea guarda la categoría');
 ok((A.cfg().categoriasTareas||[]).includes('Coche'),'la categoría nueva queda en tus categorías de tareas');
 // con categorías propias solo salen las tuyas
 A.H.openTareaForm([]);await sleep(20);
 ok(da.querySelectorAll('#tCatChips .chip:not(.nueva)').length===1,'con categorías propias, salen solo las tuyas');
 console.log(fails?'FAILED '+fails:'ALL PASS');process.exit(fails?1:0);
})().catch(x=>{console.error(x);process.exit(1)});
