-- Dashboard aggregates in Postgres so the app does not sum expense rows client-side.

CREATE OR REPLACE FUNCTION public.dashboard_stats(
  p_household_id uuid,
  p_year int,
  p_month int,
  p_trend_months int DEFAULT 6
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_months int := LEAST(GREATEST(COALESCE(p_trend_months, 6), 1), 24);
  v_start date;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  v_start := (make_date(p_year, p_month, 1) - ((v_months - 1) * interval '1 month'))::date;

  SELECT jsonb_build_object(
    'totalSpent', COALESCE((
      SELECT SUM(amount)
      FROM public.expenses
      WHERE household_id = p_household_id
        AND year = p_year
        AND month = p_month
    ), 0),
    'expenseCount', COALESCE((
      SELECT COUNT(*)
      FROM public.expenses
      WHERE household_id = p_household_id
        AND year = p_year
        AND month = p_month
    ), 0),
    'overallBudget', (
      SELECT planned_amount
      FROM public.budgets
      WHERE household_id = p_household_id
        AND year = p_year
        AND month = p_month
        AND category_id IS NULL
      LIMIT 1
    ),
    'byCategory', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', x.category_id,
          'name', x.name,
          'color', x.color,
          'amount', x.amount
        )
        ORDER BY x.amount DESC
      )
      FROM (
        SELECT
          e.category_id,
          COALESCE(c.name, 'Uncategorized') AS name,
          COALESCE(c.color, '#64748b') AS color,
          SUM(e.amount) AS amount
        FROM public.expenses e
        LEFT JOIN public.categories c ON c.id = e.category_id
        WHERE e.household_id = p_household_id
          AND e.year = p_year
          AND e.month = p_month
        GROUP BY e.category_id, c.name, c.color
      ) x
    ), '[]'::jsonb),
    'byPayer', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'userId', x.paid_by,
          'fullName', x.full_name,
          'amount', x.amount
        )
        ORDER BY x.amount DESC
      )
      FROM (
        SELECT
          e.paid_by,
          COALESCE(p.full_name, 'Roommate') AS full_name,
          SUM(e.amount) AS amount
        FROM public.expenses e
        JOIN public.profiles p ON p.id = e.paid_by
        WHERE e.household_id = p_household_id
          AND e.year = p_year
          AND e.month = p_month
        GROUP BY e.paid_by, p.full_name
      ) x
    ), '[]'::jsonb),
    'trend', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'year', t.year,
          'month', t.month,
          'amount', t.amount
        )
        ORDER BY t.year, t.month
      )
      FROM (
        SELECT
          EXTRACT(YEAR FROM d)::int AS year,
          EXTRACT(MONTH FROM d)::int AS month,
          COALESCE((
            SELECT SUM(e.amount)
            FROM public.expenses e
            WHERE e.household_id = p_household_id
              AND e.year = EXTRACT(YEAR FROM d)::int
              AND e.month = EXTRACT(MONTH FROM d)::int
          ), 0) AS amount
        FROM generate_series(
          v_start,
          make_date(p_year, p_month, 1),
          interval '1 month'
        ) AS d
      ) t
    ), '[]'::jsonb),
    'recent', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'itemName', r.item_name,
          'amount', r.amount,
          'expenseDate', r.expense_date,
          'paidByName', r.full_name
        )
        ORDER BY r.expense_date DESC, r.sort_at DESC
      )
      FROM (
        SELECT
          e.id,
          e.item_name,
          e.amount,
          e.expense_date,
          e.created_at AS sort_at,
          COALESCE(p.full_name, 'Roommate') AS full_name
        FROM public.expenses e
        JOIN public.profiles p ON p.id = e.paid_by
        WHERE e.household_id = p_household_id
          AND e.year = p_year
          AND e.month = p_month
        ORDER BY e.expense_date DESC, e.created_at DESC
        LIMIT 5
      ) r
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
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
  IF auth.uid() IS NULL OR NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can set the budget';
  END IF;

  IF p_amount < 0 THEN
    RAISE EXCEPTION 'Budget must be zero or more';
  END IF;

  UPDATE public.budgets
  SET planned_amount = p_amount
  WHERE household_id = p_household_id
    AND year = p_year
    AND month = p_month
    AND category_id IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.budgets (household_id, year, month, category_id, planned_amount)
    VALUES (p_household_id, p_year, p_month, NULL, p_amount);
  END IF;

  RETURN p_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.dashboard_stats(uuid, int, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_overall_budget(uuid, int, int, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid, int, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_overall_budget(uuid, int, int, numeric) TO authenticated;
