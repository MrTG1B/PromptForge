// src/components/auth/LoginButton.tsx
"use client";

import { signInWithGoogle } from '@/lib/firebase/auth'; // Placeholder
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const LoginButton: React.FC = () => {
  const { user } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // User state will be updated by AuthProvider
    } catch (error) {
      console.error("Login failed:", error);
      // Handle login error (e.g., show a toast)
    }
  };

  if (user) {
    return null; // Don't show login button if user is logged in
  }

  return (
    <Button onClick={handleLogin} variant="outline" className="border-accent hover:bg-accent/10">
      <LogIn className="mr-2 h-4 w-4" />
      Login with Google
    </Button>
  );
};

export default LoginButton;
