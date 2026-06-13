-- Permite subir, leer y reemplazar foto de perfil en el bucket privado documents.
-- Se aceptan rutas user/<auth.uid()>/foto_perfil/* y user/<app_users.id>/foto_perfil/*.

drop policy if exists documents_storage_insert_profile_avatar on storage.objects;
drop policy if exists documents_storage_select_profile_avatar on storage.objects;
drop policy if exists documents_storage_delete_profile_avatar on storage.objects;

create policy documents_storage_insert_profile_avatar
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[3] = 'foto_perfil'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or exists (
        select 1
        from public.app_users u
        where u.id::text = (storage.foldername(name))[2]
          and u.auth_id = auth.uid()
      )
    )
  );

create policy documents_storage_select_profile_avatar
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[3] = 'foto_perfil'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or exists (
        select 1
        from public.app_users u
        where u.id::text = (storage.foldername(name))[2]
          and u.auth_id = auth.uid()
      )
    )
  );

create policy documents_storage_delete_profile_avatar
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[3] = 'foto_perfil'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or exists (
        select 1
        from public.app_users u
        where u.id::text = (storage.foldername(name))[2]
          and u.auth_id = auth.uid()
      )
    )
  );
