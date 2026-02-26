# JTSG Employer Network

Web app for the Joshua Tree Service Group (JTSG) employer network. Employers can join the network via a public form; JTSG staff view and manage partners with role-based access.

## Features

- **Public signup**: Employers submit company and contact info; no obligation for either party.
- **Staff dashboard**: Table and map views of employers (Leaflet + OpenStreetMap).
- **Roles**: Admin, Director, Supervisor, Employment Specialist, Community Relations Specialist (CRS).
- **CRS**: Receives email when a new employer submits; sees New Submissions first (newest at top), then Active Partners; can change status to Active Partner; cannot delete.
- **Admin**: Full access; create staff accounts (invite by email); users set their own password and can reset via email (Supabase).

## Tech stack

- **Next.js 14** (App Router), TypeScript, Tailwind CSS
- **Supabase**: Auth, PostgreSQL, RLS
- **Resend**: Email to CRS on new employer submission
- **Leaflet + OpenStreetMap**: Map view (no API key); Nominatim for geocoding (cached in DB)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration: `supabase/migrations/001_initial.sql`.
3. In Project Settings → API: copy **Project URL** and **anon** key. Create a **service_role** key (keep it secret).
4. In Authentication → URL Configuration, set **Site URL** to your app URL (e.g. `https://yourapp.vercel.app`) and add `https://yourapp.vercel.app/auth/callback` to **Redirect URLs**.

### 2. Resend (optional but recommended for CRS emails)

1. Sign up at [resend.com](https://resend.com).
2. Create an API key and (optionally) verify your domain for `FROM_EMAIL`.
3. Add `RESEND_API_KEY` and `FROM_EMAIL` to env (see below).

### 3. Environment

Copy `.env.local.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_xxxx
FROM_EMAIL=JTSG Employer Network <noreply@yourdomain.com>
```

If you omit Resend, CRS will not receive “new employer” emails; the rest of the app still works.

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

After that, use **Dashboard → Users** to invite JTSG staff (Director, Supervisor, Employment Specialist, CRS). They receive an email to set their password; they can use “Forgot password?” on the login page to reset later.

## Deploy (Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. Add the same environment variables in Vercel.
3. In Supabase, set **Site URL** and **Redirect URLs** to your Vercel URL (e.g. `https://your-app.vercel.app` and `https://your-app.vercel.app/auth/callback`).

## Map and geocoding

- Map loads only when the user clicks “Show map” (lazy).
- Addresses are geocoded with Nominatim (OpenStreetMap); results are cached in the `employers` table (`latitude`, `longitude`).
- If some employers have no coordinates, click **Locate addresses**; the app geocodes one-by-one (respecting Nominatim’s ~1 req/s guideline).

## Role summary

| Role | View | Edit | Delete | Change status | User management |
|------|------|------|--------|----------------|------------------|
| Admin | All | ✓ | ✓ | ✓ | ✓ |
| Director | All | ✓ | ✓ | ✓ | — |
| Supervisor | Active Partners only | — | — | — | — |
| Employment Specialist | Active Partners only | — | — | — | — |
| CRS | All (New first, then Active) | ✓ | — | ✓ (New → Active) | — |

CRS receives an email when a new employer is submitted.
