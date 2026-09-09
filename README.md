# ExpenseBros

Shared expense tracker for roommates — month-wise spending, custom splits, and a settlement engine that shows the fewest repayments needed to square up.

Stack: Next.js (App Router) + TypeScript, Supabase (Postgres, Auth, RLS), Tailwind CSS, shadcn/ui.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. App environment variables

The Next.js app talks to Supabase with the project URL and **publishable** key (older dashboards call this the **anon** key). Copy them from **Project Settings → API** (or the Connect dialog):

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

These keys are for the running app only. They do **not** apply database migrations.

### 3. Apply database migrations

Schema files live in `supabase/migrations/`. Migrations are applied with the **Supabase CLI**, using your logged-in account (`npx supabase login`).

This repo is already linked to the hosted ExpenseBros project. After you add or change a migration file:

```bash
npx supabase db push
```

Or `npm run db:push`. That applies only migrations that are not yet on the remote database.

Confirm in the dashboard **Table Editor** that these tables exist, with RLS enabled:

`profiles`, `households`, `household_members`, `categories`, `budgets`, `expenses`, `expense_splits`, `settlements`, `recurring_expenses`, `recurring_expense_splits`

#### First-time link (new clone / different machine)

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

The project ref is the subdomain of `NEXT_PUBLIC_SUPABASE_URL` (`https://<ref>.supabase.co`).

#### Optional — local Supabase (Docker)

```bash
npx supabase start
npx supabase db reset
```

`db reset` applies every file in `supabase/migrations/` in order, then `supabase/seed.sql`. Use the URL and keys printed by `supabase start` in `.env.local`.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits go to **Sign in**. After login with no household, you land on onboarding (create or join).

### 5. Tests and checks

```bash
npm test
npm run lint
npm run typecheck
```

GitHub Actions runs lint, typecheck, tests, and a production build on every push and pull request. Typecheck generates Next.js route types first (`next typegen`), so it works on a clean checkout.

## Deploy on Vercel

The app is a standard Next.js App Router project. Vercel picks that up automatically.

1. Push this repo to GitHub, then **Import** it in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js**. Node **20.9+** (this repo’s `.nvmrc` is 22). Leave the build/output commands on Vercel’s Next.js defaults.
3. Add the same env vars as `.env.example` for **Production**, **Preview**, and **Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. The first production URL will look like `https://<project>.vercel.app`.
5. In the **Supabase** dashboard → **Authentication → URL configuration**, add:
   - Site URL: `https://<project>.vercel.app` (or your custom domain)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `https://<project>.vercel.app/auth/callback`
     - `https://<project>.vercel.app/join`
     - If you use preview deploys, also add `https://<project>-*-<team>.vercel.app/auth/callback`

Email magic links and password sign-in both return to `/auth/callback`. If those URLs are missing, login will bounce to `/login?error=auth`.

Database migrations are **not** applied by Vercel. Keep using `npx supabase db push` against the hosted project when the schema changes.

### Custom domain

Add the domain in Vercel, then update the Supabase Site URL and redirect list to that domain (keep the `vercel.app` URLs if you still use them).

## Auth (Supabase dashboard)

In **Authentication → URL configuration**, add the local URLs while developing, then the Vercel URLs from [Deploy on Vercel](#deploy-on-vercel):

- Site URL: `http://localhost:3000` (production Site URL should be the live app)
- Redirect URLs: `http://localhost:3000/auth/callback`

Email/password and magic link both use `/auth/callback`. New users get a `profiles` row via a trigger on `auth.users`. After first login, create a household (you become admin, invite code is generated) or join with a code. Share `/join?code=YOURCODE` from Household settings.

Household create/join uses RPCs (`create_household`, `join_household`) so invite-code lookups do not bypass RLS from the client.

## Recurring, budgets, and export

- **Recurring** (`/household/recurring`) — templates for rent and bills. When `next_run_date` is due, the dashboard asks you to add that run or skip it.
- **Budgets** (`/household/budgets`) — overall and per-category caps for a month. Admins can edit; everyone can see progress.
- **CSV** — History and Settlement (month view) have **Export CSV** for that month's expenses and settlements.

## Row Level Security

Every table has RLS enabled. Policies go through `is_household_member` / `is_household_admin` (SECURITY DEFINER helpers), so a user cannot read or write another household's expenses, budgets, settlements, or recurring templates. Profile rows of people you do not share a household with are also blocked (`shares_household_with`). Currency display always uses `formatMoney` with the current household's currency code.

## Project layout

- `src/app` — Next.js App Router (`(auth)`, `(onboarding)`, `(app)`)
- `src/components` — UI, auth forms, household forms, app shell
- `src/lib/supabase/client.ts` — browser client (Client Components)
- `src/lib/supabase/server.ts` — server client (Server Components, Server Actions, Route Handlers)
- `src/lib/supabase/middleware.ts` — session refresh and auth redirects
- `src/proxy.ts` — Next.js 16 request proxy (replaces `middleware.ts`)
- `supabase/migrations` — Postgres schema, indexes, triggers, RLS

## Regenerating database types

After schema changes on the linked hosted project:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Or `npm run db:types`. For a local stack, pass `--local` instead of `--linked`.
