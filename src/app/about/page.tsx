// src/app/about/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Home, Target, Zap } from 'lucide-react'; // Added Target and Zap

export const metadata: Metadata = {
  title: 'About PromptForge',
  description: 'Learn more about PromptForge, our mission, and how we are revolutionizing prompt engineering.',
};

export default function AboutPage() {
  const appName = "PromptForge";

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <Image 
            src="/promptforge-logo.png" 
            alt={`${appName} Logo`} 
            width={190} // Slightly larger for an About page
            height={42} 
            className="mx-auto mb-4"
            data-ai-hint="logo design"
          />
          <CardTitle className="font-headline text-3xl md:text-4xl">About {appName}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            Crafting the Future of AI Interaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center">
              <Target className="mr-2 h-6 w-6" /> Our Mission
            </h2>
            <p>
              At {appName}, our mission is to empower creators, developers, and innovators by making advanced AI accessible and highly effective through superior prompt engineering. We believe that the quality of interaction with AI models is paramount, and a well-crafted prompt is the key to unlocking their full potential.
            </p>
            <p className="mt-2">
              We aim to provide intuitive tools and resources that simplify the art and science of prompt design, enabling users to achieve their desired outcomes with greater precision and creativity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center">
              <Zap className="mr-2 h-6 w-6" /> What is {appName}?
            </h2>
            <p>
              {appName} is an AI-powered platform dedicated to helping you generate, refine, and manage prompts for various AI applications. Whether you're drafting content, developing code, creating art, or exploring new AI capabilities, {appName} provides the workspace and intelligent assistance you need.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2 bg-muted/30 p-4 rounded-md">
              <li><strong>AI-Powered Refinement:</strong> Get suggestions to improve your prompt ideas based on style, length, and tone.</li>
              <li><strong>Parameter Optimization:</strong> Explore different parameters to tailor AI responses.</li>
              <li><strong>Intuitive Workspace:</strong> An easy-to-use interface for drafting and iterating on prompts.</li>
              <li><strong>Focus on Quality:</strong> We emphasize techniques that lead to higher-quality, more reliable AI outputs.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center">
                <Info className="mr-2 h-6 w-6" /> Our Vision for the Future
            </h2>
            <p>
                We envision a future where interacting with AI is seamless and highly productive for everyone. As AI models become more sophisticated, the ability to communicate effectively with them will be an essential skill. {appName} strives to be at the forefront of this evolution, continuously innovating and providing tools that bridge the gap between human intention and AI execution.
            </p>
          </section>

          <p className="text-sm text-muted-foreground text-center mt-8">
            <strong>This is placeholder content.</strong> Please expand this page with original and genuine information about your application, team (if applicable), and your unique value proposition. The more authentic and detailed, the better for AdSense and your users.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Link href="/" passHref>
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to PromptForge
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
