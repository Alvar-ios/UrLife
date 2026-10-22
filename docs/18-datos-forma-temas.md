# Datos y seguridad: forma de las metas compartidas y temas en los grupos (23/10/2026)

*Nada aplicado en Supabase. Las dos migraciones esperan el «sí» del dueño. Revisión hecha con los resultados de las consultas de solo lectura que se hicieron en la base real el 23/10 a las 00:10 (apartado 7 de `docs/17-datos-planes-carpetas.md`).*

## 1. Conclusión

1. **Forma de las metas compartidas: sí.** Es una columna nueva y vacía en `objetivos_compartidos`. No cambia ninguna meta ni ninguna deuda: vacía quiere decir «la forma que sale del nombre», como hoy. No hay que tocar `validar_objetivo`.
2. **La app publicada hoy no se rompe.** No conoce la columna, así que no la manda ni la borra. Lo que sí rompe es lo contrario: publicar la app nueva antes que la columna. Orden: **migración → comprobar → publicar**.
3. **Temas (migración 1 de `docs/17`): confirmada, con un retoque pequeño en el SQL.** Los datos reales cuadran con lo que se supuso. El único cambio de SQL es opcional: exigir en la regla de crear que el autor sea quien tiene la sesión, como ya hacen gastos y metas.
4. **Una corrección importante al texto de `docs/17`:** `es_miembro` exige que el grupo **no esté cerrado**. Así que en un grupo cerrado nadie ve, crea ni cambia temas, ni edita gastos. `docs/17` decía lo contrario. Es más seguro así, pero la app debe saberlo.
5. **Riesgo pendiente que no bloquea:** quien no tiene sesión (`anon`) tiene permisos de tabla en muchas tablas. Hoy no puede leer nada, porque todas tienen RLS. Conviene quitárselos más adelante, en una migración aparte.

## 2. A) Columna `forma` en `objetivos_compartidos`

### SQL propuesto

```sql
-- Forma de una meta compartida (o icono de una deuda compartida). Aditiva: columna vacía en todas las filas.
-- Vacía = la app elige la forma por el nombre (como hoy).
alter table public.objetivos_compartidos
  add column forma text
  constraint objetivos_compartidos_forma_check
  check (forma is null or forma ~ '^[a-z][A-Za-z0-9]{0,19}$');
comment on column public.objetivos_compartidos.forma is
  'Clave corta de la forma (metas) o del icono (deudas). Vacía = la elige la app por el nombre.';
notify pgrst, 'reload schema';   -- que la web vea la columna nueva al momento
```

**Por qué una regla de formato y no la lista de las 12 claves:** solo admite letras y números, de 1 a 20. Así nadie puede colar código en la forma, aunque edite la meta saltándose la app. Además, una forma nueva (la 13.ª) o los 7 iconos de las deudas (`coche2`, `manoMoneda`…) no necesitan otra migración. Cambiar una lista cerrada obligaría a reemplazar la regla, y eso ya no es aditivo. Si una clave no existe en la app, la app usa la del nombre.

### Qué hace y qué no

| Pregunta | Respuesta |
|---|---|
| ¿Cambia datos? | No. Todas las metas y deudas quedan con `forma` vacía y se ven igual que hoy |
| ¿Hay que tocar `validar_objetivo`? | No. En las altas no la toca. Al editar solo bloquea `id`, `grupo_id`, `tipo`, `creado_por` y `created_at`, así que `forma` se puede cambiar |
| ¿Quién la cambia? | Quien hoy puede editar la meta: cualquier miembro activo (regla `editar` = `es_miembro`). Es igual que con el nombre |
| ¿La ve todo el grupo al momento? | Sí. `objetivos_compartidos` ya está en Realtime |
| ¿Hay que dar permisos nuevos? | No, si los permisos de `authenticated` son de tabla entera (ver la consulta previa P1) |
| ¿Entra en la copia semanal? | Sí, sin tocar nada (copia todo `public`) |

### Cómo se deshace

Antes, volver a la versión de la app que no usa `forma`. Si no, guardar una meta compartida falla.

