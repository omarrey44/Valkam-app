-- =====================================================================
-- VALMAK · Schema Fase 2 (PO / Proyectos / Tareas)
-- Correr DESPUÉS de schema.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ÓRDENES DE COMPRA (PO)
-- ---------------------------------------------------------------------
create table if not exists public.ordenes_compra (
  id                     uuid primary key default gen_random_uuid(),
  cotizacion_id          uuid not null references public.cotizaciones(id),
  numero_po              text unique,
  cliente_id             uuid references public.clientes(id),
  monto_po               numeric(14,2) not null default 0,
  moneda                 text not null default 'MXN' check (moneda in ('MXN','USD','EUR')),
  fecha_recepcion        date not null default current_date,
  terminos_pago          text,
  fecha_entrega_esperada date,
  estado                 text not null default 'recibida'
                         check (estado in ('recibida','en_proceso','completada','cancelada')),
  generada_por           uuid references auth.users(id),
  archivo_adjunto        text,
  creado_en              timestamptz not null default now(),
  actualizado_en         timestamptz not null default now()
);

create index if not exists idx_po_cotizacion on public.ordenes_compra (cotizacion_id);
create index if not exists idx_po_cliente    on public.ordenes_compra (cliente_id);
create index if not exists idx_po_estado     on public.ordenes_compra (estado);

-- Numeración automática PO-001, PO-002...
create sequence if not exists public.po_seq;

create or replace function public.set_numero_po()
returns trigger language plpgsql as $$
begin
  if new.numero_po is null or new.numero_po = '' then
    new.numero_po := 'PO-' || lpad(nextval('public.po_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_po_numero on public.ordenes_compra;
create trigger trg_po_numero before insert on public.ordenes_compra
  for each row execute function public.set_numero_po();

-- ---------------------------------------------------------------------
-- 2. PROYECTOS
-- ---------------------------------------------------------------------
create table if not exists public.proyectos (
  id                 uuid primary key default gen_random_uuid(),
  po_id              uuid not null references public.ordenes_compra(id),
  cotizacion_id      uuid references public.cotizaciones(id),
  cliente_id         uuid references public.clientes(id),
  nombre_proyecto    text,
  descripcion        text,
  fecha_inicio       date,
  fecha_fin_estimada date,
  fecha_fin_real     date,
  estado             text not null default 'programado'
                     check (estado in ('programado','en_proceso','validacion','completado','cancelado')),
  responsable        uuid references auth.users(id),
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

create index if not exists idx_proy_po          on public.proyectos (po_id);
create index if not exists idx_proy_estado      on public.proyectos (estado);
create index if not exists idx_proy_responsable on public.proyectos (responsable);

-- ---------------------------------------------------------------------
-- 3. TAREAS
-- ---------------------------------------------------------------------
create table if not exists public.tareas (
  id                 uuid primary key default gen_random_uuid(),
  proyecto_id        uuid not null references public.proyectos(id) on delete cascade,
  titulo             text not null,
  descripcion        text,
  estado             text not null default 'pendiente'
                     check (estado in ('pendiente','en_progreso','completada','cancelada')),
  prioridad          text not null default 'media'
                     check (prioridad in ('baja','media','alta','urgente')),
  asignado_a         uuid references auth.users(id),
  fecha_vencimiento  date,
  fecha_completada   date,
  creado_por         uuid references auth.users(id),
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

create index if not exists idx_tareas_proyecto on public.tareas (proyecto_id);
create index if not exists idx_tareas_asignado on public.tareas (asignado_a);
create index if not exists idx_tareas_estado   on public.tareas (estado);

-- ---------------------------------------------------------------------
-- 4. Trigger actualizado_en (reusa función de fase 1)
-- ---------------------------------------------------------------------
create or replace function public.touch_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_po_touch on public.ordenes_compra;
create trigger trg_po_touch before update on public.ordenes_compra
  for each row execute function public.touch_actualizado_en();

drop trigger if exists trg_proy_touch on public.proyectos;
create trigger trg_proy_touch before update on public.proyectos
  for each row execute function public.touch_actualizado_en();

drop trigger if exists trg_tareas_touch on public.tareas;
create trigger trg_tareas_touch before update on public.tareas
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------
-- 5. Auto-crear PO al aprobar cotización
--    (cumple "al aceptar cotización mover automáticamente a PO")
-- ---------------------------------------------------------------------
create or replace function public.auto_po_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'aprobada' and (old.estado is distinct from 'aprobada') then
    if not exists (select 1 from public.ordenes_compra where cotizacion_id = new.id) then
      insert into public.ordenes_compra
        (cotizacion_id, cliente_id, monto_po, moneda, fecha_recepcion, terminos_pago, generada_por, estado)
      values
        (new.id, new.cliente_id, new.monto, new.moneda, current_date, new.terminos_pago, new.aprobado_por, 'recibida');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_po on public.cotizaciones;
create trigger trg_auto_po after update on public.cotizaciones
  for each row execute function public.auto_po_on_approval();

-- ---------------------------------------------------------------------
-- 6. RLS — app interna: todo autenticado lee/escribe
-- ---------------------------------------------------------------------
alter table public.ordenes_compra enable row level security;
alter table public.proyectos      enable row level security;
alter table public.tareas         enable row level security;

drop policy if exists po_all on public.ordenes_compra;
create policy po_all on public.ordenes_compra
  for all to authenticated using (true) with check (true);

drop policy if exists proy_all on public.proyectos;
create policy proy_all on public.proyectos
  for all to authenticated using (true) with check (true);

drop policy if exists tareas_all on public.tareas;
create policy tareas_all on public.tareas
  for all to authenticated using (true) with check (true);
