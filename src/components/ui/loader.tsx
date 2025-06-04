// src/components/ui/loader.tsx
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'page' | 'modal' | 'inline';
}

const Loader = ({ className, size = 'md', variant = 'inline' }: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 after:w-4 after:h-4', // spinner width 24px, inner circle 16px, ring (24-16)/2 = 4px thick
    md: 'w-12 h-12 after:w-10 after:h-10', // spinner width 48px, inner circle 40px, ring (48-40)/2 = 4px thick
    lg: 'w-16 h-16 after:w-14 after:h-14', // spinner width 64px, inner circle 56px, ring (64-56)/2 = 4px thick
  };

  const spinnerBaseClasses = "gradient-spinner";
  
  // Adjust inner circle background based on variant
  const afterBgClass = variant === 'modal' ? 'after:bg-card' : 'after:bg-background';

  return (
    <div className={cn(
      spinnerBaseClasses,
      sizeClasses[size],
      afterBgClass,
      className
    )} role="status" aria-label="Loading...">
    </div>
  );
};

export default Loader;
