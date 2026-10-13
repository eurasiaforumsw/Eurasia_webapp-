import type { NextRequest } from "next/server";
import { verifyRequestSession, type Session } from "@/lib/auth/session";

const ROLES = new Set(["super-admin", "admin", "pr"]);

export async function broadcastActor(req: NextRequest): Promise<Session | null> {
  const session = await verifyRequestSession(req);
  return session && ROLES.has(session.role) ? session : null;
}
