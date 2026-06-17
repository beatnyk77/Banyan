import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const webhookSecret = Deno.env.get("RELEASE_NOTIFY_WEBHOOK_SECRET");
  const incomingSecret = req.headers.get("X-Webhook-Secret");

  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const record = payload.record ?? payload;
  const releaseEventId = record.id as string;
  const estateId = record.estate_id as string;
  const newStatus = record.status as string;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: nominees } = await supabase
    .from("nominees")
    .select("id, full_name, email")
    .eq("estate_id", estateId)
    .eq("kyc_status", "kyc_verified");

  if (!nominees?.length) {
    return new Response("No verified nominees", { status: 200 });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    for (const nominee of nominees) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Banyan <notifications@banyan.fo>",
          to: nominee.email,
          subject: `Estate release update — ${newStatus}`,
          text: `Dear ${nominee.full_name},\n\nAn estate release event has been updated to: ${newStatus}.\n\nRelease event ID: ${releaseEventId}\n\nBanyan`,
        }),
      });
    }
  }

  await supabase
    .from("release_events")
    .update({ notified_nominees: nominees.map((n) => n.id) })
    .eq("id", releaseEventId);

  return new Response("OK", { status: 200 });
});