// src/ai/flows/suggest-parameters.ts
'use server';
/**
 * @fileOverview A flow for suggesting optimal parameters (e.g., style, length, tone) to enhance a user-provided prompt.
 *
 * - suggestParameters - A function that takes a basic prompt as input and returns suggested parameters.
 * - SuggestParametersInput - The input type for the suggestParameters function.
 * - SuggestParametersOutput - The return type for the suggestParameters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestParametersInputSchema = z.object({
  basicPrompt: z.string().describe('The user-provided basic prompt.'),
});
export type SuggestParametersInput = z.infer<typeof SuggestParametersInputSchema>;

const SuggestParametersOutputSchema = z.object({
  suggestedStyle: z.string().describe('Suggested style for the prompt.'),
  suggestedLength: z.string().describe('Suggested length for the prompt (e.g., short, medium, long).'),
  suggestedTone: z.string().describe('Suggested tone for the prompt (e.g., formal, informal, humorous).'),
  reasoning: z.string().describe('The AI reasoning behind the parameter suggestions.'),
});
export type SuggestParametersOutput = z.infer<typeof SuggestParametersOutputSchema>;

export async function suggestParameters(input: SuggestParametersInput): Promise<SuggestParametersOutput> {
  return suggestParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestParametersPrompt',
  input: {schema: SuggestParametersInputSchema},
  output: {schema: SuggestParametersOutputSchema},
  prompt: `Given the following basic prompt, suggest optimal parameters (style, length, tone) to enhance it and tailor it to the desired output.\n\nBasic Prompt: {{{basicPrompt}}}\n\nConsider various styles (e.g., descriptive, narrative, persuasive), lengths (short, medium, long), and tones (formal, informal, humorous, serious).\nExplain the reasoning behind each suggestion.\n\nOutput the suggestions in a structured format with suggestedStyle, suggestedLength, suggestedTone, and reasoning fields.`,
});

const suggestParametersFlow = ai.defineFlow(
  {
    name: 'suggestParametersFlow',
    inputSchema: SuggestParametersInputSchema,
    outputSchema: SuggestParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
