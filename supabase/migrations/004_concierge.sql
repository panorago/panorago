-- Concierge booking refinements (safe after 003_bookings.sql)
-- Run before 005_command_center.sql
-- Customer name split, sequential REF-######, verify RPC, storage, optional video_url

-- ---------------------------------------------------------------------------
-- Bookings: name split + support contact snapshot
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists customer_first_name text;

alter table public.bookings
  add column if not exists customer_surname text;

alter table public.bookings
  add column if not exists verified_at timestamptz;

comment on column public.bookings.customer_first_name is
  'Guest given name collected on enquire form.';

comment on column public.bookings.customer_surname is
  'Guest family name collected on enquire form.';

comment on column public.bookings.verified_at is
  'Set when /verify/{customerNumber} is opened successfully.';

-- Backfill name parts from customer_name where missing
update public.bookings
set
  customer_first_name = coalesce(
    customer_first_name,
    nullif(split_part(customer_name, ' ', 1), '')
  ),
  customer_surname = coalesce(
    customer_surname,
    nullif(trim(substring(customer_name from position(' ' in customer_name))), '')
  )
where customer_first_name is null or customer_surname is null;

-- ---------------------------------------------------------------------------
-- Sequential booking references: REF-000127
-- ---------------------------------------------------------------------------
create sequence if not exists public.booking_reference_seq
  as bigint
  start with 127
  increment by 1
  minvalue 1
  no maxvalue
  cache 1;

create or replace function public.next_booking_reference()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.booking_reference_seq');
  return 'REF-' || lpad(n::text, 6, '0');
end;
$$;

grant execute on function public.next_booking_reference() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Public verify lookup (limited exposure by exact customer number)
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_by_customer_number(p_customer_number text)
returns table (
  id uuid,
  booking_reference text,
  customer_number text,
  customer_name text,
  customer_first_name text,
  customer_surname text,
  venue_name text,
  venue_address text,
  preferred_date text,
  adults integer,
  children integer,
  occasion text,
  status text,
  created_at timestamptz,
  verified_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id,
    b.booking_reference,
    b.customer_number,
    b.customer_name,
    b.customer_first_name,
    b.customer_surname,
    b.venue_name,
    b.venue_address,
    b.preferred_date,
    b.adults,
    b.children,
    b.occasion,
    b.status,
    b.created_at,
    b.verified_at
  from public.bookings b
  where upper(b.customer_number) = upper(trim(p_customer_number))
  limit 1;
end;
$$;

grant execute on function public.get_booking_by_customer_number(text) to anon, authenticated, service_role;

create or replace function public.mark_booking_verified(p_customer_number text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz;
begin
  update public.bookings
  set
    verified_at = coalesce(verified_at, now()),
    updated_at = now(),
    history = coalesce(history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'at', now(),
        'event', 'verified',
        'status', status
      )
    )
  where upper(customer_number) = upper(trim(p_customer_number))
  returning verified_at into ts;

  return ts;
end;
$$;

grant execute on function public.mark_booking_verified(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Optional venue video URL
-- ---------------------------------------------------------------------------
alter table public.places
  add column if not exists video_url text;

comment on column public.places.video_url is
  'Optional venue video (mp4 or embeddable URL) shown below the hero.';

-- ---------------------------------------------------------------------------
-- Storage bucket for QR / ticket assets (idempotent)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('booking-assets', 'booking-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public read booking assets" on storage.objects;
create policy "Public read booking assets"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'booking-assets');

drop policy if exists "Service upload booking assets" on storage.objects;
create policy "Service upload booking assets"
  on storage.objects for insert
  to authenticated, service_role
  with check (bucket_id = 'booking-assets');

drop policy if exists "Service update booking assets" on storage.objects;
create policy "Service update booking assets"
  on storage.objects for update
  to authenticated, service_role
  using (bucket_id = 'booking-assets')
  with check (bucket_id = 'booking-assets');
