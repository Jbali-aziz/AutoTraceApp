
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader className={cn(
        sizeClasses[size],
        "animate-spin text-primary"
      )} />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
