ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_handle text;

COMMENT ON COLUMN public.profiles.payment_handle IS
  'How to pay this person: UPI VPA for INR households, or a generic payment handle.';
