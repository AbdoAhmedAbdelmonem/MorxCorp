import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get all projects for a team
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const teamId = searchParams.get('team_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!teamId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_id is required' },
        { status: 400 }
      );
    }

    // Check if user is team member
    const membership = await query(
      'SELECT role FROM belong WHERE user_id = ? AND team_id = ?',
      [userId, teamId]
    );

    if (!membership || membership.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not a team member' },
        { status: 403 }
      );
    }

    // Get all projects for the team with task counts
    const projects = await query(
      `SELECT p.*, 
              COUNT(DISTINCT t.task_id) as task_count,
              COUNT(DISTINCT CASE WHEN t.status = 2 THEN t.task_id END) as completed_tasks,
              u.first_name, u.last_name
       FROM project p
       LEFT JOIN task t ON p.project_id = t.project_id
       LEFT JOIN user u ON p.create_by = u.user_id
       WHERE p.team_id = ?
       GROUP BY p.project_id
       ORDER BY p.create_at DESC`,
      [teamId]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_name, description, team_id, user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user_id;

    if (!project_name || !team_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'project_name and team_id are required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin
    const membership = await query(
      'SELECT role FROM belong WHERE user_id = ? AND team_id = ?',
      [userId, team_id]
    );

    if (!membership || membership.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not a team member' },
        { status: 403 }
      );
    }

    const role = membership[0].role;
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only owners and admins can create projects' },
        { status: 403 }
      );
    }

    // Generate random 16-character project URL
    const generateProjectUrl = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const project_url = generateProjectUrl();

    // Create project
    const result = await query(
      'INSERT INTO project (project_name, description, team_id, create_by, project_url) VALUES (?, ?, ?, ?, ?)',
      [project_name, description || '', team_id, userId, project_url]
    );

    const projectId = (result as any).insertId;

    // Fetch the created project
    const newProject = await query(
      'SELECT * FROM project WHERE project_id = ?',
      [projectId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Project created successfully',
        data: newProject[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
