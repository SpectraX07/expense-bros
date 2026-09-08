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
  if (lower.includes("you cannot edit this recurring")) {
    return "You can only edit recurring expenses you created, unless you are an admin.";
  }
  if (lower.includes("not due yet")) {
    return "That recurring expense is not due yet.";
  }
  if (lower.includes("recurring expense is paused")) {
    return "Resume this template before adding it.";
  }
  if (lower.includes("recurring expense not found")) {
    return "That recurring expense could not be found.";
  }
  if (lower.includes("duplicate key") || lower.includes("unique")) {
    return "A category with that name already exists.";
  }
  if (lower.includes("cannot remove or demote the last")) {
    return "Promote another roommate to admin first.";
  }
  if (lower.includes("only household admins can update household")) {
    return "Only household admins can change household settings.";
  }
  if (lower.includes("only household admins can rotate")) {
    return "Only household admins can rotate the invite code.";
  }
  if (lower.includes("only household admins can change members")) {
    return "Only household admins can change members.";
  }
  if (lower.includes("leave the household instead")) {
    return "Use Leave household to remove yourself.";
  }
  if (lower.includes("member not found")) {
    return "That roommate could not be found.";
  }
  if (lower.includes("household not found")) {
    return "That household could not be found.";
  }
  if (lower.includes("household name is required")) {
    return "Household name is required.";
  }
  if (lower.includes("currency must be")) {
    return "Choose a supported currency.";
  }

  return message;
}
