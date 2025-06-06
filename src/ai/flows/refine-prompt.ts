
// src/ai/flows/refine-prompt.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for refining a basic prompt idea into a more effective and detailed prompt.
 *
 * - refinePrompt - A function that takes a basic prompt idea and refines it using AI.
 * - RefinePromptInput - The input type for the refinePrompt function.
 * - RefinePromptOutput - The output type for the refinePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefinePromptInputSchema = z.object({
  promptIdea: z.string().describe('The basic prompt idea to be refined.'),
  style: z.string().optional().describe('The desired style of the content to be generated by another AI using the refined prompt.'),
  length: z.string().optional().describe('The desired length of the content to be generated by another AI using the refined prompt.'),
  tone: z.string().optional().describe('The desired tone of the content to be generated by another AI using the refined prompt.'),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinePromptOutputSchema = z.object({
  refinedPrompt: z.string().describe('The refined prompt, designed to be used with another generative AI model.'),
});
export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

export async function refinePrompt(input: RefinePromptInput): Promise<RefinePromptOutput> {
  return refinePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refinePromptPrompt',
  input: {schema: RefinePromptInputSchema},
  output: {schema: RefinePromptOutputSchema},
  prompt: `You are an expert AI Prompt Engineer. Your primary role is to help users craft highly effective prompts for other generative AI models (e.g., large language models, image generators).
You do NOT generate the final content described in the prompt. Instead, you generate the INSTRUCTIONS (the prompt itself) that a user will give to another AI.

The user's basic idea for a prompt is:
{{{promptIdea}}}

{{#if style}}
The user has specified the following parameters for the *final content* that the *other AI* should produce. You MUST craft your refined prompt to clearly guide that other AI to generate content with these characteristics:
Desired style for the AI's output: {{{style}}}
Desired length for the AI's output: {{{length}}}
Desired tone for the AI's output: {{{tone}}}
Ensure your refined prompt clearly instructs the other AI on how to achieve these. For example, if the user wants a 'Movie Script', your refined prompt should be a set of instructions for an AI to write a movie script.
{{else}}
The user has not specified particular parameters for style, length, or tone. Generate a generally effective and detailed prompt based on the core idea, suitable for instructing a general-purpose generative AI model.
{{/if}}

Your output should ONLY be the refined prompt text. Do not include any conversational preamble or explanation beyond the prompt itself.

Refined Prompt:`,
});

const refinePromptFlow = ai.defineFlow(
  {
    name: 'refinePromptFlow',
    inputSchema: RefinePromptInputSchema,
    outputSchema: RefinePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

