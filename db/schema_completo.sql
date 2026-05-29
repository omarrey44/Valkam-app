-- =====================================================================
-- VALMAK · SCHEMA COMPLETO (Fase 1 + Fase 2)
-- Pegar TODO en Supabase > SQL Editor > Run. Idempotente (re-ejecutable).
-- Equivale a correr schema.sql + schema_fase2.sql en orden.
-- =====================================================================


-- #####################################################################
-- ###  FASE 1 · Auth/Roles + Clientes + Cotizaciones                ###
-- #####################################################################

-- ---------------------------------------------------------------------
-- 1. PROFILES (extiende auth.users con rol)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  email       text,
  rol         text not null default 'vendedor'
              check (rol in ('vendedor','administrador','aprobador')),
  push_token  text,
  creado_en   timestamptz not null default now()
);

-- Crear profile automáticamente al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    coalesce(new.raw_user_meta_data->>'rol', 'vendedor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: rol del usuario actual (security definer evita recursión RLS)
create or replace function public.auth_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- SEGURIDAD: solo un administrador puede cambiar la columna 'rol'
-- (impide que un usuario se auto-escale a administrador vía API)
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
-- 2. CLIENTES
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id                    uuid primary key default gen_random_uuid(),
  empresa               text not null,
  ingeniero             text,
  solicitante           text,
  nombre_proyecto       text,
  descripcion_proyecto  text,
  correo_principal      text not null,
  correos_adicionales   text,
  telefono              text,
  direccion             text,
  estado                text not null default 'activo'
                        check (estado in ('prospecto','activo','inactivo')),
  creado_por            uuid references auth.users(id),
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

create index if not exists idx_clientes_empresa     on public.clientes (empresa);
create index if not exists idx_clientes_ingeniero   on public.clientes (ingeniero);
create index if not exists idx_clientes_solicitante on public.clientes (solicitante);
create index if not exists idx_clientes_estado      on public.clientes (estado);

-- ---------------------------------------------------------------------
-- 3. COTIZACIONES
-- ---------------------------------------------------------------------
create table if not exists public.cotizaciones (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null references public.clientes(id),
  titulo            text not null,
  descripcion       text not null,
  monto             numeric(14,2) not null default 0,
  moneda            text not null default 'MXN' check (moneda in ('MXN','USD','EUR')),
  terminos_pago     text,
  tiempo_entrega    text,
  detalles_tecnicos text,
  precio_unitario   numeric(14,2),
  cantidad          integer,
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente','borrador','enviada','aprobada','rechazada','modificada')),
  revision_current  text not null default 'A',
  autorizacion      boolean not null default false,
  cotizado_por      uuid not null references auth.users(id),
  revisado_por      uuid references auth.users(id),
  aprobado_por      uuid references auth.users(id),
  fecha_cotizacion  date not null default current_date,
  fecha_envio       date,
  fecha_aprobacion  date,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

create index if not exists idx_cotiz_cliente  on public.cotizaciones (cliente_id);
create index if not exists idx_cotiz_estado   on public.cotizaciones (estado);
create index if not exists idx_cotiz_cotizado on public.cotizaciones (cotizado_por);

-- ---------------------------------------------------------------------
-- 4. COTIZACIONES_REVISIONS (historial)
-- ---------------------------------------------------------------------
create table if not exists public.cotizaciones_revisions (
  id              uuid primary key default gen_random_uuid(),
  cotizacion_id   uuid not null references public.cotizaciones(id) on delete cascade,
  revision        text not null,
  cambio_descrito text,
  creado_por      uuid references auth.users(id),
  creado_en       timestamptz not null default now(),
  snapshot_data   jsonb
);

create index if not exists idx_revs_cotiz on public.cotizaciones_revisions (cotizacion_id);

-- Partidas / líneas de cotización
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

-- ---------------------------------------------------------------------
-- 5. Trigger actualizado_en
-- ---------------------------------------------------------------------
create or replace function public.touch_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_clientes_touch on public.clientes;
create trigger trg_clientes_touch before update on public.clientes
  for each row execute function public.touch_actualizado_en();

drop trigger if exists trg_cotiz_touch on public.cotizaciones;
create trigger trg_cotiz_touch before update on public.cotizaciones
  for each row execute function public.touch_actualizado_en();

-- ---------------------------------------------------------------------
-- 6. RLS (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.clientes               enable row level security;
alter table public.cotizaciones           enable row level security;
alter table public.cotizaciones_revisions enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.auth_rol() = 'administrador');

drop policy if exists clientes_all on public.clientes;
create policy clientes_all on public.clientes
  for all to authenticated using (true) with check (true);

drop policy if exists cotiz_select on public.cotizaciones;
create policy cotiz_select on public.cotizaciones
  for select to authenticated
  using (cotizado_por = auth.uid() or public.auth_rol() in ('administrador','aprobador'));

drop policy if exists cotiz_insert on public.cotizaciones;
create policy cotiz_insert on public.cotizaciones
  for insert to authenticated
  with check (cotizado_por = auth.uid() or public.auth_rol() in ('administrador','aprobador'));

drop policy if exists cotiz_update on public.cotizaciones;
create policy cotiz_update on public.cotizaciones
  for update to authenticated
  using (cotizado_por = auth.uid() or public.auth_rol() in ('administrador','aprobador'));

drop policy if exists revs_select on public.cotizaciones_revisions;
create policy revs_select on public.cotizaciones_revisions
  for select to authenticated
  using (exists (
    select 1 from public.cotizaciones c
    where c.id = cotizacion_id
      and (c.cotizado_por = auth.uid() or public.auth_rol() in ('administrador','aprobador'))
  ));

drop policy if exists revs_insert on public.cotizaciones_revisions;
create policy revs_insert on public.cotizaciones_revisions
  for insert to authenticated with check (true);

alter table public.cotizacion_items enable row level security;
drop policy if exists items_all on public.cotizacion_items;
create policy items_all on public.cotizacion_items
  for all to authenticated using (true) with check (true);


-- #####################################################################
-- ###  FASE 2 · PO / Proyectos / Tareas                             ###
-- #####################################################################

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
-- 4. Triggers actualizado_en (PO/Proyectos/Tareas)
-- ---------------------------------------------------------------------
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
-- 6. RLS Fase 2 — app interna: todo autenticado lee/escribe
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


-- #####################################################################
-- ###  FASE 3 · Facturación + Dashboard productividad               ###
-- #####################################################################

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
-- 3. RPC métricas por vendedor (Dashboard)
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

-- ---------------------------------------------------------------------
-- INVENTARIO (Fase 7)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- VALIDACIÓN + ENTREGA (Fase 8)
-- ---------------------------------------------------------------------
create table if not exists public.validacion_checklist (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  item         text not null,
  completado   boolean not null default false,
  orden        integer not null default 0,
  creado_en    timestamptz not null default now()
);
create index if not exists idx_valchk_proyecto on public.validacion_checklist (proyecto_id);

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
create policy valchk_all on public.validacion_checklist for all to authenticated using (true) with check (true);
drop policy if exists entregas_all on public.entregas;
create policy entregas_all on public.entregas for all to authenticated using (true) with check (true);

-- =====================================================================
-- FIN. Siguiente paso: crea usuarios en Authentication > Users,
-- luego corre db/seed.sql para asignar el primer ADMINISTRADOR.
-- =====================================================================
