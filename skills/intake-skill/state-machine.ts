export const INTAKE_STATES = [
  "welcome",
  "owner_profile",
  "family_map",
  "asset_bank",
  "asset_mutual_fund",
  "asset_insurance",
  "asset_property",
  "asset_epf_ppf",
  "asset_demat",
  "asset_locker",
  "asset_crypto",
  "asset_vehicle",
  "asset_loan",
  "asset_digital_account",
  "asset_domain",
  "bequest_intent",
  "review",
  "complete",
] as const;

export type IntakeStateId = (typeof INTAKE_STATES)[number];

const TRANSITIONS: Record<IntakeStateId, IntakeStateId | null> = {
  welcome: "owner_profile",
  owner_profile: "family_map",
  family_map: "asset_bank",
  asset_bank: "asset_mutual_fund",
  asset_mutual_fund: "asset_insurance",
  asset_insurance: "asset_property",
  asset_property: "asset_epf_ppf",
  asset_epf_ppf: "asset_demat",
  asset_demat: "asset_locker",
  asset_locker: "asset_crypto",
  asset_crypto: "asset_vehicle",
  asset_vehicle: "asset_loan",
  asset_loan: "asset_digital_account",
  asset_digital_account: "asset_domain",
  asset_domain: "bequest_intent",
  bequest_intent: "review",
  review: "complete",
  complete: null,
};

export function nextState(current: IntakeStateId): IntakeStateId | null {
  return TRANSITIONS[current];
}

export function isTerminal(state: IntakeStateId): boolean {
  return state === "complete";
}

export function stateIndex(state: IntakeStateId): number {
  return INTAKE_STATES.indexOf(state);
}

export function progressPct(state: IntakeStateId): number {
  const idx = stateIndex(state);
  return Math.round(((idx + 1) / INTAKE_STATES.length) * 100);
}