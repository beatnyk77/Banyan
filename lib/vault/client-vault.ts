import "client-only";
import _sodium from "libsodium-wrappers";
import { decrypt, encrypt } from "@/lib/crypto/envelope";
import { deriveMasterKey } from "@/lib/crypto/kdf";
import { shamirCombine } from "@/lib/crypto/shamir";
import type { EncryptedEnvelope, VaultKey, VaultKeyPacket } from "@/lib/crypto/types";

const SHARE2_KEY = "banyan_share2_kit";

export function stashShare2ForKit(share2: Uint8Array): void {
  const b64 = btoa(String.fromCharCode(...share2));
  sessionStorage.setItem(SHARE2_KEY, b64);
}

export function takeShare2ForKit(): Uint8Array | null {
  const b64 = sessionStorage.getItem(SHARE2_KEY);
  if (!b64) return null;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function clearShare2ForKit(): void {
  sessionStorage.removeItem(SHARE2_KEY);
}

export async function reconstructVaultKey(params: {
  passphrase: string;
  packet: VaultKeyPacket;
  share2: Uint8Array;
}): Promise<VaultKey> {
  await _sodium.ready;
  const salt = _sodium.from_hex(params.packet.kdf.salt);
  const masterKey = await deriveMasterKey(params.passphrase, salt);
  const userShareEnv = JSON.parse(params.packet.shares.user_enc) as EncryptedEnvelope;
  const share1 = await decrypt(userShareEnv, masterKey as unknown as VaultKey);
  const vaultKey = await shamirCombine([share1, params.share2]);
  return vaultKey as VaultKey;
}

export async function encryptFileForVault(
  file: File,
  vaultKey: VaultKey
): Promise<{ ciphertext: Uint8Array; envelope: EncryptedEnvelope }> {
  const plaintext = new Uint8Array(await file.arrayBuffer());
  const envelope = await encrypt(plaintext, vaultKey);
  const ct = _sodium.from_hex(envelope.ct);
  return { ciphertext: ct, envelope };
}

export async function decryptFileFromVault(
  ciphertext: Uint8Array,
  envelope: EncryptedEnvelope,
  vaultKey: VaultKey
): Promise<Uint8Array> {
  return decrypt(envelope, vaultKey);
}