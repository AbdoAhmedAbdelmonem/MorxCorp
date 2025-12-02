'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Get session status
        const res = await fetch('/api/auth/session');
        const response = await res.json();

        if (!response.success) {
          router.push('/signin?error=auth_failed');
          return;
        }

        const { data } = response;

        if (data.needsProfileCompletion) {
          // New user - redirect to complete profile
          sessionStorage.setItem('googleAuthData', JSON.stringify(data));
          router.push('/complete-profile');
        } else {
          // Existing user - save to localStorage using student_session key and redirect to dashboard
          const userData = data.user || data;
          localStorage.setItem('student_session', JSON.stringify(userData));
          
          // Trigger event to update header
          window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
          
          router.push('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/signin?error=auth_failed');
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
}
