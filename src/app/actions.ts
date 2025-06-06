
// src/app/actions.ts
"use server";

import { refinePrompt, type RefinePromptInput, type RefinePromptOutput } from '@/ai/flows/refine-prompt';
import { suggestParameters, type SuggestParametersInput, type SuggestParametersOutput } from '@/ai/flows/suggest-parameters';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const RECAPTCHA_SCORE_THRESHOLD = 0.5;

/**
  * Create an assessment to analyse the risk of a UI action using reCAPTCHA Enterprise.
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
  if (GOOGLE_CLOUD_PROJECT_ID === "promptforge-4jp7t-default-id" || GOOGLE_CLOUD_PROJECT_ID === "your_google_cloud_project_id_here") {
     console.warn(`Warning: GOOGLE_CLOUD_PROJECT_ID is set to a default/placeholder: "${GOOGLE_CLOUD_PROJECT_ID}". Ensure this is your actual GCP project ID where reCAPTCHA Enterprise is configured.`);
   }


  let client;
  try {
    client = new RecaptchaEnterpriseServiceClient();
  } catch (e) {
    console.error("CRITICAL: Failed to create RecaptchaEnterpriseServiceClient. Ensure Google Cloud credentials are set up correctly for the environment (e.g., service account permissions in Vercel, Application Default Credentials locally) and the '@google-cloud/recaptcha-enterprise' package is installed.", e);
    return false;
  }

  if (!client || typeof client.projectPath !== 'function') {
    console.error("CRITICAL: RecaptchaEnterpriseServiceClient was not initialized correctly. This should not happen if the constructor didn't throw an error.");
    return false;
  }
  
  const projectPath = client.projectPath(GOOGLE_CLOUD_PROJECT_ID);

  const request = {
    assessment: {
      event: {
        token: token,
        siteKey: RECAPTCHA_SITE_KEY,
      },
    },
    parent: projectPath,
  };

  console.log(`Creating reCAPTCHA Enterprise assessment for action: "${recaptchaAction}" with site key (first 5): ${RECAPTCHA_SITE_KEY.substring(0,5)}... in project: ${GOOGLE_CLOUD_PROJECT_ID}`);

  try {
    const [ response ] = await client.createAssessment(request);

    if (!response) {
        console.warn(`CreateAssessment call for action "${recaptchaAction}" returned no response.`);
        return false;
    }

    if (!response.tokenProperties) {
        console.warn(`CreateAssessment response for action "${recaptchaAction}" missing tokenProperties. Full response: ${JSON.stringify(response)}`);
        return false;
    }
    
    if (!response.tokenProperties.valid) {
      console.warn(`The CreateAssessment call failed for action "${recaptchaAction}" because the token was: ${response.tokenProperties.invalidReason}. Ensure the site key ${RECAPTCHA_SITE_KEY} is a reCAPTCHA Enterprise key associated with project ${GOOGLE_CLOUD_PROJECT_ID}.`);
      if (response.tokenProperties.invalidReason === 'INVALID_INPUT_RESPONSE') {
        console.warn("Suggestion for INVALID_INPUT_RESPONSE: This often means the token is malformed, expired, already used, or the site key is incorrect or not an Enterprise key for this project.");
      }
      return false;
    }

    if (response.tokenProperties.action !== recaptchaAction) {
      console.warn(`reCAPTCHA action mismatch for assessment. Expected: "${recaptchaAction}", Got: "${response.tokenProperties.action}". This may indicate a client-side configuration issue or a potential replay attack.`);
      return false;
    }
    
    if (!response.riskAnalysis) {
        console.warn(`CreateAssessment response for action "${recaptchaAction}" missing riskAnalysis. Full response: ${JSON.stringify(response)}`);
        return false;
    }

    const score = response.riskAnalysis.score;
    console.log(`reCAPTCHA Enterprise score for action "${recaptchaAction}": ${score}`);
    if (response.riskAnalysis.reasons && response.riskAnalysis.reasons.length > 0) {
        response.riskAnalysis.reasons.forEach((reason) => {
          console.log(`Risk reason for action "${recaptchaAction}": ${reason}`);
        });
    } else {
        console.log(`No specific risk reasons provided for action "${recaptchaAction}" with score ${score}.`);
    }


    if (score === undefined || score === null) {
        console.warn(`reCAPTCHA score not present in assessment response for action "${recaptchaAction}".`);
        return false;
    }

    if (score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn(`reCAPTCHA score ${score} for action "${recaptchaAction}" is below threshold ${RECAPTCHA_SCORE_THRESHOLD}. Denying action.`);
      return false;
    }

    console.log(`reCAPTCHA Enterprise verification PASSED for action "${recaptchaAction}" with score ${score}.`);
    return true;

  } catch (error) {
    console.error(`Exception during reCAPTCHA Enterprise assessment creation for action "${recaptchaAction}":`, error);
    return false;
  }
}


export async function handleRefinePromptAction(params: { input: RefinePromptInput, recaptchaToken: string, recaptchaAction: string }): Promise<RefinePromptOutput> {
  const { input, recaptchaToken, recaptchaAction } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
  if (!isHuman) {
    const detailedErrorMsg = `reCAPTCHA verification failed for action "${recaptchaAction}". Please ensure you are not a robot or try again later. Check server logs for specific reasons (e.g., invalid token, low score, configuration issue).`;
    console.warn(`Verification failed for handleRefinePromptAction. Action: ${recaptchaAction}. Token used: ${recaptchaToken ? 'present' : 'missing/empty'}`);
    throw new Error(detailedErrorMsg);
  }

  try {
    const result = await refinePrompt(input);
    return result;
  } catch (error) {
    console.error("Error in handleRefinePromptAction after reCAPTCHA success:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to refine prompt: ${error.message}`);
    }
    throw new Error("Failed to refine prompt due to an unknown error after reCAPTCHA success.");
  }
}

export async function handleSuggestParametersAction(params: { input: SuggestParametersInput, recaptchaToken: string, recaptchaAction: string }): Promise<SuggestParametersOutput> {
  const { input, recaptchaToken, recaptchaAction } = params;

  const isHuman = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
  if (!isHuman) {
    const detailedErrorMsg = `reCAPTCHA verification failed for action "${recaptchaAction}". Please ensure you are not a robot or try again later. Check server logs for specific reasons (e.g., invalid token, low score, configuration issue).`;
    console.warn(`Verification failed for handleSuggestParametersAction. Action: ${recaptchaAction}. Token used: ${recaptchaToken ? 'present' : 'missing/empty'}`);
    throw new Error(detailedErrorMsg);
  }

  try {
    const result = await suggestParameters(input);
    return result;
  } catch (error) {
    console.error("Error in handleSuggestParametersAction after reCAPTCHA success:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to suggest parameters: ${error.message}`);
    }
    throw new Error("Failed to suggest parameters due to an unknown error after reCAPTCHA success.");
  }
}
