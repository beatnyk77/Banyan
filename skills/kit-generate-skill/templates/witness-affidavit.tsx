import { Page, Text, View } from "@react-pdf/renderer";
import { kitStyles } from "./styles";

interface WitnessAffidavitPageProps {
  estateOwnerName: string;
}

export function WitnessAffidavitPage({ estateOwnerName }: WitnessAffidavitPageProps) {
  return (
    <Page size="A4" style={kitStyles.page}>
      <Text style={kitStyles.title}>Witness Affidavit</Text>
      <View style={kitStyles.goldRule} />
      <Text style={kitStyles.body}>
        We, the undersigned witnesses, hereby declare that on the date written below we were
        present together when {estateOwnerName} signed this will in our presence, appeared to
        be of sound mind, and requested us to attest the will as witnesses.
      </Text>
      <Text style={kitStyles.sectionHeading}>Witness 1</Text>
      <Text style={kitStyles.body}>Name: _________________________________</Text>
      <Text style={kitStyles.body}>Address: _______________________________</Text>
      <Text style={kitStyles.body}>Signature: ____________________________ Date: __________</Text>
      <Text style={kitStyles.sectionHeading}>Witness 2</Text>
      <Text style={kitStyles.body}>Name: _________________________________</Text>
      <Text style={kitStyles.body}>Address: _______________________________</Text>
      <Text style={kitStyles.body}>Signature: ____________________________ Date: __________</Text>
      <Text style={kitStyles.footer}>
        Both witnesses must be present at the same time. Neither witness may be a beneficiary.
      </Text>
    </Page>
  );
}