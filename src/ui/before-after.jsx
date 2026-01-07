import React, { useState, useRef, useEffect } from "react";
import { GripVertical, Maximize2, Download, Share2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export function BeforeAfterSlider({ 
  beforeImage, 
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
  showControls = true
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleDownload = async () => {
    if (!afterImage) return;
    
    try {
      const link = document.createElement("a");
      link.href = afterImage;
      link.download = "hairstyle-preview.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  const handleShare = async () => {
    if (!afterImage) return;
    
    try {
      if (navigator.share) {
        const response = await fetch(afterImage);
        const blob = await response.blob();
        const file = new File([blob], "hairstyle-preview.png", { type: blob.type });
        
        await navigator.share({
          title: "My New Hairstyle",
          text: "Check out my new hairstyle!",
          files: [file],
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(afterImage);
        alert("Image link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (!beforeImage || !afterImage) {
    return (
      <div className={cn("bg-gray-100 rounded-lg flex items-center justify-center h-64", className)}>
        <p className="text-gray-500">Images loading...</p>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden shadow-xl", className)}>
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-col-resize"
        onMouseMove={handleMouseMove}
      >
        {/* Before Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Foreground, clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm font-medium">
            {afterLabel}
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
            <GripVertical className="w-6 h-6 text-gray-600" />
          </div>
        </div>

        {/* Slider Track */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
          style={{ left: `${sliderPosition}%` }}
        />
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/60 rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSliderPosition(0)}
            className="text-white hover:bg-white/20"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSliderPosition(50)}
            className="text-white hover:bg-white/20"
          >
            50%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSliderPosition(100)}
            className="text-white hover:bg-white/20"
          >
            <Maximize2 className="w-4 h-4 rotate-180" />
          </Button>
          <div className="w-px bg-white/30 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white hover:bg-white/20"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}




