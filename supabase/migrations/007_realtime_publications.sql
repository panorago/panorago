-- Realtime publications for Command Center live toasts
-- Safe after 006_security_guards.sql

do $$
begin
  begin
    alter publication supabase_realtime add table public.bookings;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.place_submissions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
