import { NextRequest, NextResponse } from 'next/server';
import { suspendMember, liftSuspension, getMemberSuspensionHistory, getActiveSuspensions } from '@/lib/member-suspension';
import { requireRole } from '@/lib/api-auth';
import { MEMBER_REVIEW_ROLES } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 :
    /Cannot suspend/.test(message) ? 403 : message === 'Member not found' ? 404 : 500;
  return NextResponse.json({ error: message }, { status });
}

// GET: Get suspension history or active suspensions
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, MEMBER_REVIEW_ROLES);
    const searchParams = req.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const activeOnly = searchParams.get('active') === 'true';

    if (memberId) {
      // Get suspension history for specific member
      const history = await getMemberSuspensionHistory(memberId);
      return NextResponse.json({ history });
    }

    if (activeOnly) {
      // Get all active suspensions
      const activeSuspensions = await getActiveSuspensions();
      return NextResponse.json({ suspensions: activeSuspensions });
    }

    return NextResponse.json(
      { error: 'Missing query parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in GET suspensions API:', error);
    return failure(error);
  }
}

// POST: Create a new suspension
export async function POST(req: NextRequest) {
  try {
    const actor = await requireRole(req, MEMBER_REVIEW_ROLES);
    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }
    const {
      memberId,
      suspensionType,
      reasonCategory,
      reasonDetails,
      customDays,
    } = body || {};

    // Validate required fields
    if (typeof memberId !== 'string' || !memberId || typeof suspensionType !== 'string' || typeof reasonCategory !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate suspension type
    if (!['temporary_24h', 'temporary_custom', 'permanent'].includes(suspensionType)) {
      return NextResponse.json(
        { error: 'Invalid suspension type' },
        { status: 400 }
      );
    }

    // Validate custom days if temporary_custom
    if (suspensionType === 'temporary_custom' && (!Number.isInteger(customDays) || customDays < 1 || customDays > 3650)) {
      return NextResponse.json(
        { error: 'Custom days required for temporary_custom suspension' },
        { status: 400 }
      );
    }

    // Validate reason category
    const validReasons = [
      'spam_flooding',
      'abusive_language',
      'harassment',
      'inappropriate_content',
      'terms_violation',
      'other'
    ];

    if (!validReasons.includes(reasonCategory)) {
      return NextResponse.json(
        { error: 'Invalid reason category' },
        { status: 400 }
      );
    }

    // Create suspension
    const result = await suspendMember({
      memberId,
      suspendedBy: actor.id,
      suspensionType: suspensionType as 'temporary_24h' | 'temporary_custom' | 'permanent',
      reasonCategory: reasonCategory as 'spam_flooding' | 'abusive_language' | 'harassment' | 'inappropriate_content' | 'terms_violation' | 'other',
      reasonDetails,
      customDays,
    });

    return NextResponse.json({
      success: true,
      suspensionId: result.suspensionId,
    });

  } catch (error) {
    console.error('Error in POST suspension API:', error);
    return failure(error);
  }
}

// DELETE: Lift a suspension
export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireRole(req, MEMBER_REVIEW_ROLES);
    const searchParams = req.nextUrl.searchParams;
    const suspensionId = searchParams.get('suspensionId');

    if (!suspensionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await liftSuspension(suspensionId, actor.id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Suspension not found or already lifted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Suspension lifted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE suspension API:', error);
    return failure(error);
  }
}
