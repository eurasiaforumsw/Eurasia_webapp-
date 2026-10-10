import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const token = request.cookies.get('admin_token')?.value;

    if (!token && !authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // 1. Total Members with growth %
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id, created_at');

    if (membersError) throw membersError;

    const totalMembers = allMembers?.length || 0;
    const membersLastMonth = allMembers?.filter(m =>
      new Date(m.created_at) < lastMonth
    ).length || 0;

    const memberGrowth = membersLastMonth > 0
      ? ((totalMembers - membersLastMonth) / membersLastMonth * 100).toFixed(1)
      : '0.0';

    // 2. Total Content by type
    const { data: allContent, error: contentError } = await supabase
      .from('content')
      .select('id, type, created_at');

    if (contentError) throw contentError;

    const contentByType = {
      news: allContent?.filter(c => c.type === 'news').length || 0,
      events: allContent?.filter(c => c.type === 'event').length || 0,
      announcements: allContent?.filter(c => c.type === 'announcement').length || 0,
      total: allContent?.length || 0
    };

    // 3. Engagement Metrics - Likes
    const { data: likesToday } = await supabase
      .from('content_likes')
      .select('id')
      .gte('created_at', today.toISOString());

    const { data: likesWeek } = await supabase
      .from('content_likes')
      .select('id')
      .gte('created_at', weekAgo.toISOString());

    const { data: likesMonth } = await supabase
      .from('content_likes')
      .select('id')
      .gte('created_at', monthAgo.toISOString());

    const { data: likesTotal } = await supabase
      .from('content_likes')
      .select('id');

    // 4. Engagement Metrics - Saves (member_interests)
    const { data: savesToday } = await supabase
      .from('member_interests')
      .select('id')
      .gte('created_at', today.toISOString());

    const { data: savesWeek } = await supabase
      .from('member_interests')
      .select('id')
      .gte('created_at', weekAgo.toISOString());

    const { data: savesMonth } = await supabase
      .from('member_interests')
      .select('id')
      .gte('created_at', monthAgo.toISOString());

    const { data: savesTotal } = await supabase
      .from('member_interests')
      .select('id');

    // 5. Engagement Metrics - Views
    const { data: viewsToday } = await supabase
      .from('content_views')
      .select('id')
      .gte('viewed_at', today.toISOString());

    const { data: viewsWeek } = await supabase
      .from('content_views')
      .select('id')
      .gte('viewed_at', weekAgo.toISOString());

    const { data: viewsMonth } = await supabase
      .from('content_views')
      .select('id')
      .gte('viewed_at', monthAgo.toISOString());

    const { data: viewsTotal } = await supabase
      .from('content_views')
      .select('id');

    // 6. Active Sessions (currently active)
    const { data: activeSessions } = await supabase
      .from('member_sessions')
      .select('id')
      .eq('is_active', true)
      .gte('expires_at', now.toISOString());

    // 7. Recent Activity (last 24h)
    const yesterday = new Date(now);
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: recentActivity } = await supabase
      .from('member_activity')
      .select('id, action_type, created_at')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Activity breakdown by type
    const activityBreakdown: Record<string, number> = {};
    recentActivity?.forEach(activity => {
      activityBreakdown[activity.action_type] =
        (activityBreakdown[activity.action_type] || 0) + 1;
    });

    // 8. Content Shares
    const { data: sharesToday } = await supabase
      .from('content_shares')
      .select('id')
      .gte('shared_at', today.toISOString());

    const { data: sharesWeek } = await supabase
      .from('content_shares')
      .select('id')
      .gte('shared_at', weekAgo.toISOString());

    const { data: sharesMonth } = await supabase
      .from('content_shares')
      .select('id')
      .gte('shared_at', monthAgo.toISOString());

    // Compile response
    const analytics = {
      members: {
        total: totalMembers,
        growth: parseFloat(memberGrowth),
        newThisMonth: allMembers?.filter(m =>
          new Date(m.created_at) >= monthAgo
        ).length || 0
      },
      content: contentByType,
      engagement: {
        likes: {
          total: likesTotal?.length || 0,
          today: likesToday?.length || 0,
          week: likesWeek?.length || 0,
          month: likesMonth?.length || 0
        },
        saves: {
          total: savesTotal?.length || 0,
          today: savesToday?.length || 0,
          week: savesWeek?.length || 0,
          month: savesMonth?.length || 0
        },
        views: {
          total: viewsTotal?.length || 0,
          today: viewsToday?.length || 0,
          week: viewsWeek?.length || 0,
          month: viewsMonth?.length || 0
        },
        shares: {
          today: sharesToday?.length || 0,
          week: sharesWeek?.length || 0,
          month: sharesMonth?.length || 0
        }
      },
      sessions: {
        active: activeSessions?.length || 0
      },
      recentActivity: {
        total: recentActivity?.length || 0,
        breakdown: activityBreakdown,
        last24h: recentActivity?.slice(0, 10).map(a => ({
          type: a.action_type,
          timestamp: a.created_at
        }))
      },
      timestamp: now.toISOString()
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
