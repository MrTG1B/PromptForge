
// src/app/login/page.tsx
"use client";

import { useState, type SVGProps, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  signInWithGoogle, 
  signInWithFacebook, 
  signUpWithEmailPasswordAndSendVerification, 
  signInWithEmailPassword, 
  getFirebaseAuthErrorMessage 
} from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/config'; // Import db
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PhoneNumberInput from '@/components/ui/phone-number-input';
import { Loader2, LogIn, UserPlus, AlertTriangle, Eye, EyeOff, Check, X } from 'lucide-react';
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

const currentYear = new Date().getFullYear();
const passwordValidation = z.string()
  .min(8, { message: "Password must be at least 8 characters." })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character." });

const signUpSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  dobDay: z.string({ required_error: "Day is required." })
    .min(1, {message: "Day is required."})
    .refine(val => {
        const dayNum = parseInt(val, 10);
        return /^\d{1,2}$/.test(val) && dayNum >= 1 && dayNum <= 31;
    }, { message: "Day must be 1-31." }),
  dobMonth: z.string({ required_error: "Month is required." }).min(1, {message: "Month is required."}),
  dobYear: z.string({ required_error: "Year is required." })
    .length(4, { message: "Year must be 4 digits."})
    .refine(val => {
        const yearNum = parseInt(val, 10);
        return /^\d{4}$/.test(val) && yearNum >= 1900 && yearNum <= currentYear;
    }, { message: `Year must be between 1900 and ${currentYear}.` }),
  mobileNumber: z.string({ required_error: "Mobile number is required."})
    .min(1, { message: "Mobile number is required."}) 
    .regex(/^\+\d{1,3}\d{4,14}$/, { message: "Invalid mobile number format (e.g., +11234567890)."}),
  email: z.string().email({ message: "Invalid email address." }),
  password: passwordValidation,
  confirmPassword: passwordValidation,
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
}).refine(data => { // Date of Birth validation
  const day = parseInt(data.dobDay, 10);
  const month = parseInt(data.dobMonth, 10);
  const year = parseInt(data.dobYear, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === (month - 1) && date.getDate() === day;
}, {
  message: "The date of birth entered is not a valid date.",
  path: ["dobDay"], 
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface PasswordCriteria {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
}

const initialPasswordCriteria: PasswordCriteria = {
  minLength: false, uppercase: false, lowercase: false, number: false, specialChar: false,
};

const monthOptions = [
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" }
];

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signUpPasswordValue, setSignUpPasswordValue] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>(initialPasswordCriteria);
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const { control: signUpControl, register: registerSignUp, handleSubmit: handleSubmitSignUp, formState: { errors: signUpErrors }, watch } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
        firstName: '', lastName: '', dobDay: '', dobMonth: '', dobYear: '', mobileNumber: '', email: '', password: '', confirmPassword: ''
    }
  });
  
  const watchedSignUpPassword = watch("password");

  useEffect(() => {
    if (activeTab === "signup" && watchedSignUpPassword !== undefined) {
      setSignUpPasswordValue(watchedSignUpPassword); 
      const criteriaMet: PasswordCriteria = {
        minLength: watchedSignUpPassword.length >= 8,
        uppercase: /[A-Z]/.test(watchedSignUpPassword),
        lowercase: /[a-z]/.test(watchedSignUpPassword),
        number: /[0-9]/.test(watchedSignUpPassword),
        specialChar: /[^A-Za-z0-9]/.test(watchedSignUpPassword),
      };
      setPasswordCriteria(criteriaMet);
    } else {
      setShowPasswordCriteria(false);
    }
  }, [watchedSignUpPassword, activeTab]);

  const handleAuthSuccess = (isNewUser: boolean = false) => { 
    toast({ title: "Success!", description: "Logged in successfully." });
    if (isNewUser) {
      router.push('/?firstLogin=true');
    } else {
      router.push('/'); 
    }
    router.refresh();
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
      handleAuthSuccess(false); // Existing user
    } catch (authError) {
      handleAuthError(authError);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit: SubmitHandler<SignUpFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmailPasswordAndSendVerification(
        data.email, 
        data.password,
        data.firstName,
        data.lastName,
        data.dobDay,
        data.dobMonth,
        data.dobYear,
        data.mobileNumber
      );
      // Redirection to /auth/verify-email now happens after signUpWithEmailPasswordAndSendVerification
      // where the user will be redirected to /?firstLogin=true after clicking the verification link
      router.push('/auth/verify-email'); 
    } catch (authError) {
      handleAuthError(authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (signInMethod: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const firebaseUser = await signInMethod();
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        let isNewUserToApp = false;

        if (!docSnap.exists()) {
          isNewUserToApp = true;
          const nameParts = firebaseUser.displayName?.split(' ') || [];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          await setDoc(userDocRef, {
            firstName,
            lastName,
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || null,
            emailVerified: firebaseUser.emailVerified, // OAuth emails are usually pre-verified
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // dobDay, dobMonth, dobYear, mobileNumber will be empty for OAuth new users
          }, { merge: true });
        }
        handleAuthSuccess(isNewUserToApp);
      } else {
        // This case should ideally not happen if signInMethod resolves successfully
        handleAuthError(new Error("Sign-in process did not return a user."));
      }
    } catch (authError) {
      handleAuthError(authError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    await handleOAuthSignIn(signInWithGoogle);
  };

  const handleFacebookAuth = async () => {
    await handleOAuthSignIn(signInWithFacebook);
  };


  const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <li className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-red-600'}`}>
      {met ? <Check className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
      {text}
    </li>
  );

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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Link href="/auth/forgot-password" legacyBehavior>
                      <a className="text-sm font-medium text-primary hover:underline">
                        Forgot password?
                      </a>
                    </Link>
                  </div>
                  <div className="relative mt-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...registerSignUp("firstName")} placeholder="e.g., Jane" aria-invalid={signUpErrors.firstName ? "true" : "false"} />
                    {signUpErrors.firstName && <p className="text-sm text-destructive mt-1">{signUpErrors.firstName.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...registerSignUp("lastName")} placeholder="e.g., Doe" aria-invalid={signUpErrors.lastName ? "true" : "false"} />
                    {signUpErrors.lastName && <p className="text-sm text-destructive mt-1">{signUpErrors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <Label>Date of Birth</Label>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    <div>
                      <Label htmlFor="dobDay" className="sr-only">Day</Label>
                      <Input id="dobDay" type="number" {...registerSignUp("dobDay")} placeholder="DD" aria-invalid={signUpErrors.dobDay ? "true" : "false"} />
                      {signUpErrors.dobDay && <p className="text-sm text-destructive mt-1">{signUpErrors.dobDay.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="dobMonth" className="sr-only">Month</Label>
                      <Controller name="dobMonth" control={signUpControl} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''} disabled={field.disabled}>
                          <SelectTrigger id="dobMonth" aria-label="Month" aria-invalid={signUpErrors.dobMonth ? "true" : "false"}><SelectValue placeholder="Month" /></SelectTrigger>
                          <SelectContent>{monthOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                        </Select>
                      )} />
                      {signUpErrors.dobMonth && <p className="text-sm text-destructive mt-1">{signUpErrors.dobMonth.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="dobYear" className="sr-only">Year</Label>
                      <Input id="dobYear" type="number" {...registerSignUp("dobYear")} placeholder="YYYY" aria-invalid={signUpErrors.dobYear ? "true" : "false"} />
                      {signUpErrors.dobYear && <p className="text-sm text-destructive mt-1">{signUpErrors.dobYear.message}</p>}
                    </div>
                  </div>
                  {signUpErrors.root?.message && !signUpErrors.dobDay && !signUpErrors.dobMonth && !signUpErrors.dobYear && (<p className="text-sm text-destructive mt-1 col-span-3">{signUpErrors.root.message}</p>)}
                </div>
                
                <div>
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Controller name="mobileNumber" control={signUpControl} defaultValue="" render={({ field }) => (<PhoneNumberInput value={field.value} onChange={field.onChange} defaultCountry="IN" disabled={field.disabled} />)} />
                  {signUpErrors.mobileNumber && <p className="text-sm text-destructive mt-1">{signUpErrors.mobileNumber.message}</p>}
                </div>

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
                      placeholder="Create your password" 
                      aria-invalid={signUpErrors.password ? "true" : "false"}
                      className="pr-10"
                      onFocus={() => setShowPasswordCriteria(true)}
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
                  
                  {showPasswordCriteria && (
                    <ul className="mt-2 space-y-1 p-3 bg-muted/50 rounded-md">
                      <PasswordRequirement met={passwordCriteria.minLength} text="At least 8 characters" />
                      <PasswordRequirement met={passwordCriteria.uppercase} text="At least one uppercase letter (A-Z)" />
                      <PasswordRequirement met={passwordCriteria.lowercase} text="At least one lowercase letter (a-z)" />
                      <PasswordRequirement met={passwordCriteria.number} text="At least one number (0-9)" />
                      <PasswordRequirement met={passwordCriteria.specialChar} text="At least one special character (e.g., !@#$%)" />
                    </ul>
                  )}
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
    

    