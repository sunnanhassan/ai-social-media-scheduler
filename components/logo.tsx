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
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-2xs">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 text-primary-foreground"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
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