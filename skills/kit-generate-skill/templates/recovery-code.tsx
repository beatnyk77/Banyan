import { Page, View, Text, Image } from "@react-pdf/renderer";
import { kitStyles } from "./styles";

const recoveryStyles = {
  warning: {
    fontSize: 11,
    color: "#B8902A",
    marginBottom: 16,
    fontStyle: "italic" as const,
  },
  qrContainer: {
    alignItems: "center" as const,
    marginTop: 20,
  },
  instructions: {
    fontSize: 10,
    color: "#1A1814",
    lineHeight: 1.6,
    marginTop: 20,
  },
};

interface RecoveryCodePageProps {
  qrDataUri: string;
  estateOwnerName: string;
}

export function RecoveryCodePage({ qrDataUri, estateOwnerName }: RecoveryCodePageProps) {
  const issuedDate = new Date().toISOString().split("T")[0];

  return (
    <Page size="A4" style={kitStyles.page}>
      <Text style={kitStyles.title}>Vault Recovery Code</Text>
      <View style={kitStyles.goldRule} />
      <Text style={recoveryStyles.warning}>
        KEEP THIS PAGE SEPARATE FROM YOUR WILL. Store in a different physical location. Do not
        photograph or scan unless using it for emergency vault access.
      </Text>
      <Text style={{ fontSize: 12, color: "#1A1814" }}>Estate: {estateOwnerName}</Text>
      <View style={recoveryStyles.qrContainer}>
        <Image src={qrDataUri} style={{ width: 180, height: 180 }} />
      </View>
      <Text style={recoveryStyles.instructions}>
        {[
          "This QR code is required to access the Banyan vault if the primary passphrase is unavailable.",
          "Present it to a Banyan operations officer together with a death certificate.",
          "The QR code alone is insufficient — it must be combined with Banyan's escrow key during the verified emergency release process.",
          "",
          "Annual check: confirm to Banyan each year that this page is still in your possession.",
          "If lost, contact Banyan to re-issue while the primary passphrase is available.",
        ].join("\n")}
      </Text>
      <Text style={kitStyles.footer}>
        Banyan — Founder's Office & Co | Issued under vault setup {issuedDate}
      </Text>
    </Page>
  );
}