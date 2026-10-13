import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendCampaignEmails, generateEmailTemplate } from "@/lib/email";
import { broadcastActor } from "../_auth";

export const runtime = "nodejs";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  if (!await broadcastActor(req)) return fail("Unauthorized", 401);
  const input = await req.json().catch(() => null);
  const campaignId = input?.campaignId;
  if (typeof campaignId !== "string" || !/^[0-9a-f-]{36}$/i.test(campaignId)) return fail("Invalid campaign ID", 400);
  if (!process.env.RESEND_API_KEY) return fail("Email delivery is not configured", 503);

  const { data: campaign, error: loadError } = await supabaseAdmin.from("email_campaigns")
    .select("*").eq("id", campaignId).maybeSingle();
  if (loadError) return fail("Failed to load campaign", 500);
  if (!campaign) return fail("Campaign not found", 404);
  if (campaign.status !== "draft") return fail("Campaign is not a draft", 409);

  const { data: claimed, error: claimError } = await supabaseAdmin.rpc("claim_email_campaign", { p_campaign_id: campaignId });
  if (claimError) return fail("Failed to claim campaign", 500);
  if (!claimed) return fail("Campaign is already being sent", 409);

  let deliveryStarted = false;
  try {
    const members: Array<{ id: string; email: string; full_name: string | null }> = [];
    for (let offset = 0; ; offset += 500) {
      let recipientsQuery = supabaseAdmin.from("members")
        .select("id, email, full_name")
        .in("status", campaign.target_statuses?.length ? campaign.target_statuses : ["active"]);
      if (campaign.audience && campaign.audience !== "all") recipientsQuery = recipientsQuery.eq("membership_type", campaign.audience);
      if (campaign.target_groups?.length) recipientsQuery = recipientsQuery.overlaps("target_groups", campaign.target_groups);
      const { data: page, error: membersError } = await recipientsQuery.order("id").range(offset, offset + 499);
      if (membersError) throw new Error("Failed to load recipients");
      members.push(...(page || []));
      if (members.length > 50000) throw new Error("Audience exceeds the maximum campaign size");
      if (!page || page.length < 500) break;
    }
    const seenEmails = new Set<string>();
    const recipients = members.filter((member) => {
      if (typeof member.email !== "string" || !member.email.trim()) return false;
      const email = member.email.trim().toLowerCase();
      if (seenEmails.has(email)) return false;
      seenEmails.add(email);
      return true;
    });
    if (!recipients.length) {
      await supabaseAdmin.from("email_campaigns").update({ status: "draft", error_message: "No recipients found matching criteria", recipient_count: 0 }).eq("id", campaignId);
      return fail("No recipients found matching criteria", 400);
    }

    for (let index = 0; index < recipients.length; index += 500) {
      const records = recipients.slice(index, index + 500).map((member) => ({
        campaign_id: campaignId, member_id: member.id, email: member.email,
        full_name: member.full_name, status: "pending",
      }));
      const { error: insertError } = await supabaseAdmin.from("campaign_recipients").insert(records);
      if (insertError) throw new Error("Failed to persist recipient records");
    }
    const { error: countError } = await supabaseAdmin.from("email_campaigns")
      .update({ recipient_count: recipients.length }).eq("id", campaignId);
    if (countError) throw new Error("Failed to persist recipient count");

    const html = generateEmailTemplate(campaign.body_html, campaign.preheader, campaign.cover_image);
    deliveryStarted = true;
    const result = await sendCampaignEmails(
      recipients.map((member) => ({ email: member.email, name: member.full_name || "Member" })),
      campaign.subject, html, campaign.body_text || undefined,
    );

    const resultsByEmail = new Map(result.results.map((item) => [item.email, item]));
    let sent = 0;
    let failed = 0;
    for (const member of recipients) {
      const item = resultsByEmail.get(member.email);
      const succeeded = Boolean(item?.emailId);
      const { error } = await supabaseAdmin.from("campaign_recipients").update({
        status: succeeded ? "sent" : "failed",
        sent_at: succeeded ? new Date().toISOString() : null,
        resend_email_id: item?.emailId || null,
        error_message: succeeded ? null : item?.error || "Delivery service returned no result",
      }).eq("campaign_id", campaignId).eq("member_id", member.id);
      if (error) {
        console.error("[POST /api/broadcast/send] Failed to persist recipient result", { campaignId, memberId: member.id, error });
        throw new Error("Failed to persist delivery result");
      }
      if (succeeded) sent++; else failed++;
    }

    const { error: finalError } = await supabaseAdmin.from("email_campaigns").update({
      status: failed ? "failed" : "sent",
      sent_at: sent ? new Date().toISOString() : null,
      completed_at: new Date().toISOString(),
      error_message: failed ? `${failed} recipients failed` : null,
    }).eq("id", campaignId);
    if (finalError) throw new Error("Failed to persist campaign status");

    return NextResponse.json({ success: failed === 0, totalRecipients: recipients.length, totalSent: sent, totalFailed: failed });
  } catch (error) {
    console.error("[POST /api/broadcast/send]", error);
    const message = error instanceof Error ? error.message : "Campaign send failed";
    let status = "failed";
    if (!deliveryStarted) {
      const cleanup = await supabaseAdmin.from("campaign_recipients").delete().eq("campaign_id", campaignId);
      if (!cleanup.error) status = "draft";
    }
    await supabaseAdmin.from("email_campaigns").update({ status, error_message: message, completed_at: new Date().toISOString() }).eq("id", campaignId);
    return fail(message, 500);
  }
}
