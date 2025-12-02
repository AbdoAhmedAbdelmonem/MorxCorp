import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Check for tasks due within 24 hours and create notifications
 * This should be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Get tasks due within 24 hours that are not completed
    const tasksDueSoon = await query(
      `SELECT t.task_id, t.title, t.due_date, t.project_id, p.project_name, at.user_id, 
              u.first_name, u.last_name
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       LEFT JOIN assigned_to at ON t.task_id = at.task_id
       LEFT JOIN user u ON at.user_id = u.user_id
       WHERE t.status != 2 
       AND t.due_date IS NOT NULL
       AND t.due_date >= NOW()
       AND t.due_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
       AND NOT EXISTS (
         SELECT 1 FROM notification n 
         WHERE n.related_id = t.task_id 
         AND n.type = 'task_due' 
         AND n.user_id = at.user_id
         AND n.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       )`
    );

    let notificationsCreated = 0;

    for (const task of tasksDueSoon as any[]) {
      if (task.user_id) {
        const dueDate = new Date(task.due_date);
        const hoursUntilDue = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));
        
        const title = '⏰ Task Due Soon';
        const message = `Task "${task.title}" in project "${task.project_name}" is due in ${hoursUntilDue} hours`;

        await query(
          `INSERT INTO notification (user_id, type, title, message, related_id) 
           VALUES (?, 'task_due', ?, ?, ?)`,
          [task.user_id, title, message, task.task_id]
        );

        notificationsCreated++;
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Created ${notificationsCreated} notifications for tasks due soon`,
      data: { count: notificationsCreated },
    });
  } catch (error) {
    console.error('Check due tasks error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
