import { z } from "zod";

export const splitTypeSchema = z.enum([
  "equal",
  "percentage",
  "custom_amount",
  "shares",
]);

export const expenseSplitSchema = z.object({
  userId: z.uuid(),
  shareAmount: z.number().nonnegative(),
  isIncluded: z.boolean(),
});

export const saveExpenseSchema = z.object({
  id: z.uuid().optional(),
  householdId: z.uuid(),
  paidBy: z.uuid(),
  categoryId: z.uuid().nullable(),
  itemName: z.string().trim().min(1, "Item name is required").max(120),
  amount: z.number().positive("Amount must be greater than zero"),
  expenseDate: z.iso.date(),
  splitType: splitTypeSchema,
  note: z.string().trim().max(500).optional().nullable(),
  splits: z.array(expenseSplitSchema).min(1),
});

export const createCategorySchema = z.object({
  householdId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(40),
  icon: z.string().trim().max(40).optional().nullable(),
  color: z.string().trim().max(16).optional().nullable(),
});

export const updateCategorySchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(40),
  icon: z.string().trim().max(40).optional().nullable(),
  color: z.string().trim().max(16).optional().nullable(),
});

export const archiveCategorySchema = z.object({
  id: z.uuid(),
  householdId: z.uuid(),
  archived: z.boolean(),
});

export const deleteExpenseSchema = z.object({
  id: z.uuid(),
});

export type SaveExpenseInput = z.infer<typeof saveExpenseSchema>;
