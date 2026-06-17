import { readFileSync } from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { generateVaultKey } from "@/lib/crypto/envelope";
import { shamirSplit } from "@/lib/crypto/shamir";
import { assembleWill } from "@/skills/clause-assembly-skill/assembler";
import { EstateJsonSchema } from "@/skills/intake-skill/estate-schema";
import { generateExecutionKit } from "@/skills/kit-generate-skill/pdf-generator";

describe("ExecutionKit PDF", () => {
  it("generates non-empty valid PDF buffer with recovery page", async () => {
    const raw = JSON.parse(
      readFileSync(path.join(__dirname, "../../eval/fixtures/hindu-simple.json"), "utf8")
    );
    const estate = EstateJsonSchema.parse(raw);
    const will = await assembleWill(estate, { useLlm: false });
    const vaultKey = await generateVaultKey();
    const [, share2] = await shamirSplit(vaultKey, 3, 2);

    const buffer = await generateExecutionKit({
      estate,
      will,
      share2ForKit: share2,
      preview: true,
    });

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.slice(0, 4).toString()).toBe("%PDF");

    const pdfRaw = buffer.toString("latin1");
    expect(pdfRaw).toMatch(/\/Count 5/);
    expect(pdfRaw).toMatch(/\/Subtype \/Image/);
    expect(pdfRaw).toMatch(/\/XObject/);
  });
});