// ============================================
// STRIPE BILLING STUBS
// TODO: Integrate with Stripe SDK when ready
// ============================================

export type SubscriptionTier = "free" | "pro";

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  active: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/** Pro features that require a paid subscription */
const PRO_FEATURES = [
  "unlimited-portfolios",
  "etf-look-through",
  "alerts",
  "overlap-analysis",
  "research-hub",
  "ai-chatbot",
] as const;

export type ProFeature = (typeof PRO_FEATURES)[number];

/** Check if a subscription tier can access a given feature */
export function canAccess(tier: SubscriptionTier, feature: ProFeature): boolean {
  if (tier === "pro") return true;
  // Free tier has no access to pro features
  return false;
}

/** Get all features available for a tier */
export function getAvailableFeatures(tier: SubscriptionTier): ProFeature[] {
  if (tier === "pro") return [...PRO_FEATURES];
  return [];
}

// TODO: Implement with Stripe Checkout
export async function createCheckoutSession(
  _userId: string,
  _tier: SubscriptionTier
): Promise<{ url: string }> {
  throw new Error("Stripe checkout not yet implemented");
}

// TODO: Implement with Stripe Webhooks
export async function handleWebhook(
  _body: string,
  _signature: string
): Promise<void> {
  throw new Error("Stripe webhook handler not yet implemented");
}

// TODO: Implement with Stripe API
export async function getSubscriptionStatus(
  _userId: string
): Promise<SubscriptionStatus> {
  // Default to free tier until Stripe is integrated
  return {
    tier: "free",
    active: true,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}
