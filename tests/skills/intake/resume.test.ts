import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "test-estate-id",
              intake_state: "asset_bank",
              estate_json_enc: "aabbcc",
              estate_envelope_meta: { v: 1 },
            },
          }),
          single: async () => ({
            data: {
              id: "test-estate-id",
              intake_state: "asset_bank",
              estate_json_enc: "aabbcc",
              estate_envelope_meta: { v: 1 },
            },
          }),
        }),
      }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: {
              id: "new-estate-id",
              intake_state: "welcome",
              estate_json_enc: null,
              estate_envelope_meta: null,
            },
          }),
        }),
      }),
    }),
  }),
}));

import { loadPersistedState } from "@/skills/intake-skill/resume";

describe("IntakeResume — no conversation persistence", () => {
  it("loads current_state and encrypted estate only", async () => {
    const state = await loadPersistedState("user-123");
    expect(state).not.toBeNull();
    expect(state!.currentState).toBe("asset_bank");
    expect(state!.encryptedEstate).toBe("aabbcc");
  });

  it("PersistedIntakeState has no conversationHistory field", async () => {
    const state = await loadPersistedState("user-123");
    expect(state).not.toHaveProperty("conversationHistory");
  });
});