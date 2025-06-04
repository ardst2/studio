// src/components/auth/google-signin-button.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const GoogleSignInButton = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <Button onClick={signInWithGoogle} disabled={loading} variant="outline">
      <LogIn className="mr-2 h-4 w-4" />
      {loading ? 'Signing In...' : 'Sign In with Google'}
    </Button>
  );
};

export default GoogleSignInButton;
