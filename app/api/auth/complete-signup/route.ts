import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/utils/db-helpers';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, profile_image, location, password, oauth_provider } = body;

    console.log('Received profile_image:', profile_image);

    // Validate ALL required fields are present
    if (!first_name || !last_name || !email || !location || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with ALL complete data
    await execute(
      'INSERT INTO user (first_name, last_name, email, password, profile_image, location) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, hashedPassword, profile_image || '', location]
    );

    // Get the newly created user
    const newUser = await queryOne(
      'SELECT user_id, first_name, last_name, email, profile_image, location, create_at FROM user WHERE email = ?',
      [email]
    );

    console.log('Retrieved user from DB:', newUser);

    if (!newUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Return success with complete user data
    return NextResponse.json({
      success: true,
      user: {
        user_id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        profile_image: newUser.profile_image,
        location: newUser.location,
        create_at: newUser.create_at,
      }
    });

  } catch (error) {
    console.error('Complete signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
