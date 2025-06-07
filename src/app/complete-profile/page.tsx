
// This file is no longer used and can be deleted.
// All profile completion fields have been moved to the signup form.
// Users are redirected to the main page ('/') after email verification.
// The /update-profile page is used for existing users to manage their profile.

// To ensure no broken links, if a user somehow lands here, redirect them.
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ObsoleteCompleteProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/'); // If user is logged in, send to home
      } else {
        router.replace('/login'); // If not logged in, send to login
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Redirecting...</p>
    </div>
  );
}
    