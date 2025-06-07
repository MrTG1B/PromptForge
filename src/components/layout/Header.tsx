// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image'; 
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';
// LoginButton is no longer used here

const Header: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/promptforge-logo.png"
            alt="PromptForge Logo"
            width={127} 
            height={28}
            priority 
          />
        </Link>
        <div className="flex items-center space-x-4">
          {/* Only show UserProfile if user is logged in and not loading */}
          {!loading && user && <UserProfile />}
          {/* LoginButton is removed for logged-out state */}
        </div>
      </div>
    </header>
  );
};

export default Header;
