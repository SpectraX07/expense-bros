-- Settlement balances aggregated in Postgres. Year/month NULL means all-time.

CREATE OR REPLACE FUNCTION public.settlement_balances(
  p_household_id uuid,
  p_year int DEFAULT NULL,
  p_month int DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  is_active boolean,
  paid numeric,
  fair_share numeric,
  settled_out numeric,
  settled_in numeric,
  net numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  IF (p_year IS NULL) <> (p_month IS NULL) THEN
    RAISE EXCEPTION 'Year and month must both be set or both empty';
  END IF;

  RETURN QUERY
  WITH people AS (
    SELECT
      hm.user_id AS member_id,
      p.full_name AS member_name,
      p.avatar_url AS member_avatar,
      hm.is_active AS member_active
    FROM public.household_members hm
    JOIN public.profiles p ON p.id = hm.user_id
    WHERE hm.household_id = p_household_id
  ),
  paid_totals AS (
    SELECT
      e.paid_by AS member_id,
      SUM(e.amount) AS amount
    FROM public.expenses e
    WHERE e.household_id = p_household_id
      AND (p_year IS NULL OR (e.year = p_year AND e.month = p_month))
    GROUP BY e.paid_by
  ),
  share_totals AS (
    SELECT
      es.user_id AS member_id,
      SUM(es.share_amount) AS amount
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE e.household_id = p_household_id
      AND (p_year IS NULL OR (e.year = p_year AND e.month = p_month))
    GROUP BY es.user_id
  ),
  out_totals AS (
    SELECT
      s.from_user AS member_id,
      SUM(s.amount) AS amount
    FROM public.settlements s
    WHERE s.household_id = p_household_id
      AND s.status = 'confirmed'
      AND (p_year IS NULL OR (s.year = p_year AND s.month = p_month))
    GROUP BY s.from_user
  ),
  in_totals AS (
    SELECT
      s.to_user AS member_id,
      SUM(s.amount) AS amount
    FROM public.settlements s
    WHERE s.household_id = p_household_id
      AND s.status = 'confirmed'
      AND (p_year IS NULL OR (s.year = p_year AND s.month = p_month))
    GROUP BY s.to_user
  )
  SELECT
    people.member_id,
    people.member_name,
    people.member_avatar,
    people.member_active,
    COALESCE(paid_totals.amount, 0)::numeric,
    COALESCE(share_totals.amount, 0)::numeric,
    COALESCE(out_totals.amount, 0)::numeric,
    COALESCE(in_totals.amount, 0)::numeric,
    (
      COALESCE(paid_totals.amount, 0)
      - COALESCE(share_totals.amount, 0)
      - COALESCE(out_totals.amount, 0)
      + COALESCE(in_totals.amount, 0)
    )::numeric
  FROM people
  LEFT JOIN paid_totals ON paid_totals.member_id = people.member_id
  LEFT JOIN share_totals ON share_totals.member_id = people.member_id
  LEFT JOIN out_totals ON out_totals.member_id = people.member_id
  LEFT JOIN in_totals ON in_totals.member_id = people.member_id
  WHERE people.member_active
    OR COALESCE(paid_totals.amount, 0) <> 0
    OR COALESCE(share_totals.amount, 0) <> 0
    OR COALESCE(out_totals.amount, 0) <> 0
    OR COALESCE(in_totals.amount, 0) <> 0
  ORDER BY people.member_name;
END;
$$;

REVOKE ALL ON FUNCTION public.settlement_balances(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settlement_balances(uuid, int, int) TO authenticated;

NOTIFY pgrst, 'reload schema';
