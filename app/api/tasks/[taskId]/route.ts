import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = params;

    const task = await queryOne(
      `SELECT t.*, 
              GROUP_CONCAT(DISTINCT CONCAT(u.user_id, ':', u.first_name, ' ', u.last_name) SEPARATOR '|||') as assignees
       FROM task t
       LEFT JOIN assigned_to at ON t.task_id = at.task_id
       LEFT JOIN user u ON at.user_id = u.user_id
       WHERE t.task_id = ?
       GROUP BY t.task_id`,
      [taskId]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Parse assignees
    const taskWithAssignees = {
      ...task,
      assignees: task.assignees 
        ? task.assignees.split('|||').map((a: string) => {
            const [id, name] = a.split(':');
            return { user_id: parseInt(id), name };
          })
        : []
    };

    return NextResponse.json<ApiResponse>({
      success: true,
      data: taskWithAssignees,
    });
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = params;
    const body = await request.json();
    const { title, description, status, due_date, priority } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (updates.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(taskId);

    await query(
      `UPDATE task SET ${updates.join(', ')} WHERE task_id = ?`,
      values
    );

    const updated = await queryOne(
      'SELECT * FROM task WHERE task_id = ?',
      [taskId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = params;

    await query('DELETE FROM task WHERE task_id = ?', [taskId]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
