import { Page, Text, View } from "@react-pdf/renderer";
import { kitStyles } from "./styles";

const CHECKLIST = [
  "Print this will on plain paper (one side per page).",
  "Sign every page at the bottom in the presence of two witnesses.",
  "Both witnesses sign on the last page and complete the Witness Affidavit.",
  "Date all signatures. Use the same date for testator and witnesses.",
  "Store the executed will in a secure location known to your executor.",
  "Keep the Recovery Code page (last page of this kit) in a separate physical location.",
  "Inform your nominee where each document is stored.",
  "Review annually and update if your asset registry changes materially.",
];

export function SigningChecklistPage() {
  return (
    <Page size="A4" style={kitStyles.page}>
      <Text style={kitStyles.title}>Signing Checklist</Text>
      <View style={kitStyles.goldRule} />
      <Text style={kitStyles.body}>
        Complete each step before considering your will ready for safekeeping.
      </Text>
      {CHECKLIST.map((item, i) => (
        <Text key={i} style={kitStyles.listItem}>
          {i + 1}. {item}
        </Text>
      ))}
      <Text style={kitStyles.footer}>Banyan — Founder's Office & Co</Text>
    </Page>
  );
}