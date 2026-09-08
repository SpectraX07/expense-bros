-- Helpers, RPCs, and triggers
-- SECURITY DEFINER functions use a fixed search_path to avoid search-path attacks
-- and to bypass RLS when checking membership (prevents recursive policy loops).

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_household_invite_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR length(trim(NEW.invite_code)) = 0 THEN
    LOOP
      NEW.invite_code := public.generate_invite_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM public.households
        WHERE invite_code = NEW.invite_code
      );
    END LOOP;
  ELSE
    NEW.invite_code := upper(trim(NEW.invite_code));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_expense_period()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.month := EXTRACT(MONTH FROM NEW.expense_date)::int;
  NEW.year := EXTRACT(YEAR FROM NEW.expense_date)::int;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_household_admin(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_member(p_household_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = p_user_id
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_household_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members me
    JOIN public.household_members them
      ON them.household_id = me.household_id
    WHERE me.user_id = auth.uid()
      AND me.is_active = true
      AND them.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_mutate_expense(p_expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.expenses e
    WHERE e.id = p_expense_id
      AND public.is_household_member(e.household_id)
      AND (
        e.created_by = auth.uid()
        OR public.is_household_admin(e.household_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_mutate_recurring_expense(p_recurring_expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.recurring_expenses r
    WHERE r.id = p_recurring_expense_id
      AND public.is_household_member(r.household_id)
      AND (
        r.created_by = auth.uid()
        OR public.is_household_admin(r.household_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1),
      ''
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.household_members (household_id, user_id, role, is_active)
  VALUES (NEW.id, NEW.created_by, 'admin', true);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id uuid;
  v_admin_count int;
  v_losing_admin boolean := false;
BEGIN
  v_household_id := COALESCE(NEW.household_id, OLD.household_id);

  IF TG_OP = 'DELETE' THEN
    v_losing_admin := OLD.role = 'admin' AND OLD.is_active;
  ELSIF TG_OP = 'UPDATE' THEN
    v_losing_admin :=
      OLD.role = 'admin'
      AND OLD.is_active
      AND (NEW.is_active = false OR NEW.role <> 'admin');
  END IF;

  IF v_losing_admin THEN
    SELECT count(*)
    INTO v_admin_count
    FROM public.household_members
    WHERE household_id = v_household_id
      AND role = 'admin'
      AND is_active = true
      AND user_id <> OLD.user_id;

    IF v_admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove or demote the last household admin';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_household(
  p_name text,
  p_currency text DEFAULT 'INR'
)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_household public.households;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Household name is required';
  END IF;

  INSERT INTO public.households (name, currency, created_by)
  VALUES (
    trim(p_name),
    upper(trim(COALESCE(p_currency, 'INR'))),
    v_user_id
  )
  RETURNING * INTO v_household;

  RETURN v_household;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_household(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_household_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id
  INTO v_household_id
  FROM public.households
  WHERE invite_code = upper(trim(p_invite_code));

  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.household_members (household_id, user_id, role, is_active)
  VALUES (v_household_id, v_user_id, 'member', true)
  ON CONFLICT (household_id, user_id) DO UPDATE
    SET is_active = true,
        joined_at = CASE
          WHEN household_members.is_active THEN household_members.joined_at
          ELSE now()
        END;

  RETURN v_household_id;
END;
$$;

-- Triggers

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER households_assign_invite_code
  BEFORE INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_household_invite_code();

CREATE TRIGGER households_set_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER households_add_creator_as_admin
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_household();

CREATE TRIGGER household_members_prevent_last_admin
  BEFORE UPDATE OR DELETE ON public.household_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_removal();

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER budgets_set_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER expenses_sync_period
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_expense_period();

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER settlements_set_updated_at
  BEFORE UPDATE ON public.settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER recurring_expenses_set_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.is_household_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_household_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_member(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shares_household_with(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_mutate_expense(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_mutate_recurring_expense(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_household(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_household(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_household_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_household_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_household_with(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_mutate_expense(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_mutate_recurring_expense(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_household(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_household(text) TO authenticated;
