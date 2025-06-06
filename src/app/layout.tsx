
// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script'; // Import next/script
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import GlobalProviders from '@/components/providers/GlobalProviders';

const siteUrl = 'https://prompt-forge-blond.vercel.app';
const facebookAppId = '1663861460968287';
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const ogImageUrl = `${siteUrl}/promptforge-og.png`;

if (!recaptchaSiteKey || recaptchaSiteKey === "your_actual_recaptcha_site_key_here" || (typeof recaptchaSiteKey === 'string' && recaptchaSiteKey.startsWith("NEXT_PUBLIC_"))) {
  console.error(
    "SERVER-SIDE WARNING: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not configured or is a placeholder. " +
    "reCAPTCHA will not function correctly. " +
    "Please set this environment variable in your .env.local file (e.g., NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_actual_site_key) " +
    "and in your Vercel project's environment variable settings. " +
    "After updating .env.local, restart your development server."
  );
}


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'PromptForge',
  description: 'AI-powered prompt generation and refinement tool.',
  icons: {
    icon: '/promptforge-og.png',
  },
  openGraph: {
    title: 'PromptForge',
    description: 'AI-powered prompt generation and refinement tool.',
    url: siteUrl,
    siteName: 'PromptForge',
    images: [
      {
        url: ogImageUrl,
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
        url: ogImageUrl,
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
        <GlobalProviders recaptchaSiteKey={recaptchaSiteKey || "PLACEHOLDER_SITE_KEY_FROM_LAYOUT"}>
          {children}
        </GlobalProviders>
        <Analytics />
      </body>
    </html>
  );
}
