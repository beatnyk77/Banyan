export type ReleaseStatus =
  | "requested"
  | "death_cert_submitted"
  | "ops_review"
  | "time_lock"
  | "approved"
  | "rejected"
  | "completed";

export const RELEASE_TRANSITIONS: Record<ReleaseStatus, ReleaseStatus[]> = {
  requested: ["death_cert_submitted", "rejected"],
  death_cert_submitted: ["ops_review", "rejected"],
  ops_review: ["time_lock", "rejected"],
  time_lock: ["approved", "rejected"],
  approved: ["completed"],
  rejected: [],
  completed: [],
};

export const TIME_LOCK_DAYS = 7;