
// src/components/providers/GlobalProviders.tsx
"use client";

import type React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

interface GlobalProvidersProps {
  children: React.ReactNode;
  recaptchaSiteKey: string; // This is the prop passed from layout.tsx
}

const KNOWN_BAD_PLACEHOLDER_LAYOUT = "KEY_WAS_UNDEFINED_IN_LAYOUT";
const KNOWN_BAD_PLACEHOLDER_ENV = "your_actual_recaptcha_site_key_here";
const FALLBACK_KEY_FOR_PROVIDER = "PROVIDER_RECEIVED_INVALID_KEY_CHECK_CONSOLE";

export default function GlobalProviders({ children, recaptchaSiteKey: recaptchaSiteKeyProp }: GlobalProvidersProps) {
  let siteKeyForReCaptchaProvider: string;

  if (recaptchaSiteKeyProp && 
      recaptchaSiteKeyProp !== KNOWN_BAD_PLACEHOLDER_LAYOUT &&
      recaptchaSiteKeyProp !== KNOWN_BAD_PLACEHOLDER_ENV) {
    siteKeyForReCaptchaProvider = recaptchaSiteKeyProp;
  } else {
    siteKeyForReCaptchaProvider = FALLBACK_KEY_FOR_PROVIDER; // This key will cause reCAPTCHA to fail, but prevents a crash
    console.error(
      `CLIENT-SIDE CRITICAL reCAPTCHA ERROR: The reCAPTCHA Site Key received by GlobalProviders is invalid. ` +
      `It was '${recaptchaSiteKeyProp}'. This usually means NEXT_PUBLIC_RECAPTCHA_SITE_KEY was not properly set in your environment variables ` +
      `(.env.local or Vercel/deployment settings) OR it's still a placeholder. ` +
      `reCAPTCHA functionality WILL FAIL. Please verify your configuration. ` +
      `The key being passed to GoogleReCaptchaProvider will be '${FALLBACK_KEY_FOR_PROVIDER}'.`
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKeyForReCaptchaProvider}>
      <AuthProvider>
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </AuthProvider>
    </GoogleReCaptchaProvider>
  );
}
