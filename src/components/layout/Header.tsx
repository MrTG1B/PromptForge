
// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image'; 
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';


const Header: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/promptforge-logo.png"
            alt="PromptForge Logo"
            width={127} 
            height={28}
            priority 
          />
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4"> {/* Adjusted space for toggle */}
          <ThemeToggleButton />
          {!loading && user && <UserProfile />}
          {!loading && !user && (
            <Button 
              onClick={handleNavigateToLogin} 
              variant="default"
              size="sm"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
