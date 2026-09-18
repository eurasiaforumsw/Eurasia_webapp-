import { NextResponse } from "next/server";

/* Reader-facing machine translation.
 *
 * Provider is MyMemory: free, no API key, and it returns natural Thai/Korean
 * (LibreTranslate's public instances segment Thai word-by-word, which reads
 * broken). Requests are proxied through this route rather than called from the
 * browser so the provider can be swapped without touching the client, and so
 * the optional contact-email quota bump stays server-side.
 *
 * Set MYMEMORY_CONTACT_EMAIL to raise the anonymous daily character limit.
 */

const PROVIDER_ENDPOINT = "https://api.mymemory.translated.net/get";
const SUPPORTED = new Set(["th", "ko", "en"]);
/* Provider caps each call; longer bodies are split into sentence-sized chunks. */
const MAX_SEGMENT_CHARS = 480;
const MAX_TOTAL_CHARS = 12000;

/** Splits text on sentence and newline boundaries, never mid-word. */
const segment = (text: string): string[] => {
  const parts: string[] = [];
  for (const block of text.split(/\n/)) {
    if (block.length <= MAX_SEGMENT_CHARS) {
      parts.push(block);
      continue;
    }
    let current = "";
    for (const sentence of block.split(/(?<=[.!?])\s+/)) {
      if ((current + sentence).length > MAX_SEGMENT_CHARS && current) {
        parts.push(current.trim());
        current = "";
      }
      current += `${sentence} `;
    }
    if (current.trim()) parts.push(current.trim());
  }
  return parts;
};

const translateSegment = async (text: string, target: string): Promise<string> => {
  if (!text.trim()) return text;

  const url = new URL(PROVIDER_ENDPOINT);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `en|${target}`);
  const contact = process.env.MYMEMORY_CONTACT_EMAIL;
  if (contact) url.searchParams.set("de", contact);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    // Provider results are stable per string; let the platform cache them.
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) throw new Error(`Provider responded ${response.status}`);

  const payload = await response.json();
  const translated = payload?.responseData?.translatedText;
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error("Provider returned no translation");
  }
  // MyMemory echoes quota warnings in the payload instead of failing.
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) {
    throw new Error("Provider quota reached");
  }
  return translated;
};

export async function POST(request: Request) {
  let body: { fields?: Record<string, string>; target?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const target = body.target?.toLowerCase() ?? "";
  const fields = body.fields ?? {};

  if (!SUPPORTED.has(target)) {
    return NextResponse.json({ error: `Unsupported target locale: ${target}` }, { status: 400 });
  }
  if (target === "en") {
    return NextResponse.json({ fields });
  }

  const entries = Object.entries(fields).filter(([, value]) => typeof value === "string");
  const totalChars = entries.reduce((sum, [, value]) => sum + value.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json({ error: "Content too long to translate" }, { status: 413 });
  }

  try {
    const translated: Record<string, string> = {};
    for (const [key, value] of entries) {
      const pieces = segment(value);
      const results: string[] = [];
      // Sequential on purpose: the free tier rate-limits parallel bursts.
      for (const piece of pieces) {
        results.push(await translateSegment(piece, target));
      }
      translated[key] = value.includes("\n") ? results.join("\n") : results.join(" ");
    }
    return NextResponse.json({ fields: translated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
