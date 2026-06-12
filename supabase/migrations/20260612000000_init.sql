
create type public.org_type as enum ('school', 'nonprofit', 'business');
create type public.member_status as enum ('invited', 'active');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: users can read own profile"
  on public.profiles for select
  using (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 2 and 100),
  type       public.org_type not null,


  student_capacity    integer check (student_capacity > 0),
  registration_number text    check (char_length(btrim(registration_number)) >= 3),
  industry            text    check (char_length(btrim(industry)) >= 2),

  created_at timestamptz not null default now(),


  constraint organizations_type_details check (
    (type = 'school'    and student_capacity    is not null and registration_number is null and industry is null) or
    (type = 'nonprofit' and registration_number is not null and student_capacity    is null and industry is null) or
    (type = 'business'  and industry            is not null and student_capacity    is null and registration_number is null)
  ),

  
  constraint organizations_owner_name_unique unique (owner_id, name)
);

create index organizations_owner_id_idx on public.organizations (owner_id);

alter table public.organizations enable row level security;

create policy "organizations: owners can select"
  on public.organizations for select
  using (owner_id = (select auth.uid()));

create policy "organizations: owners can insert"
  on public.organizations for insert
  with check (owner_id = (select auth.uid()));

create policy "organizations: owners can update"
  on public.organizations for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "organizations: owners can delete"
  on public.organizations for delete
  using (owner_id = (select auth.uid()));


create table public.members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  status          public.member_status not null default 'invited',
  invited_by      uuid not null references public.profiles (id) on delete cascade,
  invited_at      timestamptz not null default now(),
  activated_at    timestamptz,

  
  constraint members_org_email_unique unique (organization_id, email)
);

create index members_organization_id_idx on public.members (organization_id);

alter table public.members enable row level security;


create policy "members: org owners can select"
  on public.members for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );



create policy "members: org owners can update"
  on public.members for update
  using (
    exists (
      select 1 from public.organizations o
      where o.id = members.organization_id
        and o.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );

create policy "members: org owners can delete"
  on public.members for delete
  using (
    exists (
      select 1 from public.organizations o
      where o.id = members.organization_id
        and o.owner_id = (select auth.uid())
    )
  );
