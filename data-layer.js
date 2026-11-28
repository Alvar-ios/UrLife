/* ============================================================
   MIS FINANZAS Y TAREAS — capa de datos (Supabase)
   ------------------------------------------------------------
   Este archivo es la ÚNICA parte que sabe que existe Supabase.
   Expone un objeto `db` con la MISMA forma que usaba la app
   cuando corría dentro de Claude (collection(x).doc(id).set/get/
   delete, collection(x).add(), collection(x).onSnapshot(),
   doc('config/app').get/set/update/onSnapshot()), para que
   app.js casi no tenga que cambiar.

   Requiere que window.SUPABASE_CONFIG = { url, anonKey } esté
   definido antes de cargar este archivo (ver config.js).
   ============================================================ */
(function () {
  'use strict';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('No se encontró la librería de Supabase. Revisa que el <script> de supabase-js esté antes de este archivo.');
    return;
  }
  var cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey) {
    console.error('Falta window.SUPABASE_CONFIG.url / anonKey. Copia config.example.js a config.js y rellénalo.');
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  var TABLES = { movimientos: 'movimientos', tareas: 'tareas', golf: 'golf' };

  /* ---- utilidades de mapeo camelCase (app) <-> snake_case (Postgres) ---- */
  function toSnake(s) { return s.replace(/[A-Z]/g, function (m) { return '_' + m.toLowerCase(); }); }
  function toCamel(s) { return s.replace(/_([a-z0-9])/g, function (_, c) { return c.toUpperCase(); }); }
  function rowToObj(row) {
    var out = {};
    Object.keys(row).forEach(function (k) {
      if (k === 'user_id') return;
      out[k === 'id' ? 'id' : toCamel(k)] = row[k];
    });
    return out;
  }
  function objToRow(obj, id, uid) {
    var row = { id: id, user_id: uid };
    Object.keys(obj).forEach(function (k) {
      if (k === 'id') return;
      row[toSnake(k)] = obj[k] === undefined ? null : obj[k];
    });
    return row;
  }
  function newId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function pgError(e) {
    var err = new Error((e && e.message) || 'Error de base de datos');
    err.code = (e && e.code) || 'unknown';
    if (esRed(e)) err.code = 'network'; // 26/11: un corte de red se reconoce siempre (reintentos, cola sin conexión)
    err.original = e;
    return err;
  }
  function esRed(e) {
    if (!e) return false;
    if (e.code === 'network' || e.code === 'sin_conexion') return true;
    var o = e.original || e, m = String((o && o.message) || '') + ' ' + String(e.message || '');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    return /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|timed out|econn|enotfound|aborted/i.test(m) || (o && o.status === 0) || (o && typeof o.status === 'number' && o.status >= 500);
  }
  function esSesion(e) {
    var o = (e && (e.original || e)) || {};
    return o.status === 401 || /PGRST30[123]|jwt/i.test(String(o.code || '') + ' ' + String(o.message || ''));
  }

  var currentUid = null;
  // 08/11 (barrido de Calidad, fallo 3): lo que guardas se vuelve a leer aunque se pierda el aviso «en vivo»,
  // y todo se relee al volver a la app o al recuperar la conexión.
  var recargas = {};
  function avisarCambio(table) { (recargas[table] || []).forEach(function (f) { try { f(); } catch (e) { /* */ } }); }
  function recargarTodo() { Object.keys(recargas).forEach(avisarCambio); }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { recargarTodo(); vaciarPronto(); } });
  if (typeof window !== 'undefined') {
    window.addEventListener('online', function () { red.sin = false; emitir(); revalidarSesion(); recargarTodo(); vaciarPronto(); });
    window.addEventListener('offline', function () { emitir(); });
  }


  /* ============================================================
     COPIA LOCAL Y COLA SIN CONEXIÓN (26/11, docs/52). SOLO en las apps de Android e iPhone (hace falta
     window.__nativo.claveLocal: la clave vive en el Keystore / Llavero). En la web del navegador no se guarda nada.
     - Copia: lo último que se leyó de cada tabla, cifrado con AES-GCM, en IndexedDB y por usuario. Se pinta cuando no hay red.
     - Cola: los cambios hechos sin red (crear = upsert por id puesto en el móvil, editar = update sin resucitar, borrar,
       y cambios de configuración por claves). Cada uno lleva su usuario: lo de otra cuenta NUNCA se sube. Sobrevive a
       cerrar la app. Se sube de uno en uno y en orden al volver la red; nada se descarta solo.
     - Lo compartido (Juntos) solo se lee sin red.
     ============================================================ */
  var L = { uid: null, cola: [], snaps: {}, vistos: {}, listo: null, cadena: Promise.resolve(), subiendo: false, escuchas: [], tSnap: {} };
  var red = { sin: false };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* */ } return null; }
  function nat() { return typeof window !== 'undefined' ? window.__nativo : null; }
  function localOn() { try { return !!(nat() && typeof nat().claveLocal === 'function' && window.indexedDB && window.crypto && window.crypto.subtle); } catch (e) { return false; } }
  function sinRedAhora() { return (typeof navigator !== 'undefined' && navigator.onLine === false) || red.sin; }
  function errSinRed() { var e = new Error('Sin conexión'); e.code = 'sin_conexion'; return e; }
  function conRed(fn) { return function () { if (sinRedAhora()) return Promise.reject(errSinRed()); return fn.apply(this, arguments); }; }
  function emitir() { L.escuchas.slice().forEach(function (f) { try { f(); } catch (e) { /* */ } }); }
  // bytes <-> texto <-> base64 (sin depender de TextEncoder, que no está en todos los entornos)
  function aBytes(str) { var u = unescape(encodeURIComponent(str)), b = new Uint8Array(u.length); for (var i = 0; i < u.length; i++) b[i] = u.charCodeAt(i); return b; }
  function deBytes(b) { var out = [], i = 0; for (; i < b.length; i += 8192) out.push(String.fromCharCode.apply(null, b.subarray(i, i + 8192))); return decodeURIComponent(escape(out.join(''))); }
  function b64(b) { var out = [], i = 0; for (; i < b.length; i += 8192) out.push(String.fromCharCode.apply(null, b.subarray(i, i + 8192))); return btoa(out.join('')); }
  function deB64(t) { var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  var clavePromesa = null;
  function clave() {
    if (!clavePromesa) clavePromesa = Promise.resolve(nat().claveLocal()).then(function (k) { return window.crypto.subtle.importKey('raw', deB64(k), 'AES-GCM', false, ['encrypt', 'decrypt']); }).catch(function (e) { clavePromesa = null; throw e; });
    return clavePromesa;
  }
  function cifrar(obj) {
    return clave().then(function (k) {
      var iv = window.crypto.getRandomValues(new Uint8Array(12));
      return window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, aBytes(JSON.stringify(obj))).then(function (ct) { return b64(iv) + '.' + b64(new Uint8Array(ct)); });
    });
  }
  function descifrar(txt) {
    if (!txt) return Promise.resolve(undefined);
    var p = String(txt).split('.');
    return clave().then(function (k) { return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(p[0]) }, k, deB64(p[1])); })
      .then(function (pt) { return JSON.parse(deBytes(new Uint8Array(pt))); }, function () { return undefined; }); // clave distinta o dato roto: se vuelve a pedir al servidor
  }
  var idbs = {};
  function abrirDb(uid) {
    return idbs[uid] || (idbs[uid] = new Promise(function (ok, ko) {
      var r = window.indexedDB.open('palomapp-' + uid, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { delete idbs[uid]; ko(r.error); };
    }));
  }
  function kv(uid, modo, k, v) {
    return abrirDb(uid).then(function (db) {
      return new Promise(function (ok, ko) {
        var tx = db.transaction('kv', modo === 'get' ? 'readonly' : 'readwrite'), st = tx.objectStore('kv'), r = modo === 'get' ? st.get(k) : modo === 'put' ? st.put(v, k) : st.delete(k);
        tx.oncomplete = function () { ok(modo === 'get' ? r.result : undefined); };
        tx.onerror = tx.onabort = function () { ko(tx.error); };
      });
    });
  }
  function borrarDb(uid) {
    var p = idbs[uid] ? idbs[uid].then(function (db) { db.close(); }, function () { /* */ }) : Promise.resolve();
    delete idbs[uid];
    return p.then(function () { return new Promise(function (ok) { try { var r = window.indexedDB.deleteDatabase('palomapp-' + uid); r.onsuccess = r.onerror = r.onblocked = function () { ok(); }; } catch (e) { ok(); } }); });
  }
  function guardarCola() {
    var uid = L.uid; if (!uid) return Promise.resolve();
    var copia = L.cola.slice();
    L.cadena = L.cadena.then(function () { return cifrar(copia); }).then(function (c) { return kv(uid, 'put', 'cola', c); });
    L.cadena.catch(function () { /* se avisa más abajo */ });
    return L.cadena;
  }
  function guardarSnap(tabla, datos) {
    var uid = L.uid; if (!uid) return;
    L.snaps[tabla] = datos;
    clearTimeout(L.tSnap[tabla]);
    L.tSnap[tabla] = setTimeout(function () { cifrar(datos).then(function (c) { if (L.uid === uid) return kv(uid, 'put', 'snap:' + tabla, c); }).catch(function () { /* sin espacio o sin clave: sigue sin copia */ }); }, 800);
  }
  function leerSnap(tabla) {
    if (!L.uid) return Promise.resolve(undefined);
    if (L.snaps[tabla] !== undefined) return Promise.resolve(L.snaps[tabla]);
    var uid = L.uid;
    return kv(uid, 'get', 'snap:' + tabla).then(descifrar).then(function (d) { if (d !== undefined) L.snaps[tabla] = d; return d; }, function () { return undefined; });
  }
  // se abre la copia y la cola de esta cuenta (si cambia la cuenta, solo se conserva la cola de la anterior, sin subirla jamás con la nueva)
  function iniciarLocal(uid, mail, factores) {
    if (!localOn() || !uid) return;
    if (L.uid === uid && L.listo) return;
    var antes = ls('palom:uid');
    if (antes && antes !== uid) { try { abrirDb(antes).then(function (db) { var tx = db.transaction('kv', 'readwrite'), st = tx.objectStore('kv'); st.openCursor().onsuccess = function (ev) { var c = ev.target.result; if (!c) return; if (String(c.key).indexOf('snap:') === 0) st.delete(c.key); c.continue(); }; }).catch(function () { /* */ }); } catch (e) { /* */ } }
    L.uid = uid; L.cola = []; L.snaps = {}; L.vistos = {};
    ls('palom:uid', uid); if (mail !== undefined) ls('palom:mail', mail || ''); if (factores !== undefined) ls('palom:fact', factores ? JSON.stringify(factores) : null);
    L.listo = kv(uid, 'get', 'cola').then(descifrar).then(function (c) { if (L.uid === uid) L.cola = Array.isArray(c) ? c : []; emitir(); }, function () { /* */ });
    return L.listo;
  }
  function olvidarLocal() {
    var uid = L.uid || ls('palom:uid');
    L.uid = null; L.cola = []; L.snaps = {}; L.vistos = {}; L.listo = null; clavePromesa = null;
    ls('palom:uid', null); ls('palom:mail', null); ls('palom:fact', null);
    var p = uid ? borrarDb(uid) : Promise.resolve();
    try { if (nat() && nat().olvidarClaveLocal) nat().olvidarClaveLocal(); } catch (e) { /* */ }
    emitir();
    return p;
  }
  function activoLocal() { return localOn() && !!L.uid && L.uid === currentUid; }
  function colaMia() { return L.cola.filter(function (o) { return o.uid === L.uid; }); }
  // lo que está en la cola se pone encima de lo que llega (del servidor o de la copia)
  function conCola(col, filas) {
    var ops = colaMia().filter(function (o) { return o.col === col; });
    if (!ops.length) return filas;
    var m = {}, orden = [];
    filas.forEach(function (r) { m[r.id] = r; orden.push(r.id); });
    ops.forEach(function (o) {
      if (o.tipo === 'borrar') { delete m[o.id]; return; }
      if (!m[o.id]) orden.push(o.id);
      m[o.id] = Object.assign({}, o.data, { id: o.id });
    });
    return orden.filter(function (id, i) { return m[id] && orden.indexOf(id) === i; }).map(function (id) { return m[id]; });
  }
  function cfgConCola(key, valor) {
    var ops = colaMia().filter(function (o) { return o.col === 'config:' + key; });
    if (!ops.length) return valor;
    return ops.reduce(function (acc, o) { return o.tipo === 'cfgset' ? Object.assign({}, o.data) : Object.assign(acc, o.data); }, Object.assign({}, valor || {}));
  }
  function recordarVistos(col, filas) { var m = {}; filas.forEach(function (r) { m[r.id] = r.updatedAt || null; }); L.vistos[col] = m; }
  function nuevaOp(o) { o.idOp = newId(); o.uid = L.uid; o.t = Date.now(); o.estado = 'pend'; o.intentos = 0; return o; }
  // mete un cambio en la cola (compactando por registro) y lo guarda en el móvil antes de decir que está hecho
  function encolar(op) {
    var o = nuevaOp(op), cola = L.cola;
    if (o.tipo === 'cfg' || o.tipo === 'cfgset') {
      var ya = cola.filter(function (x) { return x.uid === o.uid && x.col === o.col && x.estado === 'pend' && (x.tipo === 'cfg' || x.tipo === 'cfgset'); });
      if (o.tipo === 'cfgset') ya.forEach(function (x) { cola.splice(cola.indexOf(x), 1); });
      if (o.tipo === 'cfg' && ya.length) { var u = ya[ya.length - 1]; u.data = Object.assign({}, u.data, o.data); }
      else cola.push(o);
    } else {
      var previas = cola.filter(function (x) { return x.uid === o.uid && x.col === o.col && x.id === o.id && x.estado === 'pend'; }), ult = previas[previas.length - 1];
      if (o.tipo === 'set') {
        var visto = L.vistos[o.col] && Object.prototype.hasOwnProperty.call(L.vistos[o.col], o.id);
        if (ult && (ult.tipo === 'crear' || ult.tipo === 'editar')) { ult.data = o.data; }
        else if (ult && ult.tipo === 'borrar') { ult.tipo = 'crear'; ult.data = o.data; ult.base = null; } // «Deshacer» de un borrado: se vuelve a poner tal cual
        else { o.tipo = visto ? 'editar' : 'crear'; o.base = visto ? (L.vistos[o.col][o.id] || null) : null; cola.push(o); }
      } else if (o.tipo === 'borrar') {
        if (ult && ult.tipo === 'crear') cola.splice(cola.indexOf(ult), 1); // nunca llegó al servidor: no hay nada que borrar
        else if (ult) { ult.tipo = 'borrar'; ult.data = null; }
        else cola.push(o);
      }
    }
    emitir();
    return guardarCola().then(function () { if (col0(o)) avisarCambio(col0(o)); vaciarPronto(); }, function (e) {
      var er = new Error('No hay espacio para guardar sin conexión'); er.code = 'sin_espacio'; throw er;
    });
  }
  function col0(o) { return /^config:/.test(o.col) ? null : o.col; }
  function ejecutar(op) {
    var tabla = op.col;
    if (/^config:/.test(tabla)) {
      var key = tabla.slice(7);
      var leer = sb.from('config').select('value').eq('user_id', op.uid).eq('key', key).maybeSingle();
      return guardandoCfg(key, leer.then(function (res) {
        if (res.error) throw pgError(res.error);
        var valor = op.tipo === 'cfgset' ? op.data : Object.assign({}, (res.data && res.data.value) || {}, op.data);
        return sb.from('config').upsert({ user_id: op.uid, key: key, value: valor }).then(function (r2) { if (r2.error) throw pgError(r2.error); });
      }));
    }
    if (op.tipo === 'borrar') return sb.from(tabla).delete().eq('id', op.id).eq('user_id', op.uid).then(function (res) { if (res.error) throw pgError(res.error); });
    var row = objToRow(op.data, op.id, op.uid); delete row.updated_at;
    if (op.tipo === 'crear') return sb.from(tabla).upsert(row).then(function (res) { if (res.error) throw pgError(res.error); });
    // editar: no se resucita lo que otro móvil borró ni se pisa lo que otro cambió después
    var campos = tabla === 'golf' ? 'id' : 'id,updated_at';
    return sb.from(tabla).select(campos).eq('id', op.id).eq('user_id', op.uid).maybeSingle().then(function (r) {
      if (r.error) throw pgError(r.error);
      var conf = null;
      if (!r.data) conf = 'borrado';
      else if (op.base && r.data.updated_at && r.data.updated_at !== op.base) conf = 'cambiado';
      if (conf) { var c = new Error(conf); c.conflicto = conf; throw c; }
      delete row.id; delete row.user_id;
      return sb.from(tabla).update(row).eq('id', op.id).eq('user_id', op.uid).select('id').then(function (u) {
        if (u.error) throw pgError(u.error);
        if (!u.data || !u.data.length) { var c2 = new Error('borrado'); c2.conflicto = 'borrado'; throw c2; }
      });
    });
  }
  function puedeSubir() { return !!(currentUid && lastSession && !lastSession.sinComprobar && L.uid === currentUid && navigator.onLine !== false); }
  function vaciar() {
    if (!activoLocal() || L.subiendo || !puedeSubir() || !colaMia().some(function (o) { return o.estado === 'pend'; })) return Promise.resolve();
    L.subiendo = true; emitir();
    var tocadas = {};
    function siguiente() {
      var op = L.cola.filter(function (o) { return o.estado === 'pend' && o.uid === currentUid; })[0];
      if (!op || !puedeSubir()) return Promise.resolve();
      return ejecutar(op).then(function () {
        red.sin = false; L.cola.splice(L.cola.indexOf(op), 1); tocadas[op.col] = 1; return guardarCola();
      }, function (e) {
        if (!e || !e.conflicto) { if (esRed(e)) { red.sin = true; throw e; } if (esSesion(e)) throw e; }
        if (e && e.conflicto) { op.estado = 'revisar'; op.motivo = e.conflicto; } else { op.estado = 'fallo'; op.motivo = (e && e.message) || 'error'; }
        op.intentos = (op.intentos || 0) + 1; tocadas[op.col] = 1; return guardarCola();
      }).then(siguiente);
    }
    return siguiente().catch(function () { /* red o sesión: se vuelve a intentar */ }).then(function () {
      L.subiendo = false; emitir();
      Object.keys(tocadas).forEach(function (c) { if (/^config:/.test(c)) Object.keys(recargas).forEach(function (t) { /* la config se relee sola con su aviso en vivo */ }); else avisarCambio(c); });
      if (tocadas['config:app'] || tocadas['config:meta']) recargarTodo();
    });
  }
  var tVaciar = null;
  function vaciarPronto() { clearTimeout(tVaciar); tVaciar = setTimeout(vaciar, 250); }
  setInterval(function () { if (L.uid && localOn()) { if (red.sin && navigator.onLine !== false) recargarTodo(); vaciar(); } }, 15000);
  function resumenOp(o) { return { idOp: o.idOp, col: o.col, tipo: o.tipo, id: o.id, data: o.data, estado: o.estado, motivo: o.motivo || null, t: o.t }; }
  var sinc = {
    activo: function () { return activoLocal(); },
    estado: function () {
      var m = colaMia();
      return { activo: activoLocal(), sinRed: sinRedAhora(), subiendo: L.subiendo, pendientes: m.filter(function (o) { return o.estado === 'pend'; }).length, fallos: m.filter(function (o) { return o.estado === 'fallo'; }).length, revisar: m.filter(function (o) { return o.estado === 'revisar'; }).length, total: m.length };
    },
    lista: function () { return colaMia().map(resumenOp); },
    onChange: function (fn) { L.escuchas.push(fn); return function () { L.escuchas = L.escuchas.filter(function (f) { return f !== fn; }); }; },
    reintentar: function (idOp) { colaMia().forEach(function (o) { if ((!idOp || o.idOp === idOp) && (o.estado === 'fallo' || o.estado === 'revisar')) { o.estado = 'pend'; o.motivo = null; } }); emitir(); return guardarCola().then(vaciar); },
    // «Revisar»: quedarme con lo mío (se vuelve a crear / pisa lo del servidor)
    forzar: function (idOp) { colaMia().forEach(function (o) { if (o.idOp === idOp && o.estado === 'revisar') { o.estado = 'pend'; o.tipo = 'crear'; o.base = null; o.motivo = null; } }); emitir(); return guardarCola().then(vaciar); },
    descartar: function (idOp) {
      var o = L.cola.filter(function (x) { return x.idOp === idOp && x.uid === L.uid; })[0]; if (!o) return Promise.resolve();
      L.cola.splice(L.cola.indexOf(o), 1); emitir();
      return guardarCola().then(function () { if (col0(o)) avisarCambio(col0(o)); else recargarTodo(); });
    },
    olvidar: olvidarLocal,
    vaciar: vaciar,
  };

  function collection(path) {
    var table = TABLES[path];
    if (!table) throw new Error('Colección desconocida: ' + path);

    return {
      onSnapshot: function (next, errCb) {
        var channel = null;
        var stopped = false, primera = true, entregado = false;
        // Lee todas las filas por páginas (Supabase devuelve como máximo 1000 por consulta).
        function fetchAll(from, acc) {
          var PAGE = 1000;
          return sb.from(table).select('*').eq('user_id', currentUid).order('id').range(from, from + PAGE - 1).then(function (res) {
            if (res.error) throw res.error;
            var rows = acc.concat(res.data || []);
            return (res.data || []).length === PAGE ? fetchAll(from + PAGE, rows) : rows;
          });
        }
        function entregar(objs) {
          var filas = activoLocal() ? conCola(table, objs) : objs;
          entregado = true;
          next({ docs: filas.map(function (o) { return { id: o.id, exists: true, data: function () { return o; } }; }) });
        }
        // sin red (o con la red muy lenta): la copia de la última vez, con lo pendiente encima
        function deCopia() {
          return Promise.resolve(L.listo).then(function () { return leerSnap(table); }).then(function (c) {
            if (stopped || !Array.isArray(c)) return false;
            recordarVistos(table, c); entregar(c); return true;
          });
        }
        function refresh() {
          if (!currentUid) return;
          var uid0 = currentUid, hecho = false, tarde = null;
          var lectura = Promise.resolve(L.listo).then(function () { return fetchAll(0, []); });
          if (primera && localOn()) tarde = setTimeout(function () { if (!hecho && !entregado) deCopia(); }, 4000); // red muy lenta: se ve la copia mientras llega lo nuevo
          primera = false;
          lectura.then(function (rows) {
            hecho = true; clearTimeout(tarde); red.sin = false;
            if (stopped) return;
            var objs = rows.map(rowToObj);
            if (localOn() && L.uid === uid0) { recordarVistos(table, objs); guardarSnap(table, objs); }
            entregar(objs); emitir();
          }, function (e) {
            hecho = true; clearTimeout(tarde);
            if (esRed(e)) red.sin = true;
            if (stopped) return;
            if (localOn() && L.uid === uid0 && esRed(e)) { emitir(); deCopia().then(function (hay) { if (!hay && !entregado && errCb) errCb(pgError(e)); }); return; }
            if (errCb) errCb(pgError(e));
          });
        }
        // Agrupa ráfagas de cambios (p. ej. una importación) en una sola recarga.
        var timer = null;
        function refreshSoon() { clearTimeout(timer); timer = setTimeout(refresh, 300); }
        refresh();
        (recargas[table] = recargas[table] || []).push(refreshSoon);
        if (currentUid) {
          channel = sb.channel(table + '-' + currentUid)
            .on('postgres_changes', { event: '*', schema: 'public', table: table, filter: 'user_id=eq.' + currentUid }, refreshSoon)
            .subscribe();
        }
        return function unsubscribe() { stopped = true; recargas[table] = (recargas[table] || []).filter(function (f) { return f !== refreshSoon; }); if (channel) sb.removeChannel(channel); };
      },
      doc: function (id) {
        var docId = id || newId();
        // directo (con red): como siempre. Con la copia local, si hay cola o falla la red, el cambio se guarda en el móvil.
        function directoSet(data) {
          return sb.from(table).upsert(objToRow(data, docId, currentUid)).then(function (res) {
            if (res.error) throw pgError(res.error);
            avisarCambio(table);
          });
        }
        function directoBorrar() {
          return sb.from(table).delete().eq('id', docId).eq('user_id', currentUid).then(function (res) {
            if (res.error) throw pgError(res.error);
            avisarCambio(table);
          });
        }
        function escribir(op, directo) {
          return Promise.resolve(L.listo).then(function () {
            if (!activoLocal()) return directo();
            if (!colaMia().length && !sinRedAhora()) return directo().then(function (x) { red.sin = false; return x; }, function (e) { if (esRed(e) || esSesion(e)) { red.sin = true; emitir(); return encolar(op); } throw e; });
            return encolar(op);
          });
        }
        return {
          id: docId,
          get: function () {
            return sb.from(table).select('*').eq('id', docId).eq('user_id', currentUid).maybeSingle().then(function (res) {
              if (res.error) throw pgError(res.error);
              return { exists: !!res.data, id: docId, data: function () { return res.data ? rowToObj(res.data) : undefined; } };
            }, function (e) { throw pgError(e); }).catch(function (e) {
              if (!activoLocal() || !esRed(e)) throw e;
              return leerSnap(table).then(function (c) {
                var o = conCola(table, Array.isArray(c) ? c : []).filter(function (r) { return r.id === docId; })[0];
                return { exists: !!o, id: docId, data: function () { return o; } };
              });
            });
          },
          set: function (data) { return escribir({ tipo: 'set', col: table, id: docId, data: data }, function () { return directoSet(data); }); },
          delete: function () { return escribir({ tipo: 'borrar', col: table, id: docId, data: null }, directoBorrar); },
        };
      },
      // Inserta muchas filas de una vez sin pisar las que ya existan (mismo id). Devuelve cuántas eran nuevas.
      bulkInsert: conRed(function (items) {
        var rows = items.map(function (it) { return objToRow(it.data, it.id, currentUid); });
        var chunks = [];
        for (var i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i + 200));
        return chunks.reduce(function (p, chunk) {
          return p.then(function (n) {
            // cada bloque se reintenta por su cuenta (hasta 3 veces): así un fallo a mitad no hace repetir los bloques ya guardados
            function intento(k) {
              return sb.from(table).upsert(chunk, { onConflict: 'id', ignoreDuplicates: true }).select('id').then(function (res) {
                if (res.error) throw pgError(res.error);
                return res;
              }).catch(function (e) { if (k >= 2) throw e; return new Promise(function (ok) { setTimeout(ok, 600 * (k + 1)); }).then(function () { return intento(k + 1); }); });
            }
            return intento(0).then(function (res) {
              return n + (Array.isArray(res.data) ? res.data.length : chunk.length); // solo las nuevas (las repetidas se ignoran)
            });
          });
        }, Promise.resolve(0)).then(function (n) { avisarCambio(table); return n; });
      }),
      // Borra todas las filas propias con un valor concreto en un campo (solo se usa para deshacer una importación).
      deleteWhere: conRed(function (field, value) {
        if (field !== 'lote' || !value) return Promise.reject(new Error('Borrado no permitido'));
        return sb.from(table).delete().eq('user_id', currentUid).eq(toSnake(field), value).then(function (res) {
          if (res.error) throw pgError(res.error);
          avisarCambio(table);
        });
      }),
      add: function (data) {
        var id = newId();
        return sb.from(table).insert(objToRow(data, id, currentUid)).then(function (res) {
          if (res.error) throw pgError(res.error);
          avisarCambio(table);
          return { id: id };
        });
      },
    };
  }

  /* config/app y config/meta viven en una tabla `config` (user_id, key, value jsonb) */
  // 10/11 (fallo de Alfredo): cada guardado de la configuración lleva la cuenta; una lectura que salió antes de que
  // terminara un guardado (o mientras se guardaba) puede traer lo de antes, así que no se entrega: se vuelve a leer.
  var cfgEsc = {};
  function escCfg(key) { return (cfgEsc[key] = cfgEsc[key] || { enCurso: 0, seq: 0 }); }
  function guardandoCfg(key, p) {
    var st = escCfg(key); st.enCurso++;
    function fin() { st.enCurso--; st.seq++; }
    return p.then(function (x) { fin(); return x; }, function (e) { fin(); throw e; });
  }
  function doc(path) {
    var parts = path.split('/');
    if (parts[0] !== 'config') throw new Error('Ruta de documento no soportada: ' + path);
    var key = parts[1];
    function fetchOne() {
      return sb.from('config').select('value').eq('user_id', currentUid).eq('key', key).maybeSingle();
    }
    var tabla = 'config:' + key;
    function deCopia() {
      return Promise.resolve(L.listo).then(function () { return leerSnap(tabla); });
    }
    function escribirCfg(op, directo) {
      return Promise.resolve(L.listo).then(function () {
        if (!activoLocal()) return directo();
        if (!colaMia().length && !sinRedAhora()) return directo().then(function (x) { red.sin = false; return x; }, function (e) { if (esRed(e) || esSesion(e)) { red.sin = true; emitir(); return encolar(op); } throw e; });
        return encolar(op);
      });
    }
    return {
      get: function () {
        return fetchOne().then(function (res) {
          if (res.error) throw pgError(res.error);
          var v = res.data ? res.data.value : undefined;
          if (activoLocal() && res.data) guardarSnap(tabla, v);
          var pend = activoLocal() && colaMia().some(function (o) { return o.col === tabla; }), w = pend ? cfgConCola(key, v) : v;
          return { exists: !!res.data || pend, data: function () { return w; } };
        }).catch(function (e) {
          e = pgError(e);
          if (!activoLocal() || !esRed(e)) throw e;
          return deCopia().then(function (c) { var v = cfgConCola(key, c); return { exists: c !== undefined, data: function () { return v; } }; });
        });
      },
      set: function (value) {
        return escribirCfg({ tipo: 'cfgset', col: tabla, id: key, data: value }, function () {
          return guardandoCfg(key, sb.from('config').upsert({ user_id: currentUid, key: key, value: value }).then(function (res) {
            if (res.error) throw pgError(res.error);
          }));
        });
      },
      update: function (partial) {
        return escribirCfg({ tipo: 'cfg', col: tabla, id: key, data: partial }, function () {
          return guardandoCfg(key, fetchOne().then(function (res) {
            if (res.error) throw pgError(res.error);
            var merged = Object.assign({}, (res.data && res.data.value) || {}, partial);
            return sb.from('config').upsert({ user_id: currentUid, key: key, value: merged }).then(function (r2) {
              if (r2.error) throw pgError(r2.error);
            });
          }));
        });
      },
      onSnapshot: function (next, errCb) {
        var channel = null, stopped = false, primera = true, entregado = false;
        var esperando = false, otraVez = false;
        function entregar(existe, valor) {
          entregado = true;
          var pend = activoLocal() && colaMia().some(function (o) { return o.col === tabla; });
          var v = pend ? cfgConCola(key, valor) : valor;
          next({ exists: !!existe || pend, data: function () { return v; } });
        }
        function usarCopia(e) {
          return deCopia().then(function (c) { if (stopped) return true; if (c === undefined && !colaMia().some(function (o) { return o.col === tabla; })) return false; entregar(c !== undefined, c); return true; });
        }
        function refresh(intento) {
          if (!currentUid) return;
          intento = typeof intento === 'number' ? intento : 0;
          if (!intento) { if (esperando) { otraVez = true; return; } esperando = true; } // una sola lectura a la vez; si llega otro aviso, se lee otra vez al acabar
          var st = escCfg(key), seq0 = st.seq, durante = st.enCurso > 0, uid0 = currentUid, hecho = false, tarde = null;
          if (primera && localOn()) tarde = setTimeout(function () { if (!hecho && !entregado) usarCopia(); }, 4000); // red muy lenta: se ve la copia
          primera = false;
          Promise.resolve(L.listo).then(function () { return fetchOne(); }).then(function (res) {
            hecho = true; clearTimeout(tarde);
            if (stopped) { esperando = false; return; }
            if (res.error) {
              esperando = false;
              var pe = pgError(res.error);
              if (esRed(pe)) red.sin = true;
              if (localOn() && L.uid === uid0 && esRed(pe)) { emitir(); usarCopia(pe).then(function (hay) { if (!hay && errCb) errCb(pe); }); return; }
              if (errCb) errCb(pe); return;
            }
            // salió antes de terminar un guardado: puede traer lo de antes → se vuelve a leer. Nunca se entrega una lectura
            // así; el tope (unos 30 s) solo evita esperar para siempre si un guardado no acaba nunca.
            if ((durante || st.enCurso > 0 || st.seq !== seq0) && intento < 120) { setTimeout(function () { refresh(intento + 1); }, 250); return; }
            esperando = false; red.sin = false;
            if (otraVez) { otraVez = false; setTimeout(refresh, 0); }
            if (localOn() && L.uid === uid0 && res.data) guardarSnap(tabla, res.data.value);
            entregar(!!res.data, res.data ? res.data.value : undefined);
          }, function (e) { hecho = true; clearTimeout(tarde); esperando = false; if (errCb) errCb(e); }); // sin red: que el siguiente aviso pueda volver a leer
        }
        refresh();
        (recargas['config:' + key] = recargas['config:' + key] || []).push(function () { refresh(); }); // al volver la red o la app se relee
        if (currentUid) {
          channel = sb.channel('config-' + key + '-' + currentUid)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: 'user_id=eq.' + currentUid }, function () { refresh(); })
            .subscribe();
        }
        return function unsubscribe() { stopped = true; recargas['config:' + key] = []; if (channel) sb.removeChannel(channel); };
      },
    };
  }

  /* ---- autenticación ---- */
  var authListeners = [];
  var lastSession = undefined; // undefined = aún no lo sabemos, null = sin sesión
  function notifyAuth(session) {
    currentUid = session ? session.user.id : null;
    lastSession = session || null;
    // copia local y cola de esta cuenta (solo en las apps). Una sesión «sin comprobar» (sin red) usa la de la última vez.
    if (session && session.user && localOn()) iniciarLocal(session.user.id, session.sinComprobar ? undefined : (session.user.email || ''), session.sinComprobar ? undefined : (session.user.factors || null));
    authListeners.forEach(function (fn) { fn(lastSession); });
    if (session && !session.sinComprobar) vaciarPronto();
  }
  // Sin red y con sesión que no se puede renovar: si hay copia de la última cuenta, se abre con ella (sin comprobar).
  function sesionSinRed() {
    if (!localOn() || !sinRedAhora()) return null;
    var u = ls('palom:uid'); if (!u) return null;
    var f = null; try { f = JSON.parse(ls('palom:fact') || 'null'); } catch (e) { /* */ }
    return { user: { id: u, email: ls('palom:mail') || '', factors: f || undefined }, sinComprobar: true };
  }
  // al volver la red se comprueba de verdad la sesión: si ya no vale (cuenta cerrada, contraseña cambiada) se sale, SIN borrar lo pendiente
  function revalidarSesion() {
    if (!lastSession || !lastSession.sinComprobar) return;
    sb.auth.getSession().then(function (r) {
      if (r && r.data && r.data.session) notifyAuth(r.data.session);
      else if (r && r.error && !esRed(r.error)) notifyAuth(null);
    }, function () { /* sigue sin red */ });
  }
  // 08/11: al volver del correo de «¿Olvidaste tu contraseña?», Supabase avisa con PASSWORD_RECOVERY: la app pide la nueva
  var recuperando = false;
  sb.auth.onAuthStateChange(function (event, session) { if (event === 'PASSWORD_RECOVERY') recuperando = true; if (!session && event !== 'SIGNED_OUT') session = sesionSinRed(); notifyAuth(session); });
  // La web pública: dentro de la app de Android el origen es «https://localhost», que no sirve para un enlace de correo
  var WEB = 'https://www.palomapp.es/';
  function urlVuelta() { var o = window.location.origin || ''; return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) || !/^https?:/.test(o) ? WEB : o + window.location.pathname; }

  window.Auth = {
    getSession: function () { return sb.auth.getSession().then(function (r) { return r.data.session || sesionSinRed(); }, function () { return sesionSinRed(); }); },
    // Se llama inmediatamente con el estado ya conocido (si lo hay) y también con cada cambio futuro,
    // evitando perder el evento inicial si éste ya ocurrió antes de suscribirse.
    onChange: function (fn) { authListeners.push(fn); if (lastSession !== undefined) fn(lastSession); },
    signIn: function (email, password, captchaToken) { // 13/11: código del CAPTCHA (captcha.js)
      return sb.auth.signInWithPassword({ email: email, password: password, options: captchaToken ? { captchaToken: captchaToken } : undefined }).then(function (res) {
        if (res.error) throw pgError(res.error);
        return res.data.session;
      });
    },
    signOut: function () { return sb.auth.signOut(); },
    resetPassword: function (email, captchaToken) {
      return sb.auth.resetPasswordForEmail(email, { redirectTo: urlVuelta(), captchaToken: captchaToken || undefined }).then(function (res) {
        if (res.error) throw pgError(res.error);
      });
    },
    recuperando: function () { return recuperando || /type=recovery/.test(window.location.hash || ''); },
    cambiarContrasena: function (nueva) {
      return sb.auth.updateUser({ password: nueva }).then(function (res) {
        if (res.error) throw pgError(res.error);
        recuperando = false;
        try { if (/type=recovery/.test(window.location.hash || '')) history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* */ }
      });
    },
  };

  /* ---- grupos para compartir (bloque 8): las reglas de la base de datos deciden qué se ve ---- */
  function q(p) { return p.then(function (res) { if (res.error) throw pgError(res.error); return res.data; }); }
  var grupos = {
    listar: function () {
      // personas sin cuenta: si la tabla aún no existe (o falla), se sigue sin ellas
      var sinCuenta = q(sb.from('grupo_invitados').select('*')).catch(function () { return []; });
      var uid0 = currentUid;
      return Promise.all([q(sb.from('grupos').select('*')), q(sb.from('grupo_miembros').select('*')), sinCuenta]).then(function (r) {
        var out = { grupos: r[0] || [], miembros: r[1] || [], sinCuenta: r[2] || [] };
        if (localOn() && L.uid === uid0) guardarSnap('grupos', out);
        return out;
      }).catch(function (e) { // sin red: los grupos de la última vez, solo para mirar
        if (!localOn() || !esRed(e)) throw e;
        return Promise.resolve(L.listo).then(function () { return leerSnap('grupos'); }).then(function (c) { if (!c) throw e; return c; });
      });
    },
    invitaciones: function (grupoId) { return q(sb.from('grupo_invitaciones').select('token,expira,usada_en,created_at').eq('grupo_id', grupoId).order('created_at', { ascending: false })); },
    renombrar: function (grupoId, nombre) { return q(sb.from('grupos').update({ nombre: nombre }).eq('id', grupoId)); },
    // foto del grupo (23/11, docs/46 tanda 5): data URL pequeña o null. Solo administradores (regla grupos_editar).
    foto: function (grupoId, foto) { return q(sb.from('grupos').update({ foto: foto }).eq('id', grupoId).select('id')).then(function (d) { if (!d || !d.length) throw new Error('no_autorizado'); return d; }); },
    miNombre: function (grupoId, nombre) { return q(sb.from('grupo_miembros').update({ nombre: nombre }).eq('grupo_id', grupoId).eq('user_id', currentUid)); },
    // reparto habitual del grupo: { user_id: porcentaje } o null (a partes iguales). Solo administradores.
    // quién puede editar los gastos del grupo: 'todos' o 'autor' (y los administradores). Solo administradores.
    edicion: function (grupoId, valor) { return q(sb.from('grupos').update({ edicion: valor }).eq('id', grupoId).select('id')).then(function (d) { if (!d || !d.length) throw new Error('no_autorizado'); return d; }); },
    reparto: function (grupoId, reparto) { return q(sb.from('grupos').update({ reparto: reparto }).eq('id', grupoId).select('id')).then(function (d) { if (!d || !d.length) throw new Error('no_autorizado'); return d; }); },
  };
  function rpc(fn, params) { return q(sb.rpc(fn, params || {})); }
  /* ---- móviles con avisos (12/11, docs/40 C3): cada uno ve y quita solo los suyos ---- */
  var moviles = {
    registrar: function (p) { return rpc('avisos_registrar', { p_id: p.id, p_token: p.token || null, p_plataforma: p.plataforma || 'android', p_idioma: p.idioma || 'es', p_zona: p.zona || 'Europe/Madrid', p_clave_hash: p.claveHash || null }); },
    // 13/11 · avisos de Juntos (docs/41): solo el token de Firebase de este móvil (crea la fila si no está)
    token: function (p) { return rpc('avisos_token', { p_id: p.id, p_token: p.token || null, p_idioma: p.idioma || 'es', p_zona: p.zona || 'Europe/Madrid' }); },
    listar: function () { return q(sb.from('avisos_dispositivos').select('id,plataforma,creado,visto,activo').order('visto', { ascending: false })); },
    quitar: function (id) { return q(sb.from('avisos_dispositivos').delete().eq('id', id)); },
    quitarTodos: function () { return q(sb.from('avisos_dispositivos').delete().eq('user_id', currentUid)); },
  };

  ['renombrar', 'foto', 'miNombre', 'edicion', 'reparto'].forEach(function (k) { grupos[k] = conRed(grupos[k]); });
  ['registrar', 'token', 'quitar', 'quitarTodos'].forEach(function (k) { moviles[k] = conRed(moviles[k]); });
  /* ---- gastos compartidos (8.2) y metas/deudas compartidas (8.3): los ve todo el grupo; nunca se borran de verdad (borrado = fecha) ---- */
  function tablaCompartida(tabla, campos, deFila, inmutables) {
    function aFila(o) { var row = {}; campos.forEach(function (k) { if (o[k] !== undefined) row[toSnake(k)] = o[k]; }); return row; }
    var tc = {
      suscribir: function (next, errCb) {
        var stopped = false, channel = null, timer = null;
        function fetchAll(from, acc) {
          var PAGE = 1000;
          return sb.from(tabla).select('*').is('borrado', null).order('id').range(from, from + PAGE - 1).then(function (res) {
            if (res.error) throw res.error;
            var rows = acc.concat(res.data || []);
            return (res.data || []).length === PAGE ? fetchAll(from + PAGE, rows) : rows;
          });
        }
        var primera = true, entregado = false;
        function copia() {
          return Promise.resolve(L.listo).then(function () { return leerSnap('t:' + tabla); }).then(function (c) {
            if (stopped || !Array.isArray(c)) return false; entregado = true; next(c); return true;
          });
        }
        function refresh() {
          if (!currentUid) return;
          var uid0 = currentUid, hecho = false, tarde = null;
          if (primera && localOn()) tarde = setTimeout(function () { if (!hecho && !entregado) copia(); }, 4000);
          primera = false;
          Promise.resolve(L.listo).then(function () { return fetchAll(0, []); }).then(function (rows) {
            hecho = true; clearTimeout(tarde); red.sin = false;
            if (stopped) return;
            var objs = rows.map(deFila);
            if (localOn() && L.uid === uid0) guardarSnap('t:' + tabla, objs);
            entregado = true; next(objs);
          }, function (e) {
            hecho = true; clearTimeout(tarde); if (esRed(e)) red.sin = true;
            if (stopped) return;
            if (localOn() && L.uid === uid0 && esRed(e)) { emitir(); copia().then(function (hay) { if (!hay && errCb) errCb(pgError(e)); }); return; }
            if (errCb) errCb(pgError(e));
          });
        }
        function refreshSoon() { clearTimeout(timer); timer = setTimeout(refresh, 300); }
        refresh();
        (recargas[tabla] = recargas[tabla] || []).push(refreshSoon); // 11/11 (Calidad): también se vuelve a leer al volver a la app o recuperar la red
        // sin filtro: las reglas de la base de datos solo envían lo que puedes ver
        if (currentUid) channel = sb.channel(tabla + '-' + currentUid).on('postgres_changes', { event: '*', schema: 'public', table: tabla }, refreshSoon).subscribe();
        return function unsubscribe() { stopped = true; clearTimeout(timer); recargas[tabla] = (recargas[tabla] || []).filter(function (f) { return f !== refreshSoon; }); if (channel) sb.removeChannel(channel); };
      },
      crear: function (o) {
        var row = aFila(o); delete row.id; // el id lo pone la base de datos
        return q(sb.from(tabla).insert(row).select().single()).then(deFila);
      },
      editar: function (id, o) {
        var row = aFila(o); delete row.id; inmutables.forEach(function (k) { delete row[k]; });
        return q(sb.from(tabla).update(row).eq('id', id).select().single()).then(deFila);
      },
      borrar: function (id) {
        return q(sb.from(tabla).update({ borrado: new Date().toISOString() }).eq('id', id).select('id')).then(function (d) { if (!d || !d.length) throw new Error('no_autorizado'); return d; });
      },
    };
    ['crear', 'editar', 'borrar'].forEach(function (k) { tc[k] = conRed(tc[k]); }); // sin conexión, lo compartido solo se mira
    return tc;
  }
  var compartidos = tablaCompartida('compartidos', ['id', 'grupoId', 'fecha', 'tipo', 'categoria', 'subcategoria', 'descripcion', 'importe', 'pagadoPor', 'reparto', 'modo', 'objetivoId', 'articulos', 'carpetaId'], function (r) {
    return { id: r.id, grupoId: r.grupo_id, fecha: r.fecha, tipo: r.tipo, categoria: r.categoria || '', subcategoria: r.subcategoria || null, descripcion: r.descripcion || '',
      importe: Number(r.importe), pagadoPor: r.pagado_por, reparto: r.reparto || {}, modo: r.modo || 'igual', objetivoId: r.objetivo_id || null, articulos: r.articulos || null, carpetaId: r.carpeta_id || null,
      creadoPor: r.creado_por, createdAt: r.created_at, updatedAt: r.updated_at, editadoPor: r.editado_por };
  }, ['grupo_id']);
  var objetivos = tablaCompartida('objetivos_compartidos', ['id', 'grupoId', 'tipo', 'nombre', 'objetivo', 'fechaObjetivo', 'previo', 'hitos', 'usos', 'conseguida', 'forma'], function (r) {
    return { id: r.id, grupoId: r.grupo_id, tipo: r.tipo, nombre: r.nombre, objetivo: r.objetivo == null ? null : Number(r.objetivo),
      fechaObjetivo: r.fecha_objetivo || null, previo: Number(r.previo || 0), hitos: r.hitos || [], usos: r.usos || [], conseguida: r.conseguida || null, forma: r.forma || null,
      creadoPor: r.creado_por, createdAt: r.created_at };
  }, ['grupo_id', 'tipo']);
  /* ---- planes y tareas compartidas (23/10, tabla «agenda»). Nunca se borran de verdad: «borrado» y se pueden recuperar ---- */
  function deAgenda(r) {
    return { id: r.id, grupoId: r.grupo_id || null, tipo: r.tipo, titulo: r.titulo, fecha: r.fecha || null, fechaFin: r.fecha_fin || null, hora: r.hora || null, lugar: r.lugar || null, nota: r.nota || null,
      asignadoA: r.asignado_a || null, hechaEn: r.hecha_en || null, hechaPor: r.hecha_por || null, creadoPor: r.creado_por, createdAt: r.created_at, updatedAt: r.updated_at, editadoPor: r.editado_por, privada: !!r.privada };
  }
  var agenda = tablaCompartida('agenda', ['id', 'grupoId', 'tipo', 'titulo', 'fecha', 'fechaFin', 'hora', 'lugar', 'nota', 'asignadoA', 'privada'], deAgenda, ['grupo_id', 'tipo']);
  agenda.restaurar = conRed(function (id) { return q(sb.from('agenda').update({ borrado: null }).eq('id', id).select().single()).then(function (r) { return r ? deAgenda(r) : null; }); });
  /* ---- compartir mi agenda (30/10, docs/24 y 24b): con quién la compartes; lo que ven lo recorta el servidor (agenda_de) ---- */
  function dePermiso(r) { return { id: r.id, aUsuario: r.a_usuario || null, aGrupo: r.a_grupo || null, nivel: r.nivel, planes: r.planes !== false, tareas: r.tareas !== false, createdAt: r.created_at }; }
  var agendaPermisos = {
    listar: function () { return q(sb.from('agenda_permisos').select('*').order('created_at')).then(function (rs) { return (rs || []).map(dePermiso); }); },
    crear: function (o) { var row = { nivel: o.nivel || 'ocupado', planes: o.planes !== false, tareas: o.tareas !== false }; if (o.aUsuario) row.a_usuario = o.aUsuario; else row.a_grupo = o.aGrupo;
      return q(sb.from('agenda_permisos').insert(row).select().single()).then(dePermiso); },
    editar: function (id, o) { var row = {}; ['nivel', 'planes', 'tareas'].forEach(function (k) { if (o[k] !== undefined) row[k] = o[k]; });
      return q(sb.from('agenda_permisos').update(row).eq('id', id).select().single()).then(dePermiso); },
    borrar: function (id) { return q(sb.from('agenda_permisos').delete().eq('id', id)); },
    ocultas: function () { return q(sb.from('agenda_ocultas').select('agenda_id')).then(function (rs) { return (rs || []).map(function (r) { return r.agenda_id; }); }); },
    ocultar: function (agendaId) { return q(sb.from('agenda_ocultas').insert({ agenda_id: agendaId })); },
    mostrar: function (agendaId) { return q(sb.from('agenda_ocultas').delete().eq('agenda_id', agendaId)); },
    deOtro: function (persona, desde, hasta) { return q(sb.rpc('agenda_de', { p_persona: persona, p_desde: desde, p_hasta: hasta })); },
    conmigo: function () { return q(sb.rpc('agendas_conmigo', {})); }
  };
  /* ---- temas de un grupo (23/10; en la base de datos, «carpetas»). Nunca se borran de verdad: «borrado» y se pueden recuperar ---- */
  var carpetas = tablaCompartida('grupo_carpetas', ['id', 'grupoId', 'nombre', 'icono', 'desde', 'hasta', 'cerrada'], function (r) {
    return { id: r.id, grupoId: r.grupo_id, nombre: r.nombre, icono: r.icono || 'tag', desde: r.desde || null, hasta: r.hasta || null, cerrada: r.cerrada || null,
      creadoPor: r.creado_por, createdAt: r.created_at };
  }, ['grupo_id']);
  carpetas.restaurar = conRed(function (id) {
    return q(sb.from('grupo_carpetas').update({ borrado: null }).eq('id', id).select().single()).then(function (r) { return r ? { id: r.id, grupoId: r.grupo_id, nombre: r.nombre, icono: r.icono || 'tag', desde: r.desde || null, hasta: r.hasta || null, cerrada: r.cerrada || null, creadoPor: r.creado_por, createdAt: r.created_at } : null; });
  });
  /* ---- aportaciones a metas compartidas (12/10): reflejo de un movimiento personal que su dueño vincula a la meta ---- */
  var aportes = tablaCompartida('objetivo_aportes', ['objetivoId', 'movId', 'fecha', 'tipo', 'importe', 'activoId', 'participaciones'], function (r) {
    return { id: r.id, objetivoId: r.objetivo_id, userId: r.user_id, movId: r.mov_id, fecha: r.fecha, tipo: r.tipo, importe: Number(r.importe),
      activoId: r.activo_id || null, participaciones: r.participaciones == null ? null : Number(r.participaciones) };
  }, []);
  // guardar = crear o actualizar el reflejo de ese movimiento (y «resucitarlo» si se había quitado)
  aportes.guardar = conRed(function (o) {
    var row = { user_id: currentUid, objetivo_id: o.objetivoId, mov_id: o.movId, fecha: o.fecha, tipo: o.tipo, importe: o.importe,
      activo_id: o.activoId || null, participaciones: o.participaciones == null ? null : o.participaciones, borrado: null };
    return q(sb.from('objetivo_aportes').upsert(row, { onConflict: 'user_id,mov_id' }).select().single());
  });
  aportes.quitar = conRed(function (movId) {
    return q(sb.from('objetivo_aportes').update({ borrado: new Date().toISOString() }).eq('user_id', currentUid).eq('mov_id', movId).is('borrado', null).select('id'));
  });

  ['crear', 'editar', 'borrar', 'ocultar', 'mostrar'].forEach(function (k) { agendaPermisos[k] = conRed(agendaPermisos[k]); });
  // Cambio del euro del Banco Central Europeo (tabla pública «divisas», solo lectura): el último publicado hasta esa fecha (10 días como mucho)
  var divisas = {
    cambio: function (moneda, fecha) {
      var d = new Date(fecha + 'T12:00:00'); d.setDate(d.getDate() - 10);
      var desde = d.toISOString().slice(0, 10);
      return q(sb.from('divisas').select('fecha,por_eur').eq('moneda', moneda).lte('fecha', fecha).gte('fecha', desde).order('fecha', { ascending: false }).limit(1)).then(function (r) { return r && r[0] ? { fecha: r[0].fecha, porEur: Number(r[0].por_eur) } : null; });
    }
  };
  // Precios de carburante del día (tabla pública «precios_carburante», solo lectura; la rellena la función «trayecto»)
  var carburantes = {
    ultimos: function (provincia) {
      var d = new Date(); d.setDate(d.getDate() - 7);
      var provs = provincia ? ['ES', provincia] : ['ES'];
      return q(sb.from('precios_carburante').select('fecha,provincia,producto,precio').in('provincia', provs).gte('fecha', d.toISOString().slice(0, 10)).order('fecha', { ascending: false }).limit(200)).then(function (r) {
        var vistos = {}; return (r || []).filter(function (f) { var k = f.provincia + '|' + f.producto; if (vistos[k]) return false; vistos[k] = 1; return true; });
      });
    }
  };
  window.Data = { sinc: sinc, recargar: function (t) { avisarCambio(t); }, collection: collection, divisas: divisas, carburantes: carburantes, doc: doc, grupos: grupos, compartidos: compartidos, objetivos: objetivos, carpetas: carpetas, agenda: agenda, agendaPermisos: agendaPermisos, aportes: aportes, moviles: moviles, rpc: rpc, uid: function () { return currentUid; } };
})();
