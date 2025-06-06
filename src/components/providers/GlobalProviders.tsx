
// src/components/providers/GlobalProviders.tsx
"use client";

import type React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';

interface GlobalProvidersProps {
  children: React.ReactNode;
  recaptchaSiteKey: string;
}

export default function GlobalProviders({ children, recaptchaSiteKey }: GlobalProvidersProps) {
  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey || "NO_RECAPTCHA_KEY_DEFINED"}>
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
