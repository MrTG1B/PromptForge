// src/app/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import PromptWorkspace from '@/components/prompt-forge/PromptWorkspace';
import LoginButton from '@/components/auth/LoginButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';


export default function HomePage() {
  const { user, loading } = useAuth();

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
            <Wand2 className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="font-headline text-4xl">Welcome to PromptForge!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Unlock the power of AI with perfectly crafted prompts. <br />
              Log in to start forging your masterpiece.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 pb-8">
            <p className="text-foreground">
              Please log in with your Google account to access the prompt generation tools.
            </p>
            <LoginButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
