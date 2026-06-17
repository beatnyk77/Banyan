import type { EncryptedEnvelope, VaultKeyPacket } from "@/lib/crypto/types";

export interface VaultUploadRequest {
  estateId: string;
  fileName: string;
  docType: string;
  envelope: EncryptedEnvelope;
  ciphertext: Uint8Array;
}

export interface KeyCeremonyResult {
  packet: VaultKeyPacket;
  share2ForKit: Uint8Array;
}