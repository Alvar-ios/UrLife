-- 08/11/2026 · borrar_cuenta. APLICADA el 10/11/2026 con el freno opcional (probada antes en la base real: 21 de 21). Ver docs/33-play-store.md §5.
-- «Borrar mi cuenta» (obligatorio en Google Play). Aditiva: solo crea UNA función nueva; no cambia tablas,
-- reglas (RLS), restricciones ni datos hasta que alguien pulsa el botón.
--
-- Cómo se usa: SOLO la función de Supabase `borrar-cuenta` (con service_role) la llama, con el id de la sesión.
-- Después, esa función hace el borrado SUAVE de la cuenta en Auth: auth.admin.deleteUser(id, true).
-- NUNCA borrar a estas personas con «Delete user» normal en el panel: la fila de auth.users se borraría
-- y, por las claves ajenas en CASCADE, desaparecería su fila de grupo_miembros (los demás perderían su
-- nombre y no podrían editar los gastos antiguos con ella).
--
-- Qué hace borrar_cuenta_datos(p_user):
--   1. Si debe o le deben dinero en algún grupo abierto en el que sigue, NO borra nada y devuelve
--      {ok:false, motivo:'saldo_pendiente', grupos:[{grupo, nombre, tipo, con, saldo}]}  (saldo > 0 = le deben).
--   2. Borra lo personal: movimientos, tareas, config, golf, tickets_uso, agenda_ocultas, agenda_permisos
--      (lo que comparte y lo que le comparten), sus planes «Solo yo» de agenda, sus luces y comentarios del
--      mapa de paradores y sus filas en las copias backup_movimientos_20261012 / backup_config_20261012.
--   3. En los grupos queda como BAJA (grupo_miembros.baja = now()), con su nombre. No toca compartidos,
--      metas compartidas, aportes a metas (objetivo_aportes), historial, temas ni planes de grupo.
--   4. Si era el único administrador de un grupo, pasa a serlo el miembro activo más antiguo.
--      Si era grupos.creado_por, pasa al administrador activo más antiguo. Si no queda nadie con cuenta,
--      el grupo se CIERRA (no se borra) y sus enlaces de invitación caducan.
--   5. Caducan los enlaces de invitación que había creado y que nadie había usado.
--   6. Comprobaciones de seguridad: si cambiara el número de gastos de sus grupos, de sus filas en
--      grupo_miembros o de sus aportes, o si su saldo dejara de ser 0, se deshace todo (error).
--   Se puede ejecutar dos veces sin problema (la segunda no encuentra nada que borrar).
--
-- ANTES DE APLICAR (todo solo lee):
--   1. select pg_get_functiondef('public.saldo_en_grupo(uuid,uuid)'::regprocedure);   -- igual que 4b de 2026-10-17
--   2. select table_name, column_name, data_type, is_nullable from information_schema.columns
--        where table_schema='public' and table_name in ('grupos','grupo_miembros','objetivo_aportes','paradores_luces',
--        'paradores_comentarios','config','golf','tickets_uso') order by 1, ordinal_position;
--   3. select tgrelid::regclass, tgname, pg_get_triggerdef(oid) from pg_trigger
--        where tgrelid in ('public.grupos'::regclass, 'public.grupo_miembros'::regclass, 'public.movimientos'::regclass,
--        'public.paradores_comentarios'::regclass) and not tgisinternal;      -- ¿algún disparador frena cambiar baja/rol/creado_por?
--   4. select conrelid::regclass, conname, pg_get_constraintdef(oid) from pg_constraint
--        where contype='f' and confrelid = 'public.movimientos'::regclass;   -- si objetivo_aportes → movimientos en CASCADE, la
--                                                                            -- comprobación 6 lo frena: avisar a Datos
--   5. select table_name, column_name from information_schema.columns where table_schema='public'
--        and column_name in ('user_id','creado_por','dueno','a_usuario','autor') order by 1;   -- ¿falta alguna tabla personal?
--   6. select count(*) from storage.objects;   -- si no es 0, hay archivos que habría que borrar aparte
--
-- CÓMO SE DESHACE la migración (no toca datos):  drop function public.borrar_cuenta_datos(uuid);
-- Un borrado de cuenta YA HECHO no se deshace: solo se recupera de la copia semanal cifrada mientras exista.
--
-- Revisión periódica (solo lee): filas personales de cuentas ya borradas (deben salir todas a 0). Si la app seguía
-- abierta podría haber guardado algo en el minuto siguiente; se arregla volviendo a ejecutar la función con ese id.
--   select 'movimientos' t, count(*) from public.movimientos x join auth.users u on u.id = x.user_id where u.deleted_at is not null
--   union all select 'tareas', count(*) from public.tareas x join auth.users u on u.id = x.user_id where u.deleted_at is not null
--   union all select 'config', count(*) from public.config x join auth.users u on u.id = x.user_id where u.deleted_at is not null;

