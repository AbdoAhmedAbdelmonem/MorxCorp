import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { queryOne, execute } from '@/lib/utils/db-helpers';
import { User, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const userProfile = await queryOne<User>(
      'SELECT user_id, first_name, last_name, email, create_at FROM user WHERE user_id = ?',
      [user.id]
    );

    if (!userProfile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { first_name, last_name } = body;

    if (!first_name && !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (first_name) {
      updates.push('first_name = ?');
      params.push(first_name);
    }

    if (last_name) {
      updates.push('last_name = ?');
      params.push(last_name);
    }

    params.push(user.id);

    await execute(
      `UPDATE user SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    const updatedUser = await queryOne<User>(
      'SELECT user_id, first_name, last_name, email, create_at FROM user WHERE user_id = ?',
      [user.id]
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
