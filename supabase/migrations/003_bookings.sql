-- Bookings (concierge enquiries with customer numbers, QR, tickets)
-- Safe to run after 002_mvp_gaps.sql

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_number text not null unique,
  customer_name text not null,
  email text,
  phone text,
  venue_id uuid references public.places (id) on delete set null,
  venue_name text not null,
  venue_address text,
  preferred_date text,
  adults integer not null default 1 check (adults >= 0 and adults <= 99),
  children integer not null default 0 check (children >= 0 and children <= 99),
  occasion text,
  budget text,
  special_request text,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'unavailable', 'cancelled', 'completed')
  ),
  qr_code_url text,
  ticket_pdf_url text,
  qr_payload jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

create index if not exists bookings_status_idx
  on public.bookings (status);

create index if not exists bookings_venue_id_idx
  on public.bookings (venue_id);

create index if not exists bookings_customer_number_idx
  on public.bookings (customer_number);

alter table public.bookings enable row level security;

drop policy if exists "Public can insert bookings" on public.bookings;
create policy "Public can insert bookings"
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings"
  on public.bookings
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
  on public.bookings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Storage bucket for QR codes / tickets (create in dashboard if missing)
-- insert into storage.buckets (id, name, public) values ('booking-assets', 'booking-assets', true)
-- on conflict do nothing;
