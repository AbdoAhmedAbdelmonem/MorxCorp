'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompleteProfile() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          password: password,
        }),
      });

      const result = await res.json();

      if (result.success) {
        // Profile completed - user is now in database
        // Prepare user data for localStorage
        const userData = result.data;
        const userProfile = {
          user_id: userData.user_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          profile_image: userData.profile_image,
          create_at: userData.create_at
        };

        // Save to localStorage using student_session key like GitTest
        localStorage.setItem('student_session', JSON.stringify(userProfile));
        
        // Trigger event to update header
        window.dispatchEvent(new CustomEvent('userLogin', { detail: userProfile }));

        // Clear session storage
        sessionStorage.removeItem('googleAuthData');

        // User is now logged in - redirect to home
        router.push('/');
      } else {
        setError(result.error || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <Link href="/" className="mb-2">
            <Image src="/Morx.png" alt="Morx" width={60} height={60} className="size-15" />
          </Link>
          <CardTitle className="text-2xl font-bold text-center rock-salt">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-center">
            Set up your account details
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
