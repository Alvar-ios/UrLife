# Datos y seguridad: carpetas y «Planes» (22/10/2026)

*Revisión del apartado 4 de `docs/16-agenda-compartida-carpetas.md`. Nada aplicado en Supabase: el SQL de abajo espera el «sí» del dueño.*

## 1. Conclusión

1. **Veredicto: sí, con cambios.** El borrador es aditivo (dos tablas nuevas y una columna vacía) y no toca ningún gasto, tarea ni regla actual. La app publicada hoy sigue funcionando con las columnas nuevas puestas.
2. **Hay 4 fallos que se arreglan en el SQL final**: el disparador de la agenda no podría usar `es_participante` (está cerrada a los usuarios); «Deshacer» un borrado sería imposible (el disparador bloquea todo lo borrado); faltaban los permisos (por defecto Supabase abre las tablas nuevas también a quien no tiene sesión); y el control de carpetas en los gastos podía romper el guardado de los gastos de siempre. Ahora solo se ejecuta si el gasto lleva carpeta.
3. **Dos migraciones separadas, carpetas primero.** Cada una se deshace sola sin tocar la otra.
4. **Orden obligatorio:** primero se aplica la migración y luego se publica la app que la usa. Si se publica antes, guardar un gasto con carpeta falla.
5. **No he podido leer la base de datos real.** En esta sesión no tenía las herramientas de Supabase. Las reglas actuales las he sacado del repositorio. Antes de aplicar hay que hacer las 8 consultas de solo lectura del apartado 7.

## 2. Problemas encontrados (de más grave a menos)

| # | Gravedad | Problema en el borrador | Arreglo en el SQL final |
|---|---|---|---|
| 1 | Alta | Sin `revoke`/`grant`: en Supabase, una tabla nueva queda abierta a quien no tiene sesión. Hoy RLS la protege, pero solo con eso no basta | `revoke all … from anon, authenticated` y solo `select, insert, update` a `authenticated` (sin `delete`), como en `grupo_invitados` |
| 2 | Alta | `validar_agenda` llama a `es_participante`, que los usuarios no pueden ejecutar (se les quitó el 17/10). Sin `security definer`, cada tarea con encargado daría error | Los disparadores nuevos son `security definer` con `search_path` fijo |
| 3 | Alta | El disparador nuevo de `compartidos` se ejecutaría en cada gasto de todos los usuarios. Un fallo suyo bloquearía todos los gastos compartidos | `when (new.carpeta_id is not null)`: no se ejecuta nunca en los gastos sin carpeta (todos los de hoy) |
| 4 | Media | «Nada se cambia si ya está borrado» impide «Deshacer» (volver a poner `borrado` vacío) | Se permite solo eso: volver a mostrarlo, sin cambiar nada más |
| 5 | Media | Una versión antigua de la app que edita un gasto con carpeta cerrada o borrada fallaría | La carpeta solo se comprueba cuando cambia. Si el gasto pasa a pago, meta o deuda, sale de la carpeta (no se rechaza) |
| 6 | Media | Borrar una carpeta y vaciar sus gastos sería un cambio masivo en `compartidos` y complicaría «Deshacer» | No se toca ningún gasto: la app trata la carpeta borrada como «Sin carpeta». «Deshacer» la recupera con sus gastos |
| 7 | Media | Una tarea «Solo yo» podría acabar en `agenda`, y la Agenda personal estaría en tres sitios | Nueva regla: una tarea en `agenda` siempre lleva grupo. Las personales siguen en `tareas` |
| 8 | Baja | «Grupo no cerrado» y «30 carpetas» iban en la regla de RLS, que no puede contar filas de forma fiable | Se comprueba en el disparador |
| 9 | Baja | `hecha_por` se podía escribir a mano | Lo pone siempre el disparador: quien la marca |
| 10 | Baja | Faltaba un índice para buscar los gastos de una carpeta | `compartidos_carpeta` (solo filas con carpeta) |

Comprobado también (sin cambios): ver = solo miembros activos (`es_miembro`), así que al salir del grupo se dejan de ver; editar y borrar siguen `puede_editar_compartido` (el ajuste «todos» o «autor»); no se puede mover nada a otro grupo ni hacerse pasar por otro autor; nadie borra filas de verdad; las dos funciones nuevas comprueban sesión y miembro; la copia semanal (`--schema=public`) incluirá las tablas nuevas sin tocar nada.

## 3. SQL recomendado

### Migración 1 de 2: `grupo_carpetas` (aplicar primero)

