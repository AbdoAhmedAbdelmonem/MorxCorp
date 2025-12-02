import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { queryOne } from '@/lib/utils/db-helpers';
import { User, ApiResponse } from '@/lib/types';

/**
 * Get current session with full user data for localStorage
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const needsCompletion = (session.user as any).needsProfileCompletion;

    // If user needs profile completion, return limited data
    if (needsCompletion) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          needsProfileCompletion: true,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
      });
    }

    // Get full user data from database
    const userId = (session.user as any).id;
    console.log('Session API - Looking up user with ID:', userId);
    
    const userData = await queryOne(
      'SELECT user_id, first_name, last_name, email, profile_image, create_at FROM user WHERE user_id = ?',
      [userId]
    );
    
    console.log('Session API - Database query result:', userData);

    if (!userData) {
      console.error('Session API - User not found in database for ID:', userId);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        needsProfileCompletion: false,
        user: userData,
        session: {
          user: {
            id: userData.user_id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            name: `${userData.first_name} ${userData.last_name}`,
            profileImage: userData.profile_image,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
