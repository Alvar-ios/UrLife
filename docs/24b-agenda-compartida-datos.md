# Compartir mi agenda: revisión de Datos y Seguridad (29/10/2026)

*Revisión en papel del apartado 5 de `docs/24-agenda-compartida.md`. **No se ha aplicado nada en Supabase ni se ha ejecutado ningún SQL.** Decisiones del dueño ya tomadas: tres niveles (Todo / Solo los títulos / Solo si estás ocupada), lo nuevo empieza visible, y se comparte con una persona o con un grupo.*

## 1. Conclusión

1. **Veredicto: sí, con 3 cambios al borrador.** La idea es segura: nadie lee tu tabla de tareas; la otra persona pide tu agenda a una función del servidor que ya la devuelve recortada. La migración propuesta (apartado 3) es **solo aditiva**: 2 tablas nuevas, 2 columnas con valor por defecto «no», 1 regla de comprobación y 4 funciones. No toca ningún dato ni ninguna regla de lo que ya existe.
2. **Cambio 1 (importante): un solo «Privada» por plan de grupo no vale.** Un plan del grupo es de todos: si Ana lo marca privado, también se esconde a quien ve la agenda de Bea, y cualquiera del grupo podría quitarle la marca. Propuesta: `agenda.privada` solo para los planes «Solo yo», y una tabla nueva `agenda_ocultas` para que **cada persona** esconda los planes de grupo a quien la ve desde fuera.
3. **Cambio 2: el permiso se comprueba cada vez, no se borra.** Si sales del grupo o dejáis de ser «amigos», el permiso no se borra, pero deja de valer al momento. Quien recibe no puede leer la tabla de permisos: solo la función `agendas_conmigo`.
4. **Las versiones antiguas de la app no borran «Privada»**: las tareas se guardan con la fila entera tal como se leyó (que ya traerá `privada`), y los planes con una lista fija de campos (que no la incluye, así que no la tocan). **Pero hay un fallo real que arreglar antes:** al marcar hecha una tarea que se repite, la siguiente se crea sin `privada`, así que **saldría visible**.
5. Falta que el dueño confirme 2 cosas (apartado 6). La 1 bloquea la migración.

## 2. Qué cambia frente al borrador del apartado 5

| Pieza del borrador | Revisión | Por qué |
|---|---|---|
| `agenda_permisos` | Igual, y además: nivel por defecto «ocupado», uno por persona y uno por grupo, solo lo ve el dueño | Si algo falla, que falle hacia lo que menos enseña |
| `tareas.privada` | Igual (sí/no, por defecto no, nunca vacía) | Lo nuevo empieza visible, como decidió el dueño |
| `agenda.privada` | **Solo en planes «Solo yo»** (una regla lo impide en los de grupo) | En un grupo cualquiera puede editar el plan |
| — | **Nueva: `agenda_ocultas`** (persona + plan del grupo) | Cada uno esconde un plan del grupo a quien le ve desde fuera, sin afectar a los demás |
| `agenda_de` | Igual, más: rango máximo 92 días, ids cambiados por una clave que no sirve para nada más, tareas del grupo nunca, planes de grupos ajenos solo como «Ocupada» | Lo de un grupo no es solo tuyo |
| `agendas_conmigo` | Devuelve solo quién y qué nivel; los nombres los pone la app (ya los conoce de los grupos) | Menos datos viajando |
| Función interna `agenda_nivel_para` | Nueva, sin permiso para la app | Así nadie puede preguntar «¿comparte X con Y?» |

Qué devuelve `agenda_de` a quien mira, según el nivel (las tareas sin fecha, las hechas y lo privado, nunca):

