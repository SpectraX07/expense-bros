-- ExpenseBros tables, constraints, and indexes

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (char_length(currency) = 3),
  invite_code text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX households_invite_code_idx ON public.households (invite_code);

CREATE TABLE public.household_members (
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (household_id, user_id)
);

CREATE INDEX household_members_user_id_idx ON public.household_members (user_id);
CREATE INDEX household_members_household_active_idx
  ON public.household_members (household_id)
  WHERE is_active = true;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES public.households (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  icon text,
  color text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX categories_household_id_idx ON public.categories (household_id);
CREATE UNIQUE INDEX categories_global_name_idx
  ON public.categories (lower(name))
  WHERE household_id IS NULL;
CREATE UNIQUE INDEX categories_household_name_idx
  ON public.categories (household_id, lower(name))
  WHERE household_id IS NOT NULL AND is_archived = false;

CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  planned_amount numeric(12, 2) NOT NULL CHECK (planned_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX budgets_household_period_idx ON public.budgets (household_id, year, month);
CREATE UNIQUE INDEX budgets_overall_unique_idx
  ON public.budgets (household_id, year, month)
  WHERE category_id IS NULL;
CREATE UNIQUE INDEX budgets_category_unique_idx
  ON public.budgets (household_id, year, month, category_id)
  WHERE category_id IS NOT NULL;

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  item_name text NOT NULL CHECK (length(trim(item_name)) > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL DEFAULT (timezone('utc', now()))::date,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  split_type public.split_type NOT NULL DEFAULT 'equal',
  note text,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  edited_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX expenses_household_period_idx ON public.expenses (household_id, year, month);
CREATE INDEX expenses_paid_by_idx ON public.expenses (paid_by);
CREATE INDEX expenses_category_id_idx ON public.expenses (category_id);
CREATE INDEX expenses_created_by_idx ON public.expenses (created_by);
CREATE INDEX expenses_expense_date_idx ON public.expenses (household_id, expense_date DESC);

CREATE TABLE public.expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  share_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (share_amount >= 0),
  is_included boolean NOT NULL DEFAULT true,
  UNIQUE (expense_id, user_id)
);

CREATE INDEX expense_splits_expense_id_idx ON public.expense_splits (expense_id);
CREATE INDEX expense_splits_user_id_idx ON public.expense_splits (user_id);

CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  to_user uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  status public.settlement_status NOT NULL DEFAULT 'pending',
  settled_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settlements_distinct_users_chk CHECK (from_user <> to_user)
);

CREATE INDEX settlements_household_period_idx
  ON public.settlements (household_id, year, month);
CREATE INDEX settlements_from_user_idx ON public.settlements (from_user);
CREATE INDEX settlements_to_user_idx ON public.settlements (to_user);
CREATE INDEX settlements_status_idx ON public.settlements (household_id, status);

CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.categories (id) ON DELETE SET NULL,
  item_name text NOT NULL CHECK (length(trim(item_name)) > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  split_type public.split_type NOT NULL DEFAULT 'equal',
  note text,
  frequency public.recurrence_frequency NOT NULL DEFAULT 'monthly',
  next_run_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recurring_expenses_household_id_idx
  ON public.recurring_expenses (household_id);
CREATE INDEX recurring_expenses_next_run_idx
  ON public.recurring_expenses (next_run_date)
  WHERE active = true;

CREATE TABLE public.recurring_expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_expense_id uuid NOT NULL REFERENCES public.recurring_expenses (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  share_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (share_amount >= 0),
  is_included boolean NOT NULL DEFAULT true,
  UNIQUE (recurring_expense_id, user_id)
);

CREATE INDEX recurring_expense_splits_parent_idx
  ON public.recurring_expense_splits (recurring_expense_id);

COMMENT ON TABLE public.profiles IS 'App profile for each auth user.';
COMMENT ON TABLE public.households IS 'A shared living group that tracks expenses together.';
COMMENT ON TABLE public.household_members IS 'Membership, role, and active status. Inactive members stay for history.';
COMMENT ON TABLE public.expense_splits IS 'One row per member per expense so custom splits and exclusions are explicit.';
COMMENT ON TABLE public.settlements IS 'Actual repayments, separate from calculated balances.';
COMMENT ON COLUMN public.budgets.category_id IS 'NULL means an overall household budget for that month.';
