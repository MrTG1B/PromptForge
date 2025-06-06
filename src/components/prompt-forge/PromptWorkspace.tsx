// src/components/prompt-forge/PromptWorkspace.tsx
"use client";

import { useState, useEffect } from 'react';
import PromptInputForm, { type PromptFormValues } from './PromptInputForm';
import GeneratedPromptDisplay from './GeneratedPromptDisplay';
import { handleRefinePromptAction } from '@/app/actions';
import type { RefinePromptInput } from '@/ai/flows/refine-prompt';
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
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext once on the client-side
    if (typeof window !== 'undefined' && window.AudioContext && !audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    // Cleanup AudioContext on unmount
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
      }
    };
  }, []);

  const playCompletionSound = () => {
    const audioContext = audioContextRef.current;
    if (audioContext && audioContext.state !== 'closed') {
       // If context is suspended, try to resume it (usually requires user interaction)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          // Now try to play
          actuallyPlaySound(audioContext);
        }).catch(e => console.error("Error resuming AudioContext:", e));
        return; // Exit, as resume is async
      }
      actuallyPlaySound(audioContext);
    }
  };

  const actuallyPlaySound = (ctx: AudioContext) => {
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 note
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Error playing sound:", e);
      // If an error occurs, try to re-create context for next time if it's because it was closed.
      if (audioContextRef.current && audioContextRef.current.state === 'closed') {
          audioContextRef.current = new window.AudioContext();
      }
    }
  };


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
    // Do not clear generatedPrompt here to allow seeing previous while new one loads. 
    // It's cleared in GeneratedPromptDisplay if isLoading is true and promptText is null.

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
      playCompletionSound();
      
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
          // Do not show error for auto-copy failing, it's a convenience.
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setGeneratedPrompt(null); // Clear prompt on error
      toast({
        title: "Error Generating Prompt",
        description: errorMessage,
        variant: "destructive",
      });
      if (errorMessage.includes("SERVER_CONFIG_ERROR") || errorMessage.includes("GCP_AUTHENTICATION_FAILURE") || errorMessage.includes("SERVER_ERROR")) {
        console.error("A critical server or security configuration error occurred:", errorMessage);
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
          if (generatedPrompt) { // Only show toast if there's something to "regenerate" from
             toast({ title: "Regenerate Option", description: "To regenerate, adjust your idea or parameters above and click 'Generate Prompt' again."});
          }
        }}
      />
    </div>
  );
};

export default PromptWorkspace;
