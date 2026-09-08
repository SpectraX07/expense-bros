# Build Prompts: ExpenseBros (Next.js + Supabase)

Two ways to use this doc:
1. **One-shot** — paste the Master Prompt into Claude Code / Cursor / v0 and let it build the whole thing.
2. **Phased (recommended)** — paste the Master Prompt first as project context, then feed the Phase prompts one at a time in order. This keeps each step reviewable and avoids the AI losing track of earlier decisions on a big app.

---

## MASTER PROMPT (paste first, or use as CLAUDE.md / project instructions)

```
Build a web app called "ExpenseBros" — a shared expense tracker for roommates/flatmates,
similar to Splitwise but focused on a single household's monthly expenses and settlement.

TECH STACK
- Next.js latest (App Router, TypeScript, Server Components where sensible)
- Supabase (Postgres, Auth, Row Level Security) as the backend/database
- Tailwind CSS + shadcn/ui for components
- Recharts (or Tremor) for charts
- Zod + react-hook-form for form validation
- date-fns for date handling
- Deploy target: Vercel

CORE CONCEPT
- A "household" is a group of roommates sharing expenses.
- A user can belong to one or more households (join via invite link/code).
- Expenses are logged against a household, tagged with a month, category, payer,
  amount, and which members share that specific expense (not always split evenly
  across everyone — support custom subsets and custom split ratios/amounts).
- The app automatically computes who owes whom and shows the minimum number of
  transactions needed to settle up, per month and all-time.

DATA MODEL (Supabase/Postgres — design proper tables, not a single flat sheet)
- profiles (id references auth.users, full_name, avatar_url, created_at)
- households (id, name, currency, invite_code, created_by, created_at)
- household_members (household_id, user_id, role[admin/member], joined_at,
  is_active — support removing/archiving a member without deleting history)
- categories (id, household_id nullable for global defaults, name, icon, color)
- budgets (id, household_id, month, year, category_id nullable [null = overall
  budget], planned_amount)
- expenses (id, household_id, paid_by user_id, category_id, item_name, amount,
  expense_date, month, year, split_type[equal/percentage/custom_amount/shares],
  note, created_by, created_at)
- expense_splits (id, expense_id, user_id, share_amount, is_included) — one row
  per household member per expense, so custom splits and exclusions are explicit
  and queryable
- settlements (id, household_id, from_user, to_user, amount, month, year,
  status[pending/confirmed], settled_at, note) — records of actual repayments,
  separate from calculated balances
- recurring_expenses (id, household_id, template fields mirroring expenses,
  frequency[monthly/weekly], next_run_date, active) — optional but include if time
  allows, for rent/subscriptions/utilities that repeat every month

Enable Row Level Security on every table. A user may only read/write rows for
households they belong to (join through household_members). Only household admins
can remove members, edit categories, or delete others' expenses.

CORE FEATURES (all required)
1. Auth: email/password + magic link via Supabase Auth. Onboarding flow to create
   a household or join one via invite code.
2. Month-wise dashboard (default view = current month, with a month/year switcher):
   - Total spent this month, budget vs. actual (progress bar / status)
   - Spend by category (pie or donut chart)
   - Spend trend across recent months (bar or line chart)
   - Who paid how much this month (bar chart)
   - Quick "add expense" entry point (modal or slide-over, not a full page nav)
3. Fast data entry:
   - Add expense form: amount, item name, category (searchable dropdown, can add
     new category inline), date, paid by, and a split editor
   - Split editor: default to "split equally among all active members," but let
     the user toggle which members are included and switch to percentage or
     custom-amount splits, with live validation that splits sum to the total
   - Support editing and deleting expenses (only by the creator or an admin),
     with an audit trail (updated_at, edited_by)
   - Support recurring/templated expenses so rent and fixed bills don't need
     re-entry every month
4. Settlement engine (the key feature):
   - For any given month (and for all-time), calculate each member's net balance
     = total paid − total fair share
   - Implement a debt-simplification algorithm (minimum-cash-flow / greedy
     matching of debtors to creditors) so the app shows the fewest possible
     transactions to settle everyone up — not a naive pairwise list
   - Show a clear "you owe / you are owed" summary per user, and a full
     household settlement table
   - Let a debtor mark a settlement as "paid" (with optional note, e.g. UPI
     reference), which a creditor then confirms; track settlement status
   - Once settlements are confirmed for a month, reflect that in the balances
     (paid settlements offset the calculated balance)
5. History & reporting:
   - Filterable/searchable expense list (by month, category, payer, member)
   - Per-category and per-member breakdown views
   - CSV export of a month's expenses and settlements
6. Household management:
   - Invite members via shareable link/code
   - Manage categories (add/edit/archive)
   - Set monthly budgets, overall and per category
   - Admin can archive/remove members without losing historical expense data
7. Polish:
   - Fully responsive (mobile-first, since roommates will log expenses on their
     phones)
   - Loading and empty states everywhere
   - Toasts/confirmations for destructive actions
   - Currency formatting driven by the household's configured currency
   - Dark mode

NON-FUNCTIONAL REQUIREMENTS
- TypeScript strict mode, no `any` where avoidable
- Server Actions or Route Handlers for all mutations, with Zod validation on
  both client and server
- Supabase client split correctly for server components vs. client components
  vs. middleware (use @supabase/ssr)
- Optimistic UI for fast-feeling data entry where reasonable
- Seed script / sample data for local development
- Basic unit tests for the settlement/debt-simplification algorithm specifically,
  since correctness there matters most
- .env.example with required Supabase keys, and a README with setup steps
  (Supabase project creation, running migrations, running the app locally)

Ask me clarifying questions only if something above is ambiguous for the specific
screen you're building — otherwise make reasonable decisions and keep going.
```