| Cosa | Todo | Solo los títulos | Solo si estás ocupada |
|---|---|---|---|
| Plan «Solo yo» | título, fecha, hora, lugar, nota | título, fecha, hora | fecha y hora |
| Plan de un grupo del que quien mira **no** es miembro | fecha y hora | fecha y hora | fecha y hora |
| Plan de un grupo del que quien mira **sí** es miembro | no se manda (ya lo ve en su grupo) | igual | igual |
| Tarea personal con fecha | título, fecha, nota | título, fecha | no se manda |
| Tarea de un grupo | no se manda | no se manda | no se manda |
| Marcada Privada u oculta | no se manda | no se manda | no se manda |

## 3. Migración propuesta (sin aplicar)

Nombre sugerido: `agenda_compartir`. Mismo estilo que las anteriores (funciones con `security definer` y `search_path` fijo; `anon` sin nada).

```sql
-- 29/10/2026 · agenda_compartir (PROPUESTA, SIN APLICAR). Ver docs/24 §5 y docs/24b.
-- Solo aditiva: no cambia ningún dato ni las reglas actuales de tareas y agenda.

-- 1. Columnas nuevas (por defecto «no»: lo de ahora y lo nuevo, visible) ---------------
alter table public.tareas add column privada boolean not null default false;
alter table public.agenda add column privada boolean not null default false;
-- En los planes de grupo no se usa «privada» (es de todos); para eso está agenda_ocultas
alter table public.agenda add constraint agenda_privada_solo_yo check (not privada or grupo_id is null);

-- 2. Planes de grupo que cada persona esconde a quien ve su agenda desde fuera --------
create table public.agenda_ocultas (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  agenda_id uuid not null references public.agenda(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, agenda_id)
);
alter table public.agenda_ocultas enable row level security;
revoke all on public.agenda_ocultas from anon, authenticated;
grant select, insert, delete on public.agenda_ocultas to authenticated;
create policy ocultas_ver on public.agenda_ocultas for select to authenticated
  using (user_id = (select auth.uid()));
create policy ocultas_crear on public.agenda_ocultas for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.agenda a where a.id = agenda_id and a.grupo_id is not null and public.es_miembro(a.grupo_id)));
create policy ocultas_quitar on public.agenda_ocultas for delete to authenticated
  using (user_id = (select auth.uid()));

-- 3. Con quién compartes tu agenda y cómo ---------------------------------------------
create table public.agenda_permisos (
  id uuid primary key default gen_random_uuid(),
  dueno uuid not null default auth.uid() references auth.users(id) on delete cascade,
  a_usuario uuid references auth.users(id) on delete cascade,      -- una persona con cuenta…
  a_grupo uuid references public.grupos(id) on delete cascade,      -- …o un grupo entero
  nivel text not null default 'ocupado' check (nivel in ('todo', 'titulos', 'ocupado')),
  planes boolean not null default true,
  tareas boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((a_usuario is null) <> (a_grupo is null)),
  check (a_usuario is distinct from dueno)
);
create unique index agenda_permisos_una_persona on public.agenda_permisos (dueno, a_usuario) where a_usuario is not null;
create unique index agenda_permisos_un_grupo on public.agenda_permisos (dueno, a_grupo) where a_grupo is not null;
create index agenda_permisos_para_persona on public.agenda_permisos (a_usuario) where a_usuario is not null;
create index agenda_permisos_para_grupo on public.agenda_permisos (a_grupo) where a_grupo is not null;

alter table public.agenda_permisos enable row level security;
revoke all on public.agenda_permisos from anon, authenticated;
grant select, insert, update, delete on public.agenda_permisos to authenticated;
-- Solo el dueño ve y toca sus permisos. Quien recibe usa agendas_conmigo().
create policy permisos_ver on public.agenda_permisos for select to authenticated using (dueno = (select auth.uid()));
create policy permisos_crear on public.agenda_permisos for insert to authenticated with check (dueno = (select auth.uid()));
create policy permisos_editar on public.agenda_permisos for update to authenticated
  using (dueno = (select auth.uid())) with check (dueno = (select auth.uid()));
create policy permisos_quitar on public.agenda_permisos for delete to authenticated using (dueno = (select auth.uid()));

create function public.validar_agenda_permiso() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.dueno := auth.uid(); end if;
    new.created_at := now();
    if new.a_usuario is not null and not public.son_amigos(new.dueno, new.a_usuario) then
      raise exception 'no_es_amigo';
    end if;
    if new.a_grupo is not null and not exists (
        select 1 from public.grupo_miembros m join public.grupos g on g.id = m.grupo_id
        where m.grupo_id = new.a_grupo and m.user_id = new.dueno and m.baja is null and g.cerrado is null) then
      raise exception 'no_autorizado';
    end if;
  else
    if new.id is distinct from old.id or new.dueno is distinct from old.dueno or new.a_usuario is distinct from old.a_usuario
       or new.a_grupo is distinct from old.a_grupo or new.created_at is distinct from old.created_at then
      raise exception 'no_permitido';   -- para cambiar de persona o grupo: dejar de compartir y volver a compartir
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger validar_agenda_permiso before insert or update on public.agenda_permisos
  for each row execute function public.validar_agenda_permiso();

-- 4. Funciones -------------------------------------------------------------------------
-- Mejor nivel que p_quien tiene sobre la agenda de p_dueno (0 nada, 1 ocupado, 2 títulos, 3 todo).
-- Se comprueba en cada llamada: si alguien sale del grupo o deja de ser amigo, deja de valer.
create function public.agenda_nivel_para(p_dueno uuid, p_quien uuid, p_que text) returns int
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select coalesce(max(case p.nivel when 'todo' then 3 when 'titulos' then 2 else 1 end), 0)
  from public.agenda_permisos p
  where p.dueno = p_dueno and p_quien is not null and p_quien <> p_dueno
    and ((p_que = 'plan' and p.planes) or (p_que = 'tarea' and p.tareas))
    and ((p.a_usuario = p_quien and public.son_amigos(p_dueno, p_quien))
      or (p.a_grupo is not null
          and exists (select 1 from public.grupos g where g.id = p.a_grupo and g.cerrado is null)
          and exists (select 1 from public.grupo_miembros m where m.grupo_id = p.a_grupo and m.user_id = p_quien and m.baja is null)
          and exists (select 1 from public.grupo_miembros m where m.grupo_id = p.a_grupo and m.user_id = p_dueno and m.baja is null)));
$$;

-- La agenda de otra persona, ya recortada en el servidor. Nunca devuelve lo privado ni ids reales.
create function public.agenda_de(p_persona uuid, p_desde date, p_hasta date)
returns table (clave text, tipo text, fecha date, fecha_fin date, hora time, titulo text, lugar text, nota text, nivel text)
language plpgsql stable security definer set search_path to 'public', 'pg_temp' as $$
declare
  yo uuid := auth.uid();
  n_plan int; n_tarea int;
begin
  if yo is null then raise exception 'sin_sesion'; end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta - p_desde > 92 then raise exception 'rango_no_valido'; end if;
  if p_persona is null or p_persona = yo then return; end if;
  n_plan := public.agenda_nivel_para(p_persona, yo, 'plan');
  n_tarea := public.agenda_nivel_para(p_persona, yo, 'tarea');

  if n_plan > 0 then
    -- Planes «Solo yo» de la persona, no privados
    return query
      select md5(a.id::text || yo::text), 'plan'::text, a.fecha, a.fecha_fin, a.hora,
             case when n_plan >= 2 then a.titulo end,
             case when n_plan = 3 then a.lugar end,
             case when n_plan = 3 then a.nota end,
             case n_plan when 3 then 'todo' when 2 then 'titulos' else 'ocupado' end
      from public.agenda a
      where a.grupo_id is null and a.creado_por = p_persona and a.tipo = 'plan'
        and a.borrado is null and not a.privada
        and a.fecha <= p_hasta and coalesce(a.fecha_fin, a.fecha) >= p_desde;
    -- Planes de sus grupos abiertos en los que yo no estoy: solo «Ocupada», nunca el título
    return query
      select md5(a.id::text || yo::text), 'plan'::text, a.fecha, a.fecha_fin, a.hora,
             null::text, null::text, null::text, 'ocupado'::text
      from public.agenda a
      join public.grupos g on g.id = a.grupo_id and g.cerrado is null
      where a.tipo = 'plan' and a.borrado is null
        and a.fecha <= p_hasta and coalesce(a.fecha_fin, a.fecha) >= p_desde
        and exists (select 1 from public.grupo_miembros m where m.grupo_id = a.grupo_id and m.user_id = p_persona and m.baja is null)
        and not exists (select 1 from public.grupo_miembros m where m.grupo_id = a.grupo_id and m.user_id = yo and m.baja is null)
        and not exists (select 1 from public.agenda_ocultas o where o.user_id = p_persona and o.agenda_id = a.id);
  end if;

  if n_tarea >= 2 then
    -- Tareas personales con fecha, sin hacer y no privadas (en «ocupada» no salen: no tienen hora)
    return query
      select md5(t.id::text || yo::text), 'tarea'::text, x.dia, null::date, null::time,
             t.nombre::text, null::text,
             case when n_tarea = 3 then nullif(btrim(t.comentario::text), '') end,
             case n_tarea when 3 then 'todo' else 'titulos' end
      from public.tareas t
      cross join lateral (select case when t.fecha_limite::text ~ '^\d{4}-\d{2}-\d{2}'
                                      then left(t.fecha_limite::text, 10)::date end as dia) x
      where t.user_id = p_persona and not t.privada
        and t.estado is distinct from 'Completado'
        and x.dia between p_desde and p_hasta;
  end if;
end $$;

-- Quién me enseña su agenda y con qué nivel (los nombres los pone la app)
create function public.agendas_conmigo()
returns table (persona uuid, nivel_planes text, nivel_tareas text)
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  with duenos as (
    select distinct p.dueno from public.agenda_permisos p
    where auth.uid() is not null and p.dueno <> auth.uid()
      and (p.a_usuario = auth.uid() or exists (select 1 from public.grupo_miembros m
           where m.grupo_id = p.a_grupo and m.user_id = auth.uid() and m.baja is null))
  ), n as (
    select d.dueno, public.agenda_nivel_para(d.dueno, auth.uid(), 'plan') as np,
                    public.agenda_nivel_para(d.dueno, auth.uid(), 'tarea') as nt
    from duenos d
  )
  select n.dueno,
         case n.np when 3 then 'todo' when 2 then 'titulos' when 1 then 'ocupado' end,
         case n.nt when 3 then 'todo' when 2 then 'titulos' when 1 then 'ocupado' end
  from n where n.np > 0 or n.nt > 0;
$$;

revoke execute on function public.validar_agenda_permiso(), public.agenda_nivel_para(uuid, uuid, text),
  public.agenda_de(uuid, date, date), public.agendas_conmigo() from public, anon, authenticated;
grant execute on function public.agenda_de(uuid, date, date), public.agendas_conmigo() to authenticated;

-- Sin Realtime para estas tablas, y tareas sigue fuera del tiempo real de otros.
notify pgrst, 'reload schema';
```

