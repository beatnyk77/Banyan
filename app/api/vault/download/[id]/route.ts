import { NextRequest, NextResponse } from "next/server";
import { loadPersistedState } from "@/skills/intake-skill/resume";
import {
  downloadEncryptedDocument,
  encodeCiphertextB64,
} from "@/skills/vault-skill/storage";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  try {
    const service = createServiceClient();
    const doc = await downloadEncryptedDocument(service, id, persisted.estateId);

    return NextResponse.json({
      fileName: doc.fileName,
      envelope: doc.envelope,
      ciphertextB64: encodeCiphertextB64(doc.ciphertext),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Download failed" },
      { status: 404 }
    );
  }
}