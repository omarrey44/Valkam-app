-- =====================================================================
-- VALMAK · Schema Fase 1 (Auth/Roles + Clientes + Cotizaciones)
-- Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES (extiende auth.users con rol)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  email       text,
  rol         text not null default 'vendedor'
              check (rol in ('vendedor','administrador','aprobador')),
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
  creado_por            uuid references auth.users(id),
  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

create index if not exists idx_clientes_empresa     on public.clientes (empresa);
create index if not exists idx_clientes_ingeniero   on public.clientes (ingeniero);
create index if not exists idx_clientes_solicitante on public.clientes (solicitante);

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

-- PROFILES: todos los autenticados leen (para mostrar nombres); cada quien edita el suyo
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid());

-- CLIENTES: todos los autenticados ven y gestionan (base compartida)
drop policy if exists clientes_all on public.clientes;
create policy clientes_all on public.clientes
  for all to authenticated using (true) with check (true);

-- COTIZACIONES:
--  - vendedor: ve y crea las suyas
--  - administrador/aprobador: ven todo, editan todo
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

-- REVISIONS: visibles/insertables si el usuario puede ver la cotización padre
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
