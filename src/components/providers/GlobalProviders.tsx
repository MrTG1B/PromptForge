
// src/components/providers/GlobalProviders.tsx
"use client";

import type React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'; // Added import
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

interface GlobalProvidersProps {
  children: React.ReactNode;
  recaptchaSiteKey: string; // Expecting a string, even if it's a placeholder
}

export default function GlobalProviders({ children, recaptchaSiteKey }: GlobalProvidersProps) {
  // Use the provided key or the specific placeholder if it's still one of the known bad values
  const siteKeyForProvider = recaptchaSiteKey && 
                             recaptchaSiteKey !== "PLACEHOLDER_SITE_KEY_FROM_LAYOUT" &&
                             recaptchaSiteKey !== "your_actual_recaptcha_site_key_here" &&
                             !recaptchaSiteKey.startsWith("NEXT_PUBLIC_")
                             ? recaptchaSiteKey 
                             : "NO_RECAPTCHA_KEY_LOADED_CHECK_ENV";

  if (siteKeyForProvider === "NO_RECAPTCHA_KEY_LOADED_CHECK_ENV") {
    console.error(
      "CLIENT-SIDE reCAPTCHA ERROR: The reCAPTCHA Site Key is effectively missing or a placeholder ('" + recaptchaSiteKey + "'). " +
      "The GoogleReCaptchaProvider received '" + siteKeyForProvider + "'. " +
      "This means NEXT_PUBLIC_RECAPTCHA_SITE_KEY was not properly set in your environment variables (.env.local or Vercel settings). " +
      "reCAPTCHA functionality will fail. Please verify your configuration and restart your development server if using .env.local."
    );
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKeyForProvider}>
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
