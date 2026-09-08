import { z } from "zod";

export const createSettlementSchema = z.object({
  householdId: z.uuid(),
  fromUserId: z.uuid(),
  toUserId: z.uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  note: z.string().trim().max(200).optional().nullable(),
});

export const settlementIdSchema = z.object({
  id: z.uuid(),
});
