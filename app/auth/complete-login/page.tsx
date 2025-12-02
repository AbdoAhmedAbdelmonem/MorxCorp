'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CompleteLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionParam = searchParams.get('session');
    const isNewUser = searchParams.get('new_user') === 'true';
    
    if (sessionParam) {
      try {
        // Decode and parse the session data
        const sessionData = JSON.parse(decodeURIComponent(sessionParam));
        
        // Save to localStorage
        localStorage.setItem('student_session', JSON.stringify(sessionData));
        
        // Trigger header update
        window.dispatchEvent(new CustomEvent('userLogin', { detail: sessionData }));
        
        // If new user, redirect to settings page to complete profile
        // Otherwise, redirect to main page
        if (isNewUser) {
          router.replace('/settings?welcome=true');
        } else {
          router.replace('/teams');
        }
      } catch (error) {
        console.error('Error setting up session:', error);
        router.replace('/signin?error=session_failed');
      }
    } else {
      router.replace('/signin?error=no_session');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
}
