import "client-only";
import { generateVaultKey } from "@/lib/crypto/envelope";
import { shamirSplit } from "@/lib/crypto/shamir";

/**
 * Generates an ephemeral Share 2 for kit preview before vault ceremony (PR-8).
 * The caller must pass this immediately to kit generation and never persist it.
 */
export async function generatePreviewShare2(): Promise<Uint8Array> {
  const vaultKey = await generateVaultKey();
  const [, share2] = await shamirSplit(vaultKey, 3, 2);
  return share2;
}

export function share2ToBase64url(share2: Uint8Array): string {
  const binary = Array.from(share2, (b) => String.fromCharCode(b)).join("");
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}