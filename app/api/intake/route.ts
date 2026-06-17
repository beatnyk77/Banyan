import { NextRequest, NextResponse } from "next/server";
import { assertNoPII } from "@/lib/crypto/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EstateJsonSchema, type EstateJson } from "@/skills/intake-skill/estate-schema";
import { createEmptyEstate } from "@/skills/intake-skill/empty-estate";
import {
  ensureEstate,
  loadPersistedState,
  persistState,
} from "@/skills/intake-skill/resume";
import { INTAKE_STATES, type IntakeStateId } from "@/skills/intake-skill/state-machine";
import { processIntakeTurn } from "@/skills/intake-skill/turn";
import type { ModelMessage } from "@/lib/model-adapter/types";

function parseState(value: unknown): IntakeStateId {
  if (typeof value === "string" && INTAKE_STATES.includes(value as IntakeStateId)) {
    return value as IntakeStateId;
  }
  return "welcome";
}

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const persisted = await ensureEstate(user.id);
  return NextResponse.json({
    estateId: persisted.estateId,
    currentState: persisted.currentState,
    encryptedEstate: persisted.encryptedEstate ?? null,
    envelopeMeta: persisted.envelopeMeta ?? null,
  });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const action = body.action as string;

  if (action === "persist") {
    const estateId = body.estateId as string;
    const currentState = parseState(body.currentState);
    const estateJsonEnc = body.estateJsonEnc as string;
    const envelopeMeta = body.envelopeMeta;

    if (!estateId || !estateJsonEnc) {
      return NextResponse.json({ error: "estateId and estateJsonEnc required" }, { status: 400 });
    }

    try {
      assertNoPII(estateJsonEnc, "intake/persist");
      assertNoPII(envelopeMeta, "intake/persist-meta");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "PII validation failed" },
        { status: 400 }
      );
    }

    const existing = await loadPersistedState(user.id);
    if (!existing || existing.estateId !== estateId) {
      return NextResponse.json({ error: "Estate not found" }, { status: 404 });
    }

    await persistState({
      estateId,
      currentState,
      encryptedEstate: estateJsonEnc,
      envelopeMeta,
    });

    return NextResponse.json({ ok: true, currentState });
  }

  if (action === "turn") {
    const currentState = parseState(body.currentState);
    const userMessage = (body.message as string) ?? "";
    const recentMessages = (body.recentMessages as ModelMessage[]) ?? [];

    let estate: EstateJson;
    try {
      estate = body.estate
        ? EstateJsonSchema.parse(body.estate)
        : createEmptyEstate();
    } catch {
      return NextResponse.json({ error: "Invalid estate payload" }, { status: 400 });
    }

    await ensureEstate(user.id);

    const result = await processIntakeTurn({
      currentState,
      estate,
      userMessage,
      recentMessages,
    });

    return NextResponse.json({
      assistantMessage: result.assistantMessage,
      estateDelta: result.estateDelta,
      estate: result.estate,
      nextState: result.nextState,
      completed: result.completed,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}