Antes de aplicarla hay que **leer en Supabase** (solo lectura) tres cosas que no están en el repositorio: el tipo de `tareas.fecha_limite` (si es fecha, el `lateral` se simplifica), que `son_amigos(uuid, uuid)` existe con esa forma, y las reglas actuales de `tareas` (que nadie más que el dueño pueda leerla).

## 4. Cómo se desharía

| Paso | Qué hace | Se pierde |
|---|---|---|
| Interruptor de emergencia | `revoke execute on function public.agenda_de(uuid, date, date), public.agendas_conmigo() from authenticated;` Nadie ve la agenda de nadie al momento | Nada |
| Deshacer del todo (1) | Volver primero a una app que no mande `privada` (si no, guardar tareas fallaría) | — |
| Deshacer del todo (2) | `drop function public.agendas_conmigo(), public.agenda_de(uuid, date, date), public.agenda_nivel_para(uuid, uuid, text);` `drop table public.agenda_permisos, public.agenda_ocultas;` `drop function public.validar_agenda_permiso();` `alter table public.agenda drop constraint agenda_privada_solo_yo, drop column privada;` `alter table public.tareas drop column privada;` | Con quién se compartía y qué estaba marcado como privado. Ni una tarea ni un plan |

Antes de deshacer del todo, la copia semanal cifrada (`.github/workflows/backup-semanal.yml`) guarda lo anterior.

