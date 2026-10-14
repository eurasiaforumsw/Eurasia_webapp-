import { NextRequest, NextResponse } from "next/server";
import { db, query } from "@/lib/db";
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

  let campaign;
  try {
    const result = await db.from("email_campaigns").select("*").eq("id", campaignId).maybeSingle();
    campaign = result.data;
  } catch (error) {
    console.error("[POST /api/broadcast/send] Failed to load campaign", error);
    return fail("Failed to load campaign", 500);
  }
  if (!campaign) return fail("Campaign not found", 404);
  if (campaign.status !== "draft") return fail("Campaign is not a draft", 409);

  try {
    const { rows: claimed } = await query(
      `UPDATE email_campaigns SET status = 'sending', updated_at = now(), error_message = NULL
       WHERE id = $1 AND status = 'draft' RETURNING *`,
      [campaignId]
    );
    if (!claimed.length) return fail("Campaign is already being sent", 409);
    campaign = claimed[0];
  } catch (error) {
    console.error("[POST /api/broadcast/send] Failed to claim campaign", error);
    return fail("Failed to claim campaign", 500);
  }

  let deliveryStarted = false;
  try {
    const members: Array<{ id: string; email: string; full_name: string | null }> = [];
    for (let offset = 0; ; offset += 500) {
      // Build WHERE conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // target_statuses filter
      const statuses = campaign.target_statuses?.length ? campaign.target_statuses : ["active"];
      conditions.push(`status = ANY($${paramIndex})`);
      params.push(statuses);
      paramIndex++;

      // audience filter
      if (campaign.audience && campaign.audience !== "all") {
        conditions.push(`membership_type = $${paramIndex}`);
        params.push(campaign.audience);
        paramIndex++;
      }

      // target_groups overlaps filter
      if (campaign.target_groups?.length) {
        conditions.push(`target_groups && $${paramIndex}`);
        params.push(campaign.target_groups);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');
      const { rows: page } = await query(
        `SELECT id, email, full_name FROM members WHERE ${whereClause} ORDER BY id LIMIT 500 OFFSET $${paramIndex}`,
        [...params, offset]
      );

      members.push(...page);
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
      await db.from("email_campaigns").update({ status: "draft", error_message: "No recipients found matching criteria", recipient_count: 0 }).eq("id", campaignId);
      return fail("No recipients found matching criteria", 400);
    }

    for (let index = 0; index < recipients.length; index += 500) {
      const records = recipients.slice(index, index + 500).map((member) => ({
        campaign_id: campaignId, member_id: member.id, email: member.email,
        full_name: member.full_name, status: "pending",
      }));
      await db.from("campaign_recipients").insert(records).execute();
    }
    await db.from("email_campaigns")
      .update({ recipient_count: recipients.length }).eq("id", campaignId);

    const html = generateEmailTemplate(campaign.body_html, campaign.preheader, campaign.cover_image);
    deliveryStarted = true;
    const result = await sendCampaignEmails(
      recipients.map((member) => ({ email: member.email, name: member.full_name || "Member" })),
      campaign.subject, html, campaign.body_text || undefined,
    );

    // Email providers may normalize addresses to lowercase. Match using a
    // canonical form so an uppercase address is not incorrectly marked failed.
    const resultsByEmail = new Map(result.results.map((item) => [item.email.trim().toLowerCase(), item]));
    let sent = 0;
    let failed = 0;
    for (const member of recipients) {
      const item = resultsByEmail.get(member.email.trim().toLowerCase());
      const succeeded = Boolean(item?.emailId);
      await db.from("campaign_recipients").update({
        status: succeeded ? "sent" : "failed",
        sent_at: succeeded ? new Date().toISOString() : null,
        resend_email_id: item?.emailId || null,
        error_message: succeeded ? null : item?.error || "Delivery service returned no result",
      }).match({ campaign_id: campaignId, member_id: member.id });
      if (succeeded) sent++; else failed++;
    }

    await db.from("email_campaigns").update({
      status: failed ? "failed" : "sent",
      sent_at: sent ? new Date().toISOString() : null,
      completed_at: new Date().toISOString(),
      error_message: failed ? `${failed} recipients failed` : null,
    }).eq("id", campaignId);

    return NextResponse.json({ success: failed === 0, totalRecipients: recipients.length, totalSent: sent, totalFailed: failed });
  } catch (error) {
    console.error("[POST /api/broadcast/send]", error);
    const message = error instanceof Error ? error.message : "Campaign send failed";
    let status = "failed";
    if (!deliveryStarted) {
      try {
        await db.from("campaign_recipients").delete().eq("campaign_id", campaignId).execute();
        status = "draft";
      } catch (cleanupError) {
        console.error("[POST /api/broadcast/send] Failed to clean up recipients", cleanupError);
      }
    }
    try {
      await db.from("email_campaigns").update({ status, error_message: message, completed_at: new Date().toISOString() }).eq("id", campaignId);
    } catch (statusError) {
      console.error("[POST /api/broadcast/send] Failed to persist campaign failure", statusError);
    }
    return fail(message, 500);
  }
}
