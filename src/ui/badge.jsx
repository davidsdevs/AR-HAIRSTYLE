import React from "react";
import { cn } from "../lib/utils";
import { X } from "lucide-react";

export function Badge({ 
  children, 
  variant = "default", // default, primary, secondary, success, warning, error, outline
  size = "md", // sm, md, lg
  onRemove,
  className,
  ...props
}) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    primary: "bg-[#160B53] text-white hover:bg-[#12094A]",
    secondary: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    success: "bg-green-100 text-green-800 hover:bg-green-200",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    error: "bg-red-100 text-red-800 hover:bg-red-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        variantClasses[variant] || variantClasses.default,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "rounded-full p-0.5 hover:bg-black/10 transition-colors",
            variant === "outline" && "hover:bg-gray-200"
          )}
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

export function BadgeGroup({ children, className, ...props }) {
  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}




