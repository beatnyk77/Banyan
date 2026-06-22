/**
 * Generate a NaCl box keypair for Banyan escrow (Share 3 encryption).
 * Run: npx tsx scripts/generate-escrow-keys.ts
 */
import _sodium from "libsodium-wrappers";

async function main() {
  await _sodium.ready;
  const keypair = _sodium.crypto_box_keypair();
  const pubkey = _sodium.to_hex(keypair.publicKey);
  const privkey = _sodium.to_hex(keypair.privateKey);

  console.log("# Add these to .env.local (never commit the private key)\n");
  console.log(`BANYAN_ESCROW_PUBKEY=${pubkey}`);
  console.log(`BANYAN_ESCROW_PRIVKEY=${privkey}`);
  console.log(`NEXT_PUBLIC_BANYAN_ESCROW_PUBKEY=${pubkey}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});