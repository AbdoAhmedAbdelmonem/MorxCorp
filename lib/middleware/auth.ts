import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

/**
 * Middleware to protect API routes - requires authentication
 */
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return session.user;
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: any,
    user: any
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    return handler(request, context, user);
  };
}
