import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasDb = Boolean(ANON && SERVICE);
const dbDescribe = hasDb ? describe : describe.skip;

const PAN_REGEX = /[A-Z]{5}[0-9]{4}[A-Z]/;
const AADHAAR_REGEX = /\b[2-9][0-9]{11}\b/;

dbDescribe("Invariant 1: no plaintext PII in persisted data", () => {
  let estateId: string;

  beforeAll(async () => {
    const svc = createClient(URL, SERVICE!);
    const email = `pii-test-${Date.now()}@test.com`;
    const { data: user, error: userErr } = await svc.auth.admin.createUser({
      email,
      password: "password",
      email_confirm: true,
    });
    if (userErr || !user.user) {
      throw new Error(`createUser failed: ${userErr?.message}`);
    }

    await svc.from("users").upsert({ id: user.user.id });

    const mockEnvelope = JSON.stringify({
      v: 1,
      alg: "XSalsa20-Poly1305",
      nonce: "aabbcc",
      ct: "ddeeff",
    });
    const { data: estate, error: estateErr } = await svc
      .from("estates")
      .insert({
        user_id: user.user.id,
        intake_state: "asset_bank",
        estate_json_enc: mockEnvelope,
        estate_envelope_meta: { v: 1 },
      })
      .select("id")
      .single();
    if (estateErr || !estate) {
      throw new Error(`estate insert failed: ${estateErr?.message}`);
    }
    estateId = estate.id;
  });

  it("estates table has no intake_conversation column", async () => {
    const svc = createClient(URL, SERVICE!);
    const { data } = await svc.from("estates").select("*").eq("id", estateId).single();
    expect(data).not.toHaveProperty("intake_conversation");
  });

  it("estate_json_enc contains no PAN pattern", async () => {
    const svc = createClient(URL, SERVICE!);
    const { data } = await svc
      .from("estates")
      .select("estate_json_enc")
      .eq("id", estateId)
      .single();
    const raw = JSON.stringify(data?.estate_json_enc ?? "");
    expect(PAN_REGEX.test(raw)).toBe(false);
  });

  it("estate_json_enc contains no Aadhaar pattern", async () => {
    const svc = createClient(URL, SERVICE!);
    const { data } = await svc
      .from("estates")
      .select("estate_json_enc")
      .eq("id", estateId)
      .single();
    const raw = JSON.stringify(data?.estate_json_enc ?? "");
    expect(AADHAAR_REGEX.test(raw)).toBe(false);
  });
});