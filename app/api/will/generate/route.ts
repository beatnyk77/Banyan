import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";
import { assembleWill } from "@/skills/clause-assembly-skill/assembler";
import { EstateJsonSchema } from "@/skills/intake-skill/estate-schema";
import { loadPersistedState } from "@/skills/intake-skill/resume";

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  let estate;
  try {
    estate = EstateJsonSchema.parse(body.estate);
  } catch {
    return NextResponse.json({ error: "Invalid estate payload" }, { status: 400 });
  }

  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  if (persisted.currentState !== "complete") {
    return NextResponse.json(
      { error: "Complete your asset registry before generating a will" },
      { status: 400 }
    );
  }

  try {
    const will = await assembleWill(estate, { useLlm: false });

    const service = createServiceClient();
    const { data: existing } = await service
      .from("wills")
      .select("version")
      .eq("estate_id", persisted.estateId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (existing?.version ?? 0) + 1;

    const { error: insertError } = await service.from("wills").insert({
      estate_id: persisted.estateId,
      version: nextVersion,
      clause_set_hash: will.clause_set_hash,
      clause_library_version: will.clause_library_version,
      religion_branch: will.religion_branch,
      status: "draft",
    });

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to save will: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ will, version: nextVersion });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Will generation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data } = await service
    .from("wills")
    .select("version, clause_set_hash, clause_library_version, religion_branch, status, generated_at")
    .eq("estate_id", persisted.estateId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    intakeComplete: persisted.currentState === "complete",
    latestWill: data ?? null,
  });
}