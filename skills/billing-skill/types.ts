export type BillingPlan = "will" | "vault_annual" | "family_annual";

export const PLAN_PRICES_PAISE: Record<BillingPlan, number> = {
  will: 249900,
  vault_annual: 69900,
  family_annual: 499900,
};

export interface CheckoutRequest {
  plan: BillingPlan;
  referralCode?: string;
  userId: string;
  email: string;
}