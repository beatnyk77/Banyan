import type { SupabaseClient } from "@supabase/supabase-js";
import type { EncryptedEnvelope } from "@/lib/crypto/types";

export const VAULT_BUCKET = "vault-documents";

export function buildStoragePath(
  estateId: string,
  docId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${estateId}/${docId}/${safeName}`;
}

export function decodeCiphertextB64(b64: string): Uint8Array {
  const binary = Buffer.from(b64, "base64");
  return new Uint8Array(binary);
}

export function encodeCiphertextB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export interface VaultUploadInput {
  estateId: string;
  fileName: string;
  docType: string;
  envelope: EncryptedEnvelope;
  ciphertext: Uint8Array;
}

export async function uploadEncryptedDocument(
  supabase: SupabaseClient,
  input: VaultUploadInput
): Promise<{ documentId: string; storagePath: string }> {
  const docId = crypto.randomUUID();
  const storagePath = buildStoragePath(input.estateId, docId, input.fileName);

  const { error: uploadError } = await supabase.storage
    .from(VAULT_BUCKET)
    .upload(storagePath, Buffer.from(input.ciphertext), {
      contentType: "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("documents").insert({
    id: docId,
    estate_id: input.estateId,
    doc_type: input.docType,
    file_name: input.fileName,
    storage_path: storagePath,
    envelope_meta: input.envelope,
    file_size_bytes: input.ciphertext.length,
  });

  if (insertError) {
    await supabase.storage.from(VAULT_BUCKET).remove([storagePath]);
    throw new Error(`Document record failed: ${insertError.message}`);
  }

  return { documentId: docId, storagePath };
}

export async function downloadEncryptedDocument(
  supabase: SupabaseClient,
  documentId: string,
  estateId: string
): Promise<{ envelope: EncryptedEnvelope; ciphertext: Uint8Array; fileName: string }> {
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("storage_path, envelope_meta, file_name, estate_id")
    .eq("id", documentId)
    .eq("estate_id", estateId)
    .single();

  if (docError || !doc) {
    throw new Error("Document not found");
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from(VAULT_BUCKET)
    .download(doc.storage_path);

  if (downloadError || !blob) {
    throw new Error(`Storage download failed: ${downloadError?.message ?? "unknown"}`);
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  return {
    envelope: doc.envelope_meta as EncryptedEnvelope,
    ciphertext: new Uint8Array(buffer),
    fileName: doc.file_name,
  };
}