import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Update task assignments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, user_id, assigned_to } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!task_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this task
    const access = await queryOne(
      `SELECT t.task_id, b.role
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE t.task_id = ? AND b.user_id = ?`,
      [task_id, user_id]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Only admins and owners can reassign tasks
    if (access.role !== 'owner' && access.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins and owners can assign tasks' },
        { status: 403 }
      );
    }

    // Delete existing assignments
    await query('DELETE FROM assigned_to WHERE task_id = ?', [task_id]);

    // Add new assignments
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const assignedUserId of assigned_to) {
        await query(
          'INSERT INTO assigned_to (user_id, task_id) VALUES (?, ?)',
          [assignedUserId, task_id]
        );
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task assignments updated successfully',
    });
  } catch (error) {
    console.error('Update task assignments error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
