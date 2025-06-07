
// src/lib/appwrite/config.ts
import { Client, Storage, Account } from 'appwrite';

const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!appwriteEndpoint || appwriteEndpoint === "YOUR_APPWRITE_ENDPOINT_NOT_SET" || appwriteEndpoint.includes("your-appwrite-instance.example.com")) {
  const message = `CRITICAL_CONFIG_ERROR: NEXT_PUBLIC_APPWRITE_ENDPOINT is not set correctly or is a placeholder. Current value: "${appwriteEndpoint}". Appwrite integration will fail. Please ensure it's set in your .env.local and Vercel environment variables (e.g., https://cloud.appwrite.io/v1).`;
  console.error(message);
}
if (!appwriteProjectId || appwriteProjectId === "YOUR_APPWRITE_PROJECT_ID_NOT_SET" || appwriteProjectId.includes("your-project-id")) {
  const message = `CRITICAL_CONFIG_ERROR: NEXT_PUBLIC_APPWRITE_PROJECT_ID is not set correctly or is a placeholder. Current value: "${appwriteProjectId}". Appwrite integration will fail. Please ensure it's set in your .env.local and Vercel environment variables.`;
  console.error(message);
}


const client = new Client();

client
  .setEndpoint(appwriteEndpoint || "FALLBACK_ENDPOINT_NOT_SET") 
  .setProject(appwriteProjectId || "FALLBACK_PROJECT_ID_NOT_SET"); 

const storage = new Storage(client);
const account = new Account(client); 

export { client, storage, account };

// Ensure you have created an Appwrite project and a Storage Bucket.
// Add the following to your .env.local file:
// NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.example.com/v1 (or https://cloud.appwrite.io/v1 for cloud)
// NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
// NEXT_PUBLIC_APPWRITE_BUCKET_ID=your-profile-pictures-bucket-id (this will be used in the component)

