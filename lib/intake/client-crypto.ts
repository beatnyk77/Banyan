import "client-only";
import { deriveMasterKey, generateSalt } from "@/lib/crypto/kdf";
import { decrypt, encrypt } from "@/lib/crypto/envelope";
import type { EncryptedEnvelope, VaultKey } from "@/lib/crypto/types";
import type { EstateJson } from "@/skills/intake-skill/estate-schema";

const SALT_KEY = "banyan_intake_salt";

async function getVaultKey(passphrase: string): Promise<VaultKey> {
  let saltB64 = sessionStorage.getItem(SALT_KEY);
  if (!saltB64) {
    const salt = await generateSalt();
    saltB64 = btoa(String.fromCharCode(...salt));
    sessionStorage.setItem(SALT_KEY, saltB64);
  }
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  return deriveMasterKey(passphrase, salt) as unknown as VaultKey;
}

export async function encryptEstate(
  estate: EstateJson,
  passphrase: string
): Promise<{ ciphertext: string; envelopeMeta: EncryptedEnvelope }> {
  const key = await getVaultKey(passphrase);
  const plaintext = new TextEncoder().encode(JSON.stringify(estate));
  const envelope = await encrypt(plaintext, key);
  return { ciphertext: JSON.stringify(envelope), envelopeMeta: envelope };
}

export async function decryptEstate(
  ciphertext: string,
  passphrase: string
): Promise<EstateJson> {
  const key = await getVaultKey(passphrase);
  const envelope = JSON.parse(ciphertext) as EncryptedEnvelope;
  const plaintext = await decrypt(envelope, key);
  return JSON.parse(new TextDecoder().decode(plaintext)) as EstateJson;
}

export function clearIntakeSession(): void {
  sessionStorage.removeItem(SALT_KEY);
}