import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasDb = Boolean(ANON && SERVICE);
const dbDescribe = hasDb ? describe : describe.skip;

dbDescribe("release_event_log immutability (Invariant 3)", () => {
  let estateId: string;
  let releaseEventId: string;

  beforeAll(async () => {
    const svc = createClient(URL, SERVICE);
    const email = `re-test-${Date.now()}@test.com`;
    const { data: u, error: userErr } = await svc.auth.admin.createUser({
      email,
      password: "pw",
      email_confirm: true,
    });
    if (userErr || !u.user) throw new Error(`createUser failed: ${userErr?.message}`);

    await svc.from("users").upsert({ id: u.user.id });

    const { data: e, error: estateErr } = await svc
      .from("estates")
      .insert({ user_id: u.user.id })
      .select("id")
      .single();
    if (estateErr || !e) throw new Error(`estate insert failed: ${estateErr?.message}`);
    estateId = e.id;
  });

  it("INSERT on release_events creates a log entry", async () => {
    const svc = createClient(URL, SERVICE);
    const { data: re } = await svc
      .from("release_events")
      .insert({ estate_id: estateId, status: "requested" })
      .select("id")
      .single();
    releaseEventId = re!.id;

    const { data: log } = await svc
      .from("release_event_log")
      .select("to_status")
      .eq("release_event_id", releaseEventId);
    expect(log).toHaveLength(1);
    expect(log![0].to_status).toBe("requested");
  });

  it("UPDATE on release_events creates another log entry", async () => {
    const svc = createClient(URL, SERVICE);
    await svc
      .from("release_events")
      .update({ status: "death_cert_submitted" })
      .eq("id", releaseEventId);

    const { data: log } = await svc
      .from("release_event_log")
      .select("to_status")
      .eq("release_event_id", releaseEventId);
    expect(log).toHaveLength(2);
    expect(log!.map((r) => r.to_status)).toContain("death_cert_submitted");
  });

  it("DELETE on release_event_log raises exception", async () => {
    const svc = createClient(URL, SERVICE);
    const { error } = await svc
      .from("release_event_log")
      .delete()
      .eq("release_event_id", releaseEventId);
    expect(error).not.toBeNull();
    expect(error!.message).toContain("audit immutability invariant");
  });
});