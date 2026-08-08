// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail, createMemberWelcomeEmail } from '@/lib/resend-email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, memberType, organization, country } = body;

    // Validation
    if (!email || !password || !firstName || !lastName || !memberType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['professional', 'student', 'institutional'].includes(memberType)) {
      return NextResponse.json(
        { error: 'Invalid member type' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Check if email already exists
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create member
    const { data: member, error: insertError } = await supabase
      .from('members')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        member_type: memberType,
        organization: organization || null,
        country: country || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      actor_id: member.id,
      actor_name: `${firstName} ${lastName}`,
      action: 'member_registered',
      resource_type: 'member',
      resource_id: member.id,
      details: { member_type: memberType },
    });

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to EFSW!',
        html: createMemberWelcomeEmail(`${firstName} ${lastName}`),
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      member: {
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        status: member.status,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
