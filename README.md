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

## Auth (Supabase dashboard)

In **Authentication → URL configuration**, add:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

Email/password and magic link both use `/auth/callback`. New users get a `profiles` row via a trigger on `auth.users`. After first login, create a household (you become admin, invite code is generated) or join with a code. Share `/join?code=YOURCODE` from Household settings.

Household create/join uses RPCs (`create_household`, `join_household`) so invite-code lookups do not bypass RLS from the client.

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
