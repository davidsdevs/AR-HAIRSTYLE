import React, { useState } from "react";
import { X, Heart, Download, Share2, ZoomIn, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { Badge, BadgeGroup } from "../ui/badge";
import { BeforeAfterSlider } from "../ui/before-after";
import { Card } from "../ui/card";
import { useFavorites } from "../hooks/useFavorites";

export function ComparisonView({ 
  userImage, 
  hairstyles, 
  onClose,
  onSelectHairstyle 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState("before-after"); // before-after, grid, list
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  if (!hairstyles || hairstyles.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No hairstyles to compare</p>
      </div>
    );
  }

  const currentHairstyle = hairstyles[selectedIndex];
  const generatedImage = currentHairstyle?.generatedImage || null;

  const handleFavorite = () => {
    if (isFavorite(currentHairstyle.id)) {
      removeFavorite(
        favorites.find((f) => f.hairstyle?.id === currentHairstyle.id)?.id
      );
    } else {
      addFavorite(currentHairstyle, userImage, generatedImage);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `${currentHairstyle.name}-preview.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading:", error);
    }
  };

  const handleShare = async () => {
    if (!generatedImage) return;
    try {
      if (navigator.share) {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], "hairstyle.png", { type: blob.type });
        await navigator.share({
          title: `My ${currentHairstyle.name} Hairstyle`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(generatedImage);
        alert("Image link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Compare Hairstyles</h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2 border rounded-lg p-1">
              <button
                onClick={() => setViewMode("before-after")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "before-after"
                    ? "bg-[#160B53] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Before/After
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#160B53] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Grid
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === "before-after" ? (
            <div className="space-y-6">
              {/* Main Before/After View */}
              <div className="mb-6">
                <BeforeAfterSlider
                  beforeImage={userImage}
                  afterImage={generatedImage}
                  beforeLabel="Your Photo"
                  afterLabel={currentHairstyle?.name || "Hairstyle Preview"}
                  className="h-[600px]"
                />
              </div>

              {/* Hairstyle Info */}
              {currentHairstyle && (
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {currentHairstyle.name}
                      </h3>
                      {currentHairstyle.styleTags && (
                        <BadgeGroup>
                          {currentHairstyle.styleTags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </BadgeGroup>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleFavorite}
                        className={isFavorite(currentHairstyle.id) ? "text-red-500" : ""}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFavorite(currentHairstyle.id) ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleDownload}>
                        <Download className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  {currentHairstyle.matchScore && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Match Score</span>
                        <span className="text-sm font-bold text-[#160B53]">
                          {currentHairstyle.matchScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#160B53] h-2 rounded-full transition-all"
                          style={{ width: `${currentHairstyle.matchScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {currentHairstyle.whyRecommendation && (
                    <p className="text-gray-600">{currentHairstyle.whyRecommendation}</p>
                  )}
                </Card>
              )}

              {/* Thumbnail Navigation */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Other Hairstyles
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {hairstyles.map((hairstyle, idx) => (
                    <button
                      key={hairstyle.id || idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                        selectedIndex === idx
                          ? "border-[#160B53] ring-4 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <img
                        src={hairstyle.generatedImage || userImage}
                        alt={hairstyle.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white font-medium text-sm opacity-0 hover:opacity-100 transition-opacity">
                          {hairstyle.name}
                        </span>
                      </div>
                      {selectedIndex === idx && (
                        <div className="absolute top-2 right-2 bg-[#160B53] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hairstyles.map((hairstyle, idx) => (
                <Card
                  key={hairstyle.id || idx}
                  className="overflow-hidden hover-lift cursor-pointer"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setViewMode("before-after");
                  }}
                >
                  <div className="relative">
                    <img
                      src={hairstyle.generatedImage || userImage}
                      alt={hairstyle.name}
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorite(hairstyle.id)) {
                          removeFavorite(
                            favorites.find((f) => f.hairstyle?.id === hairstyle.id)?.id
                          );
                        } else {
                          addFavorite(hairstyle, userImage, hairstyle.generatedImage);
                        }
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite(hairstyle.id) ? "text-red-500 fill-current" : "text-gray-600"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{hairstyle.name}</h3>
                    {hairstyle.matchScore && (
                      <div className="text-sm text-gray-600 mb-2">
                        Match: {hairstyle.matchScore}%
                      </div>
                    )}
                    {hairstyle.styleTags && (
                      <BadgeGroup>
                        {hairstyle.styleTags.slice(0, 3).map((tag, tagIdx) => (
                          <Badge key={tagIdx} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </BadgeGroup>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onSelectHairstyle && (
            <Button
              onClick={() => {
                onSelectHairstyle(currentHairstyle);
                onClose();
              }}
            >
              Select This Style
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}




