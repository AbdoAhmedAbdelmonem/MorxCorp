import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { queryOne, execute } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;

    // Get task to check project
    const task = await queryOne(
      'SELECT project_id FROM task WHERE task_id = ?',
      [taskId]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user is project participant
    const isParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user.id, task.project_id]
    );

    if (!isParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get file from request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Update task with file
    await execute(
      'UPDATE task SET file = ? WHERE task_id = ?',
      [buffer, taskId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;

    // Get task with file
    const task = await queryOne(
      'SELECT t.file, t.project_id, t.title FROM task t WHERE t.task_id = ?',
      [taskId]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user is project participant
    const isParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user.id, task.project_id]
    );

    if (!isParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!task.file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file attached to this task' },
        { status: 404 }
      );
    }

    // Return file as blob
    return new NextResponse(task.file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="task_${taskId}_file"`,
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
