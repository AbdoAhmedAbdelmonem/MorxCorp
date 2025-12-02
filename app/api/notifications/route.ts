import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if notification table exists, if not return empty array
    try {
      let sql = `
        SELECT notification_id, user_id, type, title, message, related_id, is_read, created_at
        FROM notification
        WHERE user_id = ?
      `;

      if (unreadOnly) {
        sql += ' AND is_read = 0';
      }

      sql += ' ORDER BY created_at DESC LIMIT 50';

      const notifications = await query(sql, [userId]);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: notifications,
      });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array instead of error
      if (dbError.code === 'ER_NO_SUCH_TABLE' || dbError.message?.includes('doesn\'t exist')) {
        console.log('Notification table does not exist yet. Returning empty array.');
        return NextResponse.json<ApiResponse>({
          success: true,
          data: [],
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, type, title, message, related_id } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO notification (user_id, type, title, message, related_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, type, title, message, related_id || null]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Notification created',
      data: { notification_id: (result as any).insertId },
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
