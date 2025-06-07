// src/app/learn-prompts/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Home, BookOpen } from 'lucide-react'; // Added BookOpen

export const metadata: Metadata = {
  title: 'Learn About Prompts - PromptForge',
  description: 'Discover the art and science of prompt engineering. Learn how to craft effective prompts for AI models with PromptForge.',
};

export default function LearnPromptsPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="font-headline text-3xl md:text-4xl">Unlock the Power of Prompts</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            Your Guide to Effective Prompt Engineering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">What is Prompt Engineering?</h2>
            <p>
              Prompt engineering is the process of designing and refining inputs (prompts) for generative AI models to achieve desired outputs. It's a crucial skill for anyone looking to leverage the full potential of tools like large language models (LLMs) or image generation models.
            </p>
            <p className="mt-2">
              Think of it as giving clear, concise, and context-rich instructions to an AI. The better the prompt, the more accurate, relevant, and creative the AI's response will be. This page provides foundational knowledge to help you get started.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">Key Principles of Effective Prompting</h2>
            <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
              <li>
                <strong>Clarity and Specificity:</strong> Be as clear and specific as possible about what you want. Avoid ambiguity. Instead of "Write about dogs," try "Write a short, heartwarming story about a lost puppy finding its way home, aimed at young children."
              </li>
              <li>
                <strong>Context is King:</strong> Provide sufficient background information or context if the task requires it. The AI doesn't know what you know unless you tell it.
              </li>
              <li>
                <strong>Define the Persona/Role:</strong> Instruct the AI to adopt a specific persona (e.g., "Act as an expert historian," "You are a witty comedian"). This can significantly influence the tone and style of the output.
              </li>
              <li>
                <strong>Specify the Format:</strong> If you need the output in a particular format (e.g., bullet points, JSON, a table, a poem), explicitly state it in your prompt.
              </li>
              <li>
                <strong>Iterate and Refine:</strong> Don't expect the perfect prompt on your first try. Experiment with different phrasings, add more details, or simplify your request. PromptForge is designed to help you with this iterative process!
              </li>
              <li>
                <strong>Use Examples (Few-Shot Prompting):</strong> For complex tasks, providing a few examples of the input-output format you desire can greatly improve results.
              </li>
              <li>
                <strong>Control Length and Detail:</strong> Specify if you want a concise summary, a detailed explanation, or something in between.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">Common Prompting Techniques</h2>
            <p>
              Beyond basic instructions, several techniques can enhance your prompts:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2 bg-muted/30 p-4 rounded-md">
              <li><strong>Zero-Shot Prompting:</strong> Giving a direct instruction without any prior examples (e.g., "Translate this text to Spanish: 'Hello, world.'").</li>
              <li><strong>Few-Shot Prompting:</strong> Providing a few examples of the task before asking the AI to perform it on a new input.</li>
              <li><strong>Chain-of-Thought (CoT) Prompting:</strong> Encouraging the AI to "think step-by-step" or explain its reasoning process, which can lead to more accurate results for complex problems.</li>
              <li><strong>Role Prompting:</strong> Assigning a role to the AI, as mentioned earlier.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">How PromptForge Helps</h2>
            <p>
                PromptForge is designed to assist you in crafting and refining your prompts. Our AI-powered tools can take your basic ideas and suggest improvements, help you explore different styles, lengths, and tones, and ultimately generate more effective prompts for your needs.
            </p>
            <p className="mt-2">
                Use our workspace to experiment with your prompt ideas, leverage AI suggestions, and save your best creations.
            </p>
          </section>

          <p className="text-sm text-muted-foreground text-center mt-8">
            <strong>This is placeholder content.</strong> Replace this with your own detailed, original, and high-quality information about prompt engineering to satisfy AdSense content requirements. The more unique and valuable your content, the better.
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
