-- Allow public verify lookup by customer number OR booking reference.
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
declare
  code text := upper(trim(p_customer_number));
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
  where upper(b.customer_number) = code
     or upper(b.booking_reference) = code
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
  code text := upper(trim(p_customer_number));
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
  where upper(customer_number) = code
     or upper(booking_reference) = code
  returning verified_at into ts;

  return ts;
end;
$$;

grant execute on function public.mark_booking_verified(text) to anon, authenticated, service_role;
