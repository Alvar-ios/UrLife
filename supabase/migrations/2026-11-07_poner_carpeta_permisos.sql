-- 07/11/2026 · poner_carpeta respeta «quién puede cambiar los gastos». SIN APLICAR: espera el «sí» del dueño.
-- Solo REEMPLAZA la función poner_carpeta (misma firma, mismos permisos). No toca tablas ni datos.
-- Cambio: antes bastaba con ser miembro del grupo; ahora, si el grupo tiene edicion = 'autor', solo puede poner
-- o quitar el tema quien creó el gasto o una persona administradora (la misma regla que editar: puede_editar_compartido).
-- Marcha atrás: volver a ejecutar la definición de poner_carpeta de 2026-10-23_grupo_carpetas_temas.sql (con «create or replace»).
create or replace function public.poner_carpeta(p_ids uuid[], p_carpeta uuid) returns int
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
  for r in select id, grupo_id, creado_por from public.compartidos
           where id = any(p_ids) and borrado is null and tipo in ('Gasto', 'Factura')
             and carpeta_id is distinct from p_carpeta for update loop
    -- es miembro y, si el grupo es «solo el autor», es el autor o administrador
    if not public.puede_editar_compartido(r.grupo_id, r.creado_por) then raise exception 'no_autorizado'; end if;
    if v_grupo is not null and r.grupo_id <> v_grupo then raise exception 'carpeta_no_valida'; end if;
    update public.compartidos set carpeta_id = p_carpeta where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.poner_carpeta(uuid[], uuid) from public, anon;
grant execute on function public.poner_carpeta(uuid[], uuid) to authenticated;
notify pgrst, 'reload schema';
