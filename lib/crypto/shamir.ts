import "client-only";
import { split, combine } from "shamir-secret-sharing";

export async function shamirSplit(
  secret: Uint8Array,
  shares: 3,
  threshold: 2
): Promise<[Uint8Array, Uint8Array, Uint8Array]> {
  const parts = await split(secret, shares, threshold);
  return [parts[0], parts[1], parts[2]];
}

export async function shamirCombine(shares: Uint8Array[]): Promise<Uint8Array> {
  if (shares.length < 2) {
    throw new Error("Shamir: minimum 2 shares required");
  }
  return combine(shares);
}