import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TimeSeriesData = {
  date: string;
  value: number;
};

type EngagementResponse = {
  likes: TimeSeriesData[];
  saves: TimeSeriesData[];
  views: TimeSeriesData[];
  newMembers: TimeSeriesData[];
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin']);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Likes per day (last 30 days)
    const { data: likesData, error: likesError } = await supabaseAdmin
      .from('engagement_likes')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoISO);

    if (likesError) throw likesError;

    // Saves (interests) per day
    const { data: savesData, error: savesError } = await supabaseAdmin
      .from('engagement_interests')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoISO);

    if (savesError) throw savesError;

    // Views per day
    const { data: viewsData, error: viewsError } = await supabaseAdmin
      .from('engagement_views')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoISO);

    if (viewsError) throw viewsError;

    // New members per day
    const { data: membersData, error: membersError } = await supabaseAdmin
      .from('members')
      .select('joined_at')
      .gte('joined_at', thirtyDaysAgoISO);

    if (membersError) throw membersError;

    // Helper to aggregate by date
    const aggregateByDate = (data: Array<{ created_at?: string; joined_at?: string }>): TimeSeriesData[] => {
      const counts: Record<string, number> = {};

      data.forEach(item => {
        const timestamp = item.created_at || item.joined_at;
        if (!timestamp) return;

        const date = timestamp.split('T')[0]; // Extract YYYY-MM-DD
        counts[date] = (counts[date] || 0) + 1;
      });

      // Fill missing dates with 0
      const result: TimeSeriesData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          value: counts[dateStr] || 0
        });
      }

      return result;
    };

    const response: EngagementResponse = {
      likes: aggregateByDate(likesData || []),
      saves: aggregateByDate(savesData || []),
      views: aggregateByDate(viewsData || []),
      newMembers: aggregateByDate(membersData || [])
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics engagement error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch engagement analytics' },
      { status: 500 }
    );
  }
}
