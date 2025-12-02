'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempData, setTempData] = useState<any>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profile_image: '',
    location: '',
    password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam));
        setTempData(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          profile_image: data.profile_image || '',
          location: '',
          password: '',
          confirm_password: '',
        });
      } catch (error) {
        console.error('Error parsing temp data:', error);
        router.replace('/signin?error=invalid_data');
      }
    } else {
      router.replace('/signin?error=no_data');
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all required fields
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.location || !formData.password) {
      setError('All fields are required');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting with profile_image:', formData.profile_image);
      
      // Create the user account with ALL complete data
      const res = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          profile_image: formData.profile_image,
          location: formData.location,
          password: formData.password,
          oauth_provider: tempData?.oauth_provider || 'google'
        })
      });

      const result = await res.json();

      if (result.success) {
        // Save complete user session
        localStorage.setItem('student_session', JSON.stringify(result.user));
        
        // Trigger header update
        window.dispatchEvent(new CustomEvent('userLogin', { detail: result.user }));
        
        // Redirect to teams
        router.replace('/teams');
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tempData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="size-20">
              {formData.profile_image ? (
                <AvatarImage src={formData.profile_image} alt={formData.first_name} />
              ) : (
                <AvatarImage src="/Morx.png" />
              )}
              <AvatarFallback className="text-lg">
                {formData.first_name?.substring(0, 1)}{formData.last_name?.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Please complete all required fields to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-primary bg-primary/5">
            <CheckCircle2 className="size-4 text-primary" />
            <AlertDescription>
              All fields are required to ensure your account is properly set up. This will only take a moment!
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">From your Google account</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="City, Country (e.g., New York, USA)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  required
                  placeholder="Re-enter password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Complete Signup & Continue'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/signin')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
