import "client-only";
import _sodium from "libsodium-wrappers";
import type { EncryptedEnvelope, VaultKey } from "./types";

export async function generateVaultKey(): Promise<VaultKey> {
  await _sodium.ready;
  return _sodium.randombytes_buf(32) as VaultKey;
}

export async function encrypt(
  plaintext: Uint8Array,
  key: VaultKey
): Promise<EncryptedEnvelope> {
  await _sodium.ready;
  const nonce = _sodium.randombytes_buf(_sodium.crypto_secretbox_NONCEBYTES);
  const ct = _sodium.crypto_secretbox_easy(plaintext, nonce, key);
  return {
    v: 1,
    alg: "XSalsa20-Poly1305",
    nonce: _sodium.to_hex(nonce),
    ct: _sodium.to_hex(ct),
  };
}

export async function decrypt(
  env: EncryptedEnvelope,
  key: VaultKey
): Promise<Uint8Array> {
  await _sodium.ready;
  try {
    const plaintext = _sodium.crypto_secretbox_open_easy(
      _sodium.from_hex(env.ct),
      _sodium.from_hex(env.nonce),
      key
    );
    if (!plaintext) {
      throw new Error("Decryption failed: invalid key or tampered ciphertext");
    }
    return plaintext;
  } catch {
    throw new Error("Decryption failed: invalid key or tampered ciphertext");
  }
}