create function public.borrar_cuenta_datos(p_user uuid) returns jsonb
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  g record; m record; v_saldo numeric; n bigint; v_nuevo uuid;
  v_pend jsonb := '[]'; v_res jsonb := '{}'; v_bajas uuid[] := '{}'; v_grupos uuid[];
  c_comp bigint; c_miem bigint; c_aport bigint; c_cerrados int := 0; c_creador int := 0; c_admin int := 0;
  t text; v_tabla text; v_col text;
begin
  if p_user is null then raise exception 'sin_usuario'; end if;
  -- Solo el sistema (service_role) puede llegar aquí; con sesión de una persona, nunca.
  if auth.uid() is not null then raise exception 'no_autorizado'; end if;
  perform pg_advisory_xact_lock(hashtextextended('borrar_cuenta:' || p_user::text, 0));

  -- Grupos en los que está o estuvo, o que creó. Se bloquean hasta terminar (nadie añade gastos mientras tanto).
  select coalesce(array_agg(distinct x.gid), '{}') into v_grupos from (
    select grupo_id as gid from public.grupo_miembros where user_id = p_user
    union select id from public.grupos where creado_por = p_user) x;
  perform 1 from public.grupos where id = any (v_grupos) order by id for update;

  -- 1. ¿Debe o le deben dinero en algún grupo abierto en el que sigue? Entonces no se borra nada.
  for g in select gr.id, gr.nombre, gr.tipo from public.grupo_miembros mm join public.grupos gr on gr.id = mm.grupo_id
           where mm.user_id = p_user and mm.baja is null and gr.cerrado is null order by gr.nombre, gr.id loop
    v_saldo := round(public.saldo_en_grupo(g.id, p_user), 2);
    if abs(v_saldo) > 0.01 then
      v_pend := v_pend || jsonb_build_object('grupo', g.id, 'nombre', g.nombre, 'tipo', g.tipo, 'saldo', v_saldo,
        'con', (select string_agg(o.nombre, ', ' order by o.nombre) from public.grupo_miembros o
                where o.grupo_id = g.id and o.user_id <> p_user and o.baja is null));
    end if;
  end loop;
  if jsonb_array_length(v_pend) > 0 then
    return jsonb_build_object('ok', false, 'motivo', 'saldo_pendiente', 'grupos', v_pend);
  end if;

  -- Para las comprobaciones del final: esto NO puede cambiar.
  select count(*) into c_comp from public.compartidos where grupo_id = any (v_grupos);
  select count(*) into c_miem from public.grupo_miembros where user_id = p_user;
  select count(*) into c_aport from public.objetivo_aportes where user_id = p_user;

  -- 2. Lo personal.
  delete from public.movimientos where user_id = p_user;      get diagnostics n = row_count; v_res := v_res || jsonb_build_object('movimientos', n);
  delete from public.tareas where user_id = p_user;           get diagnostics n = row_count; v_res := v_res || jsonb_build_object('tareas', n);
  delete from public.config where user_id = p_user;           get diagnostics n = row_count; v_res := v_res || jsonb_build_object('config', n);
  delete from public.golf where user_id = p_user;             get diagnostics n = row_count; v_res := v_res || jsonb_build_object('golf', n);
  delete from public.tickets_uso where user_id = p_user;      get diagnostics n = row_count; v_res := v_res || jsonb_build_object('tickets_uso', n);
  delete from public.agenda_ocultas where user_id = p_user;   get diagnostics n = row_count; v_res := v_res || jsonb_build_object('agenda_ocultas', n);
  delete from public.agenda_permisos where dueno = p_user or a_usuario = p_user;
                                                              get diagnostics n = row_count; v_res := v_res || jsonb_build_object('agenda_permisos', n);
  delete from public.agenda where grupo_id is null and creado_por = p_user;   -- solo sus planes «Solo yo»
                                                              get diagnostics n = row_count; v_res := v_res || jsonb_build_object('agenda_solo_yo', n);
  -- Tablas que pueden no existir o cambiar de forma (copias antiguas, mapa de paradores): solo si existen.
  foreach t in array array['paradores_luces.user_id', 'paradores_comentarios.user_id', 'paradores_comentarios.autor',
                           'backup_movimientos_20261012.user_id', 'backup_config_20261012.user_id'] loop
    v_tabla := split_part(t, '.', 1); v_col := split_part(t, '.', 2);
    if exists (select 1 from information_schema.columns c where c.table_schema = 'public'
               and c.table_name = v_tabla and c.column_name = v_col) then
      execute format('delete from public.%I where %I::text = $1', v_tabla, v_col) using p_user::text;
      get diagnostics n = row_count; v_res := v_res || jsonb_build_object(t, n);
    end if;
  end loop;

  -- 3-4. Grupos: baja con su nombre; administrador y creador pasan a otro; sin nadie con cuenta, se cierra.
  for g in select gr.id, gr.tipo, gr.cerrado, gr.creado_por,
                  (select mm.rol from public.grupo_miembros mm where mm.grupo_id = gr.id and mm.user_id = p_user and mm.baja is null) as mi_rol
           from public.grupos gr where gr.id = any (v_grupos) order by gr.id loop
    update public.grupo_miembros set baja = now() where grupo_id = g.id and user_id = p_user and baja is null;
    get diagnostics n = row_count;
    if n > 0 then v_bajas := v_bajas || g.id; end if;

    -- quien queda con cuenta, el más antiguo (los administradores primero)
    select mm.user_id, mm.rol into m from public.grupo_miembros mm
      where mm.grupo_id = g.id and mm.baja is null and mm.user_id <> p_user
      order by (mm.rol = 'admin') desc, (to_jsonb(mm) ->> 'created_at')::timestamptz asc nulls last, mm.user_id
      limit 1;
    v_nuevo := m.user_id;

    if v_nuevo is null then
      if n > 0 and g.cerrado is null then   -- era el último con cuenta: cerrar (nunca borrar) y caducar los enlaces
        update public.grupos set cerrado = now() where id = g.id;
        update public.grupo_invitaciones set expira = now() where grupo_id = g.id and usada_en is null and expira > now();
        update public.invitado_enlaces set expira = now() where usado_en is null and expira > now()
          and invitado_id in (select i.id from public.grupo_invitados i where i.grupo_id = g.id);
        c_cerrados := c_cerrados + 1;
      end if;
    else
      -- era administrador y no queda otro: lo pasa a ser el miembro más antiguo (solo en grupos, no en relaciones directas)
      if n > 0 and g.mi_rol = 'admin' and g.tipo = 'grupo' and m.rol is distinct from 'admin' then
        update public.grupo_miembros set rol = 'admin' where grupo_id = g.id and user_id = v_nuevo;
        c_admin := c_admin + 1;
      end if;
      if g.creado_por = p_user then
        update public.grupos set creado_por = v_nuevo where id = g.id;
        c_creador := c_creador + 1;
      end if;
    end if;
  end loop;

  -- 5. Enlaces que había creado y nadie usó.
  update public.grupo_invitaciones set expira = now() where creado_por = p_user and usada_en is null and expira > now();
  update public.invitado_enlaces set expira = now() where creado_por = p_user and usado_en is null and expira > now();

  -- 6. Comprobaciones: si algo de lo compartido hubiera cambiado, se deshace todo.
  for g in select unnest(v_bajas) as id loop
    if abs(public.saldo_en_grupo(g.id, p_user)) > 0.01 then raise exception 'saldo_cambiado'; end if;
  end loop;
  if (select count(*) from public.compartidos where grupo_id = any (v_grupos)) < c_comp
     or (select count(*) from public.grupo_miembros where user_id = p_user) <> c_miem
     or (select count(*) from public.objetivo_aportes where user_id = p_user) <> c_aport then
    raise exception 'proteccion_datos_compartidos';
  end if;

  return jsonb_build_object('ok', true, 'borrado', v_res, 'grupos_baja', coalesce(array_length(v_bajas, 1), 0),
    'admin_pasado', c_admin, 'creador_pasado', c_creador, 'grupos_cerrados', c_cerrados);
end $$;

revoke all on function public.borrar_cuenta_datos(uuid) from public, anon, authenticated;
grant execute on function public.borrar_cuenta_datos(uuid) to service_role;

-- OPCIONAL (decisión del dueño, aplicar aparte): freno para que nadie borre de verdad una cuenta desde el panel
-- si sigue en algún grupo. Aditivo (un disparador nuevo). Antes, comprobar que ninguna función borra filas de
-- grupo_miembros:  select proname from pg_proc where prosrc ilike '%delete from public.grupo_miembros%' or prosrc ilike '%delete from grupo_miembros%';
--   create function public.frenar_borrado_miembro() returns trigger language plpgsql set search_path to 'public', 'pg_temp' as $f$
--   begin raise exception 'grupo_miembros no se borra: usa la baja (y en Auth, el borrado suave)'; end $f$;
--   create trigger frenar_borrado_miembro before delete on public.grupo_miembros for each row execute function public.frenar_borrado_miembro();
--   -- deshacer: drop trigger frenar_borrado_miembro on public.grupo_miembros; drop function public.frenar_borrado_miembro();
