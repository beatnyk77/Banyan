import { verifyNomineeInviteToken } from "@/lib/nominee-tokens";
import { createServiceClient } from "@/lib/supabase/server";

export async function resolveNomineeByAccessToken(accessToken: string) {
  const service = createServiceClient();

  const nomineeId = verifyNomineeInviteToken(accessToken);
  if (nomineeId) {
    const { data, error } = await service
      .from("nominees")
      .select("id, estate_id, full_name, email, kyc_status, invite_token")
      .eq("id", nomineeId)
      .single();

    if (!error && data) return data;
  }

  const { data, error } = await service
    .from("nominees")
    .select("id, estate_id, full_name, email, kyc_status, invite_token")
    .eq("invite_token", accessToken)
    .single();

  if (error || !data) return null;
  return data;
}