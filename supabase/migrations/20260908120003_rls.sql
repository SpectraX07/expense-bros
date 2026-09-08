-- Row Level Security: users may only read/write rows for households they belong to.
-- Admins can remove members, manage categories, and delete others' expenses.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expense_splits ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_household
  ON public.profiles FOR SELECT TO authenticated
  USING (public.shares_household_with(id));

CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- households
CREATE POLICY households_select_member
  ON public.households FOR SELECT TO authenticated
  USING (public.is_household_member(id));

CREATE POLICY households_insert_own
  ON public.households FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY households_update_admin
  ON public.households FOR UPDATE TO authenticated
  USING (public.is_household_admin(id))
  WITH CHECK (public.is_household_admin(id));

CREATE POLICY households_delete_admin
  ON public.households FOR DELETE TO authenticated
  USING (public.is_household_admin(id));

-- household_members
CREATE POLICY household_members_select_member
  ON public.household_members FOR SELECT TO authenticated
  USING (public.is_household_member(household_id));

CREATE POLICY household_members_insert_admin
  ON public.household_members FOR INSERT TO authenticated
  WITH CHECK (public.is_household_admin(household_id));

CREATE POLICY household_members_update_admin
  ON public.household_members FOR UPDATE TO authenticated
  USING (public.is_household_admin(household_id))
  WITH CHECK (public.is_household_admin(household_id));

CREATE POLICY household_members_delete_admin
  ON public.household_members FOR DELETE TO authenticated
  USING (public.is_household_admin(household_id));

-- categories: global defaults are readable by every signed-in user
CREATE POLICY categories_select
  ON public.categories FOR SELECT TO authenticated
  USING (
    household_id IS NULL
    OR public.is_household_member(household_id)
  );

CREATE POLICY categories_insert_admin
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND public.is_household_admin(household_id)
  );

CREATE POLICY categories_update_admin
  ON public.categories FOR UPDATE TO authenticated
  USING (
    household_id IS NOT NULL
    AND public.is_household_admin(household_id)
  )
  WITH CHECK (
    household_id IS NOT NULL
    AND public.is_household_admin(household_id)
  );

CREATE POLICY categories_delete_admin
  ON public.categories FOR DELETE TO authenticated
  USING (
    household_id IS NOT NULL
    AND public.is_household_admin(household_id)
  );

-- budgets
CREATE POLICY budgets_select_member
  ON public.budgets FOR SELECT TO authenticated
  USING (public.is_household_member(household_id));

CREATE POLICY budgets_insert_admin
  ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (public.is_household_admin(household_id));

CREATE POLICY budgets_update_admin
  ON public.budgets FOR UPDATE TO authenticated
  USING (public.is_household_admin(household_id))
  WITH CHECK (public.is_household_admin(household_id));

CREATE POLICY budgets_delete_admin
  ON public.budgets FOR DELETE TO authenticated
  USING (public.is_household_admin(household_id));

-- expenses
CREATE POLICY expenses_select_member
  ON public.expenses FOR SELECT TO authenticated
  USING (public.is_household_member(household_id));

CREATE POLICY expenses_insert_member
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (
    public.is_household_member(household_id)
    AND created_by = auth.uid()
    AND public.is_active_member(household_id, paid_by)
  );

CREATE POLICY expenses_update_creator_or_admin
  ON public.expenses FOR UPDATE TO authenticated
  USING (
    public.is_household_member(household_id)
    AND (created_by = auth.uid() OR public.is_household_admin(household_id))
  )
  WITH CHECK (
    public.is_household_member(household_id)
    AND (created_by = auth.uid() OR public.is_household_admin(household_id))
  );

CREATE POLICY expenses_delete_creator_or_admin
  ON public.expenses FOR DELETE TO authenticated
  USING (
    public.is_household_member(household_id)
    AND (created_by = auth.uid() OR public.is_household_admin(household_id))
  );

-- expense_splits
CREATE POLICY expense_splits_select_member
  ON public.expense_splits FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses e
      WHERE e.id = expense_id
        AND public.is_household_member(e.household_id)
    )
  );

CREATE POLICY expense_splits_insert_mutable
  ON public.expense_splits FOR INSERT TO authenticated
  WITH CHECK (public.can_mutate_expense(expense_id));

CREATE POLICY expense_splits_update_mutable
  ON public.expense_splits FOR UPDATE TO authenticated
  USING (public.can_mutate_expense(expense_id))
  WITH CHECK (public.can_mutate_expense(expense_id));

CREATE POLICY expense_splits_delete_mutable
  ON public.expense_splits FOR DELETE TO authenticated
  USING (public.can_mutate_expense(expense_id));

-- settlements
CREATE POLICY settlements_select_member
  ON public.settlements FOR SELECT TO authenticated
  USING (public.is_household_member(household_id));

CREATE POLICY settlements_insert_debtor_or_admin
  ON public.settlements FOR INSERT TO authenticated
  WITH CHECK (
    public.is_household_member(household_id)
    AND (from_user = auth.uid() OR public.is_household_admin(household_id))
  );

CREATE POLICY settlements_update_parties_or_admin
  ON public.settlements FOR UPDATE TO authenticated
  USING (
    public.is_household_member(household_id)
    AND (
      from_user = auth.uid()
      OR to_user = auth.uid()
      OR public.is_household_admin(household_id)
    )
  )
  WITH CHECK (
    public.is_household_member(household_id)
    AND (
      from_user = auth.uid()
      OR to_user = auth.uid()
      OR public.is_household_admin(household_id)
    )
  );

CREATE POLICY settlements_delete_admin_or_pending_debtor
  ON public.settlements FOR DELETE TO authenticated
  USING (
    public.is_household_member(household_id)
    AND (
      public.is_household_admin(household_id)
      OR (from_user = auth.uid() AND status = 'pending')
    )
  );

-- recurring_expenses
CREATE POLICY recurring_expenses_select_member
  ON public.recurring_expenses FOR SELECT TO authenticated
  USING (public.is_household_member(household_id));

CREATE POLICY recurring_expenses_insert_member
  ON public.recurring_expenses FOR INSERT TO authenticated
  WITH CHECK (
    public.is_household_member(household_id)
    AND created_by = auth.uid()
  );

CREATE POLICY recurring_expenses_update_creator_or_admin
  ON public.recurring_expenses FOR UPDATE TO authenticated
  USING (public.can_mutate_recurring_expense(id))
  WITH CHECK (public.can_mutate_recurring_expense(id));

CREATE POLICY recurring_expenses_delete_creator_or_admin
  ON public.recurring_expenses FOR DELETE TO authenticated
  USING (public.can_mutate_recurring_expense(id));

-- recurring_expense_splits
CREATE POLICY recurring_expense_splits_select_member
  ON public.recurring_expense_splits FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.recurring_expenses r
      WHERE r.id = recurring_expense_id
        AND public.is_household_member(r.household_id)
    )
  );

CREATE POLICY recurring_expense_splits_insert_mutable
  ON public.recurring_expense_splits FOR INSERT TO authenticated
  WITH CHECK (public.can_mutate_recurring_expense(recurring_expense_id));

CREATE POLICY recurring_expense_splits_update_mutable
  ON public.recurring_expense_splits FOR UPDATE TO authenticated
  USING (public.can_mutate_recurring_expense(recurring_expense_id))
  WITH CHECK (public.can_mutate_recurring_expense(recurring_expense_id));

CREATE POLICY recurring_expense_splits_delete_mutable
  ON public.recurring_expense_splits FOR DELETE TO authenticated
  USING (public.can_mutate_recurring_expense(recurring_expense_id));
