import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/utils/db-helpers';
import { User } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Authorize: Missing credentials');
          return null;
        }

        try {
          console.log('Authorize: Looking up user:', credentials.email);
          // Find user by email
          const user = await queryOne<User>(
            'SELECT * FROM user WHERE email = ?',
            [credentials.email]
          );

          console.log('Authorize: User found:', user ? 'Yes' : 'No');
          if (user) {
            console.log('Authorize: User has password:', user.password ? 'Yes' : 'No');
          }

          if (!user || !user.password) {
            console.log('Authorize: User not found or no password');
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('Authorize: Password valid:', isValidPassword);

          if (!isValidPassword) {
            return null;
          }

          const userResult = {
            id: user.user_id.toString(),
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          };
          console.log('Authorize: Returning user:', userResult);
          return userResult;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered');
      console.log('Provider:', account?.provider);
      console.log('Profile:', profile);
      
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && profile?.email) {
        try {
          console.log('Processing Google sign-in for:', profile.email);
          
          // Check if user exists in database
          const existingUser = await queryOne<User>(
            'SELECT * FROM user WHERE email = ?',
            [profile.email]
          );

          console.log('Existing user found:', existingUser ? 'Yes' : 'No');

          if (!existingUser) {
            console.log('Creating new user...');
            // New user - create account immediately with OAuth data
            const names = (profile.name as string || '').split(' ');
            const firstName = names[0] || '';
            const lastName = names.slice(1).join(' ') || '';

            const { db } = await import('@/lib/db_connection');
            await db.promise().execute(
              'INSERT INTO user (first_name, last_name, email, profile_image) VALUES (?, ?, ?, ?)',
              [firstName, lastName, profile.email, (profile as any).picture || '']
            );
            console.log('New user created successfully');
          }

          // Allow sign-in for both new and existing users
          console.log('Google sign-in allowed: true');
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }

      // For Google OAuth, get user data from database
      if (account?.provider === 'google' && token.email) {
        const dbUser = await queryOne<User>(
          'SELECT * FROM user WHERE email = ?',
          [token.email]
        );

        if (dbUser) {
          token.id = dbUser.user_id.toString();
          token.firstName = dbUser.first_name;
          token.lastName = dbUser.last_name;
          token.profileImage = dbUser.profile_image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token);
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).profileImage = token.profileImage;
      }
      console.log('Session callback - returning session:', session);
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
