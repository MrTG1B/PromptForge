// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image'; // Added for the logo
import LoginButton from '@/components/auth/LoginButton';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';
// Removed: import { Wand2 } from 'lucide-react'; // Wand2 icon is no longer used

const Header: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center"> {/* Removed space-x-2 as only logo is present */}
          <Image
            src="/promptforge-logo.png"
            alt="PromptForge Logo"
            width={127} // Calculated for a height of 28px based on original aspect ratio
            height={28}
            priority // Advisable for LCP elements like a header logo
          />
          {/* The Wand2 icon and the separate "PromptForge" span have been removed */}
        </Link>
        <div className="flex items-center space-x-4">
          {!loading && (user ? <UserProfile /> : <LoginButton />)}
        </div>
      </div>
    </header>
  );
};

export default Header;
