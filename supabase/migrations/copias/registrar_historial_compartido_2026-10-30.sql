-- Copia (31/10/2026) de public.registrar_historial_compartido() tal como se aplicó el 30/10 (historial_compartidos_a).
-- Es el texto del repositorio: ANTES de usarla, comprobar que coincide con la real (consulta P6 de 2026-11-xx_viajes_moneda.sql).
-- Para deshacer la tanda 2: ejecutar este archivo. No toca ningún gasto ni ninguna fila del historial.

create or replace function public.registrar_historial_compartido() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  campos constant text[] := array['fecha', 'tipo', 'categoria', 'subcategoria', 'descripcion', 'importe',
                                  'pagado_por', 'reparto', 'objetivo_id', 'carpeta_id'];
  k text; o jsonb; n jsonb; a jsonb := '{}'; d jsonb := '{}'; v_accion text;
begin
  n := to_jsonb(new);
  if tg_op = 'INSERT' then
    v_accion := 'creado';
    foreach k in array campos loop
      if jsonb_typeof(n -> k) is not null and jsonb_typeof(n -> k) <> 'null' then d := d || jsonb_build_object(k, n -> k); end if;
    end loop;
    if (n -> 'articulos') is not null and jsonb_typeof(n -> 'articulos') <> 'null' then d := d || '{"articulos": "cambiaron"}'; end if;
  else
    o := to_jsonb(old);
    foreach k in array campos loop
      if (o -> k) is distinct from (n -> k) then
        a := a || jsonb_build_object(k, o -> k);
        d := d || jsonb_build_object(k, n -> k);
      end if;
    end loop;
    if (o -> 'articulos') is distinct from (n -> 'articulos') then d := d || '{"articulos": "cambiaron"}'; end if;
    if old.borrado is null and new.borrado is not null then v_accion := 'borrado';
    elsif old.borrado is not null and new.borrado is null then v_accion := 'recuperado';
    elsif d = '{}'::jsonb then return null;            -- nada que contar
    else v_accion := 'editado';
    end if;
  end if;
  insert into public.compartidos_historial (compartido_id, grupo_id, accion, hecho_por, antes, despues)
  values (new.id, new.grupo_id, v_accion, auth.uid(), nullif(a, '{}'::jsonb), nullif(d, '{}'::jsonb));
  return null;
end $$;
revoke execute on function public.registrar_historial_compartido() from public, anon, authenticated;
