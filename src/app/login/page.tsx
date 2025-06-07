// src/app/login/page.tsx
"use client";

import { useState, type SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithGoogle, signInWithFacebook, signUpWithEmailPassword, signInWithEmailPassword, getFirebaseAuthErrorMessage } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LogIn, UserPlus, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


const GoogleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path fill="none" d="M1 1h22v22H1z" />
  </svg>
);

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
  </svg>
);

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // Point error to confirmPassword field
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { register: registerSignUp, handleSubmit: handleSubmitSignUp, formState: { errors: signUpErrors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const handleAuthSuccess = () => {
    toast({ title: "Success!", description: activeTab === "login" ? "Logged in successfully." : "Account created successfully." });
    router.push('/'); // Redirect to homepage
    router.refresh(); // Force refresh to update auth state if needed
  };

  const handleAuthError = (authError: any) => {
    const message = getFirebaseAuthErrorMessage(authError);
    setError(message);
    setIsLoading(false);
  };

  const onLoginSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailPassword(data.email, data.password);
      handleAuthSuccess();
    } catch (authError) {
      handleAuthError(authError);
    }
  };

  const onSignUpSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmailPassword(data.email, data.password);
      handleAuthSuccess();
    } catch (authError) {
      handleAuthError(authError);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      handleAuthSuccess();
    } catch (authError) {
      handleAuthError(authError);
    }
  };

  const handleFacebookAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithFacebook();
      handleAuthSuccess();
    } catch (authError) {
      handleAuthError(authError);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">
            {activeTab === 'login' ? 'Welcome Back!' : 'Create an Account'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'login' ? 'Log in to continue to PromptForge.' : 'Join PromptForge to start crafting prompts.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-6 pt-6">
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" {...registerLogin("email")} placeholder="you@example.com" aria-invalid={loginErrors.email ? "true" : "false"} />
                  {loginErrors.email && <p className="text-sm text-destructive mt-1">{loginErrors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      type={showLoginPassword ? "text" : "password"} 
                      {...registerLogin("password")} 
                      placeholder="••••••••" 
                      aria-invalid={loginErrors.password ? "true" : "false"}
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" 
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginErrors.password && <p className="text-sm text-destructive mt-1">{loginErrors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />} Login
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="space-y-6 pt-6">
              <form onSubmit={handleSubmitSignUp(onSignUpSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" {...registerSignUp("email")} placeholder="you@example.com" aria-invalid={signUpErrors.email ? "true" : "false"} />
                  {signUpErrors.email && <p className="text-sm text-destructive mt-1">{signUpErrors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                   <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showSignUpPassword ? "text" : "password"} 
                      {...registerSignUp("password")} 
                      placeholder="Must be at least 6 characters" 
                      aria-invalid={signUpErrors.password ? "true" : "false"}
                      className="pr-10"
                    />
                     <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" 
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signUpErrors.password && <p className="text-sm text-destructive mt-1">{signUpErrors.password.message}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      {...registerSignUp("confirmPassword")} 
                      placeholder="Re-enter your password" 
                      aria-invalid={signUpErrors.confirmPassword ? "true" : "false"}
                      className="pr-10"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 px-0" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signUpErrors.confirmPassword && <p className="text-sm text-destructive mt-1">{signUpErrors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoogleAuth} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />} Google
            </Button>
            <Button variant="outline" onClick={handleFacebookAuth} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white hover:text-white">
               {isLoading ? <Loader2 className="animate-spin" /> : <FacebookIcon className="mr-2 h-5 w-5 fill-current" />} Facebook
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground justify-center">
          <p>
            By continuing, you agree to our <br />
            <Link href="/terms-and-conditions" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
