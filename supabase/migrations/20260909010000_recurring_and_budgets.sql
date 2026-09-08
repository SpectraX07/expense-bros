-- Recurring templates can generate expenses; budgets upsert overall or per category.

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS recurring_expense_id uuid
    REFERENCES public.recurring_expenses (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS expenses_recurring_expense_id_idx
  ON public.expenses (recurring_expense_id)
  WHERE recurring_expense_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.advance_recurring_date(
  p_date date,
  p_frequency public.recurrence_frequency
)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_frequency = 'weekly' THEN (p_date + interval '7 days')::date
    ELSE (p_date + interval '1 month')::date
  END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_budget(
  p_household_id uuid,
  p_year int,
  p_month int,
  p_amount numeric,
  p_category_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can set the budget';
  END IF;

  IF p_amount IS NULL THEN
    DELETE FROM public.budgets
    WHERE household_id = p_household_id
      AND year = p_year
      AND month = p_month
      AND (
        (p_category_id IS NULL AND category_id IS NULL)
        OR category_id = p_category_id
      );
    RETURN NULL;
  END IF;

  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Budget must be zero or more';
  END IF;

  UPDATE public.budgets
  SET planned_amount = p_amount
  WHERE household_id = p_household_id
    AND year = p_year
    AND month = p_month
    AND (
      (p_category_id IS NULL AND category_id IS NULL)
      OR category_id = p_category_id
    );

  IF NOT FOUND THEN
    INSERT INTO public.budgets (household_id, year, month, category_id, planned_amount)
    VALUES (p_household_id, p_year, p_month, p_category_id, p_amount);
  END IF;

  RETURN p_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_overall_budget(
  p_household_id uuid,
  p_year int,
  p_month int,
  p_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.upsert_budget(p_household_id, p_year, p_month, p_amount, NULL);
END;
$$;

DROP FUNCTION IF EXISTS public.save_expense(
  uuid, uuid, text, numeric, date, public.split_type, jsonb, uuid, text, uuid
);

CREATE OR REPLACE FUNCTION public.save_expense(
  p_household_id uuid,
  p_paid_by uuid,
  p_item_name text,
  p_amount numeric,
  p_expense_date date,
  p_split_type public.split_type,
  p_splits jsonb,
  p_category_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_id uuid DEFAULT NULL,
  p_recurring_expense_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_included int;
  v_split_sum numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_item_name IS NULL OR length(trim(p_item_name)) = 0 THEN
    RAISE EXCEPTION 'Item name is required';
  END IF;

  IF NOT public.is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  IF NOT public.is_active_member(p_household_id, p_paid_by) THEN
    RAISE EXCEPTION 'Payer must be an active household member';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE COALESCE((s->>'is_included')::boolean, false)),
    COALESCE(
      SUM(
        CASE
          WHEN COALESCE((s->>'is_included')::boolean, false)
            THEN (s->>'share_amount')::numeric
          ELSE 0
        END
      ),
      0
    )
  INTO v_included, v_split_sum
  FROM jsonb_array_elements(p_splits) AS s;

  IF v_included < 1 THEN
    RAISE EXCEPTION 'Select at least one person to split with';
  END IF;

  IF abs(v_split_sum - p_amount) > 0.009 THEN
    RAISE EXCEPTION 'Splits must add up to the total amount';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.expenses (
      household_id,
      paid_by,
      category_id,
      item_name,
      amount,
      expense_date,
      month,
      year,
      split_type,
      note,
      created_by,
      recurring_expense_id
    )
    VALUES (
      p_household_id,
      p_paid_by,
      p_category_id,
      trim(p_item_name),
      p_amount,
      p_expense_date,
      EXTRACT(MONTH FROM p_expense_date)::int,
      EXTRACT(YEAR FROM p_expense_date)::int,
      p_split_type,
      NULLIF(trim(COALESCE(p_note, '')), ''),
      v_user,
      p_recurring_expense_id
    )
    RETURNING id INTO v_id;
  ELSE
    IF NOT public.can_mutate_expense(p_id) THEN
      RAISE EXCEPTION 'You cannot edit this expense';
    END IF;

    UPDATE public.expenses
    SET
      paid_by = p_paid_by,
      category_id = p_category_id,
      item_name = trim(p_item_name),
      amount = p_amount,
      expense_date = p_expense_date,
      month = EXTRACT(MONTH FROM p_expense_date)::int,
      year = EXTRACT(YEAR FROM p_expense_date)::int,
      split_type = p_split_type,
      note = NULLIF(trim(COALESCE(p_note, '')), ''),
      edited_by = v_user
    WHERE id = p_id
      AND household_id = p_household_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Expense not found';
    END IF;

    v_id := p_id;
    DELETE FROM public.expense_splits WHERE expense_id = v_id;
  END IF;

  INSERT INTO public.expense_splits (expense_id, user_id, share_amount, is_included)
  SELECT
    v_id,
    (s->>'user_id')::uuid,
    COALESCE((s->>'share_amount')::numeric, 0),
    COALESCE((s->>'is_included')::boolean, false)
  FROM jsonb_array_elements(p_splits) AS s;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_recurring_expense(
  p_household_id uuid,
  p_paid_by uuid,
  p_item_name text,
  p_amount numeric,
  p_split_type public.split_type,
  p_splits jsonb,
  p_frequency public.recurrence_frequency,
  p_next_run_date date,
  p_category_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_id uuid DEFAULT NULL,
  p_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_included int;
  v_split_sum numeric;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_item_name IS NULL OR length(trim(p_item_name)) = 0 THEN
    RAISE EXCEPTION 'Item name is required';
  END IF;

  IF NOT public.is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  IF NOT public.is_active_member(p_household_id, p_paid_by) THEN
    RAISE EXCEPTION 'Payer must be an active household member';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE COALESCE((s->>'is_included')::boolean, false)),
    COALESCE(
      SUM(
        CASE
          WHEN COALESCE((s->>'is_included')::boolean, false)
            THEN (s->>'share_amount')::numeric
          ELSE 0
        END
      ),
      0
    )
  INTO v_included, v_split_sum
  FROM jsonb_array_elements(p_splits) AS s;

  IF v_included < 1 THEN
    RAISE EXCEPTION 'Select at least one person to split with';
  END IF;

  IF abs(v_split_sum - p_amount) > 0.009 THEN
    RAISE EXCEPTION 'Splits must add up to the total amount';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.recurring_expenses (
      household_id,
      paid_by,
      category_id,
      item_name,
      amount,
      split_type,
      note,
      frequency,
      next_run_date,
      active,
      created_by
    )
    VALUES (
      p_household_id,
      p_paid_by,
      p_category_id,
      trim(p_item_name),
      p_amount,
      p_split_type,
      NULLIF(trim(COALESCE(p_note, '')), ''),
      p_frequency,
      p_next_run_date,
      COALESCE(p_active, true),
      v_user
    )
    RETURNING id INTO v_id;
  ELSE
    IF NOT public.can_mutate_recurring_expense(p_id) THEN
      RAISE EXCEPTION 'You cannot edit this recurring expense';
    END IF;

    UPDATE public.recurring_expenses
    SET
      paid_by = p_paid_by,
      category_id = p_category_id,
      item_name = trim(p_item_name),
      amount = p_amount,
      split_type = p_split_type,
      note = NULLIF(trim(COALESCE(p_note, '')), ''),
      frequency = p_frequency,
      next_run_date = p_next_run_date,
      active = COALESCE(p_active, active)
    WHERE id = p_id
      AND household_id = p_household_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recurring expense not found';
    END IF;

    v_id := p_id;
    DELETE FROM public.recurring_expense_splits WHERE recurring_expense_id = v_id;
  END IF;

  INSERT INTO public.recurring_expense_splits (
    recurring_expense_id, user_id, share_amount, is_included
  )
  SELECT
    v_id,
    (s->>'user_id')::uuid,
    COALESCE((s->>'share_amount')::numeric, 0),
    COALESCE((s->>'is_included')::boolean, false)
  FROM jsonb_array_elements(p_splits) AS s;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_recurring_expense(p_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.recurring_expenses%ROWTYPE;
  v_splits jsonb;
  v_expense_id uuid;
BEGIN
  SELECT * INTO v_row FROM public.recurring_expenses WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring expense not found';
  END IF;

  IF auth.uid() IS NULL OR NOT public.is_household_member(v_row.household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  IF NOT v_row.active THEN
    RAISE EXCEPTION 'This recurring expense is paused';
  END IF;

  IF v_row.next_run_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'This recurring expense is not due yet';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id', s.user_id,
        'share_amount', s.share_amount,
        'is_included', s.is_included
      )
    ),
    '[]'::jsonb
  )
  INTO v_splits
  FROM public.recurring_expense_splits s
  WHERE s.recurring_expense_id = p_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.recurring_expense_id = p_id
      AND e.expense_date = v_row.next_run_date
  ) THEN
    v_expense_id := public.save_expense(
      v_row.household_id,
      v_row.paid_by,
      v_row.item_name,
      v_row.amount,
      v_row.next_run_date,
      v_row.split_type,
      v_splits,
      v_row.category_id,
      v_row.note,
      NULL,
      p_id
    );
  END IF;

  UPDATE public.recurring_expenses
  SET next_run_date = public.advance_recurring_date(v_row.next_run_date, v_row.frequency)
  WHERE id = p_id;

  RETURN v_expense_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.skip_recurring_expense(p_id uuid)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.recurring_expenses%ROWTYPE;
  v_next date;
BEGIN
  SELECT * INTO v_row FROM public.recurring_expenses WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring expense not found';
  END IF;

  IF auth.uid() IS NULL OR NOT public.is_household_member(v_row.household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  v_next := public.advance_recurring_date(v_row.next_run_date, v_row.frequency);

  UPDATE public.recurring_expenses
  SET next_run_date = v_next
  WHERE id = p_id;

  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_recurring_date(date, public.recurrence_frequency) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_budget(uuid, int, int, numeric, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_expense(uuid, uuid, text, numeric, date, public.split_type, jsonb, uuid, text, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_recurring_expense(uuid, uuid, text, numeric, public.split_type, jsonb, public.recurrence_frequency, date, uuid, text, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_recurring_expense(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.skip_recurring_expense(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.advance_recurring_date(date, public.recurrence_frequency) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_budget(uuid, int, int, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_expense(uuid, uuid, text, numeric, date, public.split_type, jsonb, uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_recurring_expense(uuid, uuid, text, numeric, public.split_type, jsonb, public.recurrence_frequency, date, uuid, text, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_recurring_expense(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.skip_recurring_expense(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
