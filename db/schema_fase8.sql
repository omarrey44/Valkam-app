-- =====================================================================
-- VALMAK · Schema Fase 8 (Validación calidad + Entrega)
-- Correr DESPUÉS de schema_fase7.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- Checklist de validación de calidad por proyecto
create table if not exists public.validacion_checklist (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  item         text not null,
  completado   boolean not null default false,
  orden        integer not null default 0,
  creado_en    timestamptz not null default now()
);
create index if not exists idx_valchk_proyecto on public.validacion_checklist (proyecto_id);

-- Registro de entrega por proyecto
create table if not exists public.entregas (
  id            uuid primary key default gen_random_uuid(),
  proyecto_id   uuid not null references public.proyectos(id) on delete cascade,
  fecha_entrega date not null default current_date,
  recibido_por  text,
  notas         text,
  firma_url     text,
  creado_por    uuid references auth.users(id),
  creado_en     timestamptz not null default now()
);
create index if not exists idx_entregas_proyecto on public.entregas (proyecto_id);

alter table public.validacion_checklist enable row level security;
alter table public.entregas enable row level security;

drop policy if exists valchk_all on public.validacion_checklist;
create policy valchk_all on public.validacion_checklist
  for all to authenticated using (true) with check (true);

drop policy if exists entregas_all on public.entregas;
create policy entregas_all on public.entregas
  for all to authenticated using (true) with check (true);