```sql
-- Carpetas en los grupos (aditiva). No cambia ningún dato ni ninguna regla existente.
create table public.grupo_carpetas (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 40),
  icono text not null default 'tag'
    check (icono in ('plane','cart','home','fork','gift','car','ball','film','heart','tag')),
  desde date,
  hasta date,
  cerrada timestamptz,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  borrado timestamptz,                      -- nunca se borra de verdad
  check (desde is null or hasta is null or hasta >= desde)
);
create unique index grupo_carpetas_nombre on public.grupo_carpetas (grupo_id, lower(btrim(nombre))) where borrado is null;

alter table public.compartidos add column carpeta_id uuid references public.grupo_carpetas(id);  -- vacía en todos los gastos
create index compartidos_carpeta on public.compartidos (carpeta_id) where carpeta_id is not null;

-- Permisos y reglas: solo miembros activos; sin sesión, nada; nadie borra filas
alter table public.grupo_carpetas enable row level security;
revoke all on public.grupo_carpetas from anon, authenticated;
grant select, insert, update on public.grupo_carpetas to authenticated;
create policy carpetas_ver on public.grupo_carpetas for select to authenticated
  using (public.es_miembro(grupo_id));
create policy carpetas_crear on public.grupo_carpetas for insert to authenticated
  with check (public.es_miembro(grupo_id));
create policy carpetas_editar on public.grupo_carpetas for update to authenticated
  using (public.puede_editar_compartido(grupo_id, creado_por)) with check (public.es_miembro(grupo_id));

-- Comprobador de carpetas
create function public.validar_carpeta() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.creado_por := auth.uid(); new.created_at := now(); new.borrado := null; new.cerrada := null;
    end if;
    if exists (select 1 from public.grupos where id = new.grupo_id and cerrado is not null) then raise exception 'grupo_cerrado'; end if;
    if (select count(*) from public.grupo_carpetas where grupo_id = new.grupo_id and borrado is null) >= 30 then
      raise exception 'demasiadas_carpetas';
    end if;
    return new;
  end if;
  if new.id is distinct from old.id or new.grupo_id is distinct from old.grupo_id
     or new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at then
    raise exception 'no_permitido';
  end if;
  if old.borrado is not null then
    if new.borrado is not null then raise exception 'carpeta_borrada'; end if;
    new := old; new.borrado := null;          -- «Deshacer»: vuelve tal cual estaba
  end if;
  return new;
end $$;
create trigger validar_carpeta before insert or update on public.grupo_carpetas
  for each row execute function public.validar_carpeta();

-- Comprobador de la carpeta de un gasto. Aparte de validar_compartido (que NO se toca).
-- Solo se ejecuta si el gasto lleva carpeta: los gastos de hoy no pasan por aquí.
create function public.validar_carpeta_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare c record; cambia boolean;
begin
  if tg_op = 'INSERT' then cambia := true; else cambia := new.carpeta_id is distinct from old.carpeta_id; end if;
  if new.tipo not in ('Gasto', 'Factura') then
    if cambia then raise exception 'carpeta_no_valida'; end if;
    new.carpeta_id := null;                   -- dejó de ser un gasto: sale de la carpeta
    return new;
  end if;
  if not cambia then return new; end if;      -- carpeta de antes (aunque esté cerrada o borrada): no se rechaza
  select * into c from public.grupo_carpetas where id = new.carpeta_id;
  if not found or c.grupo_id <> new.grupo_id or c.borrado is not null then raise exception 'carpeta_no_valida'; end if;
  return new;
end $$;
create trigger validar_carpeta_compartido before insert or update on public.compartidos
  for each row when (new.carpeta_id is not null) execute function public.validar_carpeta_compartido();

-- Poner o quitar la carpeta de varios gastos (cualquier miembro, aunque el grupo sea «solo quien lo apuntó»).
-- Solo toca carpeta_id. Todo o nada: si un gasto no es de tu grupo, no cambia ninguno.
create function public.poner_carpeta(p_ids uuid[], p_carpeta uuid) returns int
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare c record; r record; n int := 0; v_grupo uuid;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if p_ids is null or cardinality(p_ids) = 0 then return 0; end if;
  if cardinality(p_ids) > 200 then raise exception 'demasiados'; end if;
  if p_carpeta is not null then
    select * into c from public.grupo_carpetas where id = p_carpeta;
    if not found or not public.es_miembro(c.grupo_id) then raise exception 'no_autorizado'; end if;
    if c.borrado is not null then raise exception 'carpeta_no_valida'; end if;
    v_grupo := c.grupo_id;
  end if;
  for r in select id, grupo_id from public.compartidos
           where id = any(p_ids) and borrado is null and tipo in ('Gasto', 'Factura')
             and carpeta_id is distinct from p_carpeta for update loop
    if not public.es_miembro(r.grupo_id) then raise exception 'no_autorizado'; end if;
    if v_grupo is not null and r.grupo_id <> v_grupo then raise exception 'carpeta_no_valida'; end if;
    update public.compartidos set carpeta_id = p_carpeta where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.validar_carpeta(), public.validar_carpeta_compartido(),
  public.poner_carpeta(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.poner_carpeta(uuid[], uuid) to authenticated;

alter publication supabase_realtime add table public.grupo_carpetas;
```

