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
  if (lower.includes("splits must add up")) {
    return "Splits must add up to the total amount.";
  }
  if (lower.includes("at least one person")) {
    return "Select at least one person to split with.";
  }
  if (lower.includes("cannot edit this expense")) {
    return "You can only edit expenses you created, unless you are an admin.";
  }
  if (lower.includes("payer must be")) {
    return "Choose who paid from the current household.";
  }
  if (lower.includes("only household admins can set")) {
    return "Only household admins can set the budget.";
  }
  if (lower.includes("budget must be zero or more")) {
    return "Budget must be zero or more.";
  }
  if (lower.includes("not a household member")) {
    return "You are not in this household.";
  }
  if (lower.includes("year and month must both")) {
    return "Pick a month or view all-time, not a mix of both.";
  }
  if (lower.includes("duplicate key") || lower.includes("unique")) {
    return "A category with that name already exists.";
  }

  return message;
}
