/** Neon HTTPS queries for Edge middleware. Node.js routes use lib/db.ts. */
export async function queryNeonJson<T>(statement: string, params: unknown[] = []): Promise<T[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Database service is not configured");
  const connection = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(connection.protocol) ||
      !connection.hostname.endsWith(".neon.tech")) {
    throw new Error("Edge database queries require a Neon connection URL");
  }
  const endpoint = `https://${connection.hostname.replace(/-pooler(?=\.)/, "")}/sql`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Neon-Connection-String": connectionString,
        "Neon-Raw-Text-Output": "true",
        "Neon-Array-Mode": "false",
      },
      body: JSON.stringify({ query: statement, params }),
      cache: "no-store",
      signal: controller.signal,
    });
    // Do not expose database errors or connection credentials in responses/logs.
    if (!response.ok) throw new Error("Database service is unavailable");
    const result = await response.json() as { rows?: { result: string | T }[] };
    if (!Array.isArray(result.rows)) throw new Error("Invalid database response");
    return result.rows.map((row) => typeof row.result === "string" ? JSON.parse(row.result) as T : row.result);
  } finally {
    clearTimeout(timeout);
  }
}
