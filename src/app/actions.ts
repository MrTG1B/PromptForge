// src/app/actions.ts
"use server";

import { refinePrompt, type RefinePromptInput, type RefinePromptOutput } from '@/ai/flows/refine-prompt';
import { suggestParameters, type SuggestParametersInput, type SuggestParametersOutput } from '@/ai/flows/suggest-parameters';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_SCORE_THRESHOLD = 0.5; // Adjust as needed

interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

async function verifyRecaptchaToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error("reCAPTCHA secret key not configured. Skipping verification (unsafe for production).");
    // In a real production scenario, you might want to fail hard here or have a stricter policy.
    // For development or if key is missing, we can bypass for now.
    // return false; // Or true if you want to allow in dev without key
    return process.env.NODE_ENV === 'development'; // Allow in dev, fail in prod if key missing
  }

  const formData = new URLSearchParams();
  formData.append('secret', RECAPTCHA_SECRET_KEY);
  formData.append('response', token);
  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error(`reCAPTCHA verification request failed: ${response.statusText}`);
      return false;
    }

    const result = await response.json() as RecaptchaVerificationResponse;

    if (!result.success) {
      console.warn("reCAPTCHA verification unsuccessful:", result["error-codes"]?.join(", ") || "Unknown error");
      return false;
    }
    
    // For reCAPTCHA v3, check the score
    if (result.score === undefined) {
        console.warn("reCAPTCHA v3 score not present in response. Treating as failed verification.");
        return false; // If score is not present, something is wrong
    }

    if (result.score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn(`reCAPTCHA score too low: ${result.score} (action: ${result.action})`);
      return false;
    }

    // console.log(`reCAPTCHA verified successfully. Score: ${result.score}, Action: ${result.action}`);
    return true;
  } catch (error) {
    console.error("Error during reCAPTCHA verification:", error);
    return false;
  }
}


export async function handleRefinePromptAction(params: { input: RefinePromptInput, recaptchaToken: string }): Promise<RefinePromptOutput> {
  const { input, recaptchaToken } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken);
  if (!isHuman) {
    throw new Error("reCAPTCHA verification failed. Please try again.");
  }

  try {
    const result = await refinePrompt(input);
    return result;
  } catch (error) {
    console.error("Error in handleRefinePromptAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to refine prompt: ${error.message}`);
    }
    throw new Error("Failed to refine prompt due to an unknown error.");
  }
}

export async function handleSuggestParametersAction(params: { input: SuggestParametersInput, recaptchaToken: string }): Promise<SuggestParametersOutput> {
  const { input, recaptchaToken } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken);
  if (!isHuman) {
    throw new Error("reCAPTCHA verification failed. Please try again.");
  }

  try {
    const result = await suggestParameters(input);
    return result;
  } catch (error) {
    console.error("Error in handleSuggestParametersAction:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to suggest parameters: ${error.message}`);
    }
    throw new Error("Failed to suggest parameters due to an unknown error.");
  }
}
