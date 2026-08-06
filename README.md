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
2. Run `supabase/migrations/001_panora_go.sql` (schema + seed places).
3. Create an Auth user for yourself (Email/Password).
4. Insert an admin profile:

```sql
insert into public.profiles (id, role, display_name)
values ('YOUR_AUTH_USER_UUID', 'admin', 'Panora Admin');
```

5. Create a public storage bucket named `place-images` (see comments in the migration).

Until the migration is applied, the app serves curated seed data so every screen works.

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
