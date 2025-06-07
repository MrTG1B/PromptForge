
// src/app/auth/forgot-password/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/firebase/auth'; // We'll create this
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setEmailSent(false);
    try {
      await sendPasswordResetEmail(data.email);
      setEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${data.email}, a password reset link has been sent. Please check your inbox (and spam folder).`,
        duration: 10000,
      });
    } catch (authError: any) {
      let message = "Failed to send password reset email. Please try again.";
      // Firebase often returns 'auth/user-not-found' but for security,
      // it's better not to confirm if an email exists or not.
      // So, we'll use a generic message unless it's a clear non-user-related error.
      if (authError.code && authError.code !== 'auth/user-not-found') {
        message = authError.message;
      }
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="font-headline text-3xl">Forgot Your Password?</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Check your email for the reset link."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">A password reset link has been sent to the email address provided, if it's associated with an account. Please check your inbox and spam folder.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register("email")} placeholder="you@example.com" aria-invalid={errors.email ? "true" : "false"} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2 h-4 w-4" />} Send Reset Link
              </Button>
            </form>
          )}

          {error && !emailSent && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pt-6 space-y-3">
            <Link href="/login" passHref>
                <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