## 5. Riesgos (de más grave a menos)

| # | Riesgo | Gravedad | Qué hacer |
|---|---|---|---|
| 1 | **La repetición de una tarea privada sale visible.** `crearSiguienteTarea` (app.js) crea la siguiente con una lista fija de campos, sin `privada`. Pasa en esta versión y en las antiguas | Alta | Copiar `privada` en `crearSiguienteTarea` antes de enseñar el botón «Privada». Prueba automática |
| 2 | **Una copia vieja pisa la marca.** Las tareas se guardan con la fila entera (`stripId` + `upsert`). Si un móvil tiene la tarea sin refrescar (pestaña dormida) y la edita, vuelve a poner el `privada` de antes | Media | Que marcar o quitar «Privada» refresque las tareas en los demás (ya lo hace el tiempo real en 0,3 s). Si preocupa: un cambio de `privada` solo con una función propia, en otra migración |
| 3 | **Un plan de grupo se ve como «Ocupada» fuera del grupo** («la cena del Piso» deja ver que Ana tiene algo el viernes) | Media | Está así en el SQL; falta el «sí» del dueño (pregunta 1) |
| 4 | **Compartir con un grupo incluye a quien entre después** | Media | Avisarlo al elegir el grupo (ya en `docs/24`) |
| 5 | «Compartir una tarea tuya» (3.1, ya en la rama `fase4/agenda31`) pasa la tarea a un plan de grupo: si era privada, deja de serlo para ese grupo | Baja | Si la tarea era privada, preguntarlo antes |
| 6 | La app nueva manda `privada` en un plan de grupo: la regla nueva lo rechaza y no se guarda | Baja | En `data-layer.js`, añadir `privada` a la lista de la agenda y mandarlo solo en planes «Solo yo» |
| 7 | Mandar `privada` vacía (null) en una tarea hace fallar el guardado | Baja | Mandar siempre sí o no |

