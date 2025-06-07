
import type {NextConfig} from 'next';

const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
let appwriteHostname = '';
if (appwriteEndpoint) {
  try {
    const url = new URL(appwriteEndpoint);
    appwriteHostname = url.hostname;
  } catch (e) {
    console.error("Warning: Invalid NEXT_PUBLIC_APPWRITE_ENDPOINT URL provided. Appwrite images may not load if a custom domain is used and not configured here. Error:", e);
    // If parsing fails, it might be a malformed URL.
    // For cloud.appwrite.io, the hostname is 'cloud.appwrite.io'
    // For self-hosted, it would be the custom domain.
    // It's safer to leave appwriteHostname empty if parsing fails, or add a specific check for common Appwrite cloud hostnames.
    if (appwriteEndpoint.includes('cloud.appwrite.io')) {
        appwriteHostname = 'cloud.appwrite.io';
    }
  }
}

const remotePatternsConfig = [
  {
    protocol: 'https',
    hostname: 'placehold.co',
    port: '',
    pathname: '/**',
  },
];

if (appwriteHostname) {
  remotePatternsConfig.push({
    protocol: 'https',
    hostname: appwriteHostname,
    port: '',
    pathname: '/**', // Allow all paths under this hostname
  });
  console.log(`INFO: Added Appwrite hostname '${appwriteHostname}' to Next.js image remote patterns.`);
} else if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  // Only log warning if endpoint was set but hostname couldn't be parsed and wasn't cloud
  console.warn(`WARNING: Could not parse hostname from NEXT_PUBLIC_APPWRITE_ENDPOINT ('${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}') for Next.js image optimization. If you use Appwrite for images, they might not load correctly unless this hostname is manually added or the endpoint format is standard.`);
}


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: remotePatternsConfig,
  },
  experimental: {
    allowedDevOrigins: [
      'https://6000-firebase-studio-1748988988578.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev',
      'https://9000-firebase-studio-1748988988578.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev'
    ],
  },
};

export default nextConfig;
