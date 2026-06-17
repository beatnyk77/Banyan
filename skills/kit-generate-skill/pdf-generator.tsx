import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import QRCode from "qrcode";
import type { KitGenerateInput } from "./types";
import { RecoveryCodePage } from "./templates/recovery-code";
import { SigningChecklistPage } from "./templates/signing-checklist";
import { SubRegistrarGuidePage } from "./templates/subregistrar-guide";
import { WillCoverPage } from "./templates/will-cover";
import { WitnessAffidavitPage } from "./templates/witness-affidavit";

export type { KitGenerateInput } from "./types";

export async function generateExecutionKit(input: KitGenerateInput): Promise<Buffer> {
  const share2B64 = Buffer.from(input.share2ForKit).toString("base64url");
  const qrDataUri = await QRCode.toDataURL(share2B64, {
    errorCorrectionLevel: "H",
    width: 300,
  });

  const doc = (
    <Document title={`Will Execution Kit — ${input.estate.owner.name}`}>
      <WillCoverPage
        estate={input.estate}
        will={input.will}
        preview={input.preview}
      />
      <WitnessAffidavitPage estateOwnerName={input.estate.owner.name} />
      <SigningChecklistPage />
      <SubRegistrarGuidePage />
      <RecoveryCodePage
        qrDataUri={qrDataUri}
        estateOwnerName={input.estate.owner.name}
      />
    </Document>
  );

  return Buffer.from(await renderToBuffer(doc));
}