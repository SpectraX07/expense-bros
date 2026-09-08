export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export function firstZodError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export function publicErrorMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid invite")) {
    return "That invite code is not valid.";
  }
  if (lower.includes("invalid login")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("already registered") || lower.includes("user already")) {
    return "An account with that email already exists. Sign in instead.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email before signing in. Check your inbox.";
  }
  if (lower.includes("not authenticated")) {
    return "Please sign in again.";
  }

  return message;
}
