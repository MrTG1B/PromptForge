// src/app/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PromptWorkspace from '@/components/prompt-forge/PromptWorkspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/login');
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
            <Wand2 className="mx-auto h-24 w-24 text-primary mb-4" />
            <CardTitle className="font-headline text-4xl">Welcome to PromptForge!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              The intelligent workspace to craft, refine, and perfect your AI prompts. <br />
              Unlock advanced AI capabilities and streamline your creative process.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4 pb-8">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
