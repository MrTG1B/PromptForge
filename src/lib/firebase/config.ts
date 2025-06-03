// src/lib/firebase/config.ts
// TODO: Replace with your actual Firebase configuration
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the API key is missing or is a placeholder
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your_api_key" || (typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.startsWith("NEXT_PUBLIC_"))) {
  const message = "ERROR: Firebase API Key is missing or not replaced with an actual value. " +
  "Google Sign-In and other Firebase services will not work. " +
  "For local development, please create a '.env.local' file in the root of your project. " +
  "For deployment, ensure Firebase environment variables are correctly set in your hosting provider's settings (e.g., Vercel, Firebase App Hosting). " +
  "Add your Firebase project's web app configuration. " +
  "You can find these details in your Firebase project settings: " +
  "Project settings > General > Your apps > (select your web app) > SDK setup and configuration. " +
  "Ensure the .env.local file (for local development) or your deployment environment variables have entries like:\n" +
  "NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYOUR_API_KEY\n" +
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com\n" +
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id\n" +
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com\n" +
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id\n" +
  "NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id\n" +
  "After adding/updating these, restart your local development server or trigger a new deployment.";
  console.error(message);
  
  if (typeof window !== 'undefined') {
    // alert(message); // Optionally alert in browser for local dev issues
  }
}


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);

export { app, auth };

// Ensure you have the following environment variables in a .env.local file (for local development)
// AND correctly set in your deployment environment (e.g., Vercel project settings):
// NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
