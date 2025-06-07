
// src/app/auth/verify-email/page.tsx
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If user is somehow already verified and on this page, redirect them
  useEffect(() => {
    if (user && user.emailVerified) {
      router.replace('/complete-profile');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <MailCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="font-headline text-3xl">Check Your Inbox!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Your account has been created.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">
            We've sent a verification link to{' '}
            <strong className="text-primary">{user?.email || 'your email address'}</strong>.
          </p>
          <p className="text-foreground">
            Please click the link in that email to verify your account. You can then log in to complete your profile.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don't see the email, please check your spam or junk folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-6">
          <Link href="/login" passHref className="w-full">
            <Button className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
          {/* 
            Future enhancement: Add a resend verification email button.
            This would require a Firebase function or another mechanism
            as client-side resend without re-auth can be tricky.
          */}
        </CardFooter>
      </Card>
    </div>
  );
}
