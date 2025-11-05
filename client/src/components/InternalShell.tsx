import { ReactNode } from "react";

interface InternalShellProps {
  children: ReactNode;
}

export function InternalShell({ children }: InternalShellProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 relative">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-pink-400/10 dark:from-blue-600/10 dark:to-pink-600/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
