import { z } from "zod";
import { expenseSplitSchema, splitTypeSchema } from "@/lib/validations/expenses";

export const frequencySchema = z.enum(["monthly", "weekly"]);

export const saveRecurringSchema = z.object({
  id: z.uuid().optional(),
  householdId: z.uuid(),
  paidBy: z.uuid(),
  categoryId: z.uuid().nullable(),
  itemName: z.string().trim().min(1, "Item name is required").max(120),
  amount: z.number().positive("Amount must be greater than zero"),
  splitType: splitTypeSchema,
  frequency: frequencySchema,
  nextRunDate: z.iso.date(),
  note: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().optional(),
  splits: z.array(expenseSplitSchema).min(1),
});

export const recurringIdSchema = z.object({
  id: z.uuid(),
});

export const upsertBudgetSchema = z.object({
  householdId: z.uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative("Budget must be zero or more").nullable(),
  categoryId: z.uuid().nullable(),
});
