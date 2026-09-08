"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/http";
import { INVITE_COOKIE } from "@/lib/constants";
import {
  firstZodError,
  publicErrorMessage,
  type ActionResult,
} from "@/lib/actions";
import {
  loginSchema,
  magicLinkSchema,
  signUpSchema,
} from "@/lib/validations/auth";

async function emailRedirectTo() {
  const origin = await getSiteOrigin();
  return `${origin}/auth/callback`;
}

export async function signInWithPassword(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: await emailRedirectTo(),
    },
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    ok: true,
    message: "Check your email to confirm your account, then sign in.",
  };
}

export async function sendMagicLink(input: unknown): Promise<ActionResult> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: await emailRedirectTo(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: publicErrorMessage(error.message) };
  }

  return {
    ok: true,
    message: "Magic link sent. Check your email to continue.",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE);
  redirect("/login");
}
