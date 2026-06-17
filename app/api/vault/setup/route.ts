import { NextRequest, NextResponse } from "next/server";
import { assertNoPII } from "@/lib/crypto/guards";
import type { VaultKeyPacket } from "@/lib/crypto/types";
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

  const service = createServiceClient();
  const { data } = await service
    .from("vault_keys")
    .select(
      "kit_issued, kit_issued_at, created_at, kdf_salt, kdf_opslimit, kdf_memlimit, user_share_enc, escrow_share_enc"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const packet = data
    ? {
        v: 1 as const,
        kdf: {
          salt: data.kdf_salt,
          opslimit: data.kdf_opslimit,
          memlimit: data.kdf_memlimit,
        },
        shares: {
          user_enc: data.user_share_enc,
          escrow_enc: data.escrow_share_enc,
        },
      }
    : null;

  return NextResponse.json({
    configured: Boolean(data),
    kitIssued: data?.kit_issued ?? false,
    kitIssuedAt: data?.kit_issued_at ?? null,
    packet,
  });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const packet = body.packet as VaultKeyPacket;

  if (!packet?.kdf?.salt || !packet?.shares?.user_enc || !packet?.shares?.escrow_enc) {
    return NextResponse.json({ error: "Invalid vault key packet" }, { status: 400 });
  }

  try {
    assertNoPII(packet, "vault/setup");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PII validation failed" },
      { status: 400 }
    );
  }

  await loadPersistedState(user.id);

  const service = createServiceClient();
  const { data: existing } = await service
    .from("vault_keys")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Vault already configured" }, { status: 409 });
  }

  const { error } = await service.from("vault_keys").insert({
    user_id: user.id,
    kdf_salt: packet.kdf.salt,
    kdf_opslimit: packet.kdf.opslimit,
    kdf_memlimit: packet.kdf.memlimit,
    user_share_enc: packet.shares.user_enc,
    escrow_share_enc: packet.shares.escrow_enc,
  });

  if (error) {
    return NextResponse.json(
      { error: `Failed to save vault keys: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}