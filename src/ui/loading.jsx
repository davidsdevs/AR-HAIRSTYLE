import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

// Loading Spinner Component
export function LoadingSpinner({ 
  size = "md", 
  className,
  text = null,
  variant = "default" // default, primary, secondary
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const variantClasses = {
    default: "text-gray-600",
    primary: "text-[#160B53]",
    secondary: "text-purple-500",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 
        className={cn(
          "animate-spin",
          sizeClasses[size] || sizeClasses.md,
          variantClasses[variant] || variantClasses.default
        )} 
      />
      {text && (
        <p className={cn(
          "text-sm font-medium",
          variantClasses[variant] || variantClasses.default
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

// Skeleton Loader Component
export function Skeleton({ 
  className,
  variant = "rectangular", // rectangular, circular, text
  width,
  height,
  lines = 1
}) {
  if (variant === "circular") {
    return (
      <div
        className={cn(
          "animate-pulse rounded-full bg-gray-200",
          className
        )}
        style={{
          width: width || "40px",
          height: height || "40px",
        }}
      />
    );
  }

  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "animate-pulse h-4 bg-gray-200 rounded",
              i === lines - 1 && "w-3/4"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
      style={{
        width: width || "100%",
        height: height || "100%",
      }}
    />
  );
}

// Loading Overlay Component
export function LoadingOverlay({ 
  isLoading, 
  text = "Loading...",
  children 
}) {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
        <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" variant="primary" />
          <p className="text-sm font-medium text-gray-700">{text}</p>
        </div>
      </div>
    </div>
  );
}

// Card Skeleton Loader
export function CardSkeleton({ className }) {
  return (
    <div className={cn("bg-white rounded-xl border p-6 shadow-sm", className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width="64px" height="64px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" lines={1} width="60%" />
          <Skeleton variant="text" lines={1} width="40%" />
        </div>
      </div>
      <Skeleton height="200px" className="rounded-lg mb-4" />
      <Skeleton variant="text" lines={2} />
    </div>
  );
}

// Page Loading Component
export function PageLoader({ text = "Loading your experience..." }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <Sparkles className="w-16 h-16 text-[#160B53] animate-pulse mx-auto mb-4" />
          <Loader2 className="w-12 h-12 text-[#160B53] animate-spin absolute top-2 left-1/2 transform -translate-x-1/2" />
        </div>
        <p className="text-lg font-medium text-gray-700 mt-4">{text}</p>
      </div>
    </div>
  );
}




