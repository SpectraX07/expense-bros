import { z } from "zod";

export const setOverallBudgetSchema = z.object({
  householdId: z.uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative("Budget must be zero or more"),
});

export type SetOverallBudgetInput = z.infer<typeof setOverallBudgetSchema>;
