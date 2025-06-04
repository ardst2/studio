
// src/components/ui/loader.tsx
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'page' | 'modal' | 'inline'; // 'page' and 'modal' will use different inner circle colors
}

const Loader = ({ className, size = 'md', variant = 'inline' }: LoaderProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6 after:w-4 after:h-4', 
    md: 'w-12 h-12 after:w-10 after:h-10',
    lg: 'w-16 h-16 after:w-14 after:h-14',
  };

  const spinnerBaseClasses = "gradient-spinner";
  
  // Adjust inner circle background based on variant
  // For 'page' or 'inline', use main background. For 'modal', use card background.
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
