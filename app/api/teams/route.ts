import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

/**
 * Get all teams for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user_id from query parameter (sent from client)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all teams where user is a member
    console.log('Fetching teams for user_id:', userId);
    const teams = await query(
      `SELECT t.team_id, t.team_name, t.team_url, t.create_by, t.create_at, 
              b.role, COUNT(DISTINCT p.project_id) as project_count
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       LEFT JOIN project p ON t.team_id = p.team_id
       WHERE b.user_id = ?
       GROUP BY t.team_id, t.team_name, t.team_url, t.create_by, t.create_at, b.role
       ORDER BY t.create_at DESC`,
      [userId]
    );

    console.log('Teams fetched:', teams.length, 'teams');

    return NextResponse.json<ApiResponse>({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { team_name, user_id } = body;

    if (!user_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user_id;

    if (!team_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'team_name is required' },
        { status: 400 }
      );
    }

    // Generate random 16-character team URL
    const generateTeamUrl = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const team_url = generateTeamUrl();

    // Create team in database
    const result = await query(
      'INSERT INTO team (team_name, create_by, team_url) VALUES (?, ?, ?)',
      [team_name, userId, team_url]
    );

    const teamId = (result as any).insertId;

    // Add creator to team as owner
    await query(
      'INSERT INTO belong (user_id, team_id, role) VALUES (?, ?, ?)',
      [userId, teamId, 'owner']
    );

    // Fetch the created team
    const newTeam = await queryOne(
      'SELECT * FROM team WHERE team_id = ?',
      [teamId]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Team created successfully',
        data: newTeam,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
