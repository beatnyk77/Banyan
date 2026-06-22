import { NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";
import { verifyVetoToken } from "@/lib/nominee-tokens";
import { createServiceClient } from "@/lib/supabase/server";
import { transitionRelease } from "@/skills/nominee-skill/release-state-machine";
import type { ReleaseStatus } from "@/skills/nominee-skill/types";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const payload = verifyVetoToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired veto token" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: event } = await service
    .from("release_events")
    .select("id, status, estate_id, time_lock_expires_at")
    .eq("id", payload.releaseEventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Release event not found" }, { status: 404 });
  }

  return NextResponse.json({
    releaseEventId: event.id,
    status: event.status,
    time_lock_expires_at: event.time_lock_expires_at,
    canVeto: event.status === "time_lock",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token as string;

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const payload = verifyVetoToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired veto token" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: nominee } = await service
    .from("nominees")
    .select("id, estate_id, kyc_status")
    .eq("id", payload.nomineeId)
    .single();

  if (!nominee || nominee.kyc_status !== "kyc_verified") {
    return NextResponse.json({ error: "Unauthorized nominee" }, { status: 403 });
  }

  const { data: event, error: fetchError } = await service
    .from("release_events")
    .select("id, status, estate_id, initiator_nominee_id")
    .eq("id", payload.releaseEventId)
    .eq("estate_id", nominee.estate_id)
    .single();

  if (fetchError || !event) {
    return NextResponse.json({ error: "Release event not found" }, { status: 404 });
  }

  if (event.initiator_nominee_id === nominee.id) {
    return NextResponse.json(
      { error: "Initiating nominee cannot veto their own release request" },
      { status: 400 }
    );
  }

  if (event.status !== "time_lock") {
    return NextResponse.json(
      { error: "Veto is only allowed during the time-lock period" },
      { status: 400 }
    );
  }

  try {
    transitionRelease(event.status as ReleaseStatus, "rejected");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid transition" },
      { status: 400 }
    );
  }

  const { error: updateError } = await service
    .from("release_events")
    .update({
      status: "rejected",
      ops_notes: `Vetoed by nominee ${nominee.id}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  return NextResponse.json({
    ok: true,
    message: "Release request vetoed. The estate owner has been notified.",
    appUrl: NEXT_PUBLIC_APP_URL,
  });
}