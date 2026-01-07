import React, { useState, useMemo } from "react";
import { 
  Briefcase, Shirt, Crown, Zap, Clock, Flame, Leaf, Scissors,
  Search, Check, Sparkles, Info, X
} from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "../ui/tooltip";
import { Badge } from "../ui/badge";

// Style preference configurations with icons, colors, and descriptions
const STYLE_PREFERENCES = [
  {
    value: "Professional",
    icon: Briefcase,
    color: "#3B82F6", // Blue
    gradient: "from-blue-500 to-blue-600",
    description: "Perfect for office and business settings",
    keywords: ["formal", "business", "corporate", "work"]
  },
  {
    value: "Casual",
    icon: Shirt,
    color: "#10B981", // Green
    gradient: "from-green-500 to-green-600",
    description: "Relaxed and comfortable everyday style",
    keywords: ["everyday", "relaxed", "comfortable", "informal"]
  },
  {
    value: "Elegant",
    icon: Crown,
    color: "#8B5CF6", // Purple
    gradient: "from-purple-500 to-purple-600",
    description: "Sophisticated and refined for special occasions",
    keywords: ["sophisticated", "refined", "luxury", "formal"]
  },
  {
    value: "Trendy",
    icon: Zap,
    color: "#F59E0B", // Amber
    gradient: "from-amber-500 to-amber-600",
    description: "Modern and fashionable current styles",
    keywords: ["modern", "fashionable", "current", "hip"]
  },
  {
    value: "Classic",
    icon: Clock,
    color: "#6B7280", // Gray
    gradient: "from-gray-500 to-gray-600",
    description: "Timeless styles that never go out of fashion",
    keywords: ["timeless", "traditional", "vintage", "retro"]
  },
  {
    value: "Bold",
    icon: Flame,
    color: "#EF4444", // Red
    gradient: "from-red-500 to-red-600",
    description: "Bold and attention-grabbing statement styles",
    keywords: ["statement", "daring", "dramatic", "eye-catching"]
  },
  {
    value: "Natural",
    icon: Leaf,
    color: "#22C55E", // Green
    gradient: "from-green-400 to-green-500",
    description: "Effortless and natural-looking styles",
    keywords: ["effortless", "natural", "organic", "minimal"]
  },
  {
    value: "Edgy",
    icon: Scissors,
    color: "#EC4899", // Pink
    gradient: "from-pink-500 to-pink-600",
    description: "Cutting-edge and unconventional styles",
    keywords: ["unconventional", "cutting-edge", "alternative", "unique"]
  }
];

