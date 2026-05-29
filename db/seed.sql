-- =====================================================================
-- VALMAK · SEED (post-setup)
-- Correr DESPUÉS de crear usuarios en Authentication > Users.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Asignar rol ADMINISTRADOR al primer usuario
--    Reemplaza el correo por el real.
-- ---------------------------------------------------------------------
update public.profiles
set rol = 'administrador'
where email = 'admin@valmak.com';

-- Ejemplos de otros roles:
-- update public.profiles set rol = 'aprobador' where email = 'jefe@valmak.com';
-- update public.profiles set rol = 'vendedor'  where email = 'ventas@valmak.com';

-- Ver usuarios y roles actuales:
-- select email, nombre, rol from public.profiles order by creado_en;


-- ---------------------------------------------------------------------
-- 2. (OPCIONAL) Cliente de prueba
--    creado_por queda null (no obligatorio).
-- ---------------------------------------------------------------------
insert into public.clientes (empresa, ingeniero, solicitante, nombre_proyecto, correo_principal, telefono)
values
  ('Industrias Demo SA de CV', 'Ing. Pérez', 'Compras', 'Línea de ensamble', 'compras@demo.com', '614-000-0000')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 3. (OPCIONAL) Cotización de prueba ligada al cliente demo
--    Requiere un usuario en cotizado_por: usa el id de un usuario real.
--    Descomenta y reemplaza '<UUID_USUARIO>' (lo ves en Authentication > Users).
-- ---------------------------------------------------------------------
-- insert into public.cotizaciones (cliente_id, titulo, descripcion, monto, moneda, cotizado_por)
-- select c.id, 'Cotización demo', 'Sistema de automatización demo', 150000, 'MXN', '<UUID_USUARIO>'
-- from public.clientes c
-- where c.empresa = 'Industrias Demo SA de CV'
-- limit 1;
