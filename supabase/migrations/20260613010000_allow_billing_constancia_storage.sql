-- Permite subir y leer constancias fiscales en el bucket privado documents.
-- Acepta tanto rutas con auth.uid() como rutas con app_users.id para tolerar
-- instalaciones que ya usen cualquiera de los dos formatos.

drop policy if exists documents_storage_insert_billing_constancia on storage.objects;
drop policy if exists documents_storage_select_billing_constancia on storage.objects;
drop policy if exists documents_storage_delete_billing_constancia on storage.objects;

create policy documents_storage_insert_billing_constancia
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[3] in ('constancia-fiscal', 'comprobante')
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

create policy documents_storage_select_billing_constancia
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[3] in ('constancia-fiscal', 'comprobante')
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

create policy documents_storage_delete_billing_constancia
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[3] in ('constancia-fiscal', 'comprobante')
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