### Migración 2 de 2: `agenda` (Planes y tareas compartidas)

```sql
-- Planes y tareas compartidas (aditiva). No toca la tabla tareas.
create table public.agenda (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references public.grupos(id) on delete cascade,   -- vacío = plan «Solo yo»
  tipo text not null check (tipo in ('plan', 'tarea')),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  fecha date,
  fecha_fin date,
  hora time,                                -- vacía = todo el día
  lugar text check (char_length(lugar) <= 120),
  nota text check (char_length(nota) <= 1000),
  asignado_a uuid,                          -- miembro o persona sin cuenta; vacío = «quien pueda»
  hecha_en timestamptz,
  hecha_por uuid references auth.users(id) on delete set null,
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  editado_por uuid,
  borrado timestamptz,                      -- nunca se borra de verdad
  check (tipo = 'tarea' or fecha is not null),
  check (tipo = 'plan' or grupo_id is not null),          -- las tareas «Solo yo» siguen en «tareas»
  check (fecha_fin is null or (tipo = 'plan' and fecha_fin >= fecha)),
  check (tipo = 'plan' or (hora is null and fecha_fin is null and lugar is null)),
  check (tipo = 'tarea' or (asignado_a is null and hecha_en is null))
);
create index agenda_grupo on public.agenda (grupo_id, fecha) where borrado is null;
create index agenda_mias on public.agenda (creado_por) where grupo_id is null and borrado is null;

alter table public.agenda enable row level security;
revoke all on public.agenda from anon, authenticated;
grant select, insert, update on public.agenda to authenticated;
create policy agenda_ver on public.agenda for select to authenticated
  using ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.es_miembro(grupo_id)));
create policy agenda_crear on public.agenda for insert to authenticated
  with check ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.es_miembro(grupo_id)));
create policy agenda_editar on public.agenda for update to authenticated
  using ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.puede_editar_compartido(grupo_id, creado_por)))
  with check ((grupo_id is null and creado_por = (select auth.uid())) or (grupo_id is not null and public.es_miembro(grupo_id)));

create function public.validar_agenda() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare es_ins boolean; cambia_asig boolean := false; estaba_hecha boolean := false;
begin
  es_ins := (tg_op = 'INSERT');
  if es_ins then
    if auth.uid() is not null then
      new.creado_por := auth.uid(); new.created_at := now(); new.updated_at := now();
      new.editado_por := null; new.borrado := null;
    end if;
    if new.grupo_id is not null and exists (select 1 from public.grupos where id = new.grupo_id and cerrado is not null) then
      raise exception 'grupo_cerrado';
    end if;
    cambia_asig := new.asignado_a is not null;
  else
    if new.id is distinct from old.id or new.grupo_id is distinct from old.grupo_id or new.tipo is distinct from old.tipo
       or new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at then
      raise exception 'no_permitido';
    end if;
    if old.borrado is not null then
      if new.borrado is not null then raise exception 'agenda_borrado'; end if;
      new := old; new.borrado := null;        -- «Deshacer»: vuelve tal cual estaba
    end if;
    new.updated_at := now(); new.editado_por := auth.uid();
    cambia_asig := new.asignado_a is not null and new.asignado_a is distinct from old.asignado_a;
    estaba_hecha := old.hecha_en is not null;
  end if;
  -- quien se encarga tiene que ser del grupo (al ponerlo o cambiarlo; si luego sale, no se rechaza)
  if cambia_asig and not public.es_participante(new.grupo_id, new.asignado_a, true) then
    raise exception 'asignado_no_valido';
  end if;
  -- «Hecha por»: siempre quien la marca
  if new.hecha_en is null then new.hecha_por := null;
  elsif not estaba_hecha then new.hecha_por := auth.uid();
  else new.hecha_por := old.hecha_por;
  end if;
  return new;
end $$;
create trigger validar_agenda before insert or update on public.agenda
  for each row execute function public.validar_agenda();

-- Marcar o desmarcar una tarea del grupo: cualquier miembro, aunque el grupo sea «solo quien lo apuntó»
create function public.agenda_hecha(p_id uuid, p_hecha boolean) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare a record;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  select * into a from public.agenda where id = p_id for update;
  if not found or a.tipo <> 'tarea' or a.grupo_id is null or not public.es_miembro(a.grupo_id) then raise exception 'no_autorizado'; end if;
  if a.borrado is not null then raise exception 'agenda_borrado'; end if;
  update public.agenda set hecha_en = case when p_hecha then coalesce(a.hecha_en, now()) else null end where id = p_id;
end $$;

revoke execute on function public.validar_agenda(), public.agenda_hecha(uuid, boolean) from public, anon, authenticated;
grant execute on function public.agenda_hecha(uuid, boolean) to authenticated;

alter publication supabase_realtime add table public.agenda;
```

