import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminRequest as verifyAdmin } from "@/lib/auth/session";

// GET: Fetch member details
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

    // Fetch member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, email, created_at, updated_at')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      created_at: member.created_at,
      updated_at: member.updated_at,
    });

  } catch (error) {
    console.error('Get member details error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
