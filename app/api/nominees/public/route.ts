import { NextRequest, NextResponse } from "next/server";
import { resolveNomineeByAccessToken } from "@/lib/nominee/resolve";
import { createServiceClient } from "@/lib/supabase/server";
import { hasDigilockerCredentials } from "@/lib/env";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const nominee = await resolveNomineeByAccessToken(token);
  if (!nominee) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: events } = await service
    .from("release_events")
    .select("id, status, time_lock_expires_at, created_at, updated_at")
    .eq("estate_id", nominee.estate_id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    nominee: {
      id: nominee.id,
      full_name: nominee.full_name,
      kyc_status: nominee.kyc_status,
    },
    release_events: events ?? [],
    digilocker_configured: hasDigilockerCredentials(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token as string;
  const action = body.action as string;

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const nominee = await resolveNomineeByAccessToken(token);
  if (!nominee) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const service = createServiceClient();

  if (action === "request_release") {
    if (nominee.kyc_status !== "kyc_verified") {
      return NextResponse.json(
        { error: "KYC verification required before requesting release" },
        { status: 403 }
      );
    }

    const { data: existing } = await service
      .from("release_events")
      .select("id, status")
      .eq("estate_id", nominee.estate_id)
      .not("status", "in", '("rejected","completed")')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An active release request already exists", releaseEventId: existing.id },
        { status: 409 }
      );
    }

    const { data: event, error: insertError } = await service
      .from("release_events")
      .insert({
        estate_id: nominee.estate_id,
        initiator_nominee_id: nominee.id,
        status: "requested",
      })
      .select("id, status, created_at")
      .single();

    if (insertError || !event) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create release request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ release_event: event });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}