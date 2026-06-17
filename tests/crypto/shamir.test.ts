import { describe, it, expect } from "vitest";
import { generateVaultKey, encrypt } from "../../lib/crypto/envelope";
import { shamirSplit, shamirCombine } from "../../lib/crypto/shamir";

describe("Shamir 2-of-3 — Invariants 1+2 + emergency path", () => {
  it("single share cannot reconstruct vault key", async () => {
    const vk = await generateVaultKey();
    const [, , s3] = await shamirSplit(vk, 3, 2);
    await expect(shamirCombine([s3])).rejects.toThrow("minimum 2 shares");
  });

  it("shares 1+2 reconstruct vault key", async () => {
    const vk = await generateVaultKey();
    const [s1, s2] = await shamirSplit(vk, 3, 2);
    expect(await shamirCombine([s1, s2])).toEqual(vk);
  });

  it("shares 1+3 reconstruct vault key", async () => {
    const vk = await generateVaultKey();
    const [s1, , s3] = await shamirSplit(vk, 3, 2);
    expect(await shamirCombine([s1, s3])).toEqual(vk);
  });

  it("emergency path: Share 2 (from kit QR) + Share 3 (escrow) reconstruct vault key", async () => {
    const vaultKey = await generateVaultKey();
    const [, shareFromKit, escrowShare] = await shamirSplit(vaultKey, 3, 2);
    const reconstructed = await shamirCombine([shareFromKit, escrowShare]);
    expect(reconstructed).toEqual(vaultKey);
  });

  it("Banyan escrow share alone is insufficient (Invariant 2)", async () => {
    const vk = await generateVaultKey();
    const [, , escrow] = await shamirSplit(vk, 3, 2);
    await expect(shamirCombine([escrow])).rejects.toThrow();
  });

  it("Invariant 1: encrypt roundtrip; no PAN in ciphertext", async () => {
    const vaultKey = await generateVaultKey();
    const plaintext = new TextEncoder().encode(JSON.stringify({ pan: "ABCDE1234F" }));
    const env = await encrypt(plaintext, vaultKey);
    expect(JSON.stringify(env)).not.toContain("ABCDE1234F");
  });
});