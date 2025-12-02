import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/utils/db-helpers'

export async function GET(
  request: Request,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const period = parseInt(searchParams.get('period') || '30')
    const projectFilter = searchParams.get('project')

    console.log('Reports API called:', { teamUrl: params.teamUrl, userId, period, projectFilter })

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const teamUrl = params.teamUrl

    // Get team info and verify membership
    console.log('Fetching team info...')
    const team = await queryOne(
      `SELECT t.team_id, t.team_name 
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE t.team_url = ? AND b.user_id = ?`,
      [teamUrl, userId]
    )

    console.log('Team result:', team)

    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found or access denied' }, { status: 404 })
    }

    // Build project filter
    let projectCondition = ''
    let projectParams: any[] = []
    if (projectFilter && projectFilter !== 'all') {
      projectCondition = ' AND p.project_id = ?'
      projectParams = [projectFilter]
    }

    // Get overview statistics
    console.log('Fetching overview stats...')
    const overviewResult = await queryOne(
      `SELECT 
        COUNT(DISTINCT p.project_id) as total_projects,
        COUNT(t.task_id) as total_tasks,
        COALESCE(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END), 0) as completed_tasks,
        COALESCE(SUM(CASE WHEN t.status = 1 THEN 1 ELSE 0 END), 0) as in_progress_tasks,
        COALESCE(SUM(CASE WHEN t.status = 0 THEN 1 ELSE 0 END), 0) as todo_tasks,
        COALESCE(SUM(CASE WHEN t.due_date < NOW() AND t.status != 2 THEN 1 ELSE 0 END), 0) as overdue_tasks
      FROM project p
      LEFT JOIN task t ON p.project_id = t.project_id
      WHERE p.team_id = ?${projectCondition}`,
      [team.team_id, ...projectParams]
    )
    const overview = overviewResult || { total_projects: 0, total_tasks: 0, completed_tasks: 0, in_progress_tasks: 0, todo_tasks: 0, overdue_tasks: 0 }
    console.log('Overview:', overview)
    const completionRate = overview.total_tasks > 0 
      ? Math.round((overview.completed_tasks / overview.total_tasks) * 100)
      : 0

    // Set trend to 0 since we don't have created_at field
    const completionTrend = 0

    // Get project statistics
      const projectStats = await query(`
        SELECT 
        p.project_id,
        p.project_name,
        COUNT(DISTINCT t.task_id) as total_tasks,
        COALESCE(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN t.status = 1 THEN 1 ELSE 0 END), 0) as in_progress,
        COALESCE(SUM(CASE WHEN t.status = 0 THEN 1 ELSE 0 END), 0) as todo,
        COALESCE(SUM(CASE WHEN t.due_date < NOW() AND t.status != 2 THEN 1 ELSE 0 END), 0) as overdue
      FROM project p
      LEFT JOIN task t ON p.project_id = t.project_id
      WHERE p.team_id = ?${projectCondition}
      GROUP BY p.project_id, p.project_name
      ORDER BY p.project_name`,
      [team.team_id, ...projectParams]
    )

    // Get team member performance
    const memberPerformance = await query(
      `SELECT 
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.profile_image,
        b.role,
        COUNT(DISTINCT a.task_id) as assigned_tasks,
        COALESCE(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END), 0) as completed_tasks
      FROM belong b
      JOIN user u ON b.user_id = u.user_id
      LEFT JOIN assigned_to a ON u.user_id = a.user_id
      LEFT JOIN task t ON a.task_id = t.task_id
      LEFT JOIN project p ON t.project_id = p.project_id
      WHERE b.team_id = ? AND (p.team_id = ? OR p.team_id IS NULL)${projectCondition}
      GROUP BY u.user_id, u.first_name, u.last_name, u.profile_image, b.role
      ORDER BY completed_tasks DESC`,
      [team.team_id, team.team_id, ...projectParams]
    )

    // Calculate completion rates for members
    const membersWithRates = memberPerformance.map((member: any) => ({
      ...member,
      completion_rate: member.assigned_tasks > 0 
        ? Math.round((member.completed_tasks / member.assigned_tasks) * 100)
        : 0
    }))

    // Get recent activity (limited since we don't have timestamps)
    const recentActivity = await query(
      `SELECT 
        t.task_id,
        t.title as task_title,
        CASE 
          WHEN t.status = 2 THEN 'done'
          WHEN t.status = 1 THEN 'in-progress'
          ELSE 'todo'
        END as status,
        NOW() as timestamp,
        p.project_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        CASE 
          WHEN t.status = 2 THEN 'completed'
          WHEN t.status = 1 THEN 'started'
          ELSE 'created'
        END as type
      FROM task t
      JOIN project p ON t.project_id = p.project_id
      LEFT JOIN assigned_to a ON t.task_id = a.task_id
      LEFT JOIN user u ON a.user_id = u.user_id
      WHERE p.team_id = ?${projectCondition}
      ORDER BY t.task_id DESC
      LIMIT 20`,
      [team.team_id, ...projectParams]
    )

    // Prepare response data
    const reportData = {
      overview: {
        total_projects: overview.total_projects,
        total_tasks: overview.total_tasks,
        completed_tasks: overview.completed_tasks,
        in_progress_tasks: overview.in_progress_tasks,
        todo_tasks: overview.todo_tasks,
        overdue_tasks: overview.overdue_tasks,
        completion_rate: completionRate,
        completion_trend: completionTrend
      },
      project_stats: projectStats,
      member_performance: membersWithRates,
      recent_activity: recentActivity
    }

    return NextResponse.json({ success: true, data: reportData })

  } catch (error: any) {
    console.error('Error fetching team reports:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    })
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
