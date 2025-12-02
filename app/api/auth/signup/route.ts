import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne, exists } from '@/lib/utils/db-helpers';
import { CreateUserRequest, ApiResponse, User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { first_name, last_name, email, password } = body;

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await queryOne<User>(
      'SELECT user_id FROM user WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: 'An account with this email already exists. Please sign in instead.'
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { db } = await import('@/lib/db_connection');
    await db.promise().execute(
      'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword]
    );

    // Fetch the created user (without password)
    const newUser = await queryOne<User>(
      'SELECT user_id, first_name, last_name, email, create_at FROM user WHERE email = ?',
      [email]
    );

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Account created successfully',
        data: newUser
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
