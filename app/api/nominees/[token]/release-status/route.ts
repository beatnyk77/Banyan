import { NextRequest, NextResponse } from "next/server";
import { resolveNomineeByAccessToken } from "@/lib/nominee/resolve";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const nominee = await resolveNomineeByAccessToken(token);

  if (!nominee) {
    return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 404 });
  }

  const supabase = createServiceClient();
  const { data: events } = await supabase
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
    redirect: `/invite/${encodeURIComponent(token)}`,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const nominee = await resolveNomineeByAccessToken(token);

  if (!nominee) {
    return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 404 });
  }

  if (nominee.kyc_status !== "kyc_verified") {
    return NextResponse.json(
      { error: "KYC verification required before requesting release" },
      { status: 403 }
    );
  }

  const body = await req.json();
  if (body.action !== "request_release") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
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

  const { data: event, error: insertError } = await supabase
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