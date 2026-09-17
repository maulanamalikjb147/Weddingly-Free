begin;

alter table public.data_tamu
  add column if not exists batch text not null default 'batch-1';

update public.data_tamu
set batch = 'batch-1'
where batch is null
   or batch not in ('batch-1', 'batch-2', 'batch-3');

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'data_tamu_batch_check'
  ) then
    alter table public.data_tamu
      add constraint data_tamu_batch_check
      check (batch in ('batch-1', 'batch-2', 'batch-3'));
  end if;
end $$;

alter table public.invitation_bulk_batches
  add column if not exists broadcast_batch text;

update public.invitation_bulk_batches
set broadcast_batch = null
where broadcast_batch is not null
  and broadcast_batch not in ('batch-1', 'batch-2', 'batch-3');

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invitation_bulk_batches_broadcast_batch_check'
  ) then
    alter table public.invitation_bulk_batches
      add constraint invitation_bulk_batches_broadcast_batch_check
      check (broadcast_batch is null or broadcast_batch in ('batch-1', 'batch-2', 'batch-3'));
  end if;
end $$;

create index if not exists data_tamu_broadcast_batch_idx
  on public.data_tamu (tamu_from, batch, invitation_status);

commit;
