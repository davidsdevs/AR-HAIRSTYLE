import React from "react";
import { cn } from "../lib/utils";
import { CheckCircle2 } from "lucide-react";

export function ProgressBar({ 
  value, 
  max = 100, 
  className,
  showLabel = false,
  variant = "default" // default, success, warning, error
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variantClasses = {
    default: "bg-[#160B53]",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant] || variantClasses.default
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function StepIndicator({ 
  steps, 
  currentStep, 
  className,
  orientation = "horizontal" // horizontal, vertical
}) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-center justify-between" : "flex-col gap-4",
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const stepNumber = index + 1;

        return (
          <div
            key={index}
            className={cn(
              "flex items-center",
              orientation === "horizontal" ? "flex-col" : "flex-row"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full border-2 transition-all",
                isCompleted
                  ? "bg-green-500 border-green-500 text-white"
                  : isActive
                  ? "bg-[#160B53] border-[#160B53] text-white scale-110"
                  : "bg-white border-gray-300 text-gray-400",
                orientation === "horizontal" ? "w-10 h-10 mb-2" : "w-10 h-10 mr-3"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <span className="text-sm font-bold">{stepNumber}</span>
              )}
            </div>
            {step.label && (
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive || isCompleted
                    ? "text-[#160B53] font-semibold"
                    : "text-gray-400",
                  orientation === "horizontal" ? "text-center" : ""
                )}
              >
                {step.label}
              </span>
            )}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "transition-colors",
                  isCompleted
                    ? "bg-green-500"
                    : "bg-gray-300",
                  orientation === "horizontal"
                    ? "w-12 h-0.5 mx-2 mb-6"
                    : "h-12 w-0.5 mx-3"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 100,
  strokeWidth = 8,
  className,
  showLabel = true
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[#160B53] transition-all duration-300 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[#160B53]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}




