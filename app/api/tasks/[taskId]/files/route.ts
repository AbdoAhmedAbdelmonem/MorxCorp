import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get file from a task (download)
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

    // Check if user has access to this task
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

    // Get file from task
    const task = await queryOne(
      'SELECT file FROM task WHERE task_id = ?',
      [taskId]
    );

    if (!task || !task.file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file found for this task' },
        { status: 404 }
      );
    }

    // Return file as binary response
    return new NextResponse(task.file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="task-${taskId}-file"`,
      },
    });
  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Upload a file to a task - anyone in the team can upload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'file is required' },
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
      [taskId, userId]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied - not a team member' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store file in task's file column (MEDIUMBLOB - max 16MB)
    await query(
      'UPDATE task SET file = ? WHERE task_id = ?',
      [buffer, taskId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename: file.name,
          size: file.size,
          type: file.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete file from a task (only admin/owner or task creator can delete)
 */
export async function DELETE(
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

    // Get task and check permissions
    const task = await queryOne(
      `SELECT t.create_by, b.role
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE t.task_id = ? AND b.user_id = ?`,
      [taskId, userId]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user is task creator or admin/owner
    const isTaskCreator = task.create_by === parseInt(userId);
    const isAdmin = task.role === 'admin' || task.role === 'owner';

    if (!isTaskCreator && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only task creator or admin can delete files' },
        { status: 403 }
      );
    }

    // Delete file from task (set to NULL)
    await query(
      'UPDATE task SET file = NULL WHERE task_id = ?',
      [taskId]
    );

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
