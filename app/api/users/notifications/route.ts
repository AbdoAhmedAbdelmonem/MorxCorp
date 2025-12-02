import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { query, execute } from '@/lib/utils/db-helpers';
import { Notification, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    let sql = `
      SELECT n.*, t.title as task_title
      FROM notifications n
      LEFT JOIN task t ON n.task_id = t.task_id
      WHERE n.user_id = ?
    `;

    if (unreadOnly) {
      sql += ' AND n.is_read = 0';
    }

    sql += ' ORDER BY n.create_at DESC';

    const notifications = await query<Notification>(sql, [user.id]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'notification_id is required' },
        { status: 400 }
      );
    }

    await execute(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [notification_id, user.id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
