export type SuspensionStatus = {
  is_active?: boolean | null;
  expires_at?: string | null;
};

/** A suspension with no expiry is permanent; an expired temporary record is inactive. */
export function isActiveSuspension(record: SuspensionStatus, now = Date.now()): boolean {
  if (record.is_active !== true) return false;
  if (!record.expires_at) return true;
  const expires = Date.parse(record.expires_at);
  return !Number.isFinite(expires) || expires > now;
}
