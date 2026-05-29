-- =====================================================================
-- VALMAK · Schema Fase 7 (Inventario)
-- Correr DESPUÉS de schema_fase6.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

create table if not exists public.inventario (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  sku             text,
  categoria       text,
  descripcion     text,
  cantidad        numeric(12,2) not null default 0,
  unidad          text not null default 'pza',
  precio_unitario numeric(14,2) not null default 0,
  stock_minimo    numeric(12,2) not null default 0,
  ubicacion       text,
  creado_por      uuid references auth.users(id),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index if not exists idx_inv_nombre    on public.inventario (nombre);
create index if not exists idx_inv_categoria on public.inventario (categoria);

drop trigger if exists trg_inv_touch on public.inventario;
create trigger trg_inv_touch before update on public.inventario
  for each row execute function public.touch_actualizado_en();

alter table public.inventario enable row level security;
drop policy if exists inv_all on public.inventario;
create policy inv_all on public.inventario
  for all to authenticated using (true) with check (true);
