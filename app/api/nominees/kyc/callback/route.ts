import { NextRequest, NextResponse } from "next/server";
import { getPublicEnv, getServerEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeDigilockerCode } from "@/skills/nominee-skill/digilocker";
import { nextKycStatus } from "@/skills/nominee-skill/kyc";

function parseState(state: string): { nomineeId: string; token: string } | null {
  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { nomineeId?: string; token?: string };
    if (!parsed.nomineeId || !parsed.token) return null;
    return { nomineeId: parsed.nomineeId, token: parsed.token };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      new URL("/invite?error=kyc_failed", req.nextUrl.origin)
    );
  }

  const parsed = parseState(state);
  if (!parsed) {
    return NextResponse.redirect(
      new URL("/invite?error=invalid_state", req.nextUrl.origin)
    );
  }

  const service = createServiceClient();
  const { data: nominee, error: nomineeError } = await service
    .from("nominees")
    .select("id, kyc_status")
    .eq("id", parsed.nomineeId)
    .single();

  if (nomineeError || !nominee) {
    return NextResponse.redirect(
      new URL("/invite?error=nominee_not_found", req.nextUrl.origin)
    );
  }

  if (nominee.kyc_status === "kyc_verified") {
    return NextResponse.redirect(
      new URL(`/invite/${encodeURIComponent(parsed.token)}?kyc=verified`, req.nextUrl.origin)
    );
  }

  try {
    const { DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET } = getServerEnv();
    const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
    const redirectUri = `${NEXT_PUBLIC_APP_URL}/api/nominees/kyc/callback`;

    const tokenResult = await exchangeDigilockerCode({
      code,
      clientId: DIGILOCKER_CLIENT_ID!,
      clientSecret: DIGILOCKER_CLIENT_SECRET!,
      redirectUri,
    });

    let kycStatus = nominee.kyc_status;
    if (kycStatus === "invited" || kycStatus === "pending") {
      kycStatus = nextKycStatus(kycStatus as "invited" | "pending", "submit");
    }
    kycStatus = nextKycStatus(kycStatus as "kyc_submitted", "verify");

    await service
      .from("nominees")
      .update({
        kyc_status: kycStatus,
        digilocker_ref: tokenResult.digilocker_id ?? tokenResult.access_token.slice(0, 32),
        updated_at: new Date().toISOString(),
      })
      .eq("id", nominee.id);
  } catch {
    return NextResponse.redirect(
      new URL(
        `/invite/${encodeURIComponent(parsed.token)}?error=kyc_exchange_failed`,
        req.nextUrl.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(`/invite/${encodeURIComponent(parsed.token)}?kyc=verified`, req.nextUrl.origin)
  );
}