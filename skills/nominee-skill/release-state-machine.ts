import {
  RELEASE_TRANSITIONS,
  TIME_LOCK_DAYS,
  type ReleaseStatus,
} from "./types";

export function canTransition(from: ReleaseStatus, to: ReleaseStatus): boolean {
  return RELEASE_TRANSITIONS[from].includes(to);
}

export function transitionRelease(
  current: ReleaseStatus,
  next: ReleaseStatus
): ReleaseStatus {
  if (!canTransition(current, next)) {
    throw new Error(`Invalid release transition: ${current} → ${next}`);
  }
  return next;
}

export function computeTimeLockExpiry(from = new Date()): string {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + TIME_LOCK_DAYS);
  return expiry.toISOString();
}

export function isTerminalStatus(status: ReleaseStatus): boolean {
  return status === "rejected" || status === "completed";
}