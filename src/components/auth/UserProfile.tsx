
// src/components/auth/UserProfile.tsx
"use client";

import Link from 'next/link';
import { signOut } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCircle2, ShieldCheck, FileText, Lightbulb, Info } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // User state will be updated by AuthProvider
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle logout error
    }
  };

  if (!user) {
    return null;
  }

  const getInitials = (name: string | null | undefined): string | null => {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return null;
    }
    const names = trimmedName.split(' ');
    if (names.length === 1 && names[0]) {
      return names[0].charAt(0).toUpperCase();
    }
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return null;
  };

  const initials = getInitials(user.displayName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback>
              {initials || <UserCircle2 className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/update-profile"> {/* Changed from /complete-profile */}
            <UserCircle2 className="mr-2 h-4 w-4" />
            Update Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/learn-prompts">
            <Lightbulb className="mr-2 h-4 w-4" />
            Learn Prompts
          </Link>
        </DropdownMenuItem>
         <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/about">
            <Info className="mr-2 h-4 w-4" />
            About Us
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/privacy-policy">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Privacy Policy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/terms-and-conditions">
            <FileText className="mr-2 h-4 w-4" />
            Terms & Conditions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
