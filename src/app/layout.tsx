
// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import GlobalProviders from '@/components/providers/GlobalProviders';
import { ThemeProvider } from 'next-themes';

const facebookAppId = '1663861460968287';
const recaptchaSiteKeyFromEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

let resolvedSiteUrl: URL;
const defaultSiteUrlString = 'https://prompt-forge-blond.vercel.app';

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

const ogImageRelativePath = '/promptforge-og.png'; // Image directly in public folder
const ogImageType = 'image/png';

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

export const metadata: Metadata = {
  metadataBase: resolvedSiteUrl,
  title: 'PromptForge | AI Prompt Engineering Assistant',
  description: 'PromptForge: Your AI-powered workspace to craft, refine, and perfect prompts for any generative AI. Get better results, faster.',
  alternates: {
    canonical: resolvedSiteUrl.toString(),
  },
  icons: {
    icon: [
      { url: ogImageRelativePath, type: ogImageType, sizes: 'any' }, // General purpose icon
    ],
    shortcut: { url: ogImageRelativePath, type: ogImageType }, // For older browsers
    apple: [
      { url: ogImageRelativePath, type: ogImageType, sizes: '180x180' }, // Common Apple touch icon size
    ],
  },
  openGraph: {
    title: 'PromptForge: AI Prompt Engineering Assistant',
    description: 'Craft, refine, and perfect your AI prompts with PromptForge. Unlock the full potential of generative AI tools.',
    url: resolvedSiteUrl.toString(),
    siteName: 'PromptForge',
    images: [
      {
        url: ogImageRelativePath, // Relative path; Next.js resolves this using metadataBase
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
    images: [ogImageRelativePath], // Relative path; Next.js resolves this
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
        <Script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PromptForge',
              url: resolvedSiteUrl.toString(),
              description: 'PromptForge: Your AI-powered workspace to craft, refine, and perfect prompts for any generative AI.',
            }),
          }}
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
