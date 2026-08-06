# Panora Command Center

Internal admin OS at `/admin`. Requires Supabase Auth + `profiles.role = 'admin'`.

## Migrations to run (Supabase SQL editor)

Run in order (do not skip):

1. `supabase/migrations/001_panora_go.sql` — core schema + seed places
2. `supabase/migrations/002_mvp_gaps.sql` — MVP gap fills
3. `supabase/migrations/003_bookings.sql` — bookings / enquiries base
4. `supabase/migrations/004_concierge.sql` — concierge name split, REF sequence, verify RPCs, `places.video_url`, `booking-assets` bucket
5. `supabase/migrations/005_command_center.sql` — Command Center tables/columns (`secret_collections`, submissions, settings, media, audit, analytics, paid/featured flags)
6. `supabase/migrations/006_security_guards.sql` — durable `submission_tokens` + `rate_limit_hits`
7. `supabase/migrations/007_realtime_publications.sql` — Realtime for bookings + place_submissions (Command Center toasts)

## Storage buckets (Dashboard → Storage)

- `booking-assets` (public) — QR codes & ticket PDFs (also created by `004_concierge.sql`)
- `media` (public) — media library assets (also created by `005_command_center.sql`)
- `place-images` (public) — place hero/gallery uploads if used by earlier migrations

If SQL `insert into storage.buckets` fails (permissions), create the buckets manually in the dashboard.

## Env vars

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Ticket/QR uploads; never expose |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Browser Maps key only |
| `NEXT_PUBLIC_PANORA_WHATSAPP` | Client | Concierge WhatsApp |
| `NEXT_PUBLIC_PANORA_EMAIL` | Client | Concierge email |
| `NEXT_PUBLIC_PANORA_PHONE` | Client | Optional |
| `NEXT_PUBLIC_SITE_URL` | Server | Absolute URLs |
| `RESEND_API_KEY` | Server | Optional ESP — without it, mailto/wa.me |

## First admin user

1. Create Auth user in Supabase
2. Insert: `insert into profiles (id, role, email, display_name) values ('<auth-user-uuid>', 'admin', 'you@…', 'You');`
