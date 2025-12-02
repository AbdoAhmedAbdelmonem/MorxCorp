import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Delete a comment (author or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { commentId } = params;

    // Get comment with task and team info
    const comment = await queryOne(
      `SELECT c.user_id as comment_author, t.project_id, p.team_id
       FROM task_comment c
       INNER JOIN task t ON c.task_id = t.task_id
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE c.comment_id = ?`,
      [commentId]
    );

    if (!comment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user is comment author
    const isAuthor = comment.comment_author === userId;

    // Check if user is admin/owner of the team
    const userRole = await queryOne(
      'SELECT role FROM belong WHERE user_id = ? AND team_id = ?',
      [userId, comment.team_id]
    );

    const isAdmin = userRole && (userRole.role === 'owner' || userRole.role === 'admin');

    if (!isAuthor && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only comment author or admins can delete comments' },
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
