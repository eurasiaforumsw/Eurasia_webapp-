import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from "@/lib/api-auth";
import { MEMBER_REVIEW_ROLES } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// GET: Fetch member details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, MEMBER_REVIEW_ROLES);

    const memberId = params.id;

    // Fetch member details
    const { data: member, error: memberError } = await db
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
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 :
        error instanceof Error && error.message === 'Forbidden' ? 403 : 500 }
    );
  }
}
