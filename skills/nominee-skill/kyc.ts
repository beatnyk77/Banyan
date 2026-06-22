export type KycStatus =
  | "pending"
  | "invited"
  | "kyc_submitted"
  | "kyc_verified"
  | "rejected";

export function nextKycStatus(current: KycStatus, event: "invite" | "submit" | "verify" | "reject"): KycStatus {
  const transitions: Record<KycStatus, Partial<Record<typeof event, KycStatus>>> = {
    pending: { invite: "invited" },
    invited: { submit: "kyc_submitted" },
    kyc_submitted: { verify: "kyc_verified", reject: "rejected" },
    kyc_verified: {},
    rejected: { submit: "kyc_submitted" },
  };
  const next = transitions[current][event];
  if (!next) {
    throw new Error(`Invalid KYC transition: ${current} + ${event}`);
  }
  return next;
}