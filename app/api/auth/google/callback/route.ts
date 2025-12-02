import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/utils/db-helpers';
import { db } from '@/lib/db_connection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=token_failed`);
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    // Check if user exists in database
    const existingUser = await queryOne(
      'SELECT * FROM user WHERE email = ?',
      [googleUser.email]
    );

    if (existingUser) {
      // Existing user - create session and redirect
      const sessionData = {
        user_id: existingUser.user_id,
        first_name: existingUser.first_name,
        last_name: existingUser.last_name,
        email: existingUser.email,
        profile_image: existingUser.profile_image || '',
        location: existingUser.location || '',
        create_at: existingUser.create_at,
      };

      // Redirect to a page that will set localStorage and redirect
      const sessionParam = encodeURIComponent(JSON.stringify(sessionData));
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/complete-login?session=${sessionParam}`);
    } else {
      // New user - DON'T create account yet, redirect to complete signup
      const names = (googleUser.name || '').split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      // Store Google user data temporarily to complete signup
      const tempUserData = {
        first_name: firstName,
        last_name: lastName,
        email: googleUser.email,
        profile_image: googleUser.picture || '',
        oauth_provider: 'google'
      };

      const tempDataParam = encodeURIComponent(JSON.stringify(tempUserData));
      // Redirect to signup completion page where user MUST complete all fields
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/complete-signup?data=${tempDataParam}`);
    }

    return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=auth_failed`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/signin?error=callback_error`);
  }
}
