"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  name?: string;
  className?: string;
  hideName?: boolean;
}

const Logo = ({ name = "OmniPost", className, hideName = false }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05" />
          <path d="M12 22.08V12" />
        </svg>
      </div>
      {!hideName && (
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
            {name}
          </span>
          <span className="text-[10px] font-mono font-medium text-primary">.ai</span>
        </div>
      )}
    </div>
  );
};

export default Logo;