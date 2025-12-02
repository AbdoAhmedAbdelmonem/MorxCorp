import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get project by URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
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

    const { projectUrl} = params;

    // Get project and check access
    const project = await queryOne(
      `SELECT p.*, t.team_name, t.team_url, b.role
       FROM project p
       INNER JOIN team t ON p.team_id = t.team_id
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE p.project_url = ? AND b.user_id = ?`,
      [projectUrl, userId]
    );

    if (!project) {
      // Project not found or user doesn't have access
      // Check if project exists and get owner info
      const projectInfo = await queryOne(
        `SELECT p.project_name, t.team_name, t.team_url, u.name as owner_name, u.email as owner_email
         FROM project p
         INNER JOIN team t ON p.team_id = t.team_id
         INNER JOIN belong b ON t.team_id = b.team_id AND b.role = 'owner'
         INNER JOIN user u ON b.user_id = u.user_id
         WHERE p.project_url = ?`,
        [projectUrl]
      );

      if (!projectInfo) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }

      // Return 403 with owner info for unauthorized access
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Access denied',
          data: {
            teamName: projectInfo.team_name,
            teamUrl: projectInfo.team_url,
            owner: {
              name: projectInfo.owner_name,
              email: projectInfo.owner_email,
            },
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
) {
  try {
    const body = await request.json();
    const { project_name, description, user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user_id;
    const { projectUrl } = params;

    // Check permissions
    const project = await queryOne(
      `SELECT p.project_id, t.team_id, b.role
       FROM project p
       INNER JOIN team t ON p.team_id = t.team_id
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE p.project_url = ? AND b.user_id = ?`,
      [projectUrl, userId]
    );

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    if (project.role !== 'owner' && project.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can update projects' },
        { status: 403 }
      );
    }

    // Update project
    await query(
      'UPDATE project SET project_name = ?, description = ? WHERE project_id = ?',
      [project_name, description, project.project_id]
    );

    const updated = await queryOne(
      'SELECT * FROM project WHERE project_id = ?',
      [project.project_id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Project updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectUrl: string } }
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

    const { projectUrl } = params;

    // Check permissions
    const project = await queryOne(
      `SELECT p.project_id, t.team_id, b.role
       FROM project p
       INNER JOIN team t ON p.team_id = t.team_id
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE p.project_url = ? AND b.user_id = ?`,
      [projectUrl, userId]
    );

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    if (project.role !== 'owner' && project.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can delete projects' },
        { status: 403 }
      );
    }

    // Delete project (cascade will delete tasks)
    await query('DELETE FROM project WHERE project_id = ?', [project.project_id]);

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
