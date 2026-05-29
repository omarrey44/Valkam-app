-- =====================================================================
-- VALMAK · Schema Fase 11 (Empresa config + Notas de proyecto)
-- Correr DESPUÉS de schema_fase10.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- Configuración de empresa (fila única)
create table if not exists public.empresa_config (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null default 'VALMAK',
  slogan      text,
  rfc         text,
  direccion   text,
  telefono    text,
  correo      text,
  logo_url    text,
  actualizado_en timestamptz not null default now()
);

insert into public.empresa_config (id, nombre, slogan)
values ('00000000-0000-0000-0000-000000000001', 'VALMAK', 'Ingeniería en Diseño y Automatización')
on conflict (id) do nothing;

alter table public.empresa_config enable row level security;
drop policy if exists empresa_select on public.empresa_config;
create policy empresa_select on public.empresa_config for select to authenticated using (true);
drop policy if exists empresa_update on public.empresa_config;
create policy empresa_update on public.empresa_config
  for update to authenticated using (public.auth_rol() = 'administrador');

-- Notas internas por proyecto
create table if not exists public.proyecto_notas (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  usuario_id  uuid references auth.users(id) on delete set null,
  contenido   text not null,
  creado_en   timestamptz not null default now()
);

create index if not exists idx_pnotas_proyecto on public.proyecto_notas (proyecto_id);

alter table public.proyecto_notas enable row level security;
drop policy if exists pnotas_all on public.proyecto_notas;
create policy pnotas_all on public.proyecto_notas
  for all to authenticated using (true) with check (true);
