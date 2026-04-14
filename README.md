# JTSG Community Employment Partners (web app)

Web app for the Joshua Tree Service Group (JTSG) **Community Employment Partners Network**. Employers join via a public form; JTSG staff manage partners with role-based access, optional county-based CRS email routing, and an admin **Territories** console.

## Features

- **Public signup**: Organizations submit company and contact info; no obligation for either party.
- **Staff dashboard**: Table and map views of employers (Leaflet + OpenStreetMap).
- **Roles**: Admin, Director, Supervisor, Employment Specialist, Community Relations Specialist (CRS).
- **CRS email routing**: After migration `003_coverage_territories.sql`, new signups email CRS staff assigned to the territory that contains the submitted **county**; unmapped counties still notify all active CRS (see server log `crs_email_county_unmapped`). Until any territory exists, behavior matches legacy (all CRS).
- **Admin**: Full access; **Users** (invite staff); **Territories** (counties + CRS/Supervisor coverage); optional Resend email.

## Tech stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Supabase**: Auth, PostgreSQL, RLS
- **Resend**: CRS alert on new signup (routed by territory when configured); optional confirmation to the contact email
- **Leaflet + OpenStreetMap**: Map view (no API key); Nominatim for geocoding (cached in DB)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run migrations in order: `001_initial.sql`, then `002_employer_pipeline.sql`, then **`003_coverage_territories.sql`** (territories, county keys, CRS/supervisor assignees).
3. In Project Settings → API: copy **Project URL** and **anon** key. Create a **service_role** key (keep it secret).
4. In Authentication → URL Configuration, set **Site URL** to your app URL (e.g. `https://yourapp.vercel.app`) and add `https://yourapp.vercel.app/auth/callback` to **Redirect URLs**.

### 2. Resend (recommended: CRS alerts + optional applicant email)

Resend can send **two** emails after `POST /api/employers`:

1. **CRS** — routed by **coverage territory** when tables are populated; otherwise all active CRS.
2. **Applicant** — optional confirmation to the contact email (`sendEmployerSignupConfirmation` in `src/lib/email.ts`).

**Setup checklist**

1. Create an account at [resend.com](https://resend.com) and open **API Keys** → create a key.
2. Add to `.env.local` (and Vercel): `RESEND_API_KEY=re_...`
3. Set **`FROM_EMAIL`** to a sender Resend accepts:
   - **Testing:** Resend’s sandbox, e.g. `JTSG Community Employment Partners <onboarding@resend.dev>` — you can usually only send **to your own verified inbox** until you add a domain (see [Resend docs](https://resend.com/docs)).
   - **Production:** verify your domain under **Domains**, then e.g. `JTSG Community Employment Partners <noreply@yourdomain.com>`.
4. Set **`APP_URL`** (or `NEXT_PUBLIC_APP_URL`) to your live site so transactional links match your deployment (otherwise Vercel provides `VERCEL_URL`; last fallback is `thejoshuatree.org`).

### 3. Environment

Copy `.env.local.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxx
FROM_EMAIL=JTSG Community Employment Partners <noreply@yourdomain.com>
APP_URL=https://your-app.vercel.app
```

If you omit Resend, email is skipped; **submissions still save**. The dashboard shows a banner, and logs include `crs_email_skipped` / `employer_confirmation_skipped` (see `src/lib/observability.ts`).

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create your admin account

1. Go to **Staff login** → **Create admin account** (or open `/setup`).
2. Enter your email and password (8+ characters).
3. Sign in on the login page.

After that, use **Dashboard → Users** to invite JTSG staff, and **Dashboard → Territories** to map Georgia counties and assign CRS/Supervisor coverage.

## Deploy (Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. Add the same environment variables in Vercel.
3. In Supabase, set **Site URL** and **Redirect URLs** to your Vercel URL (e.g. `https://your-app.vercel.app` and `https://your-app.vercel.app/auth/callback`).

## Map and geocoding

- Map loads only when the user clicks “Show map” (lazy).
- Addresses are geocoded with Nominatim (OpenStreetMap); results are cached in the `employers` table (`latitude`, `longitude`).
- If some employers have no coordinates, click **Locate addresses**; the app geocodes one-by-one (respecting Nominatim’s ~1 req/s guideline).

## Role summary

| Role | View | Edit | Delete | Change status | User / territory admin |
|------|------|------|--------|----------------|-------------------------|
| Admin | All | ✓ | ✓ | ✓ | ✓ |
| Director | All | ✓ | ✓ | ✓ | — |
| Supervisor | Active Partners only | — | — | — | — |
| Employment Specialist | Full directory (read-only) | — | — | — | — |
| CRS | Full directory | ✓ | — | ✓ (all pipeline statuses) | — |

When Resend is configured, CRS recipients for a new signup follow **Territories** rules once migration `003` is applied and counties are mapped.
