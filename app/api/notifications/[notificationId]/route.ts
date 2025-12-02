import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { queryOne, execute } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const notificationId = params.notificationId;

    // Verify notification belongs to user
    const notification = await queryOne(
      'SELECT user_id FROM notifications WHERE notification_id = ?',
      [notificationId]
    );

    if (!notification) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.user_id !== parseInt(user.id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await execute(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ?',
      [notificationId]
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const notificationId = params.notificationId;

    // Verify notification belongs to user
    const notification = await queryOne(
      'SELECT user_id FROM notifications WHERE notification_id = ?',
      [notificationId]
    );

    if (!notification) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.user_id !== parseInt(user.id)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await execute('DELETE FROM notifications WHERE notification_id = ?', [notificationId]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
