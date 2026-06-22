import { NextRequest, NextResponse } from "next/server";
import { getPublicEnv, getServerEnv, hasDigilockerCredentials } from "@/lib/env";
import { resolveNomineeByAccessToken } from "@/lib/nominee/resolve";
import { buildDigilockerAuthorizeUrl } from "@/skills/nominee-skill/digilocker";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  if (!hasDigilockerCredentials()) {
    return NextResponse.json(
      { error: "DigiLocker KYC is not configured. Contact the estate owner." },
      { status: 503 }
    );
  }

  const nominee = await resolveNomineeByAccessToken(token);
  if (!nominee) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const { DIGILOCKER_CLIENT_ID } = getServerEnv();
  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  const redirectUri = `${NEXT_PUBLIC_APP_URL}/api/nominees/kyc/callback`;
  const state = Buffer.from(JSON.stringify({ nomineeId: nominee.id, token })).toString(
    "base64url"
  );

  const authorizeUrl = buildDigilockerAuthorizeUrl({
    clientId: DIGILOCKER_CLIENT_ID!,
    redirectUri,
    state,
  });

  return NextResponse.redirect(authorizeUrl);
}