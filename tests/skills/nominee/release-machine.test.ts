import { describe, it, expect } from "vitest";
import {
  canTransition,
  computeTimeLockExpiry,
  isTerminalStatus,
  transitionRelease,
} from "@/skills/nominee-skill/release-state-machine";
import { RELEASE_TRANSITIONS, TIME_LOCK_DAYS } from "@/skills/nominee-skill/types";

describe("Release state machine", () => {
  it("allows all defined transitions", () => {
    for (const [from, targets] of Object.entries(RELEASE_TRANSITIONS)) {
      for (const to of targets) {
        expect(canTransition(from as keyof typeof RELEASE_TRANSITIONS, to)).toBe(true);
        expect(() =>
          transitionRelease(from as keyof typeof RELEASE_TRANSITIONS, to)
        ).not.toThrow();
      }
    }
  });

  it("rejects invalid transitions", () => {
    expect(() => transitionRelease("requested", "approved")).toThrow(
      "Invalid release transition"
    );
    expect(() => transitionRelease("completed", "requested")).toThrow();
    expect(canTransition("completed", "requested")).toBe(false);
  });

  it("computes 7-day time lock expiry", () => {
    const from = new Date("2026-06-17T12:00:00Z");
    const expiry = computeTimeLockExpiry(from);
    const diffDays =
      (new Date(expiry).getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(TIME_LOCK_DAYS);
  });

  it("identifies terminal statuses", () => {
    expect(isTerminalStatus("rejected")).toBe(true);
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("time_lock")).toBe(false);
  });
});