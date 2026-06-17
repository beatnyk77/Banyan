import "client-only";
import _sodium from "libsodium-wrappers";
import { generateVaultKey, encrypt } from "@/lib/crypto/envelope";
import { deriveMasterKey, generateSalt, KDF_MEMLIMIT, KDF_OPSLIMIT } from "@/lib/crypto/kdf";
import { shamirSplit } from "@/lib/crypto/shamir";
import type { VaultKey, VaultKeyPacket } from "@/lib/crypto/types";
import type { KeyCeremonyResult } from "./types";

export async function performKeyCeremony(params: {
  passphrase: string;
  escrowPublicKeyHex: string;
}): Promise<KeyCeremonyResult> {
  await _sodium.ready;

  const vaultKey = await generateVaultKey();
  const salt = await generateSalt();
  const masterKey = await deriveMasterKey(params.passphrase, salt);

  const [share1, share2, share3] = await shamirSplit(vaultKey, 3, 2);

  const userShareEnv = await encrypt(share1, masterKey as unknown as VaultKey);

  const escrowPubKey = _sodium.from_hex(params.escrowPublicKeyHex);
  const ephemeralKeypair = _sodium.crypto_box_keypair();
  const nonce = _sodium.randombytes_buf(_sodium.crypto_box_NONCEBYTES);
  const share3Enc = _sodium.crypto_box_easy(
    share3,
    nonce,
    escrowPubKey,
    ephemeralKeypair.privateKey
  );

  const escrowShareEnv = JSON.stringify({
    v: 1,
    alg: "NaCl-Box",
    nonce: _sodium.to_hex(nonce),
    ephemeral_pubkey: _sodium.to_hex(ephemeralKeypair.publicKey),
    ct: _sodium.to_hex(share3Enc),
  });

  const packet: VaultKeyPacket = {
    v: 1,
    kdf: {
      salt: _sodium.to_hex(salt),
      opslimit: KDF_OPSLIMIT,
      memlimit: KDF_MEMLIMIT,
    },
    shares: {
      user_enc: JSON.stringify(userShareEnv),
      escrow_enc: escrowShareEnv,
    },
  };

  return { packet, share2ForKit: share2 };
}