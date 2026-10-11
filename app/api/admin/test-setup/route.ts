import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Test setup endpoint - creates test data for API testing
 * DEVELOPMENT ONLY - remove in production
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    const body = await request.json();
    const { action, member_id } = body;

    if (action === 'create_test_member') {
      const testMember = {
        id: member_id || 'member-test-001',
        full_name: 'Test Member',
        email: `test.${member_id}@example.com`,
        country: 'Thailand',
        membership_type: 'professional',
        organization: 'Test Organization',
        position: 'Test Position',
        expertise: 'Testing',
        password_hash: '$2b$12$test.hash.here',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if member exists
      const { data: existing } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('id', testMember.id)
        .single();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'Test member already exists',
          member_id: testMember.id
        });
      }

      // Create member
      const { data, error } = await supabaseAdmin
        .from('members')
        .insert(testMember)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create test member', details: error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Test member created',
        member_id: data.id
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Test setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
