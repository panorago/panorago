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
8. `supabase/migrations/008_admin_credentials.sql` — admin credential metadata (if not already applied)
9. `supabase/migrations/009_verify_lookup.sql` — verify lookup helpers (if not already applied)
10. `supabase/migrations/010_realtime_places_replica.sql` — places realtime replica identity (if not already applied)
11. `supabase/migrations/011_place_menu_media.sql` — `menu_image_urls` + `pricing_items` on places

## Storage buckets (Dashboard → Storage)

- `booking-assets` (public) — QR codes & ticket PDFs (also created by `004_concierge.sql`)
- `media` (public) — media library assets (also created by `005_command_center.sql`)
- `place-images` (public) — place hero/gallery uploads if used by earlier migrations

If SQL `insert into storage.buckets` fails (permissions), create the buckets manually in the dashboard.

## Env vars

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Required — project origin only (`https://xxxx.supabase.co`), no trailing slash, no `/auth/v1` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Required (`anon` JWT or `sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Required for admin bootstrap / create-account / privileged writes (`service_role` JWT). Never expose |
| `SUPABASE_SECRET_KEY` | **Server only** | Optional alias for new `sb_secret_…` keys when service_role JWT is unused |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Browser Maps key only |
| `NEXT_PUBLIC_PANORA_WHATSAPP` | Client | Concierge WhatsApp |
| `NEXT_PUBLIC_PANORA_EMAIL` | Client | Concierge email |
| `NEXT_PUBLIC_PANORA_PHONE` | Client | Optional |
| `NEXT_PUBLIC_SITE_URL` | Server | Absolute app origin (no trailing slash) |
| `RESEND_API_KEY` | Server | Optional ESP — without it, mailto/wa.me |

### Supabase Auth URL allowlist

In **Authentication → URL Configuration**:

- **Site URL:** your app origin — `http://localhost:3000` locally, or `https://your-production-domain` in prod (same value as `NEXT_PUBLIC_SITE_URL`).
- **Redirect URLs:** allowlist at least that origin, e.g. `http://localhost:3000/**` and `https://your-production-domain/**`.

Password sign-in does not send `redirectTo`, but Site URL must still be a valid absolute app URL (not the Supabase project URL).

## First admin user (bootstrap)

Command Center can auto-create the launch admin on first successful setup:

1. Apply migrations through `008_admin_credentials.sql` (and later ones as needed).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **`SUPABASE_SERVICE_ROLE_KEY`** (server-only) in `.env.local` / Vercel.
3. Open `/admin/login` and sign in as:
   - **Email:** `victorm@panorago.co.zw`
   - **Launch password:** `Password` (documented here only — not shipped as client-side auth)
4. On first login the server action `ensureBootstrapAdmin` creates the Auth user (if missing), `profiles.role = admin`, and `admin_credentials.must_reset = true`.
5. You are forced to **change password** at `/admin/change-password` (min 8 chars, not the launch default) before the dashboard unlocks.
6. After that, use **Users → Create account** to add other admins (Auth + profile + credentials; temporary password + must-reset).

### Manual alternative (no service role on login)

If service role is unavailable at runtime, create the user in the Supabase Auth dashboard, then run:

```sql
insert into public.profiles (id, role, email, display_name)
values ('<auth-user-uuid>', 'admin', 'victorm@panorago.co.zw', 'Victor')
on conflict (id) do update
  set role = 'admin',
      email = excluded.email,
      display_name = excluded.display_name,
      updated_at = now();

insert into public.admin_credentials (user_id, email, is_active, must_reset)
values ('<auth-user-uuid>', 'victorm@panorago.co.zw', true, true)
on conflict (user_id) do update
  set email = excluded.email,
      is_active = true,
      must_reset = true,
      updated_at = now();
```

Set the Auth password to the launch default in the dashboard, then complete the in-app change-password gate.