## 4. Cómo se deshace

Antes de deshacer: **primero volver a la versión de la app sin carpetas o sin planes**. Si no, guardar falla. Y guardar una copia protegida de lo apuntado (con RLS activada y sin permisos, para que nadie la lea desde la app):

```sql
-- Copia antes de deshacer (cambiar la fecha). Se queda en public, así entra en la copia semanal.
create table public.backup_carpetas_AAAAMMDD as select * from public.grupo_carpetas;
create table public.backup_compartidos_carpeta_AAAAMMDD as select id, carpeta_id from public.compartidos where carpeta_id is not null;
create table public.backup_agenda_AAAAMMDD as select * from public.agenda;
alter table public.backup_carpetas_AAAAMMDD enable row level security;
alter table public.backup_compartidos_carpeta_AAAAMMDD enable row level security;
alter table public.backup_agenda_AAAAMMDD enable row level security;
revoke all on public.backup_carpetas_AAAAMMDD, public.backup_compartidos_carpeta_AAAAMMDD, public.backup_agenda_AAAAMMDD from anon, authenticated;

-- Deshacer la migración 2 (Planes): se pierden los planes y tareas compartidas apuntados (quedan en la copia)
alter publication supabase_realtime drop table public.agenda;
drop table public.agenda;
drop function public.agenda_hecha(uuid, boolean);
drop function public.validar_agenda();

-- Deshacer la migración 1 (carpetas): ningún gasto se borra; solo se olvida en qué carpeta estaba cada uno
alter publication supabase_realtime drop table public.grupo_carpetas;
drop trigger validar_carpeta_compartido on public.compartidos;
drop function public.validar_carpeta_compartido();
drop function public.poner_carpeta(uuid[], uuid);
drop index public.compartidos_carpeta;
alter table public.compartidos drop column carpeta_id;
drop table public.grupo_carpetas;
drop function public.validar_carpeta();
```

## 5. Qué cambia en `data-layer.js`

| Cambio | Detalle |
|---|---|
| `compartidos` | Añadir `'carpetaId'` a la lista de campos y `carpetaId: r.carpeta_id \|\| null` en `deFila`. Mandar `carpetaId` solo si se elige o se quita una carpeta (si va `undefined`, no se envía y la carpeta no se toca) |
| `carpetas` (nuevo) | `tablaCompartida('grupo_carpetas', ['id','grupoId','nombre','icono','desde','hasta','cerrada'], deFila, ['grupo_id'])`. `deFila` también con `creadoPor`, `createdAt` |
| `agenda` (nuevo) | `tablaCompartida('agenda', ['id','grupoId','tipo','titulo','fecha','fechaFin','hora','lugar','nota','asignadoA'], deFila, ['grupo_id','tipo'])`. `hechaEn`/`hechaPor` **no** van en la lista: se leen, pero se marcan con `rpc('agenda_hecha', { p_id, p_hecha })`. La hora llega como «19:00:00»: cortar a 5 letras |
| `restaurar(id)` (nuevo en `tablaCompartida`) | `update({ borrado: null }).eq('id', id).select('id')`, para «Deshacer» de carpetas y planes |
| Mover gastos de carpeta | `rpc('poner_carpeta', { p_ids, p_carpeta })` (hasta 200; `p_carpeta: null` = quitar) |
| Exportar | `carpetas` y `agenda` en `window.Data` |
| Si la tabla aún no existe | Como con `grupo_invitados`: si falla la lectura de `grupo_carpetas` o `agenda`, seguir sin ellas y sin mensaje de error |

