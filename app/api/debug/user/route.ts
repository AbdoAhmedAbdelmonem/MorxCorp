import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/utils/db-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'user_id or email is required' },
        { status: 400 }
      );
    }

    let user;
    if (userId) {
      user = await queryOne(
        'SELECT user_id, first_name, last_name, email, profile_image, create_at FROM user WHERE user_id = ?',
        [userId]
      );
    } else {
      user = await queryOne(
        'SELECT user_id, first_name, last_name, email, profile_image, create_at FROM user WHERE email = ?',
        [email]
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
      debug: {
        hasProfileImage: !!user.profile_image,
        profileImageLength: user.profile_image?.length || 0,
        profileImagePreview: user.profile_image?.substring(0, 100)
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
