import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get all members of a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectUrl } = params;

    // Get project members
    const members = await query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_image
       FROM user u
       INNER JOIN participation p ON u.user_id = p.user_id
       INNER JOIN project pr ON p.project_id = pr.project_id
       WHERE pr.project_url = ?`,
      [projectUrl]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get project members error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add member to project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
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
    const { projectUrl } = params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get project and check permissions
    const project = await queryOne(
      `SELECT p.project_id, p.team_id, b.role
       FROM project p
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE p.project_url = ? AND b.user_id = ?`,
      [projectUrl, userId]
    );

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Only owner/admin can add members
    if (project.role !== 'owner' && project.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can add members to projects' },
        { status: 403 }
      );
    }

    // Check if user to add is a team member
    const isTeamMember = await queryOne(
      'SELECT user_id FROM belong WHERE user_id = ? AND team_id = ?',
      [user_id, project.team_id]
    );

    if (!isTeamMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User must be a team member first' },
        { status: 400 }
      );
    }

    // Check if already a project member
    const existing = await queryOne(
      'SELECT user_id FROM participation WHERE user_id = ? AND project_id = ?',
      [user_id, project.project_id]
    );

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User is already a project member' },
        { status: 400 }
      );
    }

    // Add user to project
    await query(
      'INSERT INTO participation (user_id, project_id) VALUES (?, ?)',
      [user_id, project.project_id]
    );

    // Get user info
    const userInfo = await queryOne(
      'SELECT user_id, first_name, last_name, email FROM user WHERE user_id = ?',
      [user_id]
    );

    if (!userInfo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: `${userInfo.first_name} ${userInfo.last_name} added to project`,
        data: userInfo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add project member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove member from project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requesterId = (session.user as any).id;
    const { projectUrl } = params;
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('user_id');

    if (!userIdToRemove) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get project and check permissions
    const project = await queryOne(
      `SELECT p.project_id, p.team_id, b.role
       FROM project p
       INNER JOIN belong b ON p.team_id = b.team_id
       WHERE p.project_url = ? AND b.user_id = ?`,
      [projectUrl, requesterId]
    );

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Only owner/admin can remove members
    if (project.role !== 'owner' && project.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can remove members from projects' },
        { status: 403 }
      );
    }

    // Remove user from project
    await query(
      'DELETE FROM participation WHERE user_id = ? AND project_id = ?',
      [userIdToRemove, project.project_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'User removed from project',
    });
  } catch (error) {
    console.error('Remove project member error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
