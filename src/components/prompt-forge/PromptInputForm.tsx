// src/components/prompt-forge/PromptInputForm.tsx
"use client";

import React, { useState, useEffect } from 'react'; // Added useEffect and useState
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, Loader2, Send } from 'lucide-react';
import type { SuggestParametersOutput } from '@/ai/flows/suggest-parameters';

const formSchema = z.object({
  promptIdea: z.string().min(10, "Prompt idea must be at least 10 characters."),
  style: z.string().optional(),
  length: z.string().optional(),
  tone: z.string().optional(),
});

export type PromptFormValues = z.infer<typeof formSchema>;

interface PromptInputFormProps {
  onSubmitPrompt: (data: PromptFormValues) => Promise<void>;
  onSuggestParameters: (promptIdea: string) => Promise<SuggestParametersOutput | null>;
  isLoadingPrompt: boolean;
  isLoadingSuggestions: boolean;
  suggestedParameters?: SuggestParametersOutput | null;
}

const styleOptions = ["Descriptive", "Narrative", "Persuasive", "Technical", "Creative", "Formal", "Informal", "Humorous"];
const lengthOptions = ["Short (1-2 sentences)", "Medium (1 paragraph)", "Long (multiple paragraphs)", "Very Long (essay/article length)"];
const toneOptions = ["Neutral", "Friendly", "Professional", "Humorous", "Assertive", "Empathetic", "Serious", "Sarcastic"];


const PromptInputForm: React.FC<PromptInputFormProps> = ({
  onSubmitPrompt,
  onSuggestParameters,
  isLoadingPrompt,
  isLoadingSuggestions,
}) => {
  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm<PromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptIdea: '',
      style: styleOptions[0],
      length: lengthOptions[1],
      tone: toneOptions[0],
    }
  });

  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []); // Empty dependency array ensures this runs once on mount, client-side

  const handleSuggestParams = async () => {
    const promptIdea = getValues("promptIdea");
    if (!promptIdea || promptIdea.length < 10) {
      // Optionally show a toast or error message
      alert("Please enter a prompt idea (at least 10 characters) to get suggestions.");
      return;
    }
    const suggestions = await onSuggestParameters(promptIdea);
    if (suggestions) {
      setValue("style", suggestions.suggestedStyle || getValues("style"));
      setValue("length", suggestions.suggestedLength || getValues("length"));
      setValue("tone", suggestions.suggestedTone || getValues("tone"));
    }
  };
  

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Craft Your Perfect Prompt</CardTitle>
        <CardDescription>Describe what you need, and let our AI help you forge the ideal prompt.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitPrompt)} className="space-y-6">
          <div>
            <Label htmlFor="promptIdea" className="text-lg font-semibold">Your Prompt Idea</Label>
            <Textarea
              id="promptIdea"
              {...register("promptIdea")}
              placeholder={currentYear ? `e.g., "A blog post about the future of AI in education in ${currentYear}" or "A short story about a friendly robot exploring Mars"` : "Loading example..."}
              className="mt-1 min-h-[120px] text-base"
              aria-invalid={errors.promptIdea ? "true" : "false"}
            />
            {errors.promptIdea && <p className="text-sm text-destructive mt-1">{errors.promptIdea.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="style" className="font-medium">Style</Label>
              <Controller
                name="style"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSuggestParams} 
              disabled={isLoadingSuggestions || isLoadingPrompt}
              className="flex-1 sm:flex-none"
            >
              {isLoadingSuggestions ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Suggest Parameters
            </Button>
            <Button 
              type="submit" 
              disabled={isLoadingPrompt || isLoadingSuggestions} 
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
