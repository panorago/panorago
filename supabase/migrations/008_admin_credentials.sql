-- Admin credentials metadata (password itself stays in Supabase Auth)
-- Safe after 007_realtime_publications.sql
--
-- Does NOT store password hashes or plaintext. Use Auth Admin API /
-- Dashboard to set passwords; this table tracks roster + password ops.

create table if not exists public.admin_credentials (
  -- FK to profiles (also auth.users via profiles.id) so PostgREST can embed.
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email text not null default '',
  is_active boolean not null default true,
  must_reset boolean not null default false,
  password_updated_at timestamptz,
  password_set_by uuid references public.profiles (id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_credentials is
  'Admin roster + password lifecycle metadata. Passwords live in Supabase Auth only.';

comment on column public.admin_credentials.password_updated_at is
  'When the password was last set via Command Center or Auth Admin API (not Auth login).';

create index if not exists admin_credentials_active_idx
  on public.admin_credentials (is_active)
  where is_active = true;

drop trigger if exists admin_credentials_set_updated_at on public.admin_credentials;
create trigger admin_credentials_set_updated_at
  before update on public.admin_credentials
  for each row execute function public.set_updated_at();

alter table public.admin_credentials enable row level security;

drop policy if exists "Admins manage admin_credentials" on public.admin_credentials;
create policy "Admins manage admin_credentials"
  on public.admin_credentials
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed from existing admin profiles (idempotent)
insert into public.admin_credentials (user_id, email, is_active)
select
  p.id,
  coalesce(nullif(trim(p.email), ''), ''),
  p.role = 'admin'
from public.profiles p
where p.role in ('admin', 'editor', 'viewer')
on conflict (user_id) do update
  set
    email = coalesce(nullif(trim(excluded.email), ''), public.admin_credentials.email),
    is_active = excluded.is_active,
    updated_at = now();
