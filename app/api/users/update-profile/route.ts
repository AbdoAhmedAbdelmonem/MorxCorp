import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { ApiResponse } from '@/lib/types';
import bcrypt from 'bcryptjs';

/**
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { first_name, last_name, location, password } = body;

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'first_name and last_name are required' },
        { status: 400 }
      );
    }

    // Build update query
    let updateQuery = 'UPDATE user SET first_name = ?, last_name = ?';
    let params: any[] = [first_name, last_name];

    // Add location if provided
    if (location !== undefined) {
      updateQuery += ', location = ?';
      params.push(location);
    }

    // Add password if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
    }

    updateQuery += ' WHERE user_id = ?';
    params.push(userId);

    // Execute update
    await query(updateQuery, params);

    // Fetch updated user data
    const updatedUser = await queryOne(
      'SELECT user_id, first_name, last_name, email, profile_image, location, create_at FROM user WHERE user_id = ?',
      [userId]
    );

    // Create notification for profile update
    const changedFields = [];
    if (first_name) changedFields.push('name');
    if (location !== undefined) changedFields.push('location');
    if (password && password.trim() !== '') changedFields.push('password');

    await query(
      `INSERT INTO notification (user_id, type, title, message, related_id) 
       VALUES (?, 'profile_update', ?, ?, NULL)`,
      [
        userId,
        '👤 Profile Updated',
        `Your profile has been updated successfully. Changes: ${changedFields.join(', ')}`
      ]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
