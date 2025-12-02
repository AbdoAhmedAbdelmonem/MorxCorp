import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get team by URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { teamUrl } = params;

    // Get team and check if user is a member
    const team = await queryOne(
      `SELECT t.team_id, t.team_name, t.team_url, t.team_description, t.create_at, 
              b.role, COUNT(DISTINCT p.project_id) as project_count
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       LEFT JOIN project p ON t.team_id = p.project_id
       WHERE t.team_url = ? AND b.user_id = ?
       GROUP BY t.team_id, t.team_name, t.team_url, t.team_description, t.create_at, b.role`,
      [teamUrl, userId]
    );

    if (!team) {
      // Get team owner information for unauthorized access
      const ownerInfo = await queryOne(
        `SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) as name, u.email
         FROM team t
         INNER JOIN belong b ON t.team_id = b.team_id
         INNER JOIN user u ON b.user_id = u.user_id
         WHERE t.team_url = ? AND b.role = 'owner'
         LIMIT 1`,
        [teamUrl]
      );

      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: 'You are not authorized to access this team. Only team members can view this page.',
          owner: ownerInfo || null
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update team (owner and admin)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const body = await request.json();
    const { team_name, team_description, user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!team_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_name is required' },
        { status: 400 }
      );
    }

    const { teamUrl } = params;

    // Get team and check permissions
    const team = await queryOne(
      `SELECT t.team_id, b.role 
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE t.team_url = ? AND b.user_id = ?`,
      [teamUrl, user_id]
    );

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found or access denied' },
        { status: 404 }
      );
    }

    // Allow both owners and admins to edit teams
    if (team.role !== 'owner' && team.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only team owners and admins can edit teams' },
        { status: 403 }
      );
    }

    // Update team
    await query(
      'UPDATE team SET team_name = ?, team_description = ? WHERE team_id = ?',
      [team_name, team_description || null, team.team_id]
    );

    // Fetch updated team
    const updatedTeam = await queryOne(
      'SELECT * FROM team WHERE team_id = ?',
      [team.team_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete team (owner and admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { teamUrl } = params;

    // Get team by URL and check if user is the owner
    const team = await queryOne(
      `SELECT t.team_id, b.role 
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

    // Allow both owners and admins to delete teams
    if (team.role !== 'owner' && team.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only team owners and admins can delete teams' },
        { status: 403 }
      );
    }

    const teamId = team.team_id;

    // Delete in proper order to avoid foreign key constraints
    
    // 1. Delete all task-related data first
    await query(
      `DELETE tc FROM task_comment tc
       INNER JOIN task t ON tc.task_id = t.task_id
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    await query(
      `DELETE tf FROM task_files tf
       INNER JOIN task t ON tf.task_id = t.task_id
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    await query(
      `DELETE at FROM assigned_to at
       INNER JOIN task t ON at.task_id = t.task_id
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    await query(
      `DELETE t FROM task t
       INNER JOIN project p ON t.project_id = p.project_id
       WHERE p.team_id = ?`,
      [teamId]
    );

    // 2. Delete all projects in the team
    await query('DELETE FROM project WHERE team_id = ?', [teamId]);

    // 3. Delete all team members
    await query('DELETE FROM belong WHERE team_id = ?', [teamId]);

    // 4. Delete the team itself
    await query('DELETE FROM team WHERE team_id = ?', [teamId]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