Notas para Desarrollo:
- Una carpeta borrada sigue en sus gastos (`carpetaId`), pero la app la muestra como «Sin carpeta» y la incluye en «Añadir gastos ya apuntados».
- Al mover un gasto a otro grupo (crear nuevo y borrar el viejo), no copiar `carpetaId`. En `rehacerComp`, mandarlo solo si la carpeta sigue sin borrar.
- Un encargado sin cuenta cuyo sitio se ocupó se ve como su nuevo dueño (igual que en los gastos).
- Errores nuevos para `errGrupo`: `carpeta_no_valida`, `demasiadas_carpetas`, `grupo_cerrado`, `asignado_no_valido`, `agenda_borrado`, `demasiados`, y el de nombre repetido (código `23505`).

## 6. Riesgos

- **Publicar la app antes que la migración** hace fallar el guardado de gastos con carpeta: aplicar, comprobar y después publicar.
- **Marcar una tarea o poner una carpeta cuenta como «editado por»** quien lo hace. Es aceptable, pero el texto «Editado por» de la app lo reflejará.
- **Si un gasto antiguo ya no pasa `validar_compartido`** (por ejemplo, un reparto de antes de alguna regla), `poner_carpeta` falla para ese lote entero, sin cambiar nada. No hay riesgo para los datos, solo un aviso.
- **«Deshacer» una carpeta** puede chocar con otra nueva del mismo nombre (error de nombre repetido): la app debe decirlo.
- **Al borrar una cuenta de usuario**, sus planes «Solo yo» quedan sin dueño e invisibles para todos, pero siguen guardados. Si algún día se borran cuentas, hay que limpiarlos a mano.
- **Grupos cerrados:** no se crean carpetas ni planes, pero sí se pueden editar los que ya había (igual que hoy con los gastos, sin confirmar).

## 7. Lo que no he podido averiguar o confirmar

- **No he podido leer la base de datos real**: en esta sesión no estaban disponibles las herramientas de Supabase. No he podido ver `es_miembro`, las reglas de `compartidos`, `grupos` y `grupo_miembros`, el disparador `validar_compartido` en vivo ni los avisos de seguridad. Lo de arriba se basa en `supabase/migrations/` y en `data-layer.js`. Antes de aplicar, hay que hacer estas consultas (todas solo leen):
  1. `select pg_get_functiondef('public.es_miembro(uuid)'::regprocedure);`: que sea `security definer`, con `search_path` fijo y que exija `baja is null`.
  2. `select tablename, policyname, cmd, roles, qual, with_check from pg_policies where tablename in ('compartidos','grupos','grupo_miembros');`
  3. `select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.compartidos'::regclass and not tgisinternal;`
  4. `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.compartidos'::regclass;`: confirma que los gastos fijos compartidos usan el tipo `Factura`.
  5. `select tablename from pg_publication_tables where pubname = 'supabase_realtime';`: que `compartidos` ya esté, para copiar el patrón.
  6. `select relname from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity;`: **ninguna tabla de `public` sin RLS**. Hay que mirar en especial las copias `backup_movimientos_20261012`, `backup_compartidos_20261012` y `backup_config_20261012`. Si alguna sale, se podría leer con la clave pública de la web y hay que protegerla ya.
  7. `select table_name, privilege_type from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public';`
  8. Avisos de seguridad de Supabase (`get_advisors`, seguridad y rendimiento).
- No he probado el SQL. Lo recomendable es lo mismo que el 17/10: probarlo en la base real con usuarios inventados dentro de una transacción que se deshace (ajenos sin acceso, salir del grupo, «autor» frente a «todos», marcar hecha, «Deshacer», 30 carpetas, gasto de otro grupo, sin sesión).
- No sé si hoy se pueden editar gastos de un grupo cerrado. He mantenido el mismo criterio para carpetas y planes sin comprobarlo.

## 8. Preguntas para el dueño

1. **(Bloquea aplicar)** ¿Das el «sí» a la migración 1 (carpetas) tal como está aquí? La de Planes, cuando decidas el nombre.
2. ¿Quieres que antes se hagan las consultas de solo lectura del apartado 7, en especial la 6 (tablas de copia sin protección)? Recomendado: sí, y ya.
3. ¿Carpetas también en las relaciones directas con una persona (sin grupo)? El SQL lo permite. Si no las quieres, se limita en la app.

## 9. Fuentes

- `CLAUDE.md`, `supabase/migrations/README.md`, `supabase/migrations/2026-10-17_personas_sin_cuenta.sql`, `supabase/migrations/copias/2026-10-17_antes_de_personas_sin_cuenta.sql`, `data-layer.js`, `app.js` (`saveCompartido`), `.github/workflows/backup-semanal.yml`, `docs/16-agenda-compartida-carpetas.md`. Consultados el 22/10/2026.

Para el PDF: una tabla grande con los 10 problemas en colores por gravedad y, al lado, el orden «aplicar migración → comprobar → publicar app». El SQL, en una página aparte.
