import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminRequest as verifyAdmin } from "@/lib/auth/session";

// Audit log helper
async function logAudit(
  supabase: any,
  adminId: string,
  action: string,
  targetMemberId: string,
  details: any
) {
  try {
    await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action,
      target_member_id: targetMemberId,
      details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// POST: Suspend member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const memberId = params.id;
    const body = await request.json();
    const {
      suspension_type,
      suspension_reason,
      additional_notes,
      days_count
    } = body;

    // Validate required fields
    if (!suspension_type || !suspension_reason) {
      return NextResponse.json(
        { error: 'Missing required fields: suspension_type and suspension_reason' },
        { status: 400 }
      );
    }

    // Validate suspension type
    const validTypes = ['temporary_24h', 'temporary_custom', 'permanent'];
    if (!validTypes.includes(suspension_type)) {
      return NextResponse.json(
        { error: 'Invalid suspension_type. Must be: temporary_24h, temporary_custom, or permanent' },
        { status: 400 }
      );
    }

    // Validate days_count for temporary_custom
    if (suspension_type === 'temporary_custom') {
      if (!days_count || days_count <= 0) {
        return NextResponse.json(
          { error: 'days_count is required and must be positive for temporary_custom suspension' },
          { status: 400 }
        );
      }
    }

    // Map suspension_reason to reason_category
    const reasonMap: { [key: string]: string } = {
      'Spam or flooding': 'spam_flooding',
      'Abusive language': 'abusive_language',
      'Harassment': 'harassment',
      'Inappropriate content': 'inappropriate_content',
      'Terms of service violation': 'terms_violation',
      'Other': 'other'
    };

    const reason_category = reasonMap[suspension_reason] || 'other';

    // Use Supabase admin client
    const supabase = supabaseAdmin;

    // Check if member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, email')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent self-suspension
    if (memberId === admin.id) {
      return NextResponse.json(
        { error: 'Cannot suspend yourself' },
        { status: 400 }
      );
    }

    // Call database function to suspend member
    const { data: suspensionId, error: suspendError } = await supabase
      .rpc('suspend_member', {
        p_member_id: memberId,
        p_suspended_by: admin.id,
        p_suspension_type: suspension_type,
        p_reason_category: reason_category,
        p_reason_details: additional_notes || suspension_reason,
        p_custom_days: suspension_type === 'temporary_custom' ? days_count : null
      });

    if (suspendError) {
      console.error('Suspension error:', suspendError);
      return NextResponse.json(
        { error: 'Failed to suspend member', details: suspendError.message },
        { status: 500 }
      );
    }

    // Log audit trail
    await logAudit(supabase, admin.id, 'MEMBER_SUSPENDED', memberId, {
      suspension_type,
      reason_category,
      reason_details: additional_notes || suspension_reason,
      days_count: suspension_type === 'temporary_custom' ? days_count : null,
      member_name: member.full_name,
      member_email: member.email
    });

    // Calculate expires_at for response
    let expires_at = null;
    if (suspension_type === 'temporary_24h') {
      const date = new Date();
      date.setHours(date.getHours() + 24);
      expires_at = date.toISOString();
    } else if (suspension_type === 'temporary_custom' && days_count) {
      const date = new Date();
      date.setDate(date.getDate() + days_count);
      expires_at = date.toISOString();
    }

    return NextResponse.json({
      success: true,
      message: 'Member suspended successfully',
      suspension: {
        id: suspensionId,
        member_id: memberId,
        suspension_type,
        reason_category,
        reason_details: additional_notes || suspension_reason,
        expires_at,
        suspended_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Suspend member error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Lift suspension
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const memberId = params.id;

    // Get suspension_id from query params
    const { searchParams } = new URL(request.url);
    const suspension_id = searchParams.get('suspension_id');

    if (!suspension_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: suspension_id' },
        { status: 400 }
      );
    }

    // Use Supabase admin client
    const supabase = supabaseAdmin;

    // Verify suspension exists and belongs to this member
    const { data: suspension, error: fetchError } = await supabase
      .from('member_suspensions')
      .select('id, member_id, suspension_type, reason_category, is_active')
      .eq('id', suspension_id)
      .eq('member_id', memberId)
      .single();

    if (fetchError || !suspension) {
      return NextResponse.json(
        { error: 'Suspension not found' },
        { status: 404 }
      );
    }

    if (!suspension.is_active) {
      return NextResponse.json(
        { error: 'Suspension is already inactive' },
        { status: 400 }
      );
    }

    // Call database function to lift suspension
    const { data: success, error: liftError } = await supabase
      .rpc('lift_suspension', {
        p_suspension_id: suspension_id,
        p_lifted_by: admin.id
      });

    if (liftError || !success) {
      console.error('Lift suspension error:', liftError);
      return NextResponse.json(
        { error: 'Failed to lift suspension', details: liftError?.message },
        { status: 500 }
      );
    }

    // Log audit trail
    await logAudit(supabase, admin.id, 'SUSPENSION_LIFTED', memberId, {
      suspension_id,
      suspension_type: suspension.suspension_type,
      reason_category: suspension.reason_category
    });

    return NextResponse.json({
      success: true,
      message: 'Suspension lifted successfully',
      suspension_id
    });

  } catch (error) {
    console.error('Lift suspension error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
