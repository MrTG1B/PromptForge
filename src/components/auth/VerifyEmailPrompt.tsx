// src/components/auth/VerifyEmailPrompt.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailWarning, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sendEmailVerification, type ActionCodeSettings } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!user || !user.email) {
      toast({
        title: "Error",
        description: "User data not available to resend verification.",
        variant: "destructive",
      });
      return;
    }
    setIsResending(true);
    try {
      // Re-fetch siteURL as it's client-side now
      const siteURL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const actionCodeSettings: ActionCodeSettings = {
        url: `${siteURL}/complete-profile`, // Or '/' or '/update-profile' if user already completed initial profile
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      toast({
        title: "Verification Email Resent",
        description: `A new verification email has been sent to ${user.email}. Please check your inbox and spam folder.`,
        duration: 7000,
      });
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      toast({
        title: "Error Resending Email",
        description: "Could not resend verification email. Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-12"> {/* Adjusted min-height */}
      <Card className="w-full max-w-lg text-center shadow-xl border-primary/20">
        <CardHeader>
          <MailWarning className="mx-auto h-16 w-16 text-amber-500 mb-4" /> {/* Changed color for emphasis */}
          <CardTitle className="font-headline text-3xl">Verify Your Email</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Please verify your email address to access PromptForge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">
            A verification email was sent to{' '}
            <strong className="text-primary">{user.email}</strong>.
          </p>
          <p className="text-foreground">
            Click the link in that email to activate your account. Once verified, you can refresh this page or log in again.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, please check your spam or junk folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-6">
          <Button onClick={handleResendVerification} disabled={isResending} variant="outline" className="w-full sm:w-auto">
            {isResending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Resend Verification
          </Button>
          <Link href="/login" passHref className="w-full sm:w-auto">
            <Button variant="default" className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
