"use client";

import * as React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoadingLottieProps {
  className?: string;
  size?: number;
  label?: string;
}

export function LoadingLottie({ className = "", size = 120, label }: LoadingLottieProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div style={{ width: size, height: size }} className="flex items-center justify-center">
        <DotLottieReact
          src="/animations/loading.json"
          loop
          autoplay
        />
      </div>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground animate-pulse mt-2">
          {label}
        </span>
      )}
    </div>
  );
}
