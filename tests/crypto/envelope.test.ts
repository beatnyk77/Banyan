import { describe, it, expect } from "vitest";
import { generateVaultKey, encrypt, decrypt } from "../../lib/crypto/envelope";

describe("EncryptedEnvelope", () => {
  it("roundtrip: decrypt(encrypt(p)) === p", async () => {
    const key = await generateVaultKey();
    const pt = new TextEncoder().encode('{"pan":"ABCDE1234F","balance":500000}');
    expect(await decrypt(await encrypt(pt, key), key)).toEqual(pt);
  });

  it("ciphertext contains no PAN", async () => {
    const key = await generateVaultKey();
    const env = await encrypt(new TextEncoder().encode('{"pan":"ABCDE1234F"}'), key);
    expect(JSON.stringify(env)).not.toContain("ABCDE1234F");
  });

  it("tampered ciphertext throws", async () => {
    const key = await generateVaultKey();
    const env = await encrypt(new TextEncoder().encode("secret"), key);
    const tampered = { ...env, ct: env.ct.slice(0, -2) + "ff" };
    await expect(decrypt(tampered, key)).rejects.toThrow("Decryption failed");
  });

  it("wrong key throws", async () => {
    const key1 = await generateVaultKey();
    const key2 = await generateVaultKey();
    const env = await encrypt(new TextEncoder().encode("secret"), key1);
    await expect(decrypt(env, key2)).rejects.toThrow("Decryption failed");
  });
});