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
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "DEVELOPMENT MODE: reCAPTCHA secret key (RECAPTCHA_SECRET_KEY) is not configured in your environment variables. " +
        "Skipping reCAPTCHA verification. THIS IS UNSAFE FOR PRODUCTION. " +
        "Ensure RECAPTCHA_SECRET_KEY is set in your .env.local file for local development."
      );
      return true; // Bypass in development if key is missing
    } else {
      console.error(
        "PRODUCTION MODE: reCAPTCHA secret key (RECAPTCHA_SECRET_KEY) is not configured. " +
        "Verification will fail. Set this environment variable in your deployment settings (e.g., Vercel)."
      );
      return false; // Fail in production if key is missing
    }
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
      const errorBody = await response.text();
      console.error("Error body from reCAPTCHA server:", errorBody);
      return false;
    }

    const result = await response.json() as RecaptchaVerificationResponse;

    if (!result.success) {
      console.warn("reCAPTCHA verification unsuccessful. Error codes:", result["error-codes"]?.join(", ") || "Unknown error from reCAPTCHA service.");
      return false;
    }
    
    if (result.score === undefined) {
        console.warn("reCAPTCHA v3 score not present in response. Treating as failed verification.");
        return false;
    }

    if (result.score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn(`reCAPTCHA score too low: ${result.score} (action: ${result.action}). Verification failed.`);
      return false;
    }

    // console.log(`reCAPTCHA verified successfully. Score: ${result.score}, Action: ${result.action}`);
    return true;
  } catch (error) {
    console.error("Error during reCAPTCHA verification request execution:", error);
    return false;
  }
}


export async function handleRefinePromptAction(params: { input: RefinePromptInput, recaptchaToken: string }): Promise<RefinePromptOutput> {
  const { input, recaptchaToken } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken);
  if (!isHuman) {
    // The error from verifyRecaptchaToken (console.warn/error) will provide more context.
    throw new Error("reCAPTCHA verification failed. Please ensure you're not a robot or try again later.");
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
    // The error from verifyRecaptchaToken (console.warn/error) will provide more context.
    throw new Error("reCAPTCHA verification failed. Please ensure you're not a robot or try again later.");
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
