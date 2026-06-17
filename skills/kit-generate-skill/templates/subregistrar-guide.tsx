import { Page, Text, View } from "@react-pdf/renderer";
import { kitStyles } from "./styles";

export function SubRegistrarGuidePage() {
  return (
    <Page size="A4" style={kitStyles.page}>
      <Text style={kitStyles.title}>Optional Registration Guide</Text>
      <View style={kitStyles.goldRule} />
      <Text style={kitStyles.body}>
        Registration of a will with the Sub-Registrar is optional in most Indian states but
        strengthens evidentiary value. If you choose to register:
      </Text>
      <Text style={kitStyles.listItem}>
        1. Carry the original signed will and valid government ID to your local Sub-Registrar
        office.
      </Text>
      <Text style={kitStyles.listItem}>
        2. Both witnesses should ideally accompany you, or be available if required by local
        practice.
      </Text>
      <Text style={kitStyles.listItem}>
        3. Pay the applicable registration fee and obtain the registered copy.
      </Text>
      <Text style={kitStyles.listItem}>
        4. Store the registered copy with your executor and update your Banyan registry notes.
      </Text>
      <Text style={kitStyles.body}>
        Requirements vary by state. Consult a local advocate if unsure whether registration is
        advisable for your estate.
      </Text>
      <Text style={kitStyles.footer}>This guide is informational only — not legal advice.</Text>
    </Page>
  );
}