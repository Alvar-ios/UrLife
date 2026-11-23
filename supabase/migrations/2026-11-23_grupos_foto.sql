-- Foto del grupo (23/11/2026, docs/46 tanda 5). APLICADA el 23/11/2026. Aditiva: una columna opcional nueva; no toca datos.
-- La foto se recorta y reduce en el móvil (192 px, JPEG, unos 10-20 KB) y se guarda como «data:image/jpeg;base64,…» en la
-- fila del grupo: la ven solo sus miembros (regla grupos_ver) y la cambian solo los administradores (regla grupos_editar).
-- Revisada por Datos y Seguridad: columna mejor que un espacio de imágenes (sin reglas nuevas, se borra con el grupo, entra en la copia).
begin;
alter table public.grupos add column if not exists foto text;
alter table public.grupos add constraint grupos_foto_formato check (
  foto is null or (char_length(foto) <= 60000
    and foto ~ '^data:image/(jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$'));
grant select (foto), update (foto) on public.grupos to authenticated;
commit;
-- Para deshacer (solo se pierden las fotos puestas; antes, quitar de la app lo que usa «foto»):
-- begin; revoke select (foto), update (foto) on public.grupos from authenticated; alter table public.grupos drop column if exists foto; commit;
