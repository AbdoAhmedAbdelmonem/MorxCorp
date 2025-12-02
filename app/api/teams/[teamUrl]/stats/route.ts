import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get team statistics and analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
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
    const { teamUrl } = params;

    // Get team and verify membership
    const team = await queryOne(
      `SELECT t.team_id, t.team_name, b.role
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE t.team_url = ? AND b.user_id = ?`,
      [teamUrl, userId]
    );

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found or access denied' },
        { status: 404 }
      );
    }

    const teamId = team.team_id;

    // Get overall statistics
    const overallStats = await queryOne(
      `SELECT 
        COUNT(DISTINCT p.project_id) as total_projects,
        COUNT(DISTINCT t.task_id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 2 THEN t.task_id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 0 THEN t.task_id END) as todo_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 1 THEN t.task_id END) as in_progress_tasks,
        COUNT(DISTINCT tm.user_id) as total_members
       FROM project p
       LEFT JOIN task t ON p.project_id = t.project_id
       LEFT JOIN belong tm ON p.team_id = tm.team_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    // Get user task statistics
    const userStats = await query(
      `SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT at.task_id) as assigned_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 2 THEN at.task_id END) as completed_tasks
       FROM user u
       INNER JOIN belong b ON u.user_id = b.user_id
       LEFT JOIN assigned_to at ON u.user_id = at.user_id
       LEFT JOIN task t ON at.task_id = t.task_id AND t.project_id IN (
         SELECT project_id FROM project WHERE team_id = ?
       )
       WHERE b.team_id = ?
       GROUP BY u.user_id
       ORDER BY assigned_tasks DESC`,
      [teamId, teamId]
    );

    // Get project statistics
    const projectStats = await query(
      `SELECT 
        p.project_id,
        p.project_name,
        COUNT(DISTINCT t.task_id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 2 THEN t.task_id END) as completed_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 1 THEN t.task_id END) as in_progress_tasks
       FROM project p
       LEFT JOIN task t ON p.project_id = t.project_id
       WHERE p.team_id = ?
       GROUP BY p.project_id
       ORDER BY p.create_at DESC`,
      [teamId]
    );

    // Get task status distribution
    const statusDistribution = await queryOne(
      `SELECT 
        COUNT(CASE WHEN status = 0 THEN 1 END) as todo,
        COUNT(CASE WHEN status = 1 THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 2 THEN 1 END) as done
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    // Get priority distribution
    const priorityDistribution = await queryOne(
      `SELECT 
        COUNT(CASE WHEN priority = 3 THEN 1 END) as high,
        COUNT(CASE WHEN priority = 2 THEN 1 END) as medium,
        COUNT(CASE WHEN priority = 1 THEN 1 END) as low
       FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        overall: {
          ...overallStats,
          completion_rate: overallStats.total_tasks > 0 
            ? Math.round((overallStats.completed_tasks / overallStats.total_tasks) * 100)
            : 0
        },
        by_user: userStats,
        by_project: projectStats,
        status_distribution: statusDistribution,
        priority_distribution: priorityDistribution,
      },
    });
  } catch (error) {
    console.error('Get team stats error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
