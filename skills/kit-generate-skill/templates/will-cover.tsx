import { Page, Text, View } from "@react-pdf/renderer";
import type { AssembledWill } from "../../clause-assembly-skill/types";
import type { EstateJson } from "../../intake-skill/estate-schema";
import { kitStyles } from "./styles";

interface WillCoverPageProps {
  estate: EstateJson;
  will: AssembledWill;
  preview?: boolean;
}

export function WillCoverPage({ estate, will, preview }: WillCoverPageProps) {
  return (
    <Page size="A4" style={kitStyles.page}>
      {preview && (
        <Text style={kitStyles.previewBanner}>
          PREVIEW — Placeholder clause library. Not valid for execution until lawyer sign-off.
        </Text>
      )}
      <Text style={kitStyles.title}>Last Will and Testament</Text>
      <View style={kitStyles.goldRule} />
      <Text style={kitStyles.subtitle}>
        Prepared for {estate.owner.name} · {will.religion_branch} succession branch
      </Text>
      {will.rendered_text.split("\n\n").map((para, i) => (
        <Text key={i} style={kitStyles.body}>
          {para}
        </Text>
      ))}
      <Text style={kitStyles.footer}>
        Banyan Execution Kit · Clause library v{will.clause_library_version} ·{" "}
        {will.clause_ids.length} clauses
      </Text>
    </Page>
  );
}