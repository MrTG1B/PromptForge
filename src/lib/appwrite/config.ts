// src/lib/appwrite/config.ts
import { Client, Storage, Account } from 'appwrite';

const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const appwriteProjectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!appwriteEndpoint || !appwriteProjectId) {
  const message = "CRITICAL_CONFIG_ERROR: Appwrite environment variables (NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID) are not set. " +
  "Appwrite integration will fail. " +
  "Please ensure these are set in your .env.local file for local development and in your Vercel/deployment environment variables. Example:\n" +
  "NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1\n" +
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id";
  console.error(message);
  // You might want to throw an error here or handle it more gracefully
  // For now, we'll let the client potentially be created with undefined values,
  // which will cause errors when used.
}


const client = new Client();

client
  .setEndpoint(appwriteEndpoint || "YOUR_APPWRITE_ENDPOINT_NOT_SET") // Fallback to prevent crash if env var missing
  .setProject(appwriteProjectId || "YOUR_APPWRITE_PROJECT_ID_NOT_SET"); // Fallback

const storage = new Storage(client);
const account = new Account(client); // Might be useful for user-specific buckets or permissions later

export { client, storage, account };

// Ensure you have created an Appwrite project and a Storage Bucket.
// Add the following to your .env.local file:
// NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-instance.example.com/v1 (or https://cloud.appwrite.io/v1 for cloud)
// NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
// NEXT_PUBLIC_APPWRITE_BUCKET_ID=your-profile-pictures-bucket-id (this will be used in the component)