Por qué las versiones antiguas no lo borran (comprobado leyendo el código, **no probado**):
- **Tareas:** `data-layer.js` lee con `select('*')` y la app edita con `stripId(ex)`: la fila completa, con `privada` dentro, vuelve tal cual. Las tareas nuevas no lo mandan y empiezan visibles, como decidió el dueño. Papelera: la copia guardada lleva `privada` y se recupera con ella.
- **Planes:** `tablaCompartida` solo manda los campos de su lista (`id`, `grupoId`, `tipo`, `titulo`…); `privada` no está, así que nunca se toca. «Deshacer» un borrado (`new := old`) la conserva.
- No hay *service worker*: una versión antigua solo dura lo que una pestaña sin recargar.

## 6. Preguntas que debe decidir el dueño

1. **(Bloquea la migración)** Tus planes de un grupo, ¿salen como «Ocupada» a quien ve tu agenda y no es del grupo? Recomendado: sí (es lo que hace el SQL). Si dice que no, se quita ese bloque y no salen nunca.
2. ¿Te parece bien que «Dejar de compartir» **borre de verdad** el permiso? Solo es la regla de quién ve, no ningún dato tuyo. Recomendado: sí.
3. Para aplicarla: el «sí» explícito del dueño, después de leer en Supabase las tres cosas del final del apartado 3.

