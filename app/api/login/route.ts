import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/utils/db-helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const userData = await queryOne(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );

    if (!userData || !userData.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return user data (excluding password)
    const sessionData = {
      user_id: userData.user_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      profile_image: userData.profile_image,
      create_at: userData.create_at,
    };

    return NextResponse.json({ user: sessionData });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
