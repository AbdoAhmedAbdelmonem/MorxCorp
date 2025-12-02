import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/utils/db-helpers';

// POST - Like/Unlike a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comment_id, user_id } = body;

    if (!comment_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Comment ID and User ID are required' },
        { status: 400 }
      );
    }

    // Increment the likes counter
    await execute(
      'UPDATE task_comment SET likes = COALESCE(likes, 0) + 1 WHERE comment_id = ?',
      [comment_id]
    );

    // Get the updated comment
    const updatedComment = await query(
      'SELECT COALESCE(likes, 0) as likes FROM task_comment WHERE comment_id = ?',
      [comment_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        likes: updatedComment[0]?.likes || 0
      }
    });

  } catch (error) {
    console.error('Like comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}
