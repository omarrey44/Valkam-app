-- =====================================================================
-- VALMAK · Schema Fase 3 (Facturación + Dashboard productividad)
-- Correr DESPUÉS de schema_fase2.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. FACTURAS
-- ---------------------------------------------------------------------
create table if not exists public.facturas (
  id                uuid primary key default gen_random_uuid(),
  proyecto_id       uuid not null references public.proyectos(id),
  po_id             uuid references public.ordenes_compra(id),
  cotizacion_id     uuid references public.cotizaciones(id),
  numero_factura    text unique,
  monto             numeric(14,2) not null default 0,
  moneda            text not null default 'MXN' check (moneda in ('MXN','USD','EUR')),
  terminos_pago     text,
  fecha_emision     date not null default current_date,
  fecha_vencimiento date,
  fecha_pago        date,
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente','pagada','vencida','cancelada')),
  creado_por        uuid references auth.users(id),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index if not exists idx_fact_proyecto on public.facturas (proyecto_id);
create index if not exists idx_fact_estado   on public.facturas (estado);

-- Numeración automática F-001, F-002...
create sequence if not exists public.factura_seq;

create or replace function public.set_numero_factura()
returns trigger language plpgsql as $$
begin
  if new.numero_factura is null or new.numero_factura = '' then
    new.numero_factura := 'F-' || lpad(nextval('public.factura_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fact_numero on public.facturas;
create trigger trg_fact_numero before insert on public.facturas
  for each row execute function public.set_numero_factura();

drop trigger if exists trg_fact_touch on public.facturas;
create trigger trg_fact_touch before update on public.facturas
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------
-- 2. RLS facturas — lectura todos; escritura administrador/aprobador
-- ---------------------------------------------------------------------
alter table public.facturas enable row level security;

drop policy if exists fact_select on public.facturas;
create policy fact_select on public.facturas
  for select to authenticated using (true);

drop policy if exists fact_insert on public.facturas;
create policy fact_insert on public.facturas
  for insert to authenticated
  with check (public.auth_rol() in ('administrador','aprobador'));

drop policy if exists fact_update on public.facturas;
create policy fact_update on public.facturas
  for update to authenticated
  using (public.auth_rol() in ('administrador','aprobador'));

drop policy if exists fact_delete on public.facturas;
create policy fact_delete on public.facturas
  for delete to authenticated
  using (public.auth_rol() in ('administrador','aprobador'));

-- ---------------------------------------------------------------------
-- 3. RPC métricas por vendedor (Dashboard de productividad)
--    Filtros opcionales por rango de fecha de cotización.
-- ---------------------------------------------------------------------
create or replace function public.metricas_vendedor(
  desde date default null,
  hasta date default null
)
returns table (
  vendedor_id             uuid,
  nombre                  text,
  email                   text,
  cotizaciones_realizadas bigint,
  monto_total_cotizado    numeric,
  cotizaciones_aprobadas  bigint,
  tasa_aprobacion         numeric,
  po_generadas            bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.nombre,
    p.email,
    count(c.id) as cotizaciones_realizadas,
    coalesce(sum(c.monto), 0) as monto_total_cotizado,
    count(c.id) filter (where c.estado = 'aprobada') as cotizaciones_aprobadas,
    case when count(c.id) = 0 then 0
         else round(count(c.id) filter (where c.estado = 'aprobada')::numeric / count(c.id) * 100, 1)
    end as tasa_aprobacion,
    (
      select count(*)
      from public.ordenes_compra o
      join public.cotizaciones c2 on c2.id = o.cotizacion_id
      where c2.cotizado_por = p.id
        and (desde is null or c2.fecha_cotizacion >= desde)
        and (hasta is null or c2.fecha_cotizacion <= hasta)
    ) as po_generadas
  from public.profiles p
  left join public.cotizaciones c
    on c.cotizado_por = p.id
    and (desde is null or c.fecha_cotizacion >= desde)
    and (hasta is null or c.fecha_cotizacion <= hasta)
  group by p.id, p.nombre, p.email
  order by cotizaciones_realizadas desc;
$$;

grant execute on function public.metricas_vendedor(date, date) to authenticated;
