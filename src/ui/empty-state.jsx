import React from "react";
import { Search, Heart, Image, Camera, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

const emptyStateConfigs = {
  noResults: {
    icon: Search,
    title: "No Results Found",
    description: "Try adjusting your preferences or search terms.",
    action: null,
  },
  noFavorites: {
    icon: Heart,
    title: "No Favorites Yet",
    description: "Save your favorite hairstyles to see them here.",
    action: {
      label: "Browse Hairstyles",
      onClick: () => {},
    },
  },
  noImage: {
    icon: Image,
    title: "No Image Available",
    description: "Please capture or upload an image to continue.",
    action: {
      label: "Capture Photo",
      onClick: () => {},
    },
  },
  noCamera: {
    icon: Camera,
    title: "Camera Not Available",
    description: "Please allow camera access or use an image upload.",
    action: {
      label: "Try Again",
      onClick: () => {},
    },
  },
  error: {
    icon: AlertCircle,
    title: "Something Went Wrong",
    description: "We encountered an error. Please try again.",
    action: {
      label: "Retry",
      onClick: () => {},
    },
  },
  empty: {
    icon: null,
    title: "Nothing Here",
    description: "Start by selecting a hairstyle or capturing a photo.",
    action: null,
  },
};

export function EmptyState({
  type = "empty",
  icon: CustomIcon,
  title,
  description,
  action,
  className,
  size = "md", // sm, md, lg
}) {
  const config = emptyStateConfigs[type] || emptyStateConfigs.empty;
  const Icon = CustomIcon || config.icon;

  const sizeClasses = {
    sm: {
      icon: "w-8 h-8",
      title: "text-base",
      description: "text-sm",
    },
    md: {
      icon: "w-12 h-12",
      title: "text-lg",
      description: "text-base",
    },
    lg: {
      icon: "w-16 h-16",
      title: "text-xl",
      description: "text-lg",
    },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayAction = action || config.action;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "text-gray-400 mb-4",
            type === "error" && "text-red-400",
            currentSize.icon
          )}
        >
          <Icon className="w-full h-full" />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-gray-900 mb-2",
          currentSize.title
        )}
      >
        {displayTitle}
      </h3>
      {displayDescription && (
        <p
          className={cn(
            "text-gray-600 mb-6 max-w-md",
            currentSize.description
          )}
        >
          {displayDescription}
        </p>
      )}
      {displayAction && (
        <Button
          onClick={displayAction.onClick}
          variant={type === "error" ? "default" : "outline"}
        >
          {displayAction.label}
        </Button>
      )}
    </div>
  );
}




