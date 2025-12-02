import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Mark notification as read
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notification_id, user_id } = body;

    if (!notification_id || !user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE notification SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [notification_id, user_id]
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

/**
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [user_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