```sql
-- (Opcional) copia protegida de las formas elegidas; cambiar la fecha
create table public.backup_objetivos_forma_AAAAMMDD as
  select id, forma from public.objetivos_compartidos where forma is not null;
alter table public.backup_objetivos_forma_AAAAMMDD enable row level security;
revoke all on public.backup_objetivos_forma_AAAAMMDD from anon, authenticated;

alter table public.objetivos_compartidos drop column forma;   -- las metas vuelven a la forma del nombre
notify pgrst, 'reload schema';
```

Solo se pierde qué forma eligió cada grupo. Ninguna meta, aportación ni deuda cambia.

### Qué cambia en `data-layer.js`

| Dónde | Cambio |
|---|---|
| `objetivos` (lista de campos) | Añadir `'forma'` a la lista de `tablaCompartida('objetivos_compartidos', …)` |
| `objetivos` (`deFila`) | `forma: r.forma \|\| null` |
| camelCase ↔ snake_case | No hace falta nada: se llama `forma` en los dos lados |
| Al guardar | Mandar `forma` **solo si se elige a mano**. Si va `undefined`, no se envía y no se toca. `null` = volver a «la del nombre». Nunca `''` (la regla lo rechaza) |
| Al leer (en `app.js`) | Si la clave no está en la lista de formas (o de iconos de deuda), usar `formaSugerida(nombre)`. Nunca meter el texto tal cual en el HTML |
| Errores | Añadir a `ERR_GRUPO` la clave `objetivos_compartidos_forma_check` → «Esa forma no vale» |

**La app publicada hoy:** solo manda los campos de su lista, así que nunca manda `forma` ni la vacía al editar. Lee con `select('*')`, recibe `forma` y la ignora. No se rompe nada. Una persona con la app antigua que edite una meta tampoco borra la forma que eligió otra.

## 3. B) Temas (migración 1 de `docs/17`) con los datos reales

| Dato real (23/10) | Qué supone para el SQL de `docs/17` | ¿Cambia? |
|---|---|---|
| `es_miembro`: `security definer`, `search_path` fijo, exige sesión, `baja is null` y **grupo no cerrado** | Las reglas y `poner_carpeta` valen tal cual. En grupo cerrado, todo se rechaza ya por RLS | No (corrige el texto, ver abajo) |
| `compartidos`: crear exige `creado_por = auth.uid()`; editar = `puede_editar_compartido` + `es_miembro` | `carpetas_editar` copia el mismo patrón. `carpetas_crear` no exigía el autor | Sí, retoque 1 |
| Ninguna regla de DELETE | Igual que en temas: no se da `delete` | No |
| Solo un disparador en `compartidos` (`compartidos_validar`) | No hay choque de nombres. Postgres los ejecuta por orden alfabético: primero `compartidos_validar` y después `validar_carpeta_compartido`, que solo mira `carpeta_id` | No |
| Tipos: Gasto, Factura, Ahorro, Deuda, Liquidación | Confirma que los fijos son `Factura`: la lista `('Gasto','Factura')` es correcta | No |
| `compartidos` ya está en Realtime | Se añade `grupo_carpetas` igual | No |
| Ninguna tabla de `public` sin RLS; las `backup_*` con RLS y sin reglas | La duda sobre las copias del 12/10 queda cerrada: nadie las lee desde la web | No |
| `anon` tiene permisos de tabla por defecto | Confirma que el `revoke all … from anon, authenticated` de la tabla nueva es **necesario** | No |

**Retoque 1 (recomendado, sin riesgo):** en `carpetas_crear`, exigir el autor como en gastos y metas. El valor por defecto y el disparador ya lo ponen, así que la app no tiene que mandar nada nuevo.

```sql
create policy carpetas_crear on public.grupo_carpetas for insert to authenticated
  with check (public.es_miembro(grupo_id) and creado_por = (select auth.uid()));
```

**Añadido en las dos migraciones:** `notify pgrst, 'reload schema';` al final, para que la web vea la tabla y la columna nuevas al momento.

