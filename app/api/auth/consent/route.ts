import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { purpose } = await req.json();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("users")
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