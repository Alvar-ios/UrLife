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
        function refresh() {
          if (!currentUid) return;
          sb.from(table).select('*').eq('user_id', currentUid).then(function (res) {
            if (stopped) return;
            if (res.error) { if (errCb) errCb(pgError(res.error)); return; }
            next({ docs: (res.data || []).map(function (r) { return { id: r.id, exists: true, data: function () { return rowToObj(r); } }; }) });
          });
        }
        refresh();
        if (currentUid) {
          channel = sb.channel(table + '-' + currentUid)
            .on('postgres_changes', { event: '*', schema: 'public', table: table, filter: 'user_id=eq.' + currentUid }, refresh)
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

  window.Data = { collection: collection, doc: doc };
})();
