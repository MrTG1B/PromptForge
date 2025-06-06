
// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script'; // Import next/script
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import GlobalProviders from '@/components/providers/GlobalProviders';

const siteUrl = 'https://prompt-forge-blond.vercel.app';
const facebookAppId = '1663861460968287'; // Facebook App ID for login
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const ogImageUrl = `${siteUrl}/promptforge-og.png`; // Absolute URL for the OG image

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), // Base URL for resolving relative paths
  title: 'PromptForge',
  description: 'AI-powered prompt generation and refinement tool.',
  icons: {
    icon: '/promptforge-og.png', // Relative path, will be resolved by metadataBase
  },
  openGraph: {
    title: 'PromptForge',
    description: 'AI-powered prompt generation and refinement tool.',
    url: siteUrl, // Absolute URL of the page
    siteName: 'PromptForge',
    images: [
      {
        url: ogImageUrl, // Absolute URL to the image
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
    images: [ // Changed to an array of objects for consistency and robustness
      {
        url: ogImageUrl, // Absolute URL to the image
        alt: 'PromptForge Twitter Image',
      }
    ],
  },
  other: {
    'fb:app_id': facebookAppId, // For Facebook integration
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5029378704821021"
          crossOrigin="anonymous"
          strategy="lazyOnload"
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
                xfbml: false, // Changed to false as we are only using SDK for login
                version: 'v20.0'
              });
              // FB.AppEvents.logPageView(); // Removed earlier
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
        <GlobalProviders recaptchaSiteKey={recaptchaSiteKey!}>
          {children}
        </GlobalProviders>
        <Analytics />
      </body>
    </html>
  );
}
