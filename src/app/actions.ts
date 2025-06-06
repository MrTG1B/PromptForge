
// src/app/actions.ts
"use server";

import { refinePrompt, type RefinePromptInput, type RefinePromptOutput } from '@/ai/flows/refine-prompt';
import { suggestParameters, type SuggestParametersInput, type SuggestParametersOutput } from '@/ai/flows/suggest-parameters';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_SCORE_THRESHOLD = 0.5;

// Common placeholder patterns for secret keys
const PLACEHOLDER_SECRET_PATTERNS = [
  "your_actual_recaptcha_secret_key_here",
  "YOUR_SECRET_KEY",
  "your_actual_secret_key_from_google",
  // Add any other common placeholders you've used or seen
];

interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string; // Timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
  hostname?: string;     // The hostname of the site where the reCAPTCHA was solved
  "error-codes"?: string[]; // e.g. "missing-input-secret", "invalid-input-secret", "missing-input-response", "invalid-input-response", "bad-request", "timeout-or-duplicate"
}

async function verifyRecaptchaToken(token: string, remoteIp?: string): Promise<boolean> {
  console.log(`Attempting reCAPTCHA verification. Token received (first 10 chars): ${token?.substring(0, 10)}..., Target URL: ${RECAPTCHA_VERIFY_URL}`);

  if (!RECAPTCHA_SECRET_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "DEVELOPMENT MODE: RECAPTCHA_SECRET_KEY environment variable is NOT SET. " +
        "Skipping reCAPTCHA verification. THIS IS UNSAFE FOR PRODUCTION. " +
        "Ensure RECAPTCHA_SECRET_KEY is set in your .env.local file."
      );
      return true;
    } else {
      console.error(
        "PRODUCTION CRITICAL: RECAPTCHA_SECRET_KEY environment variable is NOT SET. " +
        "Verification will fail. Set this environment variable in your Vercel/deployment settings."
      );
      return false;
    }
  }

  if (PLACEHOLDER_SECRET_PATTERNS.some(pattern => RECAPTCHA_SECRET_KEY === pattern)) {
    console.error(
      `CRITICAL CONFIGURATION ERROR: The RECAPTCHA_SECRET_KEY is currently set to a placeholder value: "${RECAPTCHA_SECRET_KEY}". ` +
      "This will cause reCAPTCHA verification to fail. " +
      "Please replace it with your actual secret key from the Google reCAPTCHA admin console in your Vercel/deployment environment variables and redeploy."
    );
    return false;
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

    const resultText = await response.text(); // Read response as text first for robust logging
    let result: RecaptchaVerificationResponse;

    try {
      result = JSON.parse(resultText) as RecaptchaVerificationResponse;
    } catch (e) {
      console.error("reCAPTCHA verification response from Google was not valid JSON. Raw response text:", resultText);
      return false;
    }
    
    console.log("Full reCAPTCHA verification response object from Google:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      // This case might occur for network issues or if Google's endpoint itself has a problem, distinct from reCAPTCHA logic errors.
      console.error(`reCAPTCHA verification request to Google server failed with HTTP status: ${response.status} ${response.statusText}. Response body from Google: ${resultText}`);
      return false;
    }

    if (!result.success) {
      console.warn(
        "reCAPTCHA verification unsuccessful as reported by Google. Details: ",
        `Error codes: ${result["error-codes"]?.join(", ") || "No error codes provided."}. `,
        `Hostname: ${result.hostname || "N/A"}. `,
        `Challenge TS: ${result.challenge_ts || "N/A"}.`
      );
      
      if (result["error-codes"]?.includes("invalid-input-response")) {
        console.warn(
          "Specific ADVICE for 'invalid-input-response': This error often means the reCAPTCHA token ('response' parameter) was malformed, expired, already used, OR that the 'secret' key used for verification is incorrect or doesn't match the site key used on the client. "+
          "CRITICAL: Double-check your RECAPTCHA_SECRET_KEY environment variable in Vercel. It MUST be the secret key corresponding to the site key used on your website."
        );
      }
      if (result["error-codes"]?.includes("missing-input-response")) {
          console.warn("Specific ADVICE for 'missing-input-response': The 'response' parameter (the user's token) was missing. This might indicate an issue with how the token is captured or sent from the client.");
      }
      if (result["error-codes"]?.includes("invalid-input-secret")) {
        console.warn(
          "Specific ADVICE for 'invalid-input-secret': This explicitly means the RECAPTCHA_SECRET_KEY ('secret' parameter) is incorrect. "+
          "Verify it in your Vercel environment variables and ensure it's the correct one associated with your site key."
        );
      }
       if (result["error-codes"]?.includes("missing-input-secret")) {
        console.warn(
          "Specific ADVICE for 'missing-input-secret': The 'secret' parameter was missing. This indicates an issue with the server-side configuration where RECAPTCHA_SECRET_KEY is not being correctly passed to Google's API."
        );
      }
      return false;
    }
    
    // If success is true
    console.log(
      `reCAPTCHA verification successful by Google. Score: ${result.score ?? "N/A"}, Action: ${result.action ?? "N/A"}, Hostname: ${result.hostname ?? "N/A"}, Challenge TS: ${result.challenge_ts ?? "N/A"}`
    );

    if (result.score === undefined) {
        console.warn("reCAPTCHA v3 score not present in a successful-looking response. Treating as failed verification for security reasons.");
        return false;
    }

    if (result.score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn(`reCAPTCHA score ${result.score} is below threshold ${RECAPTCHA_SCORE_THRESHOLD}. (Action: ${result.action}). Verification failed due to low score.`);
      return false;
    }

    console.log(`reCAPTCHA score ${result.score} is sufficient. Verification passed.`);
    return true;
  } catch (error) {
    console.error("Exception occurred during the reCAPTCHA verification fetch request execution:", error);
    return false;
  }
}


export async function handleRefinePromptAction(params: { input: RefinePromptInput, recaptchaToken: string }): Promise<RefinePromptOutput> {
  const { input, recaptchaToken } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken);
  if (!isHuman) {
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
