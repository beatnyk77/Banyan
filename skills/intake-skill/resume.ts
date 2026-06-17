import { createServiceClient } from "@/lib/supabase/server";
import type { IntakeStateId } from "./state-machine";

export interface PersistedIntakeState {
  estateId: string;
  currentState: IntakeStateId;
  encryptedEstate?: string;
  envelopeMeta?: unknown;
}

interface EstateRow {
  id: string;
  intake_state: string;
  estate_json_enc: string | null;
  estate_envelope_meta: unknown;
}

function toPersisted(row: EstateRow): PersistedIntakeState {
  return {
    estateId: row.id,
    currentState: row.intake_state as IntakeStateId,
    encryptedEstate: row.estate_json_enc ?? undefined,
    envelopeMeta: row.estate_envelope_meta ?? undefined,
  };
}

export async function loadPersistedState(
  userId: string
): Promise<PersistedIntakeState | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("estates")
    .select("id, intake_state, estate_json_enc, estate_envelope_meta")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return toPersisted(data as EstateRow);
}

export async function ensureEstate(userId: string): Promise<PersistedIntakeState> {
  const existing = await loadPersistedState(userId);
  if (existing) return existing;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("estates")
    .insert({ user_id: userId, intake_state: "welcome" })
    .select("id, intake_state, estate_json_enc, estate_envelope_meta")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create estate: ${error?.message ?? "unknown"}`);
  }

  return toPersisted(data as EstateRow);
}

export async function persistState(state: PersistedIntakeState): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("estates")
    .update({
      intake_state: state.currentState,
      estate_json_enc: state.encryptedEstate ?? null,
      estate_envelope_meta: state.envelopeMeta ?? null,
      intake_completed_at:
        state.currentState === "complete" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", state.estateId);

  if (error) {
    throw new Error(`Failed to persist intake state: ${error.message}`);
  }
}