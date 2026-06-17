import { NextRequest, NextResponse } from "next/server";
import {
  buildInviteEmailText,
  buildInviteLink,
  normalizeInviteEmail,
} from "@/skills/nominee-skill/invite";
import {
  computeTimeLockExpiry,
  transitionRelease,
} from "@/skills/nominee-skill/release-state-machine";
import type { ReleaseStatus } from "@/skills/nominee-skill/types";
import { loadPersistedState } from "@/skills/intake-skill/resume";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

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

  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: nominees, error: nomineeError } = await service
    .from("nominees")
    .select("id, full_name, email, phone, relationship, kyc_status, invite_token, invite_sent_at, created_at")
    .eq("estate_id", persisted.estateId)
    .order("created_at", { ascending: false });

  if (nomineeError) {
    return NextResponse.json({ error: nomineeError.message }, { status: 500 });
  }

  const { data: releaseEvents } = await service
    .from("release_events")
    .select("id, status, initiator_nominee_id, time_lock_expires_at, created_at, updated_at")
    .eq("estate_id", persisted.estateId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    nominees: nominees ?? [],
    releaseEvents: releaseEvents ?? [],
  });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const action = body.action as string;

  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  const service = createServiceClient();

  if (action === "invite") {
    const fullName = (body.fullName as string)?.trim();
    const email = normalizeInviteEmail((body.email as string) ?? "");
    const phone = (body.phone as string)?.trim();
    const relationship = (body.relationship as string)?.trim();

    if (!fullName || !email) {
      return NextResponse.json({ error: "fullName and email required" }, { status: 400 });
    }

    const { data: nominee, error } = await service
      .from("nominees")
      .insert({
        estate_id: persisted.estateId,
        full_name: fullName,
        email,
        phone: phone || null,
        relationship: relationship || null,
        kyc_status: "invited",
        invite_sent_at: new Date().toISOString(),
      })
      .select("id, invite_token, full_name, email")
      .single();

    if (error || !nominee) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create nominee" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteLink = buildInviteLink(nominee.invite_token, baseUrl);
    const emailContent = buildInviteEmailText({
      nomineeName: nominee.full_name,
      estateOwnerName: user.email ?? "the estate owner",
      inviteLink,
    });

    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Banyan <notifications@banyan.fo>",
          to: nominee.email,
          subject: emailContent.subject,
          text: emailContent.text,
        }),
      });
    }

    return NextResponse.json({ nominee, inviteLink });
  }

  if (action === "advance_release") {
    const releaseEventId = body.releaseEventId as string;
    const nextStatus = body.nextStatus as ReleaseStatus;

    const { data: event, error: fetchError } = await service
      .from("release_events")
      .select("id, status, estate_id")
      .eq("id", releaseEventId)
      .eq("estate_id", persisted.estateId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: "Release event not found" }, { status: 404 });
    }

    try {
      transitionRelease(event.status as ReleaseStatus, nextStatus);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid transition" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "time_lock") {
      updates.time_lock_expires_at = computeTimeLockExpiry();
    }

    const { error: updateError } = await service
      .from("release_events")
      .update(updates)
      .eq("id", releaseEventId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}