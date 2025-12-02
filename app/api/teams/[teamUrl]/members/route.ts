import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get team members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { teamUrl } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a team member
    console.log('Fetching team for teamUrl:', teamUrl, 'userId:', userId);
    const team = await queryOne(
      `SELECT t.team_id 
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE t.team_url = ? AND b.user_id = ?`,
      [teamUrl, userId]
    );

    console.log('Team found:', team);

    if (!team) {
      console.log('Team not found for teamUrl:', teamUrl, 'userId:', userId);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found or access denied' },
        { status: 404 }
      );
    }

    // Get all team members
    console.log('Fetching members for team_id:', team.team_id);
    const members = await query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_image, b.role
       FROM user u
       INNER JOIN belong b ON u.user_id = b.user_id
       WHERE b.team_id = ?
       ORDER BY 
         CASE b.role 
           WHEN 'owner' THEN 1 
           WHEN 'admin' THEN 2 
           ELSE 3 
         END,
         u.first_name`,
      [team.team_id]
    );

    console.log('Members fetched:', members.length, 'members');

    return NextResponse.json<ApiResponse>({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add user to team - admins and owners can add members
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { teamUrl } = params;
    const body = await request.json();
    const { user_email, role = 'member', user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user_id;

    if (!user_email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_email is required' },
        { status: 400 }
      );
    }

    // Get team and check if requester is owner/admin
    const team = await queryOne(
      `SELECT t.team_id, b.role as requester_role
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

    if (team.requester_role !== 'owner' && team.requester_role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can add members' },
        { status: 403 }
      );
    }

    // Find user by email
    const userToAdd = await queryOne(
      'SELECT user_id, first_name, last_name, email FROM user WHERE email = ?',
      [user_email]
    );

    if (!userToAdd) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existing = await queryOne(
      'SELECT user_id FROM belong WHERE user_id = ? AND team_id = ?',
      [userToAdd.user_id, team.team_id]
    );

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Add user to team
    await query(
      'INSERT INTO belong (user_id, team_id, role) VALUES (?, ?, ?)',
      [userToAdd.user_id, team.team_id, role]
    );

    // Get team name for notification
    const teamInfo = await queryOne(
      'SELECT team_name FROM team WHERE team_id = ?',
      [team.team_id]
    );

    // Get requester info for notification
    const requester = await queryOne(
      'SELECT first_name, last_name FROM user WHERE user_id = ?',
      [userId]
    );

    // Create notification for the added user
    await query(
      `INSERT INTO notification (user_id, type, title, message, related_id) 
       VALUES (?, 'team_added', ?, ?, ?)`,
      [
        userToAdd.user_id,
        '👥 Added to Team',
        `${requester.first_name} ${requester.last_name} added you to the team "${teamInfo.team_name}" as a ${role}`,
        team.team_id
      ]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: `${userToAdd.first_name} ${userToAdd.last_name} added to team`,
        data: userToAdd,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove user from team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { teamUrl } = params;
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requester_id');
    const userIdToRemove = searchParams.get('user_id');

    if (!requesterId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!userIdToRemove) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get team and check permissions
    const team = await queryOne(
      `SELECT t.team_id, b.role as requester_role
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE t.team_url = ? AND b.user_id = ?`,
      [teamUrl, requesterId]
    );

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found or access denied' },
        { status: 404 }
      );
    }

    if (team.requester_role !== 'owner' && team.requester_role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Check if user to remove is the owner
    const userToRemove = await queryOne(
      'SELECT role FROM belong WHERE user_id = ? AND team_id = ?',
      [userIdToRemove, team.team_id]
    );

    if (!userToRemove) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is not a team member' },
        { status: 404 }
      );
    }

    if (userToRemove.role === 'owner') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot remove team owner' },
        { status: 403 }
      );
    }

    // Remove user from team
    await query(
      'DELETE FROM belong WHERE user_id = ? AND team_id = ?',
      [userIdToRemove, team.team_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User removed from team',
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update user role in team
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { teamUrl: string } }
) {
  try {
    const { teamUrl } = params;
    const body = await request.json();
    const { user_id, new_role, requester_id } = body;

    if (!requester_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requesterId = requester_id;

    if (!user_id || !new_role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id and new_role are required' },
        { status: 400 }
      );
    }

    // Get team and check if requester is owner
    const team = await queryOne(
      `SELECT t.team_id, b.role as requester_role
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE t.team_url = ? AND b.user_id = ?`,
      [teamUrl, requesterId]
    );

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Team not found or access denied' },
        { status: 404 }
      );
    }

    if (team.requester_role !== 'owner') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners can change user roles' },
        { status: 403 }
      );
    }

    // Cannot change owner role
    const userToUpdate = await queryOne(
      'SELECT role FROM belong WHERE user_id = ? AND team_id = ?',
      [user_id, team.team_id]
    );

    if (!userToUpdate) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is not a team member' },
        { status: 404 }
      );
    }

    if (userToUpdate.role === 'owner') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot change owner role' },
        { status: 403 }
      );
    }

    // Update role
    await query(
      'UPDATE belong SET role = ? WHERE user_id = ? AND team_id = ?',
      [new_role, user_id, team.team_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
