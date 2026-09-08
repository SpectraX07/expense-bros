-- Atomic expense writes and allow members to add household categories while logging.

CREATE POLICY categories_insert_member
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (
    household_id IS NOT NULL
    AND public.is_household_member(household_id)
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
  p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
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
      created_by
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
      v_user
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

REVOKE ALL ON FUNCTION public.save_expense(
  uuid, uuid, text, numeric, date, public.split_type, jsonb, uuid, text, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_expense(
  uuid, uuid, text, numeric, date, public.split_type, jsonb, uuid, text, uuid
) TO authenticated;
