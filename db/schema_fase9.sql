-- =====================================================================
-- VALMAK · Schema Fase 9 (Avatares y logos)
-- Correr DESPUÉS de schema_fase8.sql. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

-- Columnas de imagen
alter table public.profiles add column if not exists avatar_url text;
alter table public.clientes  add column if not exists logo_url   text;

-- Buckets públicos de Storage
insert into storage.buckets (id, name, public)
values
  ('avatars',     'avatars',     true),
  ('logos',       'logos',       true),
  ('firmas',      'firmas',      true),
  ('documentos',  'documentos',  true)
on conflict (id) do nothing;

drop policy if exists "documentos_select" on storage.objects;
create policy "documentos_select" on storage.objects
  for select using (bucket_id = 'documentos');

drop policy if exists "documentos_insert" on storage.objects;
create policy "documentos_insert" on storage.objects
  for insert with check (bucket_id = 'documentos' and auth.role() = 'authenticated');

drop policy if exists "documentos_update" on storage.objects;
create policy "documentos_update" on storage.objects
  for update using (bucket_id = 'documentos' and auth.role() = 'authenticated');

drop policy if exists "documentos_delete" on storage.objects;
create policy "documentos_delete" on storage.objects
  for delete using (bucket_id = 'documentos' and auth.role() = 'authenticated');

drop policy if exists "firmas_select" on storage.objects;
create policy "firmas_select" on storage.objects
  for select using (bucket_id = 'firmas');

drop policy if exists "firmas_insert" on storage.objects;
create policy "firmas_insert" on storage.objects
  for insert with check (bucket_id = 'firmas' and auth.role() = 'authenticated');

drop policy if exists "firmas_update" on storage.objects;
create policy "firmas_update" on storage.objects
  for update using (bucket_id = 'firmas' and auth.role() = 'authenticated');

drop policy if exists "firmas_delete" on storage.objects;
create policy "firmas_delete" on storage.objects
  for delete using (bucket_id = 'firmas' and auth.role() = 'authenticated');

-- Políticas de Storage: avatars
drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Políticas de Storage: logos
drop policy if exists "logos_select" on storage.objects;
create policy "logos_select" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_insert" on storage.objects;
create policy "logos_insert" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_update" on storage.objects;
create policy "logos_update" on storage.objects
  for update using (bucket_id = 'logos' and auth.role() = 'authenticated');

drop policy if exists "logos_delete" on storage.objects;
create policy "logos_delete" on storage.objects
  for delete using (bucket_id = 'logos' and auth.role() = 'authenticated');
