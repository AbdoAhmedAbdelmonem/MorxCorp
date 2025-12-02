import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';
import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * Delete a file (uploader or admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
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
    const { fileId } = params;

    // Get file with task and team info
    const file = await queryOne(
      `SELECT f.user_id as uploader_id, f.file_path, t.project_id, p.team_id
       FROM task_files f
       INNER JOIN task t ON f.task_id = t.task_id
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE f.file_id = ?`,
      [fileId]
    );

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if user is uploader
    const isUploader = file.uploader_id === userId;

    // Check if user is admin/owner of the team
    const userRole = await queryOne(
      'SELECT role FROM belong WHERE user_id = ? AND team_id = ?',
      [userId, file.team_id]
    );

    const isAdmin = userRole && (userRole.role === 'owner' || userRole.role === 'admin');

    if (!isUploader && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only file uploader or admins can delete files' },
        { status: 403 }
      );
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', file.file_path);
      await unlink(filePath);
    } catch (err) {
      console.error('Error deleting physical file:', err);
      // Continue even if file doesn't exist
    }

    // Delete from database
    await query('DELETE FROM task_files WHERE file_id = ?', [fileId]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
