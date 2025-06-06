
import type { Metadata } from 'next';
import Script from 'next/script'; // Import next/script
import './globals.css';
import { Analytics } from "@vercel/analytics/next";
import GlobalProviders from '@/components/providers/GlobalProviders';


const siteUrl = 'https://prompt-forge-blond.vercel.app';
const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'PromptForge',
  description: 'AI-powered prompt generation and refinement tool.',
  icons: {
    icon: '/promptforge-logo.png',
  },
  openGraph: {
    title: 'PromptForge',
    description: 'AI-powered prompt generation and refinement tool.',
    url: siteUrl,
    siteName: 'PromptForge',
    images: [
      {
        url: '/promptforge-og.png', 
        width: 1200,
        height: 630,
        alt: 'PromptForge Social Sharing Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
    appId: '750845667265576', 
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptForge',
    description: 'AI-powered prompt generation and refinement tool.',
    images: ['/promptforge-og.png'], 
  },
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
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning={true}>
        <div id="fb-root"></div>
        <Script id="facebook-sdk-init" strategy="lazyOnload">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId: '750845667265576',
                cookie: true,
                xfbml: true,
                version: 'v20.0' // Using a recent API version
              });
              FB.AppEvents.logPageView(); // Logs page views automatically
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
