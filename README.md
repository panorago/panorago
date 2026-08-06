# Panora Go

Zimbabwe's premium lifestyle discovery platform — curated places, cinematic storytelling, and personal enquiries via WhatsApp, email, or call.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + design tokens
- Framer Motion
- next-themes (Light / Dark / System)
- Supabase (Auth, Postgres, Storage)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Environment

Copy `.env.example` to `.env.local` (already configured for your project):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `NEXT_PUBLIC_PANORA_WHATSAPP` | Enquiry WhatsApp (digits, country code) |
| `NEXT_PUBLIC_PANORA_EMAIL` | Enquiry email |
| `NEXT_PUBLIC_PANORA_PHONE` | Enquiry call number |
| `NEXT_PUBLIC_PANORA_PHONE_DISPLAY` | Display formatting |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server admin key |
| `DATABASE_URL` | Optional direct Postgres URL |

Update the Panora contact numbers/email before launch so enquiries reach you.

## Supabase setup

1. Open the Supabase SQL editor for project `pxgdoevtrqvkbwftnsaa`.
2. Run migrations **in order**:
   1. `001_panora_go.sql` — schema + seed places
   2. `002_mvp_gaps.sql`
   3. `003_bookings.sql`
   4. `004_concierge.sql` — concierge booking refinements + `booking-assets`
   5. `005_command_center.sql` — Command Center admin schema + `media` bucket
3. Create an Auth user for yourself (Email/Password).
4. Insert an admin profile:

```sql
insert into public.profiles (id, role, email, display_name)
values ('YOUR_AUTH_USER_UUID', 'admin', 'you@example.com', 'Panora Admin');
```

5. Confirm public storage buckets exist: `place-images`, `booking-assets`, `media` (SQL migrations create the latter two when permitted; otherwise create in Dashboard → Storage).

Until the migrations are applied, the app serves curated seed data so every screen works. See `docs/COMMAND_CENTER.md` for Command Center env vars and first-admin details.

## Product surfaces

- `/` — cinematic landing + homepage collections
- `/discover` — search + vibe filters
- `/panoras/[slug]` — story, notes, highlights, gallery, map, enquiry, experience stories
- `/saved` — locally saved places
- `/the-panora-way` — brand page
- `/admin` — places, stories, homepage sections

## Architecture notes

Places are hand-curated by Panora (no merchant accounts in v1). Schema already includes nullable `merchant_id` for future merchant tools, bookings, and payments without a rewrite.

No Google Forms in the customer experience. Admin writes directly to Supabase.
