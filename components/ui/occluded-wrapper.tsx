"use client";

import * as React from "react";

interface OccludedWrapperProps {
  children: React.ReactNode;
  heightClass: string;
  className?: string;
}

export function OccludedWrapper({ children, heightClass, className = "" }: OccludedWrapperProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasEntered, setHasEntered] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
      setIsVisible(true);
      setHasEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasEntered(true);
        }
      },
      {
        rootMargin: "400px 0px 400px 0px", // Load 400px before entering viewport
      }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, []);

  return (
    <div ref={ref} className={`${heightClass} ${className} relative overflow-hidden`}>
      {isVisible ? (
        <div className={`w-full h-full transition-opacity duration-500 ease-out ${hasEntered ? "opacity-100" : "opacity-0"}`}>
          {children}
        </div>
      ) : (
        <div className="w-full h-full bg-zinc-100/60 animate-pulse rounded-lg border border-zinc-200/40" />
      )}
    </div>
  );
}
