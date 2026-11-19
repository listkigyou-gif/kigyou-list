export type PlanId = "free" | "trial" | "pro" | "business" | "enterprise";

export const WATCHLIST_LIMITS: Record<PlanId, number> = {
  free: 10,
  trial: 10,
  pro: 100,
  business: 500,
  enterprise: 1000,
};

/**
 * Daily free form-outreach credits granted to FREE plan accounts (resets daily in JST).
 * Unlike CSV export (20/day, 50/day for verified partners), form credits stay at 20/day.
 */
export const FREE_DAILY_FORM_CREDITS = 20;

export function normalizePlanId(plan?: string | null, role?: string | null): PlanId {
  const candidate = (
    plan && plan !== "trial"
      ? plan
      : role && role !== "admin" && role !== "trial"
      ? role
      : plan || "free"
  )?.toLowerCase();

  if (
    candidate === "pro" ||
    candidate === "business" ||
    candidate === "enterprise" ||
    candidate === "trial"
  ) {
    return candidate;
  }
  return "free";
}

export function getWatchlistLimit(plan?: string | null, role?: string | null): number {
  if (role?.toLowerCase() === "admin" || plan?.toLowerCase() === "admin") {
    return Infinity;
  }
  const normalized = normalizePlanId(plan, role);
  return WATCHLIST_LIMITS[normalized] ?? WATCHLIST_LIMITS.free;
}
