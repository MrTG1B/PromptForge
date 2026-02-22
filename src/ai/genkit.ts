import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// IMPORTANT: Ensure you have your GEMINI_API_KEY environment variable set.
// You can obtain a key from Google AI Studio (makersuite.google.com)
// and set it in your .env.local file (e.g., GEMINI_API_KEY=your_api_key_here)
// and also in your deployment environment variables.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
