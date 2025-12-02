import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get all comments for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const { taskId } = params;

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has access to this task (is a team member)
    const access = await queryOne(
      `SELECT b.user_id, b.role
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE t.task_id = ? AND b.user_id = ?`,
      [taskId, userId]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all comments for the task
    const comments = await query(
      `SELECT tc.*, u.first_name, u.last_name, u.profile_image
       FROM task_comment tc
       INNER JOIN user u ON tc.user_id = u.user_id
       WHERE tc.task_id = ?
       ORDER BY tc.comment_id ASC`,
      [taskId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add a comment to a task - anyone in the team can comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await request.json();
    const { comment_text, user_id } = body;
    const { taskId } = params;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!comment_text || !comment_text.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_text is required' },
        { status: 400 }
      );
    }

    // Check if user is a team member for this task's project
    const access = await queryOne(
      `SELECT b.user_id, b.role
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE t.task_id = ? AND b.user_id = ?`,
      [taskId, user_id]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied - not a team member' },
        { status: 403 }
      );
    }

    // Create comment
    const result = await query(
      'INSERT INTO task_comment (comment_text, task_id, user_id) VALUES (?, ?, ?)',
      [comment_text, taskId, user_id]
    );

    const commentId = (result as any).insertId;

    // Fetch the created comment with user info
    const newComment = await queryOne(
      `SELECT tc.*, u.first_name, u.last_name, u.profile_image
       FROM task_comment tc
       INNER JOIN user u ON tc.user_id = u.user_id
       WHERE tc.comment_id = ?`,
      [commentId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Comment added successfully',
        data: newComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a comment (only admin/owner, task creator, or comment creator can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const commentId = searchParams.get('comment_id');
    const { taskId } = params;

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!commentId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_id is required' },
        { status: 400 }
      );
    }

    // Get comment and check permissions
    const commentData = await queryOne(
      `SELECT tc.user_id as comment_creator, b.role, t.create_by as task_creator
       FROM task_comment tc
       INNER JOIN task t ON tc.task_id = t.task_id
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE tc.comment_id = ? AND tc.task_id = ? AND b.user_id = ?`,
      [commentId, taskId, userId]
    );

    if (!commentData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is comment creator, task creator, or admin/owner
    const isCommentCreator = commentData.comment_creator === parseInt(userId);
    const isTaskCreator = commentData.task_creator === parseInt(userId);
    const isAdmin = commentData.role === 'admin' || commentData.role === 'owner';

    if (!isCommentCreator && !isTaskCreator && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only comment creator, task creator, or admin can delete comments' },
        { status: 403 }
      );
    }

    // Delete comment
    await query('DELETE FROM task_comment WHERE comment_id = ?', [commentId]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
