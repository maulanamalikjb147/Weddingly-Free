begin;

alter table public._siraman_data_tamu
  drop constraint if exists data_tamu_invitation_delivery_method_check;

alter table public._siraman_data_tamu
  add constraint data_tamu_invitation_delivery_method_check
  check (
    invitation_delivery_method is null
    or invitation_delivery_method in ('manual', 'openwa', 'openwa_bulk', 'baileys', 'baileys_bulk')
  );

commit;
