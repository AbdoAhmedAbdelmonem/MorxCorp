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
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

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

    // Check if requester is project participant
    const isRequesterParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user.id, task.project_id]
    );

    if (!isRequesterParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: You must be a project participant' },
        { status: 403 }
      );
    }

    // Check if user to assign is project participant
    const isUserParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user_id, task.project_id]
    );

    if (!isUserParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User must be a project participant to be assigned' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const alreadyAssigned = await queryOne(
      'SELECT * FROM assigned_to WHERE user_id = ? AND task_id = ?',
      [user_id, taskId]
    );

    if (alreadyAssigned) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already assigned to this task' },
        { status: 409 }
      );
    }

    await execute(
      'INSERT INTO assigned_to (user_id, task_id) VALUES (?, ?)',
      [user_id, taskId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'User assigned to task successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Assign task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const taskId = params.taskId;
    const { searchParams } = new URL(request.url);
    const userIdToUnassign = searchParams.get('user_id');

    if (!userIdToUnassign) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id query parameter is required' },
        { status: 400 }
      );
    }

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

    // Check if requester is project participant
    const isParticipant = await queryOne(
      'SELECT * FROM participation WHERE user_id = ? AND project_id = ?',
      [user.id, task.project_id]
    );

    if (!isParticipant) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized: You must be a project participant' },
        { status: 403 }
      );
    }

    await execute(
      'DELETE FROM assigned_to WHERE user_id = ? AND task_id = ?',
      [userIdToUnassign, taskId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User unassigned from task successfully',
    });
  } catch (error) {
    console.error('Unassign task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
