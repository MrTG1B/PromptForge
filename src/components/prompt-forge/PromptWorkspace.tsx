// src/components/prompt-forge/PromptWorkspace.tsx
"use client";

import { useState } from 'react';
import PromptInputForm, { type PromptFormValues } from './PromptInputForm';
import GeneratedPromptDisplay from './GeneratedPromptDisplay';
import { handleRefinePromptAction } from '@/app/actions';
import type { RefinePromptInput } from '@/ai/flows/refine-prompt'; // Import RefinePromptInput
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const PromptWorkspace: React.FC = () => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
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

  const handleSubmitPrompt = async (data: PromptFormValues, includeParameters: boolean) => {
    setIsLoadingPrompt(true);
    setError(null);
    setGeneratedPrompt(null); 

    const recaptchaDetails = await getRecaptchaTokenAndAction('refine_prompt');
    if (!recaptchaDetails) {
      setIsLoadingPrompt(false);
      return;
    }

    const refineInput: RefinePromptInput = {
      promptIdea: data.promptIdea,
      style: includeParameters ? data.style : undefined,
      length: includeParameters ? data.length : undefined,
      tone: includeParameters ? data.tone : undefined,
    };

    try {
      const result = await handleRefinePromptAction({
        input: refineInput,
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
      if (errorMessage.includes("SERVER_CONFIG_ERROR") || errorMessage.includes("GCP_AUTHENTICATION_FAILURE")) {
        console.error("A critical server configuration error occurred:", errorMessage);
      }
    } finally {
      setIsLoadingPrompt(false);
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
        isLoadingPrompt={isLoadingPrompt}
      />
      <GeneratedPromptDisplay
        promptText={generatedPrompt}
        isLoading={isLoadingPrompt}
        onRegenerate={() => {
          if (generatedPrompt) {
             toast({ title: "Regenerate Option", description: "To regenerate, adjust your idea or parameters above and click 'Generate Prompt' again."});
          }
        }}
      />
    </div>
  );
};

export default PromptWorkspace;
