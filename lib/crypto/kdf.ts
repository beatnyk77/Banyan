import "client-only";
import _sodium from "libsodium-wrappers-sumo";
import type { MasterKey } from "./types";

export const KDF_OPSLIMIT = 2;
export const KDF_MEMLIMIT = 67108864;

export async function deriveMasterKey(
  passphrase: string,
  salt: Uint8Array
): Promise<MasterKey> {
  await _sodium.ready;
  return _sodium.crypto_pwhash(
    32,
    passphrase,
    salt,
    KDF_OPSLIMIT,
    KDF_MEMLIMIT,
    _sodium.crypto_pwhash_ALG_ARGON2ID13
  ) as MasterKey;
}

export async function generateSalt(): Promise<Uint8Array> {
  await _sodium.ready;
  return _sodium.randombytes_buf(_sodium.crypto_pwhash_SALTBYTES);
}