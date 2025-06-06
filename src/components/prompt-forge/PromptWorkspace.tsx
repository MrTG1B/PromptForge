
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
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const PromptWorkspace: React.FC = () => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestedParameters, setSuggestedParameters] = useState<SuggestParametersOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getRecaptchaTokenAndAction = async (actionName: string): Promise<{ token: string; action: string } | null> => {
    if (!executeRecaptcha) {
      toast({
        title: "reCAPTCHA Error",
        description: "reCAPTCHA not available. Please try again later.",
        variant: "destructive",
      });
      return null;
    }
    try {
      const token = await executeRecaptcha(actionName);
      if (!token) {
        toast({
          title: "reCAPTCHA Error",
          description: "Failed to obtain reCAPTCHA token. Please try again.",
          variant: "destructive",
        });
        return null;
      }
      return { token, action: actionName };
    } catch (err) {
      console.error("reCAPTCHA execution error:", err);
      toast({
        title: "reCAPTCHA Error",
        description: "Failed to execute reCAPTCHA. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmitPrompt = async (data: PromptFormValues) => {
    setIsLoadingPrompt(true);
    setError(null);
    setGeneratedPrompt(null); // Clear previous prompt

    const recaptchaDetails = await getRecaptchaTokenAndAction('refine_prompt');
    if (!recaptchaDetails) {
      setIsLoadingPrompt(false);
      return;
    }

    try {
      const result = await handleRefinePromptAction({
        input: {
          promptIdea: data.promptIdea,
          style: data.style,
          length: data.length,
          tone: data.tone,
        },
        recaptchaToken: recaptchaDetails.token,
        recaptchaAction: recaptchaDetails.action,
      });
      setGeneratedPrompt(result.refinedPrompt);
      
      toast({
        title: "Prompt Forged!",
        description: "Your new prompt has been successfully generated.",
      });

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

    const recaptchaDetails = await getRecaptchaTokenAndAction('suggest_parameters');
    if (!recaptchaDetails) {
      setIsLoadingSuggestions(false);
      return null;
    }

    try {
      const result = await handleSuggestParametersAction({ 
        input: { basicPrompt: promptIdea },
        recaptchaToken: recaptchaDetails.token,
        recaptchaAction: recaptchaDetails.action,
      });
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
            duration: 10000, 
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
