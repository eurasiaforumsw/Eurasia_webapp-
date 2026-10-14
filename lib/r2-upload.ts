"use client";

/** Browser uploads bytes to R2; Vercel only handles the small signed requests. */
export async function uploadFileDirect(file: File, purpose: "media" | "document" | "gallery" | "avatar" = "media") {
  const signed = await fetch("/api/upload/direct", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "presign", purpose, contentType: file.type, size: file.size }) });
  const ticket = await signed.json();
  if (!signed.ok) throw new Error(ticket.error || "Could not start upload");
  const uploaded = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploaded.ok) throw new Error("R2 upload failed");
  const complete = await fetch("/api/upload/direct", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "finalize", token: ticket.token }) });
  const result = await complete.json();
  if (!complete.ok) throw new Error(result.error || "Could not finish upload");
  return result;
}
