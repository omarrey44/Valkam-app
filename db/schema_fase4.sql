-- =====================================================================
-- VALMAK · Schema Fase 4 (Signup / Perfil / Roles / Push token)
-- Correr DESPUÉS de schema_fase3.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Columna push_token (para notificaciones push futuras)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists push_token text;

-- ---------------------------------------------------------------------
-- 2. Política de UPDATE: el propio usuario O un administrador
--    (reemplaza la anterior 'profiles_update_own')
-- ---------------------------------------------------------------------
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.auth_rol() = 'administrador');

-- ---------------------------------------------------------------------
-- 3. SEGURIDAD: impedir auto-escalada de rol.
--    Solo un administrador puede cambiar la columna 'rol'.
--    Sin esto, cualquier usuario podría hacerse administrador vía API.
-- ---------------------------------------------------------------------
create or replace function public.guard_profile_rol()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and public.auth_rol() <> 'administrador' then
    raise exception 'Solo un administrador puede cambiar el rol';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_rol on public.profiles;
create trigger trg_guard_profile_rol
  before update on public.profiles
  for each row execute function public.guard_profile_rol();

-- ---------------------------------------------------------------------
-- 4. Realtime: publicar cotizaciones (badge de Pendientes en vivo)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cotizaciones'
  ) then
    alter publication supabase_realtime add table public.cotizaciones;
  end if;
end $$;
