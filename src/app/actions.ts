// src/app/actions.ts
"use server";

import { refinePrompt, type RefinePromptInput, type RefinePromptOutput } from '@/ai/flows/refine-prompt';
import { suggestParameters, type SuggestParametersInput, type SuggestParametersOutput } from '@/ai/flows/suggest-parameters';

export async function handleRefinePromptAction(input: RefinePromptInput): Promise<RefinePromptOutput> {
  try {
    const result = await refinePrompt(input);
    return result;
  } catch (error) {
    console.error("Error in handleRefinePromptAction:", error);
    throw new Error("Failed to refine prompt.");
  }
}

export async function handleSuggestParametersAction(input: SuggestParametersInput): Promise<SuggestParametersOutput> {
  try {
    const result = await suggestParameters(input);
    return result;
  } catch (error) {
    console.error("Error in handleSuggestParametersAction:", error);
    throw new Error("Failed to suggest parameters.");
  }
}
