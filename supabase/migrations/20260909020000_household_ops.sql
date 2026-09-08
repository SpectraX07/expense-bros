-- Household ops: leave, archive/restore, transfer admin, rotate invite, rename/currency.

CREATE OR REPLACE FUNCTION public.update_household(
  p_household_id uuid,
  p_name text,
  p_currency text
)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household public.households;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can update household settings';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Household name is required';
  END IF;

  IF p_currency IS NULL OR char_length(upper(trim(p_currency))) <> 3 THEN
    RAISE EXCEPTION 'Currency must be a 3-letter code';
  END IF;

  UPDATE public.households
  SET
    name = trim(p_name),
    currency = upper(trim(p_currency))
  WHERE id = p_household_id
  RETURNING * INTO v_household;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Household not found';
  END IF;

  RETURN v_household;
END;
$$;

CREATE OR REPLACE FUNCTION public.rotate_invite_code(p_household_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can rotate the invite code';
  END IF;

  LOOP
    v_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.households
      WHERE invite_code = v_code
    );
  END LOOP;

  UPDATE public.households
  SET invite_code = v_code
  WHERE id = p_household_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Household not found';
  END IF;

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_member_active(
  p_household_id uuid,
  p_user_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can change members';
  END IF;

  IF p_user_id = auth.uid() AND p_is_active = false THEN
    RAISE EXCEPTION 'Leave the household instead of archiving yourself';
  END IF;

  UPDATE public.household_members
  SET is_active = p_is_active
  WHERE household_id = p_household_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_member_role(
  p_household_id uuid,
  p_user_id uuid,
  p_role public.member_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_household_admin(p_household_id) THEN
    RAISE EXCEPTION 'Only household admins can change members';
  END IF;

  UPDATE public.household_members
  SET role = p_role
  WHERE household_id = p_household_id
    AND user_id = p_user_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_household(p_household_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_household_member(p_household_id) THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;

  UPDATE public.household_members
  SET is_active = false
  WHERE household_id = p_household_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a household member';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_household(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rotate_invite_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_member_active(uuid, uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_member_role(uuid, uuid, public.member_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_household(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_household(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rotate_invite_code(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_active(uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, uuid, public.member_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_household(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
