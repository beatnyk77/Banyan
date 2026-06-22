import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    NOMINEE_TOKEN_SECRET: "test-nominee-secret-min-32-chars-long",
    VETO_TOKEN_SECRET: "test-veto-secret-min-32-chars-long!!",
  }),
}));

import {
  createNomineeInviteToken,
  createVetoToken,
  verifyNomineeInviteToken,
  verifyVetoToken,
} from "@/lib/nominee-tokens";

describe("nominee tokens", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips nominee invite token", () => {
    const token = createNomineeInviteToken("nominee-uuid-1");
    expect(verifyNomineeInviteToken(token)).toBe("nominee-uuid-1");
  });

  it("round-trips veto token", () => {
    const token = createVetoToken({
      nomineeId: "nominee-2",
      releaseEventId: "release-1",
    });
    const payload = verifyVetoToken(token);
    expect(payload).toEqual({
      nomineeId: "nominee-2",
      releaseEventId: "release-1",
    });
  });

  it("rejects tampered token", () => {
    const token = createNomineeInviteToken("nominee-uuid-1");
    expect(verifyNomineeInviteToken(`${token}x`)).toBeNull();
  });
});