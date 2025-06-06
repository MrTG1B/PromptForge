// src/components/prompt-forge/PromptWorkspace.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
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

      oscillator.type = 'sine'; // Changed to 'sine' for a purer wave sound
      oscillator.frequency.setValueAtTime(261.63, ctx.currentTime); // C4 note, for a slightly lower, softer pitch
      
      // Envelope for a "wavey" feel and longer duration
      gainNode.gain.setValueAtTime(0, ctx.currentTime); // Start silent
      gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.15); // Quick swell up (attack phase)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5); // Extended decay (release phase)

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.5); // Stop oscillator after 1.5 seconds
    } catch (e) {
      console.error("Error playing sound:", e);
      if (audioContextRef.current && audioContextRef.current.state === 'closed') {
          // Re-initialize if it was closed due to an error, though this is less common for simple playback.
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
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setGeneratedPrompt(null); 
      toast({
        title: "Error Generating Prompt",
        description: errorMessage,
        variant: "destructive",
      });
      if (errorMessage.includes("SERVER_CONFIG_ERROR") || errorMessage.includes("GCP_AUTHENTICATION_FAILURE") || errorMessage.includes("SERVER_ERROR") || errorMessage.includes("SECURITY_SERVICE_INIT_FAILURE")) {
        console.error("A critical server or security configuration error occurred:", errorMessage);
      } else if (errorMessage.includes("GCP_AUTHENTICATION_FAILURE_INIT:")) {
         console.error("A critical server or security configuration error occurred (GCP Auth Init):", errorMessage);
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
