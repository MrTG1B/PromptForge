// src/components/prompt-forge/PromptInputForm.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, Mic, MicOff } from 'lucide-react'; // Added Mic, MicOff
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  promptIdea: z.string().min(10, "Prompt idea must be at least 10 characters."),
  style: z.string().optional(),
  length: z.string().optional(),
  tone: z.string().optional(),
});

export type PromptFormValues = z.infer<typeof formSchema>;

interface PromptInputFormProps {
  onSubmitPrompt: (data: PromptFormValues, includeParameters: boolean) => Promise<void>;
  isLoadingPrompt: boolean;
}

const styleOptions = ["Descriptive", "Narrative", "Persuasive", "Technical", "Creative", "Formal", "Informal", "Humorous"];
const lengthOptions = ["Short (1-2 sentences)", "Medium (1 paragraph)", "Long (multiple paragraphs)", "Very Long (essay/article length)"];
const toneOptions = ["Neutral", "Friendly", "Professional", "Humorous", "Assertive", "Empathetic", "Serious", "Sarcastic"];

const PromptInputForm: React.FC<PromptInputFormProps> = ({
  onSubmitPrompt,
  isLoadingPrompt,
}) => {
  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<PromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptIdea: '',
      style: styleOptions[0],
      length: lengthOptions[1],
      tone: toneOptions[0],
    }
  });

  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [includeParameters, setIncludeParameters] = useState(true);
  const { toast } = useToast();

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [micError, setMicError] = useState<string | null>(null);


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const instance = new SpeechRecognitionAPI();
        instance.continuous = false;
        instance.interimResults = false;
        instance.lang = 'en-US';
        speechRecognitionRef.current = instance;
        setSpeechApiSupported(true);

        instance.onstart = () => {
          setIsListening(true);
          setMicError(null);
        };
        instance.onend = () => {
          setIsListening(false);
        };
        instance.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setValue('promptIdea', transcript);
        };
        instance.onerror = (event) => {
          let errorMessage = 'Speech recognition error.';
          if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'Audio capture failed. Ensure your microphone is working.';
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone permission denied.';
            setMicPermissionGranted(false);
          }
          setMicError(errorMessage);
          toast({ title: "Microphone Error", description: errorMessage, variant: "destructive" });
          setIsListening(false);
        };
      } else {
        setSpeechApiSupported(false);
      }
    } else {
      setSpeechApiSupported(false);
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [setValue, toast]);

  const handleMicClick = async () => {
    if (!speechApiSupported || !speechRecognitionRef.current) {
      setMicError("Speech recognition is not supported by your browser.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    if (micPermissionGranted === false) {
      setMicError("Microphone permission was denied. Please enable it in your browser settings.");
      return;
    }
    
    try {
      // Check/request permission if not explicitly known
      if (micPermissionGranted === null) {
        // Modern browsers require interaction for permission request, but speechRecognition.start() implicitly does this.
        // However, to be more explicit or handle prior denial:
        if (navigator.permissions) {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            if (permissionStatus.state === 'granted') {
                setMicPermissionGranted(true);
            } else if (permissionStatus.state === 'denied') {
                setMicPermissionGranted(false);
                setMicError("Microphone permission was denied. Please enable it in your browser settings.");
                toast({ title: "Permission Denied", description: "Microphone access is required to use voice input.", variant: "destructive" });
                return;
            }
            // If 'prompt', starting recognition will trigger the prompt
        }
      }
      speechRecognitionRef.current.start();
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        setMicPermissionGranted(false);
        setMicError("Microphone permission denied. Please enable it in your browser settings.");
        toast({ title: "Permission Denied", description: "Microphone access is required.", variant: "destructive" });
      } else {
        setMicError("Could not start voice input. Please try again.");
        toast({ title: "Mic Error", description: "Could not start voice input.", variant: "destructive" });
      }
      setIsListening(false);
    }
  };


  const handleFormSubmit: SubmitHandler<PromptFormValues> = (data) => {
    onSubmitPrompt(data, includeParameters);
  };
  

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Craft Your Perfect Prompt</CardTitle>
        <CardDescription>Describe what you need, and let our AI help you forge the ideal prompt.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="promptIdea" className="text-lg font-semibold">Your Prompt Idea</Label>
            <div className="mt-1 flex items-center gap-2">
              <Textarea
                id="promptIdea"
                {...register("promptIdea")}
                placeholder={currentYear ? `e.g., "A blog post about the future of AI in education in ${currentYear}" or "A short story about a friendly robot exploring Mars"` : "Loading example..."}
                className="min-h-[120px] text-base flex-grow"
                aria-invalid={errors.promptIdea ? "true" : "false"}
              />
              {speechApiSupported && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleMicClick}
                  disabled={isLoadingPrompt || (!speechApiSupported)}
                  title={isListening ? "Stop listening" : "Use microphone"}
                  className={isListening ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  <span className="sr-only">{isListening ? "Stop listening" : "Use microphone"}</span>
                </Button>
              )}
            </div>
            {errors.promptIdea && <p className="text-sm text-destructive mt-1">{errors.promptIdea.message}</p>}
            {!speechApiSupported && (
                 <Alert variant="default" className="mt-2">
                    <MicOff className="h-4 w-4" />
                    <AlertTitle>Voice Input Not Supported</AlertTitle>
                    <AlertDescription>Your browser does not support voice input, or it's disabled.</AlertDescription>
                </Alert>
            )}
            {micError && speechApiSupported && (
                <Alert variant="destructive" className="mt-2">
                    <MicOff className="h-4 w-4" />
                    <AlertTitle>Microphone Error</AlertTitle>
                    <AlertDescription>{micError}</AlertDescription>
                </Alert>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="includeParameters"
              checked={includeParameters}
              onCheckedChange={setIncludeParameters}
              disabled={isLoadingPrompt}
            />
            <Label htmlFor="includeParameters" className="font-medium cursor-pointer">
              Refine with Specific Parameters
            </Label>
          </div>

          {includeParameters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="style" className="font-medium">Style</Label>
                <Controller
                  name="style"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingPrompt || !includeParameters}>
                      <SelectTrigger id="style" className="mt-1">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {styleOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="length" className="font-medium">Length</Label>
                 <Controller
                  name="length"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingPrompt || !includeParameters}>
                      <SelectTrigger id="length" className="mt-1">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        {lengthOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="tone" className="font-medium">Tone</Label>
                <Controller
                  name="tone"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingPrompt || !includeParameters}>
                      <SelectTrigger id="tone" className="mt-1">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}


          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button 
              type="submit" 
              disabled={isLoadingPrompt} 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoadingPrompt ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Generate Prompt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PromptInputForm;
