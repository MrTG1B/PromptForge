
// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script'; // Import next/script
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import GlobalProviders from '@/components/providers/GlobalProviders';
import { ThemeProvider } from 'next-themes'; // Added ThemeProvider

const siteUrl = 'https://prompt-forge-blond.vercel.app';
const facebookAppId = '1663861460968287'; // This is used for FB.init
const recaptchaSiteKeyFromEnv = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const ogImageUrl = `${siteUrl}/promptforge-og.png`;

// More robust check for the reCAPTCHA site key
if (!recaptchaSiteKeyFromEnv || recaptchaSiteKeyFromEnv === "your_actual_recaptcha_site_key_here") {
  console.error(
    "SERVER-SIDE CRITICAL WARNING: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not configured or is still the placeholder value 'your_actual_recaptcha_site_key_here'. " +
    "reCAPTCHA will NOT function. " +
    "1. For local development: Ensure this key is set in your .env.local file (e.g., NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_real_site_key) AND RESTART your dev server. " +
    "2. For Vercel/deployment: Ensure this environment variable is set in your Vercel project's settings and a new deployment is triggered. " +
    "The current value read from environment is: '" + recaptchaSiteKeyFromEnv + "'"
  );
}


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'PromptForge',
  description: 'AI-powered prompt generation and refinement tool.',
  icons: {
    icon: '/promptforge-og.png', // Relative path
  },
  openGraph: {
    title: 'PromptForge',
    description: 'AI-powered prompt generation and refinement tool.',
    url: siteUrl,
    siteName: 'PromptForge',
    images: [
      {
        url: ogImageUrl, // Absolute URL
        width: 1200,
        height: 630,
        alt: 'PromptForge Social Sharing Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptForge',
    description: 'AI-powered prompt generation and refinement tool.',
    images: [
      {
        url: ogImageUrl, // Absolute URL
        alt: 'PromptForge Twitter Image',
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
  // Pass the key from environment, or a specific string if it's undefined/empty
  const keyToPassToProvider = recaptchaSiteKeyFromEnv || "PLACEHOLDER_SITE_KEY_FROM_LAYOUT";

  return (
    <html lang="en" suppressHydrationWarning> {/* Added suppressHydrationWarning for next-themes */}
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
