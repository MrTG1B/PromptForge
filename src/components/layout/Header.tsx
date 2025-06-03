// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import LoginButton from '@/components/auth/LoginButton';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { Wand2 } from 'lucide-react';

const Header: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Wand2 className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">PromptForge</span>
        </Link>
        <div className="flex items-center space-x-4">
          {!loading && (user ? <UserProfile /> : <LoginButton />)}
        </div>
      </div>
    </header>
  );
};

export default Header;