## 7. Plan de pruebas de aislamiento (cuentas de prueba, sin datos reales)

Igual que el 10/10: en la base de datos real, dentro de una transacción que se deshace al terminar, con cuentas inventadas (Prueba A, B, C y D) y títulos inventados («Plan prueba 1»). A comparte; B es su amiga directa; C está con A en el grupo «G-prueba»; D es ajena.

| # | Caso | Esperado |
|---|---|---|
| 1 | Sin sesión: leer `agenda_permisos`, `agenda_ocultas` o llamar a `agenda_de` | Error o nada |
| 2 | D llama a `agenda_de(A)` | 0 filas |
| 3 | A crea un permiso para D (no son amigos) | `no_es_amigo` |
| 4 | A crea un permiso a un grupo del que no es miembro | `no_autorizado` |
| 5 | B intenta crear, cambiar o borrar un permiso de A, o cambiar el `dueno` | Rechazado o 0 filas |
| 6 | B lee `agenda_permisos` directamente | 0 filas (solo `agendas_conmigo`) |
| 7 | Nivel «ocupado»: B pide la agenda de A | Ningún título, lugar ni nota; 0 tareas |
| 8 | Nivel «títulos» | Títulos sí; lugar y nota vacíos |
| 9 | Nivel «todo» | Todo menos lo privado |
| 10 | Tarea y plan «Solo yo» privados, en los 3 niveles | No llegan nunca, ni como «ocupada» |
| 11 | Tareas sin fecha, hechas o borradas | No llegan |
| 12 | Plan de un grupo de A en el que B no está | Solo «ocupado»; oculto por A en `agenda_ocultas`: no llega |
| 13 | C oculta un plan del grupo: no cambia lo que ven A ni los demás del grupo | Igual que antes |
| 14 | Marcar `privada` en un plan de grupo | Rechazado por la regla |
| 15 | Permiso al grupo: C lo ve; C sale del grupo (o se cierra) y vuelve a pedirla | Antes sí; después 0 filas |
| 16 | A deja de compartir con B | `agenda_de` devuelve 0 filas al momento |
| 17 | Rango de 93 días o al revés | `rango_no_valido` |
| 18 | Ningún resultado trae un id real de tarea o plan | Solo la clave |
| 19 | Guardar una tarea privada «a la antigua» (fila entera sin cambiar `privada`, y lista de campos de la agenda) | `privada` sigue en sí |
| 20 | Las tareas y los planes que ya existen (44 tareas el 23/10) | Mismo número y contenido; todos con `privada` = no |

En las pruebas automáticas (`tests/`): copiar `privada` al repetir una tarea, no mandarlo en planes de grupo y que la agenda de otros no se pueda editar.

## 8. Lo que no hemos podido averiguar o confirmar

- **Nada ejecutado.** El SQL no se ha probado ni en una transacción; puede tener errores de escritura.
- No hemos leído en Supabase el tipo de `tareas.fecha_limite` y `tareas.id`, ni las reglas actuales de `tareas`, ni la forma exacta de `son_amigos` y `es_miembro` (no están en el repositorio).
- Lo de las versiones antiguas sale de leer `data-layer.js` y `app.js`, no de probarlo.

## 9. Fuentes

- Del repositorio (29/10/2026): `docs/24-agenda-compartida.md` §5, `data-layer.js` (`objToRow`, `doc().set` con `upsert`, `tablaCompartida`, `agenda`), `app.js` (`saveTarea`, `toggleTarea`, `crearSiguienteTarea`, `papeleraRecuperar`, `stripId`), `supabase/migrations/2026-10-23_agenda_planes.sql`, `2026-10-17_personas_sin_cuenta.sql` y `README.md`.

Para el PDF: un dibujo del camino «móvil de A → servidor (comprueba el permiso, quita lo privado, recorta según el nivel) → móvil de B», y la tabla de los niveles del apartado 2 en grande.
