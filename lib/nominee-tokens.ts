import crypto from "crypto";
import { getServerEnv } from "@/lib/env";

interface NomineeTokenPayload {
  sub: string;
  typ: "nominee_invite";
  iat?: number;
  exp?: number;
}

interface VetoTokenPayload {
  sub: string;
  releaseEventId: string;
  typ: "release_veto";
  iat?: number;
  exp?: number;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signHs256(payload: object, secret: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyHs256<T extends { exp?: number }>(
  token: string,
  secret: string
): (T & { exp?: number }) | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as T & { exp?: number };

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

const NOMINEE_INVITE_TTL_SEC = 60 * 60 * 24 * 90;
const VETO_TTL_SEC = 60 * 60 * 24 * 8;

export function createNomineeInviteToken(nomineeId: string): string {
  const { NOMINEE_TOKEN_SECRET } = getServerEnv();
  const now = Math.floor(Date.now() / 1000);
  const payload: NomineeTokenPayload & { iat: number; exp: number } = {
    sub: nomineeId,
    typ: "nominee_invite",
    iat: now,
    exp: now + NOMINEE_INVITE_TTL_SEC,
  };
  return signHs256(payload, NOMINEE_TOKEN_SECRET);
}

export function verifyNomineeInviteToken(token: string): string | null {
  const { NOMINEE_TOKEN_SECRET } = getServerEnv();
  const payload = verifyHs256<NomineeTokenPayload>(token, NOMINEE_TOKEN_SECRET);
  if (!payload || payload.typ !== "nominee_invite" || !payload.sub) return null;
  return payload.sub;
}

export function createVetoToken(params: {
  nomineeId: string;
  releaseEventId: string;
}): string {
  const { VETO_TOKEN_SECRET } = getServerEnv();
  const now = Math.floor(Date.now() / 1000);
  const payload: VetoTokenPayload & { iat: number; exp: number } = {
    sub: params.nomineeId,
    releaseEventId: params.releaseEventId,
    typ: "release_veto",
    iat: now,
    exp: now + VETO_TTL_SEC,
  };
  return signHs256(payload, VETO_TOKEN_SECRET);
}

export function verifyVetoToken(token: string): {
  nomineeId: string;
  releaseEventId: string;
} | null {
  const { VETO_TOKEN_SECRET } = getServerEnv();
  const payload = verifyHs256<VetoTokenPayload>(token, VETO_TOKEN_SECRET);
  if (!payload || payload.typ !== "release_veto" || !payload.sub || !payload.releaseEventId) {
    return null;
  }
  return { nomineeId: payload.sub, releaseEventId: payload.releaseEventId };
}

export function buildVetoLink(token: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/veto/${encodeURIComponent(token)}`;
}