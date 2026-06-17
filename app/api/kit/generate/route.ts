import { NextRequest, NextResponse } from "next/server";
import { assertKitIssuanceAllowed } from "@/skills/clause-assembly-skill/assembler";
import { isClauseLibrarySigned } from "@/skills/clause-assembly-skill/library";
import type { AssembledWill } from "@/skills/clause-assembly-skill/types";
import { EstateJsonSchema } from "@/skills/intake-skill/estate-schema";
import { loadPersistedState } from "@/skills/intake-skill/resume";
import { generateExecutionKit } from "@/skills/kit-generate-skill/pdf-generator";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

function decodeShare2(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = Buffer.from(padded + pad, "base64");
  return new Uint8Array(binary);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  let estate;
  let will: AssembledWill;

  try {
    estate = EstateJsonSchema.parse(body.estate);
    will = body.will as AssembledWill;
    if (!will?.rendered_text || !will.clause_ids) {
      throw new Error("Invalid will");
    }
  } catch {
    return NextResponse.json({ error: "Invalid estate or will payload" }, { status: 400 });
  }

  const share2B64 = body.share2ForKitB64 as string;
  if (!share2B64) {
    return NextResponse.json({ error: "share2ForKitB64 required" }, { status: 400 });
  }

  const persisted = await loadPersistedState(user.id);
  if (!persisted) {
    return NextResponse.json({ error: "Estate not found" }, { status: 404 });
  }

  if (persisted.currentState !== "complete") {
    return NextResponse.json(
      { error: "Complete your asset registry before generating a kit" },
      { status: 400 }
    );
  }

  const preview = body.preview === true || !isClauseLibrarySigned();

  if (!preview) {
    try {
      assertKitIssuanceAllowed();
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Kit issuance not allowed" },
        { status: 403 }
      );
    }
  }

  try {
    const share2ForKit = decodeShare2(share2B64);
    const buffer = await generateExecutionKit({
      estate,
      will,
      share2ForKit,
      preview,
    });

    if (!preview) {
      const service = createServiceClient();
      await service
        .from("wills")
        .update({
          status: "kit_issued",
          kit_issued_at: new Date().toISOString(),
        })
        .eq("estate_id", persisted.estateId)
        .eq("clause_set_hash", will.clause_set_hash);
    }

    const filename = `banyan-execution-kit-${estate.owner.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "X-Kit-Preview": preview ? "true" : "false",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kit generation failed" },
      { status: 500 }
    );
  }
}