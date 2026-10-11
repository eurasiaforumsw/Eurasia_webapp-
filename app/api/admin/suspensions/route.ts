import { NextRequest, NextResponse } from 'next/server';
import { suspendMember, liftSuspension, getMemberSuspensionHistory, getActiveSuspensions } from '@/lib/member-suspension';

// GET: Get suspension history or active suspensions
export async function GET(req: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new suspension
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      memberId,
      suspendedBy,
      suspensionType,
      reasonCategory,
      reasonDetails,
      customDays,
    } = body;

    // Validate required fields
    if (!memberId || !suspendedBy || !suspensionType || !reasonCategory) {
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
    if (suspensionType === 'temporary_custom' && (!customDays || customDays <= 0)) {
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
      suspendedBy,
      suspensionType,
      reasonCategory,
      reasonDetails,
      customDays,
    });

    return NextResponse.json({
      success: true,
      suspensionId: result.suspensionId,
    });

  } catch (error) {
    console.error('Error in POST suspension API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Lift a suspension
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const suspensionId = searchParams.get('suspensionId');
    const liftedBy = searchParams.get('liftedBy');

    if (!suspensionId || !liftedBy) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await liftSuspension(suspensionId, liftedBy);

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
