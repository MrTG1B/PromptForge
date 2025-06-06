
// src/app/actions.ts
"use server";

import { refinePrompt, type RefinePromptInput, type RefinePromptOutput } from '@/ai/flows/refine-prompt';
import { suggestParameters, type SuggestParametersInput, type SuggestParametersOutput } from '@/ai/flows/suggest-parameters';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const RECAPTCHA_SCORE_THRESHOLD = 0.5;

/**
 * Verifies a reCAPTCHA Enterprise token by creating an assessment.
 */
async function verifyRecaptchaToken(token: string, recaptchaAction: string): Promise<boolean> {
  if (!GOOGLE_CLOUD_PROJECT_ID) {
    console.error("CRITICAL_CONFIG_ERROR: GOOGLE_CLOUD_PROJECT_ID environment variable is NOT SET. reCAPTCHA Enterprise verification will fail.");
    throw new Error("SERVER_CONFIG_ERROR: Missing Google Cloud Project ID for reCAPTCHA.");
  }
  if (GOOGLE_CLOUD_PROJECT_ID === "your_google_cloud_project_id_here" || GOOGLE_CLOUD_PROJECT_ID === "promptforge-4jp7t-default-id") {
    console.warn(`Warning_CONFIG: GOOGLE_CLOUD_PROJECT_ID is set to a default/placeholder: "${GOOGLE_CLOUD_PROJECT_ID}". Ensure this is your actual GCP project ID where reCAPTCHA Enterprise is configured.`);
  }
  if (!RECAPTCHA_SITE_KEY) {
    console.error("CRITICAL_CONFIG_ERROR: NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable is NOT SET. reCAPTCHA Enterprise verification will fail.");
    throw new Error("SERVER_CONFIG_ERROR: Missing reCAPTCHA Site Key.");
  }
  if (RECAPTCHA_SITE_KEY === "your_actual_recaptcha_site_key_here" || RECAPTCHA_SITE_KEY === "NO_RECAPTCHA_KEY_LOADED_CHECK_ENV" || RECAPTCHA_SITE_KEY === "PLACEHOLDER_SITE_KEY_FROM_LAYOUT") {
    console.error(`CRITICAL_CONFIG_ERROR: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is a placeholder value: "${RECAPTCHA_SITE_KEY}". reCAPTCHA Enterprise verification will fail.`);
    throw new Error("SERVER_CONFIG_ERROR: Placeholder reCAPTCHA Site Key detected.");
  }

  let client;
  try {
    const clientOptions: { projectId?: string; credentials?: any; keyFilename?: string } = { projectId: GOOGLE_CLOUD_PROJECT_ID };
    const gcpCredsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (gcpCredsEnv) {
      try {
        const parsedCreds = JSON.parse(gcpCredsEnv);
        if (parsedCreds.client_email && parsedCreds.private_key) {
          console.log("Attempting to initialize RecaptchaEnterpriseServiceClient with explicit JSON credentials from GOOGLE_APPLICATION_CREDENTIALS.");
          clientOptions.credentials = {
            client_email: parsedCreds.client_email,
            // Ensure private key newlines are correctly formatted
            private_key: parsedCreds.private_key.replace(/\\n/g, '\n'),
          };
        } else {
          console.log("GOOGLE_APPLICATION_CREDENTIALS was set but not valid JSON with client_email/private_key. Assuming it's a file path for RecaptchaEnterpriseServiceClient.");
          clientOptions.keyFilename = gcpCredsEnv;
        }
      } catch (e) {
        console.log("GOOGLE_APPLICATION_CREDENTIALS was set but could not be parsed as JSON. Assuming it's a file path for RecaptchaEnterpriseServiceClient.");
        clientOptions.keyFilename = gcpCredsEnv;
      }
    } else {
      console.warn("GOOGLE_APPLICATION_CREDENTIALS environment variable is NOT SET. RecaptchaEnterpriseServiceClient will attempt to use Application Default Credentials (ADC).");
    }
    
    client = new RecaptchaEnterpriseServiceClient(clientOptions);

  } catch (e: any) {
    console.error("CRITICAL_SERVICE_CLIENT_ERROR: Failed to create RecaptchaEnterpriseServiceClient. This often indicates a problem with Google Cloud library setup or fundamental environment issues.", e);
    if (e.message && (e.message.includes('Could not load the default credentials') || e.message.includes('ENAMETOOLONG') || e.message.includes('does not exist'))) {
      console.error("FATAL_GCP_AUTH_ERROR_DURING_ASSESSMENT_INIT: Could not load Google Cloud credentials for RecaptchaEnterpriseServiceClient. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly in your Vercel environment (as the JSON key content) and the service account has 'reCAPTCHA Enterprise Agent' permissions. If GOOGLE_APPLICATION_CREDENTIALS is set, verify its content and format. Current error details:", e.message, e.stack);
      throw new Error("GCP_AUTHENTICATION_FAILURE_INIT: Server failed to initialize security services due to credential loading issues.");
    }
    throw new Error("SERVER_ERROR: Could not initialize reCAPTCHA service client.");
  }

  if (!client || typeof client.projectPath !== 'function') {
    console.error("CRITICAL_RUNTIME_ERROR: RecaptchaEnterpriseServiceClient was not initialized correctly. This should not happen if the constructor didn't throw an error.");
    throw new Error("SERVER_ERROR: reCAPTCHA service client is not valid.");
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
        console.warn(`CreateAssessment call for action "${recaptchaAction}" returned no response object.`);
        return false;
    }

    if (!response.tokenProperties) {
        console.warn(`CreateAssessment response for action "${recaptchaAction}" missing tokenProperties. Full response: ${JSON.stringify(response)}`);
        return false;
    }
    
    if (!response.tokenProperties.valid) {
      console.warn(`The CreateAssessment call failed for action "${recaptchaAction}" because the token was: ${response.tokenProperties.invalidReason}. Ensure the site key ${RECAPTCHA_SITE_KEY} is an Enterprise key associated with project ${GOOGLE_CLOUD_PROJECT_ID}. Full response: ${JSON.stringify(response)}`);
      if (response.tokenProperties.invalidReason === 'INVALID_INPUT_RESPONSE') {
        console.warn("Suggestion for INVALID_INPUT_RESPONSE: This often means the token is malformed, expired, already used, or the site key is incorrect or not an Enterprise key for this project, or there's a mismatch between site key and secret key/project config.");
      } else if (response.tokenProperties.invalidReason) {
        console.warn(`Invalid reason details: ${response.tokenProperties.invalidReason}`);
      }
      return false;
    }

    if (response.tokenProperties.action !== recaptchaAction) {
      console.warn(`reCAPTCHA action mismatch for assessment. Expected: "${recaptchaAction}", Got: "${response.tokenProperties.action}". This may indicate a client-side configuration issue or a potential replay attack. Full response: ${JSON.stringify(response)}`);
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
        console.warn(`reCAPTCHA score not present in assessment response for action "${recaptchaAction}". Full response: ${JSON.stringify(response)}`);
        return false;
    }

    if (score < RECAPTCHA_SCORE_THRESHOLD) {
      console.warn(`reCAPTCHA score ${score} for action "${recaptchaAction}" is below threshold ${RECAPTCHA_SCORE_THRESHOLD}. Denying action.`);
      return false;
    }

    console.log(`reCAPTCHA Enterprise verification PASSED for action "${recaptchaAction}" with score ${score}.`);
    return true;

  } catch (error: any) {
    console.error(`Exception during reCAPTCHA Enterprise assessment creation for action "${recaptchaAction}":`, error);
    if (error.message && (error.message.includes('Could not load the default credentials') || e.message.includes('ENAMETOOLONG') || e.message.includes('does not exist'))) {
        console.error(`FATAL_GCP_AUTH_ERROR_DURING_ASSESSMENT: Could not load Google Cloud credentials during assessment for action "${recaptchaAction}". This is a critical GCP authentication issue. Ensure GOOGLE_APPLICATION_CREDENTIALS is correctly set in Vercel. Error: ${error.message}`, error.stack);
        throw new Error(`GCP_AUTHENTICATION_FAILURE: Server failed to authenticate with Google Cloud services for reCAPTCHA for action "${recaptchaAction}".`);
    }
    console.error(`Detailed error during assessment for action "${recaptchaAction}": ${error.message}`, error.stack);
    throw new Error(`SERVER_ERROR: An error occurred during reCAPTCHA assessment for action "${recaptchaAction}".`);
  }
}


