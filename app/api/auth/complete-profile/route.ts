import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query, queryOne, exists } from '@/lib/utils/db-helpers';
import { ApiResponse, User } from '@/lib/types';
import bcrypt from 'bcryptjs';

/**
 * Complete profile for new Google OAuth users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user needs profile completion
    const needsCompletion = (session.user as any).needsProfileCompletion;
    const email = session.user.email;
    const profileImage = session.user.image || null; // Get Google profile image

    if (!needsCompletion) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Profile already completed' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email not found in session' },
        { status: 400 }
      );
    }

    // Get profile data from request
    const body = await request.json();
    const { first_name, last_name, password } = body;

    if (!first_name || !last_name || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'first_name, last_name, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists (shouldn't happen, but safety check)
    const existingUser = await exists('user', 'email', email);
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database with hashed password and profile image
    const { db } = await import('@/lib/db_connection');
    await db.promise().execute(
      'INSERT INTO user (first_name, last_name, email, password, profile_image) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword, profileImage]
    );

    // Fetch the created user
    const newUser = await queryOne(
      'SELECT user_id, first_name, last_name, email, profile_image, create_at FROM user WHERE email = ?',
      [email]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Profile completed successfully',
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