export function StylePreferencePicker({
  selectedPreferences = [],
  onSelectionChange,
  maxSelections = null,
  showSearch = true,
  showCounter = true,
  className
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredPreference, setHoveredPreference] = useState(null);

  // Filter preferences based on search
  const filteredPreferences = useMemo(() => {
    if (!searchQuery.trim()) return STYLE_PREFERENCES;
    
    const query = searchQuery.toLowerCase();
    return STYLE_PREFERENCES.filter(pref =>
      pref.value.toLowerCase().includes(query) ||
      pref.keywords.some(keyword => keyword.includes(query)) ||
      pref.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleToggle = (value) => {
    if (!onSelectionChange) return;

    const isSelected = selectedPreferences.includes(value);
    
    // Check max selections limit
    if (!isSelected && maxSelections && selectedPreferences.length >= maxSelections) {
      return; // Don't allow selection if max reached
    }

    const newSelection = isSelected
      ? selectedPreferences.filter(p => p !== value)
      : [...selectedPreferences, value];

    onSelectionChange(newSelection);
  };

  const clearAll = () => {
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  const selectedCount = selectedPreferences.length;
  const canSelectMore = maxSelections === null || selectedCount < maxSelections;

  return (
    <div className={cn("w-full", className)}>
      {/* Header with Counter and Clear */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#160B53] rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Style Preferences</h3>
            {showCounter && (
              <p className="text-sm text-gray-500">
                {selectedCount} {selectedCount === 1 ? 'preference' : 'preferences'} selected
                {maxSelections && ` (max ${maxSelections})`}
              </p>
            )}
          </div>
        </div>
        {selectedCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all selections"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#160B53] focus:ring-2 focus:ring-purple-200 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Preferences Grid */}
      {filteredPreferences.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No styles found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {filteredPreferences.map((pref) => {
            const Icon = pref.icon;
            const isSelected = selectedPreferences.includes(pref.value);
            const isDisabled = !canSelectMore && !isSelected;

            return (
              <Tooltip
                key={pref.value}
                content={
                  <div className="max-w-xs">
                    <p className="font-semibold mb-1">{pref.value}</p>
                    <p className="text-sm">{pref.description}</p>
                  </div>
                }
                position="top"
              >
                <button
                  type="button"
                  onClick={() => !isDisabled && handleToggle(pref.value)}
                  onMouseEnter={() => setHoveredPreference(pref.value)}
                  onMouseLeave={() => setHoveredPreference(null)}
                  disabled={isDisabled}
                  className={cn(
                    "group relative rounded-xl border-3 transition-all duration-300 overflow-hidden",
                    "focus:outline-none focus:ring-4 focus:ring-purple-200",
                    isSelected
                      ? "border-[#160B53] bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl scale-105 ring-4 ring-purple-200"
                      : isDisabled
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-300 bg-white hover:border-purple-300 hover:shadow-lg hover:scale-105",
                    hoveredPreference === pref.value && !isSelected && "border-purple-400"
                  )}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-[#160B53] rounded-full p-1.5 shadow-lg animate-bounce-in">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay on Hover */}
                  {hoveredPreference === pref.value && !isSelected && (
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-10 transition-opacity",
                        pref.gradient
                      )}
                    />
                  )}

                  {/* Icon Background with Gradient */}
                  <div
                    className={cn(
                      "relative h-24 sm:h-28 flex items-center justify-center transition-all",
                      isSelected ? `bg-gradient-to-br ${pref.gradient}` : "bg-gray-50 group-hover:bg-gray-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 transition-all",
                        isSelected ? "text-white scale-110" : `text-[${pref.color}] group-hover:scale-110`
                      )}
                      style={!isSelected ? { color: pref.color } : {}}
                    />
                  </div>

                  {/* Label */}
                  <div className="p-3 bg-white">
                    <span
                      className={cn(
                        "text-sm sm:text-base font-semibold block text-center transition-colors",
                        isSelected ? "text-[#160B53]" : "text-gray-700 group-hover:text-purple-600"
                      )}
                    >
                      {pref.value}
                    </span>
                  </div>

                  {/* Pulse Effect When Selected */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl border-2 border-purple-400 animate-pulse pointer-events-none" />
                  )}

                  {/* Max Selection Warning */}
                  {isDisabled && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-xl">
                      <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-1 rounded">
                        Max {maxSelections} selections
                      </span>
                    </div>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Selected Preferences Display */}
      {selectedCount > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Selected Styles:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPreferences.map((prefValue) => {
              const pref = STYLE_PREFERENCES.find(p => p.value === prefValue);
              return (
                <Badge
                  key={prefValue}
                  variant="primary"
                  size="md"
                  onRemove={() => handleToggle(prefValue)}
                  className="animate-bounce-in"
                >
                  {pref?.icon && (
                    <pref.icon className="w-3 h-3 mr-1" style={{ color: pref.color }} />
                  )}
                  {prefValue}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Max Selection Warning */}
      {maxSelections && selectedCount >= maxSelections && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            You've reached the maximum of {maxSelections} selections. Remove a preference to select another.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact variant for smaller spaces
export function StylePreferencePickerCompact({
  selectedPreferences = [],
  onSelectionChange,
  className
}) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-wrap gap-2">
        {STYLE_PREFERENCES.map((pref) => {
          const Icon = pref.icon;
          const isSelected = selectedPreferences.includes(pref.value);
          
          return (
            <button
              key={pref.value}
              type="button"
              onClick={() => {
                const newSelection = isSelected
                  ? selectedPreferences.filter(p => p !== pref.value)
                  : [...selectedPreferences, pref.value];
                onSelectionChange(newSelection);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-purple-200",
                isSelected
                  ? "border-[#160B53] bg-purple-50 text-[#160B53] shadow-md"
                  : "border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50"
              )}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: isSelected ? "#160B53" : pref.color }}
              />
              <span className="text-sm font-medium">{pref.value}</span>
              {isSelected && <Check className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}




