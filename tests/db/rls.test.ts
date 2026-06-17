import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasDb = Boolean(ANON && SERVICE);
const dbDescribe = hasDb ? describe : describe.skip;

dbDescribe("RLS policies", () => {
  let tokenA: string;
  let tokenB: string;
  let estateIdA: string;

  beforeAll(async () => {
    const svc = createClient(URL, SERVICE);
    const emailA = `rls-a-${Date.now()}@test.com`;
    const emailB = `rls-b-${Date.now()}@test.com`;

    const { data: a, error: errA } = await svc.auth.admin.createUser({
      email: emailA,
      password: "password",
      email_confirm: true,
    });
    if (errA || !a.user) throw new Error(`createUser A failed: ${errA?.message}`);

    const { data: b, error: errB } = await svc.auth.admin.createUser({
      email: emailB,
      password: "password",
      email_confirm: true,
    });
    if (errB || !b.user) throw new Error(`createUser B failed: ${errB?.message}`);

    // Belt-and-suspenders: ensure public.users rows exist (trigger should handle this)
    await svc.from("users").upsert([{ id: a.user.id }, { id: b.user.id }]);

    const aClient = createClient(URL, ANON);
    tokenA = (
      await aClient.auth.signInWithPassword({ email: emailA, password: "password" })
    ).data.session!.access_token;

    const bClient = createClient(URL, ANON);
    tokenB = (
      await bClient.auth.signInWithPassword({ email: emailB, password: "password" })
    ).data.session!.access_token;

    const { data: estate, error: estateErr } = await svc
      .from("estates")
      .insert({ user_id: a.user.id })
      .select("id")
      .single();
    if (estateErr || !estate) throw new Error(`estate insert failed: ${estateErr?.message}`);
    estateIdA = estate.id;
  });

  it("user A reads own estate", async () => {
    const c = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${tokenA}` } },
    });
    const { data } = await c.from("estates").select("id");
    expect(data).toHaveLength(1);
    expect(data![0].id).toBe(estateIdA);
  });

  it("user B cannot read user A estate", async () => {
    const c = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${tokenB}` } },
    });
    const { data } = await c.from("estates").select("id");
    expect(data).toHaveLength(0);
  });

  it("user B cannot read user A assets", async () => {
    const c = createClient(URL, ANON, {
      global: { headers: { Authorization: `Bearer ${tokenB}` } },
    });
    const { data } = await c.from("assets").select("id").eq("estate_id", estateIdA);
    expect(data).toHaveLength(0);
  });
});