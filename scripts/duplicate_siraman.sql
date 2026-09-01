begin;

do $$
declare
  source_tables text[] := array[
    'config_tamu_dari',
    'data_tamu',
    'invitation_bulk_batch_items',
    'invitation_bulk_batches',
    'invitation_message_templates',
    'rsvps',
    'wedding_cms_assets',
    'wedding_cms_settings'
  ];
  source_table text;
  target_table text;
  identity_column record;
  max_identity_value bigint;
  grant_row record;
  policy_row record;
  fk_row record;
  fk_definition text;
  referenced_table text;
  policy_roles text;
  policy_sql text;
begin
  foreach source_table in array source_tables loop
    target_table := '_siraman_' || source_table;

    if to_regclass(format('public.%I', target_table)) is not null then
      raise exception 'Target table public.% already exists', target_table;
    end if;

    execute format(
      'create table public.%I (like public.%I including all)',
      target_table,
      source_table
    );

    execute format(
      'insert into public.%I overriding system value select * from public.%I',
      target_table,
      source_table
    );

    for identity_column in
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = source_table
        and identity_generation is not null
    loop
      execute format(
        'select max(%I)::bigint from public.%I',
        identity_column.column_name,
        target_table
      )
      into max_identity_value;

      if max_identity_value is not null then
        execute format(
          'select setval(pg_get_serial_sequence(%L, %L), %s, true)',
          'public.' || target_table,
          identity_column.column_name,
          max_identity_value
        );
      end if;
    end loop;

    for grant_row in
      select grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = source_table
        and grantee in ('anon', 'authenticated', 'service_role')
      group by grantee
    loop
      execute format(
        'grant %s on table public.%I to %I',
        grant_row.privileges,
        target_table,
        grant_row.grantee
      );
    end loop;

    execute format('alter table public.%I enable row level security', target_table);

    for policy_row in
      select policyname, permissive, roles, cmd, qual, with_check
      from pg_policies
      where schemaname = 'public'
        and tablename = source_table
    loop
      select string_agg(format('%I', role_name), ', ' order by role_name)
      into policy_roles
      from unnest(policy_row.roles) as role_name;

      policy_sql := format(
        'create policy %I on public.%I as %s for %s to %s',
        left('_siraman_' || policy_row.policyname, 63),
        target_table,
        policy_row.permissive,
        policy_row.cmd,
        policy_roles
      );

      if policy_row.qual is not null then
        policy_sql := policy_sql || ' using (' || policy_row.qual || ')';
      end if;

      if policy_row.with_check is not null then
        policy_sql := policy_sql || ' with check (' || policy_row.with_check || ')';
      end if;

      execute policy_sql;
    end loop;
  end loop;

  for fk_row in
    select c.conrelid::regclass::text as table_name, c.conname, pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where n.nspname = 'public'
      and c.contype = 'f'
      and c.conrelid::regclass::text = any(source_tables)
    order by c.conrelid::regclass::text, c.conname
  loop
    fk_definition := fk_row.definition;

    foreach referenced_table in array source_tables loop
      fk_definition := replace(
        fk_definition,
        'REFERENCES ' || referenced_table || '(',
        'REFERENCES _siraman_' || referenced_table || '('
      );
      fk_definition := replace(
        fk_definition,
        'REFERENCES public.' || referenced_table || '(',
        'REFERENCES public._siraman_' || referenced_table || '('
      );
    end loop;

    execute format(
      'alter table public.%I add constraint %I %s',
      '_siraman_' || fk_row.table_name,
      left('_siraman_' || fk_row.conname, 63),
      fk_definition
    );
  end loop;

  execute 'create trigger _siraman_set_wedding_invitation_slug_trigger before insert on public._siraman_data_tamu for each row execute function set_wedding_invitation_slug()';
end $$;

commit;
