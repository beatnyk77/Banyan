import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purpose } = await req.json();

  const { error } = await supabase
    .from("users")
    // Hand-written Database types lack Relationships metadata (see lib/supabase/server.ts).
    // @ts-expect-error — payload matches users.Update
    .update({
      consent_given_at: new Date().toISOString(),
      consent_purpose: purpose ?? "succession_document_generation",
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ consented: true });
}