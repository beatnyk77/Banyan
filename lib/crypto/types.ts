export interface EncryptedEnvelope {
  v: 1;
  alg: "XSalsa20-Poly1305";
  nonce: string;
  ct: string;
}

export interface VaultKeyPacket {
  v: 1;
  kdf: { salt: string; opslimit: number; memlimit: number };
  shares: {
    user_enc: string;
    escrow_enc: string;
  };
}

export type MasterKey = Uint8Array & { readonly __brand: "MasterKey" };
export type VaultKey = Uint8Array & { readonly __brand: "VaultKey" };