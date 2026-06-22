import { NextRequest, NextResponse } from "next/server";
import { getPublicEnv, getServerEnv } from "@/lib/env";
import { buildVetoLink, createNomineeInviteToken, createVetoToken } from "@/lib/nominee-tokens";
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
    .select("id, full_name, email, phone, relationship, kyc_status, invite_sent_at, created_at")
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
      .select("id, full_name, email")
      .single();

    if (error || !nominee) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create nominee" },
        { status: 500 }
      );
    }

    const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
    const accessToken = createNomineeInviteToken(nominee.id);
    const inviteLink = buildInviteLink(accessToken, NEXT_PUBLIC_APP_URL);
    const emailContent = buildInviteEmailText({
      nomineeName: nominee.full_name,
      estateOwnerName: user.email ?? "the estate owner",
      inviteLink,
    });

    const { RESEND_API_KEY } = getServerEnv();
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Banyan <notifications@banyan.fo>",
            to: nominee.email,
            subject: emailContent.subject,
            text: emailContent.text,
          }),
        });
      } catch {
        // Email failure should not block invite creation
      }
    }

    return NextResponse.json({ nominee, inviteLink });
  }

  if (action === "advance_release") {
    const releaseEventId = body.releaseEventId as string;
    const nextStatus = body.nextStatus as ReleaseStatus;

    const { data: event, error: fetchError } = await service
      .from("release_events")
      .select("id, status, estate_id, initiator_nominee_id")
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

    if (nextStatus === "time_lock") {
      const { data: otherNominees } = await service
        .from("nominees")
        .select("id, full_name, email")
        .eq("estate_id", persisted.estateId)
        .eq("kyc_status", "kyc_verified");

      const { NEXT_PUBLIC_APP_URL, RESEND_API_KEY } = {
        ...getPublicEnv(),
        ...getServerEnv(),
      };

      for (const other of otherNominees ?? []) {
        if (other.id === event.initiator_nominee_id) continue;

        const vetoToken = createVetoToken({
          nomineeId: other.id,
          releaseEventId,
        });
        const vetoLink = buildVetoLink(vetoToken, NEXT_PUBLIC_APP_URL);

        if (RESEND_API_KEY) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Banyan <notifications@banyan.fo>",
                to: other.email,
                subject: "Action required: estate release time-lock started",
                text: [
                  `Dear ${other.full_name},`,
                  "",
                  "An emergency release request has entered the 7-day time-lock period.",
                  "As a verified nominee, you may veto this release:",
                  vetoLink,
                  "",
                  "Banyan — Founder's Office & Co",
                ].join("\n"),
              }),
            });
          } catch {
            // Non-blocking notification failure
          }
        }
      }
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}