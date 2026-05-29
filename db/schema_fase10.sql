-- =====================================================================
-- VALMAK · Schema Fase 10 (Historial de actividad)
-- Correr DESPUÉS de schema_fase9.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

create table if not exists public.actividad_log (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid references auth.users(id) on delete set null,
  accion      text not null,        -- 'creó' | 'editó' | 'eliminó'
  modulo      text not null,        -- 'cotizacion' | 'cliente' | 'proyecto' | etc.
  registro_id text,
  descripcion text not null,
  creado_en   timestamptz not null default now()
);

create index if not exists idx_actlog_usuario on public.actividad_log (usuario_id);
create index if not exists idx_actlog_modulo  on public.actividad_log (modulo);
create index if not exists idx_actlog_cuando  on public.actividad_log (creado_en desc);

alter table public.actividad_log enable row level security;

-- Vendedores ven sus propios logs; administradores ven todo
drop policy if exists actlog_select on public.actividad_log;
create policy actlog_select on public.actividad_log
  for select to authenticated
  using (usuario_id = auth.uid() or public.auth_rol() = 'administrador');

drop policy if exists actlog_insert on public.actividad_log;
create policy actlog_insert on public.actividad_log
  for insert to authenticated
  with check (usuario_id = auth.uid());
