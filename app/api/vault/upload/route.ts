import { NextRequest, NextResponse } from "next/server";
import { assertNoPII } from "@/lib/crypto/guards";
import type { EncryptedEnvelope } from "@/lib/crypto/types";
import { loadPersistedState } from "@/skills/intake-skill/resume";
import {
  decodeCiphertextB64,
  uploadEncryptedDocument,
} from "@/skills/vault-skill/storage";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

const ALLOWED_DOC_TYPES = [
  "property_deed",
  "insurance_policy",
  "bank_statement",
  "photo_id",
  "will_draft",
  "execution_kit",
  "other",
] as const;

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
  const { data, error } = await service
    .from("documents")
    .select("id, doc_type, file_name, file_size_bytes, created_at")
    .eq("estate_id", persisted.estateId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const fileName = body.fileName as string;
  const docType = body.docType as string;
  const envelope = body.envelope as EncryptedEnvelope;
  const ciphertextB64 = body.ciphertextB64 as string;

  if (!fileName || !docType || !envelope || !ciphertextB64) {
    return NextResponse.json({ error: "Missing upload fields" }, { status: 400 });
  }

  if (!ALLOWED_DOC_TYPES.includes(docType as (typeof ALLOWED_DOC_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  try {
    assertNoPII(envelope, "vault/upload");
    assertNoPII(ciphertextB64, "vault/upload-ciphertext");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PII validation failed" },
      { status: 400 }
    );
  }

  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: vaultKeys } = await service
    .from("vault_keys")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vaultKeys) {
    return NextResponse.json(
      { error: "Complete vault setup before uploading documents" },
      { status: 400 }
    );
  }

  try {
    const result = await uploadEncryptedDocument(service, {
      estateId: persisted.estateId,
      fileName,
      docType,
      envelope,
      ciphertext: decodeCiphertextB64(ciphertextB64),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}