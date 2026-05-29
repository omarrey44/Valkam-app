-- =====================================================================
-- VALMAK · Schema Fase 6 (Partidas/líneas de cotización)
-- Correr DESPUÉS de schema_fase5.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

create table if not exists public.cotizacion_items (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones(id) on delete cascade,
  descripcion     text not null,
  cantidad        numeric(12,2) not null default 1,
  precio_unitario numeric(14,2) not null default 0,
  orden           integer not null default 0,
  creado_en       timestamptz not null default now()
);

create index if not exists idx_items_cotizacion on public.cotizacion_items (cotizacion_id);

alter table public.cotizacion_items enable row level security;

drop policy if exists items_all on public.cotizacion_items;
create policy items_all on public.cotizacion_items
  for all to authenticated using (true) with check (true);
