// src/components/prompt-forge/PromptWorkspace.tsx
"use client";

import { useState } from 'react';
import PromptInputForm, { type PromptFormValues } from './PromptInputForm';
import GeneratedPromptDisplay from './GeneratedPromptDisplay';
import { handleRefinePromptAction, handleSuggestParametersAction } from '@/app/actions';
import type { SuggestParametersOutput } from '@/ai/flows/suggest-parameters';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const PromptWorkspace: React.FC = () => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedParameters, setSuggestedParameters] = useState<SuggestParametersOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmitPrompt = async (data: PromptFormValues) => {
    setIsLoadingPrompt(true);
    setError(null);
    setGeneratedPrompt(null); // Clear previous prompt
    try {
      const result = await handleRefinePromptAction({
        promptIdea: data.promptIdea,
        style: data.style,
        length: data.length,
        tone: data.tone,
      });
      setGeneratedPrompt(result.refinedPrompt);
      
      toast({
        title: "Prompt Forged!",
        description: "Your new prompt has been successfully generated.",
      });

      // Auto-copy logic
      if (result.refinedPrompt) {
        try {
          await navigator.clipboard.writeText(result.refinedPrompt);
          toast({
            title: "Prompt Auto-Copied!",
            description: "The generated prompt has been copied to your clipboard.",
            variant: "default",
          });
        } catch (copyError) {
          console.error("Auto-copy failed:", copyError);
          // Optional: show a toast if auto-copy fails, but primary success toast is already shown.
          // toast({
          //   title: "Auto-Copy Failed",
          //   description: "Could not automatically copy prompt. You can copy it manually.",
          //   variant: "destructive",
          // });
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Error Generating Prompt",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleSuggestParams = async (promptIdea: string): Promise<SuggestParametersOutput | null> => {
    setIsLoadingSuggestions(true);
    setError(null);
    setSuggestedParameters(null);
    try {
      const result = await handleSuggestParametersAction({ basicPrompt: promptIdea });
      setSuggestedParameters(result);
      toast({
        title: "Parameters Suggested!",
        description: "AI has suggested new parameters for your prompt.",
      });
      if (result.reasoning) {
         toast({
            title: "AI Reasoning for Suggestions",
            description: (
            <div className="text-sm">
                <p className="font-semibold">Style: <span className="font-normal">{result.suggestedStyle}</span></p>
                <p className="font-semibold">Length: <span className="font-normal">{result.suggestedLength}</span></p>
                <p className="font-semibold">Tone: <span className="font-normal">{result.suggestedTone}</span></p>
                <p className="mt-2 pt-2 border-t border-border"><span className="font-semibold">Reasoning:</span> {result.reasoning}</p>
            </div>
            ),
            duration: 10000, // Longer duration for reading
        });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Error Suggesting Parameters",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <PromptInputForm
        onSubmitPrompt={handleSubmitPrompt}
        onSuggestParameters={handleSuggestParams}
        isLoadingPrompt={isLoadingPrompt}
        isLoadingSuggestions={isLoadingSuggestions}
        suggestedParameters={suggestedParameters}
      />
      <GeneratedPromptDisplay
        promptText={generatedPrompt}
        isLoading={isLoadingPrompt}
        onRegenerate={() => {
          if (generatedPrompt) {
             toast({ title: "Regenerate Clicked", description: "Modify parameters and click 'Generate Prompt' again."});
          }
        }}
      />
    </div>
  );
};

export default PromptWorkspace;