**Correcciones al texto de `docs/17` (no al SQL):**
- En un **grupo cerrado** no se pueden editar los temas ni los gastos que ya había (`docs/17`, apartado 6, decía que sí). La comprobación `grupo_cerrado` del disparador queda como segunda barrera. La app recibirá un error de permiso (`42501`), no `grupo_cerrado`.
- En un grupo cerrado, o después de salir de un grupo, la persona sigue viendo sus gastos (porque pagó o participa), pero no sus temas. La app debe enseñarlos como «Sin tema», sin error.
- **Tema cerrado:** `docs/16` dice que no se pueda meter un gasto en un tema cerrado. El SQL solo lo impide si el tema está borrado. Recomiendo dejarlo así: que la app no ofrezca temas cerrados. Si la base de datos lo prohibiera, «Deshacer» un gasto de un tema cerrado fallaría.
- **Nombres:** las tablas y los errores siguen diciendo «carpeta» (`grupo_carpetas`, `carpeta_id`, `carpeta_no_valida`, `demasiadas_carpetas`). No se ven en pantalla. `ERR_GRUPO` los traduce con la palabra «tema».
- Los 10 iconos de la regla (`plane`, `cart`, `home`, `fork`, `gift`, `car`, `ball`, `film`, `heart`, `tag`) existen ya en `ICONS` de `app.js`.

## 4. Recomendaciones

- **Aplicar primero `forma` (es la más simple) y después los temas,** cada una por separado. Así, si una falla, la otra sigue.
- **Hacer la prueba con usuarios inventados en una transacción que se deshace** antes de publicar los temas, como el 17/10: ajeno sin acceso, salir del grupo, grupo cerrado, «autor» frente a «todos», 30 temas, gasto de otro grupo, «Deshacer» y sin sesión.
- **Más adelante, quitar permisos a `anon`** en las tablas que la web nunca usa sin sesión (`movimientos`, `config`, `tareas`, `backup_*`…), con una migración aparte y revisada. No es urgente, porque RLS ya lo frena. Pero si alguna vez se desactivara RLS en una tabla por error, quedaría abierta.

## 5. Riesgos

| Gravedad | Riesgo | Cómo se evita |
|---|---|---|
| Alta | Publicar la app con `forma` o con temas antes de la migración: guardar falla (la base de datos no conoce la columna) | Aplicar, comprobar (apartado 8) y después publicar. Y mandar `forma` solo si se elige a mano |
| Media | Que `validar_objetivo` copie las columnas una a una y descarte `forma` (solo he visto su resumen) | Prueba A4: si después de guardar `forma` sale vacía, avisar antes de publicar |
| Media | Permisos por columna en `objetivos_compartidos` o `compartidos`: la columna nueva no se podría guardar | Consulta previa P1 |
| Baja | Cualquier miembro puede cambiar la forma, aunque el grupo esté en «solo quien lo apuntó» (eso hoy solo se aplica a los gastos) | Igual que el nombre de la meta hoy. Si se quiere cambiar, es otra decisión |
| Baja | `anon` con permisos de tabla (apartado 4) | Migración aparte más adelante |

## 6. Preguntas para el dueño

1. **(Bloquea A)** ¿Das el «sí» a la columna `forma` tal como está en el apartado 2?
2. **(Bloquea B)** ¿Das el «sí» a la migración 1 de temas de `docs/17`, con el retoque 1 y el `notify` de este documento?
3. ¿La misma columna sirve también para el icono de las **deudas** compartidas? Lo recomiendo: no cuesta nada más y así todo el grupo ve el mismo icono.
4. (No bloquea) ¿Preparo otro día la migración para quitar permisos a `anon`?

## 7. Lo que no hemos podido averiguar o confirmar

- **No he visto el texto completo de `validar_objetivo`**, solo su resumen. La prueba A4 lo confirma.
- **No sé si hay permisos por columna** en `objetivos_compartidos` o `compartidos` (en `grupos` puede haberlos, por la migración `grupos_columnas_protegidas`). Lo dice la consulta P1.
- **Faltan los avisos de seguridad de Supabase** (consulta 8 de `docs/17`). No venían en los resultados.
- No he probado ningún SQL: en esta sesión no tengo las herramientas de Supabase.

## 8. Consultas de comprobación

**Antes de aplicar (solo lectura):**

