export function contentSecurityPolicy(nonce: string): string {
  const connections = ["'self'", "https://*.r2.cloudflarestorage.com"];
  if (process.env.NODE_ENV !== "production") connections.push("ws:", "http://localhost:2024");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connections.join(" ")}`,
    "worker-src 'self' blob:",
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
