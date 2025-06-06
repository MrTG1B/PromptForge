
// src/components/prompt-forge/PromptInputForm.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, Mic, MicOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  promptIdea: z.string().min(10, "Prompt idea must be at least 10 characters.").or(z.literal("")),
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
  const { register, handleSubmit, control, formState: { errors }, setValue, watch, getValues } = useForm<PromptFormValues>({
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

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const promptIdeaValue = watch("promptIdea");

  const performSubmit = useCallback((data: PromptFormValues) => {
     if (data.promptIdea.length > 0 && data.promptIdea.length < 10) {
        toast({
            title: "Prompt Too Short",
            description: "Please enter a prompt idea that is at least 10 characters long, or clear the field if you don't want to submit it.",
            variant: "destructive",
        });
        return;
    }
    onSubmitPrompt(data, includeParameters);
  }, [onSubmitPrompt, includeParameters, toast]);


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const instance = new SpeechRecognitionAPI();
        instance.continuous = false;
        instance.interimResults = false;
        instance.lang = 'en-US';
        speechRecognitionRef.current = instance;
        setSpeechApiSupported(true);
      } else {
        setSpeechApiSupported(false);
      }
    } else {
      setSpeechApiSupported(false);
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const currentInstance = speechRecognitionRef.current;
    if (!speechApiSupported || !currentInstance) {
      return;
    }

    const handleSpeechStart = () => {
      setIsListening(true);
      setMicError(null);
    };

    const handleSpeechEnd = () => {
      setIsListening(false);
    };

    const handleSpeechResult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      const currentPromptIdea = getValues('promptIdea');
      const newPromptIdea = currentPromptIdea ? `${currentPromptIdea} ${transcript}` : transcript;
      
      setValue('promptIdea', newPromptIdea, { shouldValidate: true, shouldDirty: true });
    };

    const handleSpeechError = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Audio capture failed. Ensure your microphone is working.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone permission denied. Please enable it in your browser settings.';
        setMicPermissionGranted(false);
      } else if (event.error === 'network') {
        errorMessage = 'Network error during speech recognition. Please check your connection.';
      } else if (event.error === 'aborted') {
        errorMessage = 'Speech recognition was aborted. Please try again.';
      } else if (event.error === 'language-not-supported') {
        errorMessage = 'The language is not supported for speech recognition.';
      } else if (event.error === 'service-not-allowed') {
        errorMessage = 'Speech recognition service is not allowed. This might be a browser or system policy.';
      } else if (event.error === 'bad-grammar') {
        errorMessage = 'There was an issue with the speech recognition grammar.';
      } else {
        errorMessage = `An unknown speech error occurred: ${event.error}`;
      }
      setMicError(errorMessage);
      toast({ title: "Microphone Error", description: errorMessage, variant: "destructive" });
      setIsListening(false);
    };

    currentInstance.onstart = handleSpeechStart;
    currentInstance.onend = handleSpeechEnd;
    currentInstance.onresult = handleSpeechResult;
    currentInstance.onerror = handleSpeechError;

    return () => {
      if (currentInstance) {
        currentInstance.onstart = null;
        currentInstance.onend = null;
        currentInstance.onresult = null;
        currentInstance.onerror = null;
      }
    };
  }, [speechApiSupported, setValue, toast, setIsListening, setMicError, setMicPermissionGranted, getValues]);


  const handleMicClick = async () => {
    if (!speechApiSupported || !speechRecognitionRef.current) {
      setMicError("Speech recognition is not supported by your browser.");
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      return;
    }

    if (micPermissionGranted === false) {
      setMicError("Microphone permission was denied. Please enable it in your browser settings.");
      return;
    }
    
    try {
      if (micPermissionGranted === null) {
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
            // If 'prompt', we let the browser ask. If it was 'granted' or 'denied' already, we've handled it.
        }
      }
      // Proceed to start listening if permission is granted or still prompt (browser will ask)
      if (micPermissionGranted !== false) {
        speechRecognitionRef.current.start();
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || (error.message && error.message.includes('Permission denied'))) {
        setMicPermissionGranted(false);
        setMicError("Microphone permission denied. Please enable it in your browser settings.");
        toast({ title: "Permission Denied", description: "Microphone access is required.", variant: "destructive" });
      } else {
        setMicError(`Could not start voice input: ${error.message || 'Please try again.'}`);
        toast({ title: "Mic Error", description: `Could not start voice input: ${error.message || 'Please try again.'}`, variant: "destructive" });
      }
      setIsListening(false);
    }
  };

  const onManualFormSubmit: SubmitHandler<PromptFormValues> = (data) => {
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop(); 
    }
    performSubmit(data); 
  };

  const handleClearPromptIdea = () => {
    setValue('promptIdea', '', { shouldValidate: true, shouldDirty: true });
  };
  

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Craft Your Perfect Prompt</CardTitle>
        <CardDescription>Describe what you need, and let our AI help you forge the ideal prompt.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onManualFormSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="promptIdea" className="text-lg font-semibold">Your Prompt Idea</Label>
            <div className="mt-1 flex items-start gap-2">
              <Textarea
                id="promptIdea"
                {...register("promptIdea")}
                placeholder={currentYear ? `e.g., "A blog post about the future of AI in education in ${currentYear}" or "A short story about a friendly robot exploring Mars"` : "Loading example..."}
                className="min-h-[120px] text-base flex-grow"
                aria-invalid={errors.promptIdea ? "true" : "false"}
              />
              <div className="flex flex-col space-y-2">
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
                {promptIdeaValue && promptIdeaValue.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleClearPromptIdea}
                    disabled={isLoadingPrompt}
                    title="Clear prompt idea"
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Clear prompt idea</span>
                  </Button>
                )}
              </div>
            </div>
            {errors.promptIdea && errors.promptIdea.message && <p className="text-sm text-destructive mt-1">{errors.promptIdea.message}</p>}
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
    

    