```sql
-- P1. Permisos de tabla entera para los usuarios con sesión (deben salir INSERT, SELECT y UPDATE en las dos)
select table_name, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'authenticated'
  and table_name in ('objetivos_compartidos', 'compartidos') order by 1, 2;
-- P2. Que no existan ya (debe salir vacío)
select table_name, column_name from information_schema.columns
where table_schema = 'public' and ((table_name = 'objetivos_compartidos' and column_name = 'forma')
   or (table_name = 'compartidos' and column_name = 'carpeta_id') or table_name = 'grupo_carpetas');
```

**Después de A (`forma`):**

```sql
-- A1. La columna: text, admite vacío, sin valor por defecto
select data_type, is_nullable, column_default from information_schema.columns
where table_schema = 'public' and table_name = 'objetivos_compartidos' and column_name = 'forma';
-- A2. La regla
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'public.objetivos_compartidos'::regclass and conname = 'objetivos_compartidos_forma_check';
-- A3. Nada ha cambiado: con_forma debe ser 0
select count(*) as metas, count(forma) as con_forma from public.objetivos_compartidos;
```

```sql
-- A4. Prueba que se deshace sola (no guarda nada). Debe devolver 'maleta'.
begin;
update public.objetivos_compartidos set forma = 'maleta'
  where id = (select id from public.objetivos_compartidos where borrado is null limit 1)
  returning forma;
rollback;
-- A5. Igual, con una forma no válida: debe dar error objetivos_compartidos_forma_check
begin;
update public.objetivos_compartidos set forma = '<b>x</b>'
  where id = (select id from public.objetivos_compartidos where borrado is null limit 1);
rollback;
```

**Después de B (temas):**

```sql
-- B1. Tabla con RLS y columna nueva
select relname, relrowsecurity from pg_class where oid = 'public.grupo_carpetas'::regclass;
select count(*) from information_schema.columns
where table_schema = 'public' and table_name = 'compartidos' and column_name = 'carpeta_id';   -- 1
-- B2. Reglas: 3 (ver, crear, editar), ninguna de DELETE
select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'grupo_carpetas';
-- B3. Permisos: anon nada; authenticated solo SELECT, INSERT, UPDATE
select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'grupo_carpetas' and grantee in ('anon', 'authenticated');
-- B4. Disparadores: compartidos_validar y validar_carpeta_compartido (con WHEN) en compartidos; validar_carpeta en grupo_carpetas
select tgrelid::regclass, tgname, pg_get_triggerdef(oid) from pg_trigger
where tgrelid in ('public.compartidos'::regclass, 'public.grupo_carpetas'::regclass) and not tgisinternal;
-- B5. Funciones: las tres security definer con search_path; solo poner_carpeta ejecutable con sesión
select proname, prosecdef, proconfig,
  has_function_privilege('anon', oid, 'execute') as anon,
  has_function_privilege('authenticated', oid, 'execute') as con_sesion
from pg_proc where pronamespace = 'public'::regnamespace
  and proname in ('validar_carpeta', 'validar_carpeta_compartido', 'poner_carpeta');
-- B6. Realtime
select tablename from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'grupo_carpetas';
-- B7. Nada ha cambiado: 0 gastos con tema y 0 temas
select count(carpeta_id) as gastos_con_tema from public.compartidos;
select count(*) as temas from public.grupo_carpetas;
```

Y al final de las dos, los avisos de seguridad y rendimiento de Supabase (`get_advisors`): no debe salir nada nuevo sobre `grupo_carpetas` ni sobre `objetivos_compartidos`.

## 9. Fuentes

- Resultados de las consultas de solo lectura en la base real, 23/10/2026 00:10, pasados por la sesión principal (no los he visto directamente).
- `docs/17-datos-planes-carpetas.md`, `docs/16-agenda-compartida-carpetas.md` (v2), `docs/15-dinero-ajustes.md` (2.3 y 2.5), `data-layer.js` (`tablaCompartida`, `objetivos`), `app.js` (`ICONS`, `objGuardar`, `errGrupo`), `supabase/migrations/README.md` y `2026-10-17_personas_sin_cuenta.sql`. Consultados el 23/10/2026.

Para el PDF: dos tarjetas, una para cada migración, con el semáforo en verde («sí») y debajo el orden «migración → comprobar → publicar». La tabla del apartado 3 en una hoja. El SQL y las consultas, en un anexo.
