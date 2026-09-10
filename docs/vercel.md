# Deploy ExpenseBros on Vercel

This is a standard Next.js App Router app. Vercel detects that automatically. You do not need a `vercel.json` or extra build settings.

## What you need first

- The repo on GitHub
- A hosted [Supabase](https://supabase.com) project
- Schema already applied (`npx supabase db push`) — Vercel never runs migrations
- These values from Supabase → **Project Settings → API**:
  - Project URL
  - Publishable key (older dashboards call this the **anon** key)

## 1. Import the project

1. Open [vercel.com/new](https://vercel.com/new).
2. Import the GitHub repo.
3. Framework preset: **Next.js**.
4. Leave **Build Command**, **Output Directory**, **Install Command**, and **Root Directory** on the defaults.
5. Node: **20.9+** (this repo’s `.nvmrc` is 22). Vercel’s current default is fine.

Do not click Deploy yet if env vars are empty. `NEXT_PUBLIC_*` values are baked in at **build** time.

## 2. Add environment variables

In the import screen, or later in **Project Settings → Environment Variables**, add both of these for **Production**, **Preview**, and **Development**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable / anon key |

If a dashboard only shows “anon”, that is the same key. You can set `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead; the app accepts either.

If these are missing, the Vercel build fails with a message telling you to add them.

## 3. Deploy

Click **Deploy**. The first production URL looks like `https://<project>.vercel.app`.

Later pushes to the production branch (usually `main`) redeploy automatically. Pull requests get Preview URLs.

## 4. Allow the Vercel URL in Supabase Auth

In Supabase → **Authentication → URL configuration**:

**Site URL** (production):

```text
https://<project>.vercel.app
```

**Redirect URLs** (add all that you use):

```text
http://localhost:3000/auth/callback
https://<project>.vercel.app/auth/callback
https://<project>.vercel.app/join
```

Preview deploys (optional):

```text
https://<project>-*-<team>.vercel.app/auth/callback
```

Email magic links and password sign-in both return to `/auth/callback`. If that URL is not allowlisted, login redirects to `/login?error=auth`.

Keep the localhost callback while you still develop locally.

## 5. Check that it works

1. Open the production URL. You should see **Sign in**.
2. Sign in or sign up. You should land on onboarding or the dashboard, not `/login?error=auth`.
3. Create or join a household.
4. Add an expense.

## Custom domain

1. Vercel → **Project Settings → Domains** → add the domain and follow DNS instructions.
2. Supabase → **Authentication → URL configuration**:
   - Site URL → `https://your-domain.com`
   - Redirect URLs → also add `https://your-domain.com/auth/callback` and `https://your-domain.com/join`
3. Keep the `vercel.app` URLs if you still use that host.

## What Vercel does not do

- It does not apply `supabase/migrations/`. After a schema change, run `npx supabase db push` (or `npm run db:push`) against the hosted project.
- GitHub Actions CI (`.github/workflows/ci.yml`) only checks the code. It does not deploy. Vercel deploys from the GitHub integration.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Build error about missing `NEXT_PUBLIC_SUPABASE_*` | Env vars are set for the environment you deployed (Production vs Preview), then **Redeploy** so they are inlined. |
| Login bounces to `/login?error=auth` | Redirect URLs in Supabase include `https://<this-host>/auth/callback`. |
| Invite / join link fails | Add `https://<this-host>/join` to Redirect URLs. |
| App talks to the wrong Supabase project | `NEXT_PUBLIC_*` was set after the last build. Redeploy. |
| Tables missing / RLS errors | Migrations were not pushed. Run `npx supabase db push`. |
