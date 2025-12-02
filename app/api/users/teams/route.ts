import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { query } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const teams = await query(
      `SELECT t.team_id, t.team_name, t.team_url, t.create_at, b.role, b.join_at
       FROM team t
       INNER JOIN belong b ON t.team_id = b.team_id
       WHERE b.user_id = ?
       ORDER BY b.join_at DESC`,
      [user.id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
