import { NextResponse } from 'next/server';
import { query } from '@/lib/utils/db-helpers';

export async function GET() {
  try {
    const users = await query('SELECT user_id, first_name, last_name, email, profile_image, create_at, password FROM user');
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}
