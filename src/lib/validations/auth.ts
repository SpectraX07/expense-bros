import { z } from "zod";
import { CURRENCIES } from "@/lib/constants";

const currencyCodes = CURRENCIES.map((item) => item.code) as [
  (typeof CURRENCIES)[number]["code"],
  ...(typeof CURRENCIES)[number]["code"][],
];

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = loginSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
});

export const magicLinkSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const createHouseholdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  currency: z.enum(currencyCodes),
});

export const joinHouseholdSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, "Enter a valid invite code")
    .max(12, "Enter a valid invite code")
    .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, "")),
});

export const switchHouseholdSchema = z.object({
  householdId: z.uuid("Choose a household"),
});

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
});

export const updateHouseholdSettingsSchema = createHouseholdSchema.extend({
  householdId: z.uuid("Choose a household"),
});

export const householdIdSchema = z.object({
  householdId: z.uuid("Choose a household"),
});

export const memberTargetSchema = householdIdSchema.extend({
  userId: z.uuid("Choose a roommate"),
});

export const setMemberActiveSchema = memberTargetSchema.extend({
  isActive: z.boolean(),
});

export const setMemberRoleSchema = memberTargetSchema.extend({
  role: z.enum(["admin", "member"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
