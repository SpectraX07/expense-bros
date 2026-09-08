export function budgetStatus(spent: number, budget: number | null) {
  if (budget === null || budget <= 0) {
    return { label: "No budget set", tone: "muted" as const, percent: 0 };
  }

  const percent = Math.round((spent / budget) * 100);

  if (spent > budget) {
    return { label: "Over budget", tone: "danger" as const, percent };
  }
  if (percent >= 80) {
    return { label: "Close to budget", tone: "warn" as const, percent };
  }
  return { label: "On track", tone: "ok" as const, percent };
}
