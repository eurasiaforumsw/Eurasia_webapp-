import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminRequest as verifyAdmin } from "@/lib/auth/session";

// GET: Fetch member suspension history
export async function GET(
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

    // Use Supabase admin client
    const supabase = supabaseAdmin;

    // Fetch all suspensions for this member (active and inactive)
    const { data: suspensions, error: suspensionError } = await supabase
      .from('member_suspensions')
      .select(
        'id, suspension_type, reason_category, reason_details, suspended_at, expires_at, is_active, lifted_at'
      )
      .eq('member_id', memberId)
      .order('suspended_at', { ascending: false });

    if (suspensionError) {
      console.error('Suspension fetch error:', suspensionError);
      return NextResponse.json(
        { error: 'Failed to fetch suspensions', details: suspensionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      member_id: memberId,
      suspensions: suspensions || [],
      total: suspensions?.length || 0,
    });

  } catch (error) {
    console.error('Get member suspensions error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
