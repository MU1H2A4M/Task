alter table public.members
  add column role text not null default 'member'
    check (role in ('admin', 'member')),
  add column user_id uuid references auth.users (id) on delete set null,
  add column invite_token uuid not null default gen_random_uuid();


alter table public.members
  add constraint members_invite_token_unique unique (invite_token);

create index members_user_id_idx on public.members (user_id);


alter table public.members
  add constraint members_status_user_link check (
    (status = 'invited' and user_id is null)
    or status = 'active'
  );
