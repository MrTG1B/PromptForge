// src/components/prompt-forge/PromptInputForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch'; // Added Switch
import { Loader2, Send } from 'lucide-react';

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
  const { register, handleSubmit, control, formState: { errors } } = useForm<PromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptIdea: '',
      style: styleOptions[0],
      length: lengthOptions[1],
      tone: toneOptions[0],
    }
  });

  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [includeParameters, setIncludeParameters] = useState(true); // State for the toggle

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

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
            <Textarea
              id="promptIdea"
              {...register("promptIdea")}
              placeholder={currentYear ? `e.g., "A blog post about the future of AI in education in ${currentYear}" or "A short story about a friendly robot exploring Mars"` : "Loading example..."}
              className="mt-1 min-h-[120px] text-base"
              aria-invalid={errors.promptIdea ? "true" : "false"}
            />
            {errors.promptIdea && <p className="text-sm text-destructive mt-1">{errors.promptIdea.message}</p>}
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
