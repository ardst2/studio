
// src/components/auth/google-signin-button.tsx
"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GoogleLogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.99C17.77 15.61 17.09 16.75 16.07 17.54V20.13H19.69C21.58 18.45 22.56 15.63 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C14.97 23 17.45 22.04 19.21 20.48L15.99 17.91C15.07 18.59 13.68 19.02 12 19.02C9.38 19.02 7.15 17.3 6.24 14.94H2.84V17.6C4.61 20.87 8.03 23 12 23Z" fill="#34A853"/>
    <path d="M6.24 14.94C5.98 14.21 5.82 13.42 5.82 12.58C5.82 11.74 5.98 10.95 6.24 10.22V7.56H2.84C2.04 9.02 1.5 10.74 1.5 12.58C1.5 14.42 2.04 16.14 2.84 17.6L6.24 14.94Z" fill="#FBBC05"/>
    <path d="M12 6.02C13.32 6.02 14.39 6.48 15.26 7.3L17.96 4.8C16.24 3.21 14.19 2.18 12 2.18C8.03 2.18 4.61 4.31 2.84 7.56L6.24 10.22C7.15 7.86 9.38 6.02 12 6.02Z" fill="#EA4335"/>
  </svg>
);

const GoogleSignInButton = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <Button 
      onClick={signInWithGoogle} 
      disabled={loading} 
      variant="outline" // Using outline variant for a more subtle look
      className={cn(
        "p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out",
        "h-16 w-16 border-border hover:bg-muted/50", // Larger size, circular, subtle background
        loading ? "opacity-70 cursor-not-allowed" : ""
      )}
      aria-label="Sign In with Google"
    >
      <GoogleLogoIcon />
    </Button>
  );
};

export default GoogleSignInButton;


    