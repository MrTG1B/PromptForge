// src/components/prompt-forge/GeneratedPromptDisplay.tsx
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Copy, Check, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedPromptDisplayProps {
  promptText: string | null;
  onRegenerate?: () => void; // Optional: if regeneration is tied to the main form's submit
  isLoading: boolean;
}

const GeneratedPromptDisplay: React.FC<GeneratedPromptDisplayProps> = ({ promptText, onRegenerate, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [editablePrompt, setEditablePrompt] = useState(promptText || "");

  useEffect(() => {
    setEditablePrompt(promptText || "");
  }, [promptText]);

  const handleCopy = async () => {
    if (!editablePrompt) return;
    try {
      await navigator.clipboard.writeText(editablePrompt);
      setCopied(true);
      toast({
        title: "Prompt Copied!",
        description: "The generated prompt has been copied to your clipboard.",
        variant: "default",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy prompt to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!promptText && !isLoading) {
    return (
      <Card className="w-full mt-8 shadow-lg bg-muted/30">
        <CardContent className="p-6 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your expertly crafted prompt will appear here once generated.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading && !promptText) {
     return (
      <Card className="w-full mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Generated Prompt</CardTitle>
          <CardDescription>Your AI-refined prompt is being forged...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="h-32 w-full bg-muted animate-pulse rounded-md"></div>
           <div className="flex justify-end space-x-2">
             <Button variant="outline" disabled className="w-32 h-10 bg-muted animate-pulse"></Button>
             {onRegenerate && <Button disabled className="w-32 h-10 bg-muted animate-pulse"></Button>}
           </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Your Forged Prompt</CardTitle>
        <CardDescription>Here is the AI-refined prompt. You can edit it directly or copy it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="generatedPrompt" className="sr-only">Generated Prompt</Label>
          <Textarea
            id="generatedPrompt"
            value={editablePrompt}
            onChange={(e) => setEditablePrompt(e.target.value)}
            readOnly={!promptText}
            placeholder="Your generated prompt will appear here..."
            className="min-h-[150px] text-base bg-background focus:ring-accent"
            aria-label="Generated AI Prompt"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
          {onRegenerate && (
             <Button onClick={onRegenerate} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          )}
          <Button onClick={handleCopy} disabled={!editablePrompt || isLoading} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratedPromptDisplay;
