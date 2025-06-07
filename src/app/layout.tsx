
// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import GlobalProviders from '@/components/providers/GlobalProviders';
import { ThemeProvider } from 'next-themes';

const facebookAppId = '1663861460968287';
const recaptchaSiteKeyFromEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// --- Critical for Social Sharing ---
// 1. NEXT_PUBLIC_SITE_URL: This environment variable MUST be set to your production URL in Vercel/hosting.
//    e.g., NEXT_PUBLIC_SITE_URL=https://your-promptforge-app.com
// 2. Image File: Ensure an image (e.g., 'promptforge-og.png') exists in your 'public' folder.
//    Recommended dimensions: 1200x630px. Keep file size reasonable (e.g., < 300KB for WhatsApp, < 1MB generally).

let resolvedSiteUrl: URL;
const defaultSiteUrlString = 'https://prompt-forge-blond.vercel.app'; // Default fallback

try {
  const siteUrlString = process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrlString;
  resolvedSiteUrl = new URL(siteUrlString);
} catch (e) {
  console.error(
    `CRITICAL_METADATA_ERROR: Invalid NEXT_PUBLIC_SITE_URL ('${process.env.NEXT_PUBLIC_SITE_URL}') or fallback. ` +
    `Using default: ${defaultSiteUrlString}. Error: ${(e as Error).message}`
  );
  resolvedSiteUrl = new URL(defaultSiteUrlString);
}

// IMPORTANT: This path is now relative to the `public` folder root.
// Your image should be at `public/promptforge-og.png`.
const ogImageFileName = 'promptforge-og.png'; 
const ogImageType = 'image/png'; // Change to 'image/jpeg' if it's a JPG

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "WARNING: NEXT_PUBLIC_SITE_URL environment variable is not set. " +
    "Metadata URLs and other features might not work correctly. " +
    "Please set it in your .env.local file for development and in your Vercel project settings for deployment to your production URL."
  );
}

if (!recaptchaSiteKeyFromEnv || recaptchaSiteKeyFromEnv === "your_actual_recaptcha_site_key_here") {
  console.error(
    "SERVER-SIDE CRITICAL WARNING: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not configured or is still the placeholder. " +
    "reCAPTCHA will NOT function. Check .env.local or Vercel deployment settings. " +
    "Current value: '" + recaptchaSiteKeyFromEnv + "'"
  );
}

const absoluteOgImageUrl = new URL(ogImageFileName.startsWith('/') ? ogImageFileName.substring(1) : ogImageFileName, resolvedSiteUrl).toString();


export const metadata: Metadata = {
  metadataBase: resolvedSiteUrl,
  title: 'PromptForge | AI Prompt Engineering Assistant',
  description: 'PromptForge: Your AI-powered workspace to craft, refine, and perfect prompts for any generative AI. Get better results, faster.',
  icons: {
    icon: absoluteOgImageUrl, 
  },
  openGraph: {
    title: 'PromptForge: AI Prompt Engineering Assistant',
    description: 'Craft, refine, and perfect your AI prompts with PromptForge. Unlock the full potential of generative AI tools.',
    url: resolvedSiteUrl.toString(),
    siteName: 'PromptForge',
    images: [
      {
        url: absoluteOgImageUrl,
        secureUrl: absoluteOgImageUrl, 
        type: ogImageType,            
        width: 1200,
        height: 630,
        alt: 'PromptForge - AI Prompt Engineering Tool',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptForge: AI Prompt Engineering Assistant',
    description: 'Craft, refine, and perfect your AI prompts with PromptForge. Unlock the full potential of generative AI tools.',
    images: [ 
      {
        url: absoluteOgImageUrl,
        alt: 'PromptForge Twitter Card Image',
      }
    ],
  },
  other: {
    'fb:app_id': facebookAppId,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const keyToPassToProvider = recaptchaSiteKeyFromEnv || "PLACEHOLDER_SITE_KEY_FROM_LAYOUT";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5029378704821021"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
          id="google-adsense-script"
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning={true}>
        <div id="fb-root"></div>
        <Script id="facebook-sdk-init" strategy="lazyOnload">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId: '${facebookAppId}',
                cookie: true,
                xfbml: false,
                version: 'v20.0'
              });
            };
          `}
        </Script>
        <Script
          async
          defer
          crossOrigin="anonymous"
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="lazyOnload"
          id="facebook-jssdk"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalProviders recaptchaSiteKey={keyToPassToProvider}>
            {children}
          </GlobalProviders>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
