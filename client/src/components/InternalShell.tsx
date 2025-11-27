import { ReactNode } from "react";

interface InternalShellProps {
  children: ReactNode;
}

export function InternalShell({ children }: InternalShellProps) {
  return (
    <div className="min-h-screen w-full bg-background relative">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 hidden" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
