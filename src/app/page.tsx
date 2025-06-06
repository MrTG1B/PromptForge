
// src/app/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import PromptWorkspace from '@/components/prompt-forge/PromptWorkspace';
import LoginButton from '@/components/auth/LoginButton'; // This is the Google Login Button
import { Button } from '@/components/ui/button'; // For the new Facebook button
import { signInWithFacebook } from '@/lib/firebase/auth'; // Import Facebook sign-in
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

const FacebookLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
  </svg>
);


export default function HomePage() {
  const { user, loading } = useAuth();

  const handleFacebookLogin = async () => {
    try {
      await signInWithFacebook();
      // User state will be updated by AuthProvider
    } catch (error) {
      console.error("Facebook Login failed on page:", error);
      // Handle login error (e.g., show a toast)
    }
  };

  if (loading) {
    // Loading state is handled by AuthProvider's full-screen loader
    return null; 
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {user ? (
        <PromptWorkspace />
      ) : (
        <Card className="mt-10 text-center shadow-xl border-primary/20">
          <CardHeader>
            <Wand2 className="mx-auto h-20 w-20 text-primary mb-4" />
            <CardTitle className="font-headline text-4xl">Welcome to PromptForge!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Unlock the power of AI with perfectly crafted prompts. <br />
              Log in to start forging your masterpiece.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4 pb-8">
            <p className="text-foreground text-center">
              Please log in to access the prompt generation tools.
            </p>
            <LoginButton /> 
            <Button 
              onClick={handleFacebookLogin} 
              variant="outline" // You can change variant, e.g. to "default" for Facebook blue if you add custom styles
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 shadow-sm hover:shadow-md transition-shadow duration-150 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FacebookLogo />
              Sign in with Facebook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
