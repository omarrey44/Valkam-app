-- =====================================================================
-- VALMAK · Schema Fase 5 (Estado de cliente)
-- Correr DESPUÉS de schema_fase4.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

alter table public.clientes
  add column if not exists estado text not null default 'activo'
  check (estado in ('prospecto', 'activo', 'inactivo'));

create index if not exists idx_clientes_estado on public.clientes (estado);