async function handleGenericAction<TInput, TOutput>(
  actionName: string,
  params: { input: TInput, recaptchaToken: string, recaptchaAction: string },
  flowFunction: (input: TInput) => Promise<TOutput>
): Promise<TOutput> {
  const { input, recaptchaToken, recaptchaAction } = params;

  let isHuman;
  try {
    isHuman = await verifyRecaptchaToken(recaptchaToken, recaptchaAction);
  } catch (verificationError: any) {
    console.error(`Error during reCAPTCHA verification for ${actionName} (${recaptchaAction}):`, verificationError.message);
    if (verificationError.message && verificationError.message.startsWith('GCP_AUTHENTICATION_FAILURE_INIT:')) {
      throw new Error("A server security configuration error occurred (GCP Auth Init). Please try again later or contact support.");
    } else if (verificationError.message && verificationError.message.startsWith('GCP_AUTHENTICATION_FAILURE:')) {
      throw new Error("A server security configuration error occurred (GCP Auth). Please try again later or contact support.");
    } else if (verificationError.message && verificationError.message.startsWith('SERVER_CONFIG_ERROR:')) {
       throw new Error("A server configuration error occurred with reCAPTCHA. Please contact support.");
    } else if (verificationError.message && verificationError.message.startsWith('SERVER_ERROR:')) {
       throw new Error("An unexpected server error occurred during reCAPTCHA processing. Please contact support.");
    }
    throw new Error("An unexpected error occurred during security verification. Please contact support.");
  }
  
  if (!isHuman) {
    const detailedErrorMsg = `reCAPTCHA verification failed for action "${recaptchaAction}". Please ensure you are not a robot or try again later. Check server logs for specific reasons.`;
    console.warn(`Verification failed for ${actionName}. Action: ${recaptchaAction}. Token used: ${recaptchaToken ? 'present' : 'missing/empty'}`);
    throw new Error(detailedErrorMsg);
  }

  console.log(`reCAPTCHA PASSED for ${actionName}. Proceeding with flow.`);
  try {
    const result = await flowFunction(input);
    return result;
  } catch (error) {
    console.error(`Error in ${actionName} after reCAPTCHA success for action "${recaptchaAction}":`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to ${actionName.toLowerCase().replace(/\s+/g, ' ')}: ${error.message}`);
    }
    throw new Error(`Failed to ${actionName.toLowerCase().replace(/\s+/g, ' ')} due to an unknown error after reCAPTCHA success.`);
  }
}

export async function handleRefinePromptAction(params: { input: RefinePromptInput, recaptchaToken: string, recaptchaAction: string }): Promise<RefinePromptOutput> {
  return handleGenericAction("Refine Prompt", params, refinePrompt);
}

export async function handleSuggestParametersAction(params: { input: SuggestParametersInput, recaptchaToken: string, recaptchaAction: string }): Promise<SuggestParametersOutput> {
  return handleGenericAction("Suggest Parameters", params, suggestParameters);
}

    