export interface NomineeInviteInput {
  fullName: string;
  email: string;
  phone?: string;
  relationship?: string;
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildInviteLink(token: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/nominees/${token}/release-status`;
}

export function buildInviteEmailText(params: {
  nomineeName: string;
  estateOwnerName: string;
  inviteLink: string;
}): { subject: string; text: string } {
  return {
    subject: "You have been named as a Banyan estate nominee",
    text: [
      `Dear ${params.nomineeName},`,
      "",
      `${params.estateOwnerName} has named you as a nominee for their Banyan estate vault.`,
      "",
      `View your invite status and release updates here:`,
      params.inviteLink,
      "",
      "Banyan — Founder's Office & Co",
    ].join("\n"),
  };
}