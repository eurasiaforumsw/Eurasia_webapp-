import { supabaseAdmin } from '@/lib/supabase';

/**
 * Check if member is currently suspended
 */
export async function checkMemberSuspension(memberId: string) {
  const { data, error } = await supabaseAdmin
    .rpc('is_member_suspended', { p_member_id: memberId });

  if (error) {
    console.error('Error checking suspension:', error);
    throw new Error('Failed to check member suspension status');
  }

  // The function returns a single row or empty
  const suspension = Array.isArray(data) ? data[0] : data;

  return {
    isSuspended: suspension?.is_suspended || false,
    details: suspension?.is_suspended ? {
      type: suspension.suspension_type,
      reasonCategory: suspension.reason_category,
      reasonDetails: suspension.reason_details,
      suspendedAt: suspension.suspended_at,
      expiresAt: suspension.expires_at,
    } : null,
  };
}

/**
 * Suspend a member
 */
export async function suspendMember(params: {
  memberId: string;
  suspendedBy: string;
  suspensionType: 'temporary_24h' | 'temporary_custom' | 'permanent';
  reasonCategory: 'spam_flooding' | 'abusive_language' | 'harassment' | 'inappropriate_content' | 'terms_violation' | 'other';
  reasonDetails?: string;
  customDays?: number;
}) {
  const { data, error } = await supabaseAdmin.rpc('suspend_member', {
    p_member_id: params.memberId,
    p_suspended_by: params.suspendedBy,
    p_suspension_type: params.suspensionType,
    p_reason_category: params.reasonCategory,
    p_reason_details: params.reasonDetails || null,
    p_custom_days: params.customDays || null,
  });

  if (error) {
    console.error('Error suspending member:', error);
    throw new Error('Failed to suspend member');
  }

  return { suspensionId: data };
}

/**
 * Lift a suspension
 */
export async function liftSuspension(suspensionId: string, liftedBy: string) {
  const { data, error } = await supabaseAdmin.rpc('lift_suspension', {
    p_suspension_id: suspensionId,
    p_lifted_by: liftedBy,
  });

  if (error) {
    console.error('Error lifting suspension:', error);
    throw new Error('Failed to lift suspension');
  }

  return { success: data };
}

/**
 * Get suspension history for a member
 */
export async function getMemberSuspensionHistory(memberId: string) {
  const { data, error } = await supabaseAdmin
    .from('member_suspensions')
    .select('*')
    .eq('member_id', memberId)
    .order('suspended_at', { ascending: false });

  if (error) {
    console.error('Error fetching suspension history:', error);
    throw new Error('Failed to fetch suspension history');
  }

  return data;
}

/**
 * Get all active suspensions (for admin dashboard)
 */
export async function getActiveSuspensions() {
  const { data, error } = await supabaseAdmin
    .from('member_suspensions')
    .select(`
      *,
      member:members!member_suspensions_member_id_fkey(id, full_name, email),
      suspended_by_member:members!member_suspensions_suspended_by_fkey(id, full_name)
    `)
    .eq('is_active', true)
    .order('suspended_at', { ascending: false });

  if (error) {
    console.error('Error fetching active suspensions:', error);
    throw new Error('Failed to fetch active suspensions');
  }

  return data;
}

/**
 * Expire old suspensions (call this periodically via cron)
 */
export async function expireSuspensions() {
  const { data, error } = await supabaseAdmin.rpc('expire_suspensions');

  if (error) {
    console.error('Error expiring suspensions:', error);
    throw new Error('Failed to expire suspensions');
  }

  return { expiredCount: data };
}

/**
 * Delete expired messages (call this periodically via cron)
 */
export async function deleteExpiredMessages() {
  const { data, error } = await supabaseAdmin.rpc('delete_expired_messages');

  if (error) {
    console.error('Error deleting expired messages:', error);
    throw new Error('Failed to delete expired messages');
  }

  return { deletedCount: data };
}
