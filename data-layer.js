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
    err.original = e;
    return err;
  }

  var currentUid = null;

  function collection(path) {
    var table = TABLES[path];
    if (!table) throw new Error('Colección desconocida: ' + path);

    return {
      onSnapshot: function (next, errCb) {
        var channel = null;
        var stopped = false;
        // Lee todas las filas por páginas (Supabase devuelve como máximo 1000 por consulta).
        function fetchAll(from, acc) {
          var PAGE = 1000;
          return sb.from(table).select('*').eq('user_id', currentUid).order('id').range(from, from + PAGE - 1).then(function (res) {
            if (res.error) throw res.error;
            var rows = acc.concat(res.data || []);
            return (res.data || []).length === PAGE ? fetchAll(from + PAGE, rows) : rows;
          });
        }
        function refresh() {
          if (!currentUid) return;
          fetchAll(0, []).then(function (rows) {
            if (stopped) return;
            next({ docs: rows.map(function (r) { return { id: r.id, exists: true, data: function () { return rowToObj(r); } }; }) });
          }, function (e) { if (!stopped && errCb) errCb(pgError(e)); });
        }
        // Agrupa ráfagas de cambios (p. ej. una importación) en una sola recarga.
        var timer = null;
        function refreshSoon() { clearTimeout(timer); timer = setTimeout(refresh, 300); }
        refresh();
        if (currentUid) {
          channel = sb.channel(table + '-' + currentUid)
            .on('postgres_changes', { event: '*', schema: 'public', table: table, filter: 'user_id=eq.' + currentUid }, refreshSoon)
            .subscribe();
        }
        return function unsubscribe() { stopped = true; if (channel) sb.removeChannel(channel); };
      },
      doc: function (id) {
        var docId = id || newId();
        return {
          id: docId,
          get: function () {
            return sb.from(table).select('*').eq('id', docId).eq('user_id', currentUid).maybeSingle().then(function (res) {
              if (res.error) throw pgError(res.error);
              return { exists: !!res.data, id: docId, data: function () { return res.data ? rowToObj(res.data) : undefined; } };
            });
          },
          set: function (data) {
            return sb.from(table).upsert(objToRow(data, docId, currentUid)).then(function (res) {
              if (res.error) throw pgError(res.error);
            });
          },
          delete: function () {
            return sb.from(table).delete().eq('id', docId).eq('user_id', currentUid).then(function (res) {
              if (res.error) throw pgError(res.error);
            });
          },
        };
      },
      // Inserta muchas filas de una vez sin pisar las que ya existan (mismo id). Devuelve cuántas se enviaron.
      bulkInsert: function (items) {
        var rows = items.map(function (it) { return objToRow(it.data, it.id, currentUid); });
        var chunks = [];
        for (var i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i + 200));
        return chunks.reduce(function (p, chunk) {
          return p.then(function (n) {
            return sb.from(table).upsert(chunk, { onConflict: 'id', ignoreDuplicates: true }).then(function (res) {
              if (res.error) throw pgError(res.error);
              return n + chunk.length;
            });
          });
        }, Promise.resolve(0));
      },
      // Borra todas las filas propias con un valor concreto en un campo (solo se usa para deshacer una importación).
      deleteWhere: function (field, value) {
        if (field !== 'lote' || !value) return Promise.reject(new Error('Borrado no permitido'));
        return sb.from(table).delete().eq('user_id', currentUid).eq(toSnake(field), value).then(function (res) {
          if (res.error) throw pgError(res.error);
        });
      },
      add: function (data) {
        var id = newId();
        return sb.from(table).insert(objToRow(data, id, currentUid)).then(function (res) {
          if (res.error) throw pgError(res.error);
          return { id: id };
        });
      },
    };
  }

  /* config/app y config/meta viven en una tabla `config` (user_id, key, value jsonb) */
  function doc(path) {
    var parts = path.split('/');
    if (parts[0] !== 'config') throw new Error('Ruta de documento no soportada: ' + path);
    var key = parts[1];
    function fetchOne() {
      return sb.from('config').select('value').eq('user_id', currentUid).eq('key', key).maybeSingle();
    }
    return {
      get: function () {
        return fetchOne().then(function (res) {
          if (res.error) throw pgError(res.error);
          return { exists: !!res.data, data: function () { return res.data ? res.data.value : undefined; } };
        });
      },
      set: function (value) {
        return sb.from('config').upsert({ user_id: currentUid, key: key, value: value }).then(function (res) {
          if (res.error) throw pgError(res.error);
        });
      },
      update: function (partial) {
        return fetchOne().then(function (res) {
          if (res.error) throw pgError(res.error);
          var merged = Object.assign({}, (res.data && res.data.value) || {}, partial);
          return sb.from('config').upsert({ user_id: currentUid, key: key, value: merged }).then(function (r2) {
            if (r2.error) throw pgError(r2.error);
          });
        });
      },
      onSnapshot: function (next, errCb) {
        var channel = null, stopped = false;
        function refresh() {
          if (!currentUid) return;
          fetchOne().then(function (res) {
            if (stopped) return;
            if (res.error) { if (errCb) errCb(pgError(res.error)); return; }
            next({ exists: !!res.data, data: function () { return res.data ? res.data.value : undefined; } });
          });
        }
        refresh();
        if (currentUid) {
          channel = sb.channel('config-' + key + '-' + currentUid)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: 'user_id=eq.' + currentUid }, refresh)
            .subscribe();
        }
        return function unsubscribe() { stopped = true; if (channel) sb.removeChannel(channel); };
      },
    };
  }

  /* ---- autenticación ---- */
  var authListeners = [];
  var lastSession = undefined; // undefined = aún no lo sabemos, null = sin sesión
  function notifyAuth(session) {
    currentUid = session ? session.user.id : null;
    lastSession = session || null;
    authListeners.forEach(function (fn) { fn(lastSession); });
  }
  sb.auth.onAuthStateChange(function (_event, session) { notifyAuth(session); });

  window.Auth = {
    getSession: function () { return sb.auth.getSession().then(function (r) { return r.data.session; }); },
    // Se llama inmediatamente con el estado ya conocido (si lo hay) y también con cada cambio futuro,
    // evitando perder el evento inicial si éste ya ocurrió antes de suscribirse.
    onChange: function (fn) { authListeners.push(fn); if (lastSession !== undefined) fn(lastSession); },
    signIn: function (email, password) {
      return sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
        if (res.error) throw pgError(res.error);
        return res.data.session;
      });
    },
    signOut: function () { return sb.auth.signOut(); },
    resetPassword: function (email) {
      return sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname }).then(function (res) {
        if (res.error) throw pgError(res.error);
      });
    },
  };

  /* ---- grupos para compartir (bloque 8): las reglas de la base de datos deciden qué se ve ---- */
  function q(p) { return p.then(function (res) { if (res.error) throw pgError(res.error); return res.data; }); }
  var grupos = {
    listar: function () {
      return Promise.all([q(sb.from('grupos').select('*')), q(sb.from('grupo_miembros').select('*'))]).then(function (r) {
        return { grupos: r[0] || [], miembros: r[1] || [] };
      });
    },
    invitaciones: function (grupoId) { return q(sb.from('grupo_invitaciones').select('token,expira,usada_en,created_at').eq('grupo_id', grupoId).order('created_at', { ascending: false })); },
    renombrar: function (grupoId, nombre) { return q(sb.from('grupos').update({ nombre: nombre }).eq('id', grupoId)); },
    miNombre: function (grupoId, nombre) { return q(sb.from('grupo_miembros').update({ nombre: nombre }).eq('grupo_id', grupoId).eq('user_id', currentUid)); },
    // reparto habitual del grupo: { user_id: porcentaje } o null (a partes iguales). Solo administradores.
    reparto: function (grupoId, reparto) { return q(sb.from('grupos').update({ reparto: reparto }).eq('id', grupoId).select('id')).then(function (d) { if (!d || !d.length) throw new Error('no_autorizado'); return d; }); },
  };
  function rpc(fn, params) { return q(sb.rpc(fn, params || {})); }

  /* ---- gastos compartidos (bloque 8.2): los ve todo el grupo; nunca se borran de verdad (borrado = fecha) ---- */
  var COMP_CAMPOS = ['id', 'grupoId', 'fecha', 'tipo', 'categoria', 'descripcion', 'importe', 'pagadoPor', 'reparto', 'modo'];
  function compDeFila(r) {
    return { id: r.id, grupoId: r.grupo_id, fecha: r.fecha, tipo: r.tipo, categoria: r.categoria || '', descripcion: r.descripcion || '',
      importe: Number(r.importe), pagadoPor: r.pagado_por, reparto: r.reparto || {}, modo: r.modo || 'igual',
      creadoPor: r.creado_por, createdAt: r.created_at, updatedAt: r.updated_at, editadoPor: r.editado_por };
  }
  function compAFila(o) { var row = {}; COMP_CAMPOS.forEach(function (k) { if (o[k] !== undefined) row[toSnake(k)] = o[k]; }); return row; }
  var compartidos = {
    suscribir: function (next, errCb) {
      var stopped = false, channel = null, timer = null;
      function fetchAll(from, acc) {
        var PAGE = 1000;
        return sb.from('compartidos').select('*').is('borrado', null).order('id').range(from, from + PAGE - 1).then(function (res) {
          if (res.error) throw res.error;
          var rows = acc.concat(res.data || []);
          return (res.data || []).length === PAGE ? fetchAll(from + PAGE, rows) : rows;
        });
      }
      function refresh() {
        if (!currentUid) return;
        fetchAll(0, []).then(function (rows) { if (!stopped) next(rows.map(compDeFila)); }, function (e) { if (!stopped && errCb) errCb(pgError(e)); });
      }
      function refreshSoon() { clearTimeout(timer); timer = setTimeout(refresh, 300); }
      refresh();
      // sin filtro: las reglas de la base de datos solo envían lo que puedes ver
      if (currentUid) channel = sb.channel('compartidos-' + currentUid).on('postgres_changes', { event: '*', schema: 'public', table: 'compartidos' }, refreshSoon).subscribe();
      return function unsubscribe() { stopped = true; clearTimeout(timer); if (channel) sb.removeChannel(channel); };
    },
    crear: function (o) {
      var row = compAFila(o); delete row.id; // el id lo pone la base de datos
      return q(sb.from('compartidos').insert(row).select().single()).then(compDeFila);
    },
    editar: function (id, o) {
      var row = compAFila(o); delete row.id; delete row.grupo_id;
      return q(sb.from('compartidos').update(row).eq('id', id).select().single()).then(compDeFila);
    },
    borrar: function (id) {
      return q(sb.from('compartidos').update({ borrado: new Date().toISOString() }).eq('id', id).select('id')).then(function (d) { if (!d || !d.length) throw new Error('no_autorizado'); return d; });
    },
  };

  window.Data = { collection: collection, doc: doc, grupos: grupos, compartidos: compartidos, rpc: rpc, uid: function () { return currentUid; } };
})();
