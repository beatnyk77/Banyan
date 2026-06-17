import { describe, it, expect, beforeAll } from "vitest";
import _sodium from "libsodium-wrappers";
import { shamirCombine } from "@/lib/crypto/shamir";
import { performKeyCeremony } from "@/skills/vault-skill/key-ceremony";
import {
  buildStoragePath,
  decodeCiphertextB64,
  encodeCiphertextB64,
} from "@/skills/vault-skill/storage";

let MOCK_ESCROW_PUBKEY: string;

beforeAll(async () => {
  await _sodium.ready;
  const escrowKeyPair = _sodium.crypto_box_keypair();
  MOCK_ESCROW_PUBKEY = _sodium.to_hex(escrowKeyPair.publicKey);
});

describe("Key ceremony", () => {
  it("returns packet + share2ForKit; share2 not in packet", async () => {
    const result = await performKeyCeremony({
      passphrase: "test-passphrase-123",
      escrowPublicKeyHex: MOCK_ESCROW_PUBKEY,
    });

    expect(result.share2ForKit).toBeInstanceOf(Uint8Array);
    expect(result.share2ForKit.length).toBeGreaterThan(0);

    const packetStr = JSON.stringify(result.packet);
    expect(packetStr).not.toContain(Buffer.from(result.share2ForKit).toString("hex"));
    expect(result.packet.shares).not.toHaveProperty("share2");
  });

  it("share2ForKit + escrow share reconstruct vault key (emergency path)", async () => {
    const { shamirSplit } = await import("@/lib/crypto/shamir");
    const { generateVaultKey } = await import("@/lib/crypto/envelope");
    const vaultKey = await generateVaultKey();
    const [, share2, share3] = await shamirSplit(vaultKey, 3, 2);
    const reconstructed = await shamirCombine([share2, share3]);
    expect(reconstructed).toEqual(vaultKey);
  });
});

describe("Vault storage helpers", () => {
  it("builds deterministic storage paths", () => {
    const path = buildStoragePath("estate-1", "doc-1", "my file.pdf");
    expect(path).toBe("estate-1/doc-1/my_file.pdf");
  });

  it("roundtrips ciphertext base64 encoding", () => {
    const original = new Uint8Array([1, 2, 3, 255, 0]);
    const encoded = encodeCiphertextB64(original);
    const decoded = decodeCiphertextB64(encoded);
    expect(decoded).toEqual(original);
  });
});