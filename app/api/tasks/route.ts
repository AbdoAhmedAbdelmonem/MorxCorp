import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get all tasks for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const projectId = searchParams.get('project_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'project_id is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this project (is a team member)
    const access = await queryOne(
      `SELECT b.user_id, b.role
       FROM project p
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE p.project_id = ? AND b.user_id = ?`,
      [projectId, userId]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all tasks for the project with assignment info
    const tasks = await query(
      `SELECT t.*, 
              GROUP_CONCAT(DISTINCT CONCAT(au.user_id, ':', au.first_name, ' ', au.last_name) SEPARATOR '||') as assigned_users,
              COUNT(DISTINCT tc.comment_id) as comment_count
       FROM task t
       LEFT JOIN assigned_to at ON t.task_id = at.task_id
       LEFT JOIN user au ON at.user_id = au.user_id
       LEFT JOIN task_comment tc ON t.task_id = tc.task_id
       WHERE t.project_id = ?
       GROUP BY t.task_id
       ORDER BY t.due_date ASC, t.priority DESC`,
      [projectId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new task - anyone in the team can create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, project_id, user_id, priority, due_date, status, assigned_to } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!title || !project_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'title and project_id are required' },
        { status: 400 }
      );
    }

    // Check if user is a team member for this project
    const access = await queryOne(
      `SELECT b.user_id, b.role
       FROM project p
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE p.project_id = ? AND b.user_id = ?`,
      [project_id, user_id]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied - not a team member' },
        { status: 403 }
      );
    }

    // Create task (status: 0=todo, 1=in progress, 2=done)
    const result = await query(
      `INSERT INTO task (title, description, project_id, priority, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description || '', 
        project_id, 
        priority || 0, 
        due_date || null, 
        status || 0
      ]
    );

    const taskId = (result as any).insertId;

    // Assign users to task if specified
    if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const assignedUserId of assigned_to) {
        await query(
          'INSERT INTO assigned_to (user_id, task_id) VALUES (?, ?)',
          [assignedUserId, taskId]
        );
      }

      // Check if due date is within 24 hours and create notification
      if (due_date) {
        const dueTime = new Date(due_date).getTime();
        const now = Date.now();
        const hoursUntilDue = (dueTime - now) / (1000 * 60 * 60);

        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          const projectInfo = await queryOne(
            'SELECT project_name FROM project WHERE project_id = ?',
            [project_id]
          );

          for (const assignedUserId of assigned_to) {
            await query(
              `INSERT INTO notification (user_id, type, title, message, related_id) 
               VALUES (?, 'task_due', ?, ?, ?)`,
              [
                assignedUserId,
                '⏰ Task Due Soon',
                `Task "${title}" in project "${projectInfo.project_name}" is due in ${Math.round(hoursUntilDue)} hours`,
                taskId
              ]
            );
          }
        }
      }
    }

    // Fetch the created task
    const newTask = await queryOne(
      `SELECT t.*
       FROM task t
       WHERE t.task_id = ?`,
      [taskId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Task created successfully',
        data: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update task (anyone on team can update due_date, priority, status)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, user_id, title, description, priority, due_date, status } = body;

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

    // Get task and check access
    const task = await queryOne(
      `SELECT t.*, p.team_id, b.role
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE t.task_id = ? AND b.user_id = ?`,
      [task_id, user_id]
    );

    if (!task) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Build update query dynamically based on what's provided
    const updates: string[] = [];
    const values: any[] = [];

    // Anyone can update priority, due_date, status
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    // Only admin/owner can update title and description
    const isAdmin = task.role === 'admin' || task.role === 'owner';

    if ((title !== undefined || description !== undefined) && !isAdmin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins and owners can update title/description' },
        { status: 403 }
      );
    }

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (updates.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(task_id);

    await query(
      `UPDATE task SET ${updates.join(', ')} WHERE task_id = ?`,
      values
    );

    // Fetch updated task
    const updatedTask = await queryOne(
      'SELECT * FROM task WHERE task_id = ?',
      [task_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask,
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
 * Delete task (only task creator can delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const taskId = searchParams.get('task_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!taskId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'task_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this task (is team member)
    const access = await queryOne(
      `SELECT t.task_id
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE t.task_id = ? AND b.user_id = ?`,
      [taskId, userId]
    );

    if (!access) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Anyone on the team can delete tasks

    // Delete task (cascade will handle comments, assignments, notifications)
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
