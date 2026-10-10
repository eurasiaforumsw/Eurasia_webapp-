import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * GET /api/engagement/stats?memberId=xxx
 * Returns engagement statistics for a member using the get_member_engagement_stats() function
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      );
    }

    // Call the Supabase function
    const { data, error } = await supabaseAdmin.rpc('get_member_engagement_stats', {
      p_member_id: memberId
    });

    if (error) {
      console.error('[Engagement Stats API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch engagement stats', details: error.message },
        { status: 500 }
      );
    }

    // The function returns a single row, extract it
    const stats = data?.[0] || {
      total_likes: 0,
      total_saves: 0,
      total_views: 0,
      total_shares: 0,
      liked_content_ids: [],
      saved_content_ids: [],
      recent_activity: []
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalLikes: Number(stats.total_likes) || 0,
        totalSaves: Number(stats.total_saves) || 0,
        totalViews: Number(stats.total_views) || 0,
        totalShares: Number(stats.total_shares) || 0,
        likedContentIds: stats.liked_content_ids || [],
        savedContentIds: stats.saved_content_ids || [],
        recentActivity: stats.recent_activity || []
      }
    });
  } catch (err) {
    console.error('[Engagement Stats API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