---

## PHASED PROMPTS (feed one at a time, in order)

### Phase 1 — Project scaffold & Supabase schema
```
Set up the Next.js + Supabase project scaffold per the spec above:
- Initialize Next.js (TypeScript, App Router, Tailwind, ESLint)
- Install and configure shadcn/ui, @supabase/ssr, zod, react-hook-form, date-fns,
  recharts
- Write the full Supabase schema as SQL migration files: all tables from the
  Data Model section, proper foreign keys, sensible indexes (household_id,
  month/year, user_id on the hot-path tables), and Row Level Security policies
  for every table as described
- Set up the Supabase client helpers for server components, client components,
  and middleware
- Add .env.example and a README section on running the migrations
Do not build any UI yet — just get the project running with a working Supabase
connection and the schema applied.
```

### Phase 2 — Auth & household onboarding
```
Build auth and onboarding:
- Sign up / log in (email+password and magic link) using Supabase Auth
- After first login with no household, show onboarding: "Create a household" or
  "Join with invite code"
- Create-household flow generates a unique invite_code and adds the creator as
  admin in household_members
- Join flow validates the invite code and adds the user as a member
- Basic app shell/layout: sidebar or bottom nav (mobile) with Dashboard, Add
  Expense, History, Settlement, Household Settings; show current household name
  and a switcher if the user belongs to more than one
```

### Phase 3 — Expense entry & categories
```
Build expense entry:
- Add/Edit expense form as described (amount, item, category with inline-create,
  date, paid-by, split editor supporting equal/percentage/custom-amount, live
  validation that splits sum to total)
- Persist to expenses + expense_splits atomically (use a Postgres function or a
  transaction) so partial writes can't happen
- Category management screen (list/add/edit/archive) scoped to the household
- Expense list view with filters (month, category, payer) and edit/delete
  respecting the permission rules (creator or admin only)
```

### Phase 4 — Dashboard
```
Build the month-wise dashboard as described:
- Month/year switcher (default current month)
- Summary cards: total spent, budget vs actual with status
- Category breakdown chart, spend trend chart across recent months, paid-by-member
  chart
- Quick-add expense entry point accessible from the dashboard without full page
  navigation
Fetch data efficiently — aggregate in Postgres (views or RPC functions) rather
than pulling all rows and summing client-side.
```

### Phase 5 — Settlement engine
```
Implement the settlement engine:
- A pure, well-tested function that takes a list of {user_id, net_balance} and
  returns the minimum set of {from, to, amount} transactions to zero everyone out
  (greedy max-debtor-to-max-creditor matching). Write unit tests covering: all
  settled, one debtor/many creditors, many debtors/one creditor, ties, uneven
  splits, and a case with 5+ members
- Wire it to real data: compute each member's paid vs fair-share vs net balance
  for a given month (and all-time) from expenses + expense_splits, minus any
  already-confirmed settlements for that period
- Build the settlement UI: per-user "you owe / you're owed" summary, full
  household settlement table, mark-as-paid flow (debtor marks paid → creditor
  confirms), and settlement history
```

### Phase 6 — Recurring expenses, budgets, export, polish
```
Add the remaining features:
- Recurring expense templates (rent, subscriptions) that generate a new expense
  each month automatically or via a "confirm this month's recurring expenses"
  prompt on dashboard load
- Budget settings screen (overall + per-category, per month)
- CSV export for a month's expenses and settlements
- Empty states, loading states, toasts for all mutations, mobile responsiveness
  pass, dark mode
- Final review: confirm RLS policies actually block cross-household access (test
  with two households), confirm currency formatting is consistent everywhere
```

---

### Tips for using these with an agentic coding tool
- Run Phase 1 fully, verify the Supabase schema looks right (open the table
  editor), *then* move to Phase 2 — don't queue all phases at once.
- After each phase, ask it to run the app and fix any type errors before moving on.
- If you already have specific roommates in mind, tell it your household size —
  the split editor and settlement UI are easier to sanity-check against real names.
