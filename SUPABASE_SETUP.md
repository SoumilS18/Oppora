# Oppora: Supabase Authentication & PostgreSQL Database Setup Guide

This guide documents the complete procedure to provision and connect a production-grade Supabase project to the Oppora platform for secure authentication, persistent founder profiles, bookmarked opportunities, and checklist progress tracking.

---

## 1. Create a Supabase Project

1. Navigate to [Supabase](https://supabase.com) and sign in or create a developer account.
2. On your Supabase Dashboard, click **New Project**.
3. Select your organization and choose a project name (e.g., `oppora-production` or `oppora-dev`).
4. Generate or specify a strong **Database Password** (store this in a secure password manager).
5. Choose the AWS/GCP region closest to your target audience (e.g., `ap-south-1` (Mumbai) for India-first workloads).
6. Click **Create new project** and allow ~2 minutes for PostgreSQL provisioning.

---

## 2. Obtain Project URL and Public Anon Key

1. In the Supabase project sidebar, click **Project Settings** (gear icon) -> **API**.
2. Locate the **Project URL**:
   - Format: `https://<your-project-ref>.supabase.co`
3. Locate the **Project API Keys**:
   - Copy the `anon` / `public` key.
   - **SECURITY WARNING:** Do **not** use or copy the `service_role` key into client environment variables or any variable prefixed with `NEXT_PUBLIC_`. The service-role key bypasses Row Level Security and must remain strictly server-confidential.

---

## 3. Apply Database Migrations & Row Level Security

Oppora includes a production-ready SQL migration file located in:
`supabase/migrations/20261013000000_init_oppora_schema.sql`

This migration creates:
- `public.profiles`: Venture profile table linked to `auth.users(id)` with auto-trigger `handle_new_user()`.
- `public.saved_opportunities`: JSONB-backed opportunity bookmark table with user isolation.
- `public.saved_checklist_items`: Normalized checklist persistence per opportunity per founder.
- Row Level Security (RLS) policies on every table restricting read/write access to `auth.uid() = user_id`.

### Option A: Using the Supabase Web Dashboard (Recommended & Instant)
1. Open your Supabase Dashboard.
2. Click **SQL Editor** from the left navigation menu.
3. Click **New query**.
4. Copy the entire contents of `supabase/migrations/20261013000000_init_oppora_schema.sql` and paste it into the query editor.
5. Click **Run** (Ctrl + Enter).
6. Verify that the output shows `Success. No rows returned`.

### Option B: Using the Supabase CLI
```bash
# Link project
npx supabase link --project-ref <your-project-ref>

# Push migration to remote database
npx supabase db push
```

---

## 4. Configure Local Environment Variables

1. In the root directory of the Oppora repository, create or update `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>

# Optional Discovery Engine Keys
TINYFISH_API_KEY=your_tinyfish_key_here
GEMINI_API_KEY=your_gemini_key_here
OPPORA_DEFAULT_MODE=live
```

2. Verify that `.env.local` is listed in `.gitignore` so secrets are never pushed to GitHub.

---

## 5. Configure Authentication URL Configuration

To ensure email verification links and password resets route back to Oppora securely:

1. In the Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. Set **Site URL**:
   - Local development: `http://localhost:3000`
   - Production deployment: `https://your-domain.vercel.app` (or custom domain)
3. Under **Redirect URLs**, add the following allowed callback destinations:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
   - `http://localhost:3000/workspace`
   - `https://your-domain.vercel.app/auth/callback` (for production)
   - `https://your-domain.vercel.app/reset-password`
   - `https://your-domain.vercel.app/workspace`
4. Click **Save**.

---

## 6. Configure Email Verification & Password Recovery Templates

Under **Authentication** -> **Email Templates**:

### Confirm Signup Template
- **Subject:** `Verify your Oppora venture account`
- **Body:**
```html
<h2>Welcome to Oppora</h2>
<p>Follow this link to verify your email and activate your startup opportunity pipeline:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Account Email</a></p>
```

### Reset Password Template
- **Subject:** `Reset your Oppora account password`
- **Body:**
```html
<h2>Reset Your Oppora Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

---

## 7. How to Test Locally

1. **Start the local Next.js server:**
   ```bash
   npm run dev
   ```
2. **Test User Registration:**
   - Visit `http://localhost:3000/signup`.
   - Enter your full name, email, and password (at least 8 chars).
   - Submit the form. Notice the "Verification Link Dispatched" screen.
   - Inspect your email inbox (or Supabase Dashboard -> **Authentication** -> **Users** in local/inbucket mode).
   - Click the confirmation link. You will be authenticated and redirected to `/workspace`.
3. **Verify Database Trigger:**
   - In Supabase Dashboard -> **Table Editor** -> `profiles`, verify that a row was automatically created for your user ID with default venture values and your full name.
4. **Test Opportunity Bookmarking & Checklists:**
   - Visit `http://localhost:3000/discover`.
   - Bookmark an opportunity (e.g. "Startup India Seed Fund Scheme").
   - Click "Open Checklist Drawer" and check off 2 items.
   - Visit `http://localhost:3000/workspace`. Notice that the opportunity and the checklist progress percentage are loaded persistently.
   - Inspect Supabase Dashboard -> **Table Editor** -> `saved_opportunities` and `saved_checklist_items` to confirm records were persisted to PostgreSQL.
5. **Test Account Isolation & Logout:**
   - Click **Sign Out** in the Workspace or Navbar.
   - Attempt to directly access `http://localhost:3000/workspace`. Notice Next.js middleware blocks access and redirects to `/login?next=%2Fworkspace`.
   - Sign in with a different test account or incognito window: notice none of the first user's saved items are visible.
6. **Test Password Recovery:**
   - Visit `http://localhost:3000/forgot-password`.
   - Enter your registered email address and submit.
   - Open the received email recovery link -> arrives at `/reset-password`.
   - Enter a new 8-character password and submit -> updates password and logs in.

---

## 8. Production Deployment Checklist

Before going live on Vercel, AWS, or any production hosting:

1. **Environment Variables:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your host's environment settings.
2. **Site URL:** Update Supabase Auth -> Site URL from `localhost:3000` to your real production domain.
3. **SMTP Provider:** Configure a custom SMTP provider (Resend, SendGrid, Amazon SES) in Supabase Auth -> **SMTP Settings** to avoid the default rate limit (3 emails per hour on Supabase free tier).
4. **Row Level Security Audit:** Verify that RLS is enabled on all tables in Supabase (`profiles`, `saved_opportunities`, `saved_checklist_items`).
5. **No Service-Role Key Exposure:** Ensure the `service_role` key is never checked into git or added to client environment bundles.
