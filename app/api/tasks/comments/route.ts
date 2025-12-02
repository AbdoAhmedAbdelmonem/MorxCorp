import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/utils/db-helpers';

// GET - Get all comments for a task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const task_id = searchParams.get('task_id');

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const comments = await query(
      `SELECT 
        tc.comment_id,
        tc.comment_text,
        tc.created_at,
        COALESCE(tc.likes, 0) as likes,
        u.user_id,
        u.first_name,
        u.last_name,
        u.profile_image
      FROM task_comment tc
      JOIN user u ON tc.user_id = u.user_id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at DESC`,
      [task_id]
    );

    return NextResponse.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, user_id, comment_text } = body;

    if (!task_id || !user_id || !comment_text) {
      return NextResponse.json(
        { success: false, error: 'Task ID, User ID, and comment text are required' },
        { status: 400 }
      );
    }

    const result = await execute(
      'INSERT INTO task_comment (task_id, user_id, comment_text) VALUES (?, ?, ?)',
      [task_id, user_id, comment_text]
    );

    // Get the newly created comment with user info
    const newComment = await query(
      `SELECT 
        tc.comment_id,
        tc.comment_text,
        tc.created_at,
        COALESCE(tc.likes, 0) as likes,
        u.user_id,
        u.first_name,
        u.last_name,
        u.profile_image
      FROM task_comment tc
      JOIN user u ON tc.user_id = u.user_id
      WHERE tc.comment_id = ?`,
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      data: newComment[0]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comment_id = searchParams.get('comment_id');
    const user_id = searchParams.get('user_id');

    if (!comment_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Comment ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify the comment belongs to the user
    const comment = await query(
      'SELECT * FROM task_comment WHERE comment_id = ? AND user_id = ?',
      [comment_id, user_id]
    );

    if (comment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment not found or unauthorized' },
        { status: 403 }
      );
    }

    await execute('DELETE FROM task_comment WHERE comment_id = ?', [comment_id]);

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
