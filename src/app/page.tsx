
// src/app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import PromptWorkspace from '@/components/prompt-forge/PromptWorkspace';
import VerifyEmailPrompt from '@/components/auth/VerifyEmailPrompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Wand2, ArrowRight, Zap, Settings2, LayoutGrid, Sparkles, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  useEffect(() => {
    const isFirstLogin = searchParams.get('firstLogin') === 'true';
    if (isFirstLogin && user && !loading) {
      setShowWelcomeDialog(true);
      // Remove the query param from URL without reloading and triggering navigation events
      const newUrl = `${window.location.pathname}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [searchParams, user, loading]);

  const handleGetStarted = () => {
    router.push('/login');
  };

  if (loading) {
    return null;
  }

  if (user) {
    const isEmailPasswordUser = user.providerData.some(p => p.providerId === 'password');
    if (isEmailPasswordUser && !user.emailVerified) {
      return <VerifyEmailPrompt />;
    }
    return (
      <>
        <div className="w-full max-w-4xl mx-auto">
          <PromptWorkspace />
        </div>
        <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center">
                <Sparkles className="mr-3 h-7 w-7 text-primary" /> Welcome to PromptForge!
              </DialogTitle>
              <DialogDescription className="pt-2 text-base">
                You're all set to start crafting amazing AI prompts. Here’s a quick guide:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 text-sm text-foreground">
              <p>
                <strong>1. Input Your Idea:</strong> Enter your basic prompt idea in the main text area.
                Don't worry if it's rough – that's what we're here for!
              </p>
              <p>
                <strong>2. (Optional) Refine Parameters:</strong> If you have specific needs, toggle on "Refine with Specific Parameters" to set the desired style, length, and tone for your prompt.
              </p>
              <p>
                <strong>3. Generate:</strong> Click "Generate Prompt". Our AI will analyze your input and forge a more detailed and effective prompt.
              </p>
              <p>
                <strong>4. Edit & Copy:</strong> The refined prompt will appear below. You can edit it directly or copy it to your clipboard to use with your favorite AI tools.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowWelcomeDialog(false)} className="bg-primary hover:bg-primary/90">
                <CheckCircle className="mr-2 h-5 w-5" /> Got it, Let's Forge!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // User is not logged in - show landing page
  return (
    <div className="container mx-auto px-4 py-8 overflow-x-hidden bg-animated-gradient min-h-[calc(100vh-theme(spacing.16))]">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Hero Section */}
        <div className="animate-in fade-in-0 slide-in-from-top-8 duration-700">
          <Wand2 className="h-20 w-20 md:h-28 md:w-28 text-primary mb-6 animate-subtle-pulse" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline text-foreground mb-6">
            Welcome to PromptForge
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">
            The intelligent workspace to craft, refine, and perfect your AI prompts.
            Unlock advanced AI capabilities and streamline your creative process with our intuitive tools.
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="px-10 py-7 text-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform transform hover:scale-105"
          >
            Start Forging Now
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>

        {/* Feature Highlights Section */}
        <div
          className="mt-24 w-full max-w-5xl animate-in fade-in-0 slide-in-from-bottom-12 duration-500 delay-200"
          data-animate-on-scroll
        >
          <h2 className="text-3xl font-semibold font-headline text-foreground mb-12">Why Choose PromptForge?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col text-center animate-in fade-in-0 slide-in-from-bottom-8 duration-500 delay-300 hover:scale-105" data-animate-on-scroll>
              <CardHeader className="items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4 inline-block">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">AI-Powered Refinement</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm">
                  Leverage cutting-edge AI to transform your basic ideas into highly effective and detailed prompts.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col text-center animate-in fade-in-0 slide-in-from-bottom-8 duration-500 delay-400 hover:scale-105" data-animate-on-scroll>
              <CardHeader className="items-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4 inline-block">
                    <Settings2 className="h-8 w-8 text-primary" />
                  </div>
                <CardTitle className="text-xl font-semibold">Parameter Optimization</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm">
                  Fine-tune style, length, and tone with smart suggestions to achieve precise AI responses.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col text-center animate-in fade-in-0 slide-in-from-bottom-8 duration-500 delay-500 hover:scale-105" data-animate-on-scroll>
              <CardHeader className="items-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4 inline-block">
                    <LayoutGrid className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Intuitive Workspace</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm">
                  Enjoy a seamless and user-friendly interface designed for efficient prompt creation and iteration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          className="mt-24 w-full max-w-3xl animate-in fade-in-0 zoom-in-90 duration-500 delay-300"
          data-animate-on-scroll
        >
            <h3 className="text-2xl font-semibold font-headline text-foreground mb-8">See It In Action</h3>
            <div className="bg-card p-2 rounded-lg shadow-xl border border-border transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <Image
                    src="https://placehold.co/700x400.png"
                    alt="PromptForge Workspace Preview"
                    width={700}
                    height={400}
                    className="rounded-md "
                    data-ai-hint="app screenshot"
                />
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">Conceptual preview of the PromptForge workspace.</p>
        </div>

        <div
          className="mt-24 mb-10 py-16 bg-muted/30 rounded-lg w-full max-w-4xl px-6 animate-in fade-in-0 slide-in-from-bottom-12 duration-700 delay-300"
          data-animate-on-scroll
        >
            <h2 className="text-3xl font-semibold font-headline text-foreground mb-5">Ready to Forge Perfect Prompts?</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-lg">
                Join PromptForge today and elevate your AI interactions. Sign up is quick, easy, and free to get started!
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="px-10 py-7 text-xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform transform hover:scale-110 animate-subtle-pulse"
            >
              Start Forging Now
              <Sparkles className="ml-3 h-6 w-6" />
            </Button>
        </div>
      </div>
    </div>
  );
}
    