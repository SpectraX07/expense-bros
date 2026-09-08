-- Global default categories (household_id IS NULL). Households can add their own later.

INSERT INTO public.categories (household_id, name, icon, color) VALUES
  (NULL, 'Rent', 'home', '#6366f1'),
  (NULL, 'Utilities', 'zap', '#f59e0b'),
  (NULL, 'Internet', 'wifi', '#3b82f6'),
  (NULL, 'Groceries', 'shopping-cart', '#22c55e'),
  (NULL, 'Household', 'sofa', '#14b8a6'),
  (NULL, 'Dining out', 'utensils', '#ef4444'),
  (NULL, 'Transport', 'car', '#8b5cf6'),
  (NULL, 'Entertainment', 'clapperboard', '#ec4899'),
  (NULL, 'Health', 'heart-pulse', '#f43f5e'),
  (NULL, 'Other', 'ellipsis', '#64748b');
