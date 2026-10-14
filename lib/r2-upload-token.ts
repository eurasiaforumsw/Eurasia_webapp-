import { createHmac, timingSafeEqual } from "node:crypto";

export type UploadClaim = {
  key: string; destination: string; contentType: string; size: number;
  user: string; purpose: "media" | "document" | "gallery" | "avatar"; expires: number;
};

function signature(value: string) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  return createHmac("sha256", process.env.JWT_SECRET).update(value).digest("base64url");
}

export function issueUploadToken(claim: UploadClaim) {
  const encoded = Buffer.from(JSON.stringify(claim)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyUploadToken(token: string, user: string): UploadClaim | null {
  const pieces = token.split(".");
  if (pieces.length !== 2 || pieces.some((piece) => !/^[A-Za-z0-9_-]+$/.test(piece))) return null;
  const [encoded, provided] = pieces;
  const expected = signature(encoded);
  if (provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  try {
    const claim = JSON.parse(Buffer.from(encoded, "base64url").toString()) as UploadClaim;
    return claim.user === user && claim.expires > Date.now() ? claim : null;
  } catch { return null; }
}
