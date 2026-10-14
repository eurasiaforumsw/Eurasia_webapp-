import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { ADMIN_ROLES } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const withLinks = "m.content ~* 'https?://'";
const flagged = String.raw`(
  LENGTH(REGEXP_REPLACE(m.content, '[^A-Z]', '', 'g'))::numeric / NULLIF(LENGTH(m.content), 0) > 0.7
  OR m.content ~ '[!?]{3,}' OR m.content ~ '(.)\1{4,}' OR LENGTH(BTRIM(m.content)) < 5
)`;

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
  if (status === 500) console.error('Admin messages error:', error);
  return NextResponse.json({ error: status === 500 ? 'Internal server error' : message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ADMIN_ROLES);
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(params.get('pageSize') || '50', 10) || 50));
    const offset = (page - 1) * pageSize;
    const filterType = params.get('filterType') || params.get('filter') || 'all';
    if (!['all', 'with_links', 'flagged'].includes(filterType) || !Number.isSafeInteger(offset)) {
      return NextResponse.json({ error: 'Invalid message filters' }, { status: 400 });
    }
    const conditions = ['m.deleted_at IS NULL'];
    const values: unknown[] = [];
    const add = (condition: string, value: unknown) => {
      values.push(value);
      conditions.push(condition.replace('?', `$${values.length}`));
    };
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    for (const [value, end] of [[startDate, false], [endDate, true]] as const) {
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'Invalid date filter' }, { status: 400 });
      if (end) date.setUTCHours(23, 59, 59, 999);
      add(end ? 'm.created_at <= ?' : 'm.created_at >= ?', date.toISOString());
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    }
    const search = params.get('search')?.trim();
    if (search) add('m.content ILIKE ?', `%${search}%`);
    if (filterType === 'with_links') conditions.push(withLinks);
    if (filterType === 'flagged') conditions.push(flagged);
    const where = conditions.join(' AND ');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const [messages, count, stats] = await Promise.all([
      query(`SELECT m.id, m.sender_id, m.conversation_id, m.content, m.created_at, m.read_at, m.deleted_at,
        COALESCE(sender.full_name, 'Unknown') AS sender_name,
        COALESCE(sender.email, 'unknown@example.com') AS sender_email,
        ${withLinks} AS contains_link, ${flagged} AS is_flagged
        FROM messages m LEFT JOIN members sender ON sender.id = m.sender_id
        WHERE ${where} ORDER BY m.created_at DESC, m.id DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, pageSize, offset]),
      query(`SELECT COUNT(*) AS count FROM messages m WHERE ${where}`, values),
      query(`SELECT COUNT(*) FILTER (WHERE m.created_at >= $1) AS total_today,
        COUNT(*) FILTER (WHERE ${withLinks}) AS with_links,
        COUNT(*) FILTER (WHERE ${flagged}) AS flagged
        FROM messages m WHERE m.deleted_at IS NULL`, [today.toISOString()]),
    ]);
    const total = Number(count.rows[0]?.count || 0);
    return NextResponse.json({
      messages: messages.rows.map((message) => ({ ...message,
        is_flagged: !!message.is_flagged, contains_link: !!message.contains_link,
        recipient_name: 'Conversation', recipient_email: message.conversation_id,
      })), total, page, pageSize, hasMore: offset + pageSize < total,
      stats: { total_today: Number(stats.rows[0]?.total_today || 0),
        with_links: Number(stats.rows[0]?.with_links || 0), flagged: Number(stats.rows[0]?.flagged || 0) },
    });
  } catch (error) { return failure(error); }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(req, ADMIN_ROLES);
    const input = await req.json().catch(() => null);
    if (typeof input?.messageId !== 'string' || !input.messageId.trim()) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }
    const { rows } = await query(
      'UPDATE messages SET deleted_at = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id',
      [new Date().toISOString(), input.messageId],
    );
    if (!rows.length) return NextResponse.json({ error: 'Message not found or already deleted' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}
