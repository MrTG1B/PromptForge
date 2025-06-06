
// src/app/actions.ts
"use server";

import { refinePrompt, type RefinePromptInput, type RefinePromptOutput } from '@/ai/flows/refine-prompt';
import { suggestParameters, type SuggestParametersInput, type SuggestParametersOutput } from '@/ai/flows/suggest-parameters';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY; // This is the reCAPTCHA v3 site key
const RECAPTCHA_SCORE_THRESHOLD = 0.5;


/**
  * Create an assessment to analyse the risk of a UI action using reCAPTCHA Enterprise.
  *
  * projectID: Your Google Cloud project ID.
  * recaptchaSiteKey: The reCAPTCHA key associated with the site/app
  * token: The generated token obtained from the client.
  * recaptchaAction: Action name corresponding to the token.
  */
async function verifyRecaptchaToken(token: string, recaptchaAction: string): Promise<boolean> {
  if (!GOOGLE_CLOUD_PROJECT_ID) {
    console.error("CRITICAL: GOOGLE_CLOUD_PROJECT_ID environment variable is NOT SET. reCAPTCHA Enterprise verification will fail.");
    return false;
  }
  if (!RECAPTCHA_SITE_KEY) {
    console.error("CRITICAL: NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable is NOT SET. reCAPTCHA Enterprise verification will fail.");
    return false;
  }
   if (RECAPTCHA_SITE_KEY === "your_actual_recaptcha_site_key_here" || RECAPTCHA_SITE_KEY === "NO_RECAPTCHA_KEY_LOADED_CHECK_ENV" || RECAPTCHA_SITE_KEY === "PLACEHOLDER_SITE_KEY_FROM_LAYOUT") {
    console.error(`CRITICAL: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is a placeholder value: "${RECAPTCHA_SITE_KEY}". reCAPTCHA Enterprise verification will fail.`);
    return false;
  }
   if (GOOGLE_CLOUD_PROJECT_ID === "promptforge-4jp7t" && process.env.NODE_ENV !== "development") {
     // A check to ensure the default project ID is not used in production without explicit confirmation or if it's a generic placeholder.
     // You might want to adjust this check based on your actual project ID or remove it if 'promptforge-4jp7t' is indeed your production GCP project ID.
     // console.warn("Warning: GOOGLE_CLOUD_PROJECT_ID is set to the default 'promptforge-4jp7t'. Ensure this is correct for your environment.");
   }


  // Create the reCAPTCHA client.
  // TODO: Cache the client generation code (recommended) or call client.close() before exiting the method.
  // For Vercel, client instantiation per request is common due to the serverless nature.
  let client;
  try {
    client = new RecaptchaEnterpriseServiceClient();
  } catch (e) {
    console.error("Failed to create RecaptchaEnterpriseServiceClient:", e);
    return false;
  }
  
  const projectPath = client.projectPath(GOOGLE_CLOUD_PROJECT_ID);

  // Build the assessment request.
  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: RECAPTCHA_SITE_KEY,
        // userAgent: // Optional: Add user agent if available
        // userIpAddress: // Optional: Add user IP if available and privacy compliant
      },
      // Optional: Set WAF (Web Application Firewall) token if applicable.
      // wafToken: "YOUR_WAF_TOKEN", // Example placeholder
    },
    parent: projectPath,
  };

  console.log(`Creating reCAPTCHA assessment for action: ${recaptchaAction} with site key (first 5): ${RECAPTCHA_SITE_KEY.substring(0,5)}... in project: ${GOOGLE_CLOUD_PROJECT_ID}`);

  try {
    const [ response ] = await client.createAssessment(request);

    if (!response) {
        console.warn("CreateAssessment call returned no response.");
        return false;
    }

    if (!response.tokenProperties) {
        console.warn("CreateAssessment response missing tokenProperties.");
        return false;
    }
    
    // Check if the token is valid.
    if (!response.tokenProperties.valid) {
      console.warn(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
      return false;
    }

    // Check if the expected action was executed.
    if (response.tokenProperties.action !== recaptchaAction) {
      console.warn(`reCAPTCHA action mismatch. Expected: "${recaptchaAction}", Got: "${response.tokenProperties.action}"`);
      return false;
    }
    
    if (!response.riskAnalysis) {
        console.warn("CreateAssessment response missing riskAnalysis.");
        // Depending on strictness, you might treat this as a failure.
        // For now, let's be cautious and fail.
        return false;
    }

    const score = response.riskAnalysis.score;
    console.log(`reCAPTCHA Enterprise score for action "${recaptchaAction}": ${score}`);
    response.riskAnalysis.reasons.forEach((reason) => {
      console.log(`Risk reason: ${reason}`);
    });

    if (score === undefined || score === null) {
        console.warn("reCAPTCHA score not present in assessment response.");
        return false;
    }

    if (score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn(`reCAPTCHA score ${score} is below threshold ${RECAPTCHA_SCORE_THRESHOLD} for action "${recaptchaAction}".`);
      return false;
    }

    console.log(`reCAPTCHA Enterprise verification passed for action "${recaptchaAction}" with score ${score}.`);
    return true;

  } catch (error) {
    console.error("Exception during reCAPTCHA Enterprise assessment creation:", error);
    return false;
  } finally {
    // client.close(); // Consider if client should be closed here or cached.
    // In serverless, often not closed to be reused if container is warm.
  }
}


export async function handleRefinePromptAction(params: { input: RefinePromptInput, recaptchaToken: string, recaptchaAction: string }): Promise<RefinePromptOutput> {
  const { input, recaptchaToken, recaptchaAction } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
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

export async function handleSuggestParametersAction(params: { input: SuggestParametersInput, recaptchaToken: string, recaptchaAction: string }): Promise<SuggestParametersOutput> {
  const { input, recaptchaToken, recaptchaAction } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
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
