import React, { useState, useMemo } from "react";
import { 
  Briefcase, Shirt, Crown, Zap, Clock, Flame, Leaf, Scissors,
  Search, Check, Sparkles, Info, X, Filter, Grid3x3, List
} from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// Enhanced style preference configurations
const STYLE_PREFERENCES = [
  {
    value: "Professional",
    icon: Briefcase,
    color: "#3B82F6",
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    description: "Perfect for office and business settings. Clean, polished, and sophisticated.",
    keywords: ["formal", "business", "corporate", "work", "office"],
    examples: ["Classic bob", "Pixie cut", "Shoulder-length layers"]
  },
  {
    value: "Casual",
    icon: Shirt,
    color: "#10B981",
    gradient: "from-green-500 to-green-600",
    bgGradient: "from-green-50 to-green-100",
    description: "Relaxed and comfortable everyday style. Low maintenance and versatile.",
    keywords: ["everyday", "relaxed", "comfortable", "informal", "easy"],
    examples: ["Long waves", "Textured bob", "Layered cut"]
  },
  {
    value: "Elegant",
    icon: Crown,
    color: "#8B5CF6",
    gradient: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
    description: "Sophisticated and refined for special occasions. Timeless and graceful.",
    keywords: ["sophisticated", "refined", "luxury", "formal", "upscale"],
    examples: ["Chignon", "Sleek bob", "Elegant updo"]
  },
  {
    value: "Trendy",
    icon: Zap,
    color: "#F59E0B",
    gradient: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-50 to-amber-100",
    description: "Modern and fashionable current styles. On-trend and Instagram-worthy.",
    keywords: ["modern", "fashionable", "current", "hip", "contemporary"],
    examples: ["Shag cut", "Textured layers", "Face-framing"]
  },
  {
    value: "Classic",
    icon: Clock,
    color: "#6B7280",
    gradient: "from-gray-500 to-gray-600",
    bgGradient: "from-gray-50 to-gray-100",
    description: "Timeless styles that never go out of fashion. Always in style.",
    keywords: ["timeless", "traditional", "vintage", "retro", "evergreen"],
    examples: ["Blunt cut", "Layered bob", "Shoulder-length"]
  },
  {
    value: "Bold",
    icon: Flame,
    color: "#EF4444",
    gradient: "from-red-500 to-red-600",
    bgGradient: "from-red-50 to-red-100",
    description: "Bold and attention-grabbing statement styles. Confident and daring.",
    keywords: ["statement", "daring", "dramatic", "eye-catching", "bold"],
    examples: ["Asymmetric cut", "Undercut", "Fade"]
  },
  {
    value: "Natural",
    icon: Leaf,
    color: "#22C55E",
    gradient: "from-green-400 to-green-500",
    bgGradient: "from-green-50 to-emerald-100",
    description: "Effortless and natural-looking styles. Minimal styling required.",
    keywords: ["effortless", "natural", "organic", "minimal", "easy-care"],
    examples: ["Long layers", "Natural waves", "Beach waves"]
  },
  {
    value: "Edgy",
    icon: Scissors,
    color: "#EC4899",
    gradient: "from-pink-500 to-pink-600",
    bgGradient: "from-pink-50 to-rose-100",
    description: "Cutting-edge and unconventional styles. Unique and artistic.",
    keywords: ["unconventional", "cutting-edge", "alternative", "unique", "artistic"],
    examples: ["Pixie", "Mohawk", "Fade with design"]
  }
];

// Group preferences by category
const PREFERENCE_CATEGORIES = [
  {
    name: "Work & Formal",
    preferences: ["Professional", "Elegant", "Classic"]
  },
  {
    name: "Everyday",
    preferences: ["Casual", "Natural"]
  },
  {
    name: "Fashion Forward",
    preferences: ["Trendy", "Bold", "Edgy"]
  }
];

export function StylePreferencePickerEnhanced({
  selectedPreferences = [],
  onSelectionChange,
  maxSelections = null,
  showSearch = true,
  showCounter = true,
  showCategories = true,
  viewMode = "grid", // grid, list
  className
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredPreference, setHoveredPreference] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [showExamples, setShowExamples] = useState({});

  // Filter preferences based on search and category
  const filteredPreferences = useMemo(() => {
    let filtered = STYLE_PREFERENCES;

    // Filter by category
    if (activeCategory) {
      const category = PREFERENCE_CATEGORIES.find(c => c.name === activeCategory);
      if (category) {
        filtered = filtered.filter(pref => category.preferences.includes(pref.value));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pref =>
        pref.value.toLowerCase().includes(query) ||
        pref.keywords.some(keyword => keyword.includes(query)) ||
        pref.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, activeCategory]);

  const handleToggle = (value) => {
    if (!onSelectionChange) return;

    const isSelected = selectedPreferences.includes(value);
    
    // Check max selections limit
    if (!isSelected && maxSelections && selectedPreferences.length >= maxSelections) {
      return;
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

  const selectCategory = (categoryName) => {
    if (activeCategory === categoryName) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryName);
    }
  };

  const toggleExamples = (prefValue) => {
    setShowExamples(prev => ({
      ...prev,
      [prefValue]: !prev[prefValue]
    }));
  };

  const selectedCount = selectedPreferences.length;
  const canSelectMore = maxSelections === null || selectedCount < maxSelections;

  // Grid view
  if (currentViewMode === "grid") {
    return (
      <div className={cn("w-full space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#160B53] to-purple-600 rounded-lg shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Style Preferences</h3>
              {showCounter && (
                <p className="text-sm text-gray-500">
                  {selectedCount} {selectedCount === 1 ? 'selected' : 'selected'}
                  {maxSelections && ` / ${maxSelections} max`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        {showSearch && (
          <div className="space-y-3">
            <div className="relative">
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            {showCategories && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    !activeCategory
                      ? "bg-[#160B53] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  All Styles
                </button>
                {PREFERENCE_CATEGORIES.map(category => (
                  <button
                    key={category.name}
                    onClick={() => selectCategory(category.name)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      activeCategory === category.name
                        ? "bg-[#160B53] text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preferences Grid */}
        {filteredPreferences.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No styles found matching your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPreferences.map((pref) => {
              const Icon = pref.icon;
              const isSelected = selectedPreferences.includes(pref.value);
              const isDisabled = !canSelectMore && !isSelected;

              return (
                <div
                  key={pref.value}
                  className={cn(
                    "preference-card group relative rounded-xl border-3 overflow-hidden transition-all duration-300",
                    isSelected && "selected preference-ripple"
                  )}
                  onMouseEnter={() => setHoveredPreference(pref.value)}
                  onMouseLeave={() => setHoveredPreference(null)}
                >
                  <Tooltip
                    content={
                      <div className="max-w-xs">
                        <p className="font-semibold mb-1">{pref.value}</p>
                        <p className="text-sm mb-2">{pref.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pref.keywords.slice(0, 3).map(keyword => (
                            <span key={keyword} className="text-xs bg-white/20 px-2 py-0.5 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    }
                    position="top"
                  >
                    <button
                      type="button"
                      onClick={() => !isDisabled && handleToggle(pref.value)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full h-full focus:outline-none focus:ring-4 focus:ring-purple-200 rounded-xl",
                        isSelected
                          ? `bg-gradient-to-br ${pref.bgGradient} border-[#160B53] shadow-xl`
                          : isDisabled
                          ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-300 bg-white hover:border-purple-300"
                      )}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 animate-bounce-in">
                          <div className="bg-[#160B53] rounded-full p-1.5 shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Icon Section */}
                      <div
                        className={cn(
                          "relative h-28 flex items-center justify-center transition-all",
                          isSelected ? `bg-gradient-to-br ${pref.gradient}` : "bg-gray-50 group-hover:bg-gray-100"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-12 h-12 transition-all duration-300",
                            isSelected ? "text-white scale-110" : `group-hover:scale-110`
                          )}
                          style={!isSelected ? { color: pref.color } : {}}
                        />
                        
                        {/* Glow effect on hover */}
                        {hoveredPreference === pref.value && !isSelected && (
                          <div
                            className={cn(
                              "absolute inset-0 bg-gradient-to-br opacity-20 blur-xl",
                              pref.gradient
                            )}
                          />
                        )}
                      </div>

                      {/* Label Section */}
                      <div className="p-3 bg-white">
                        <span
                          className={cn(
                            "text-sm font-semibold block text-center transition-colors",
                            isSelected ? "text-[#160B53]" : "text-gray-700 group-hover:text-purple-600"
                          )}
                        >
                          {pref.value}
                        </span>
                      </div>

                      {/* Examples Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExamples(pref.value);
                        }}
                        className="absolute bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Info className={cn(
                          "w-4 h-4",
                          isSelected ? "text-[#160B53]" : "text-gray-400"
                        )} />
                      </button>
                    </button>
                  </Tooltip>

                  {/* Examples Panel */}
                  {showExamples[pref.value] && (
                    <div className={cn(
                      "absolute inset-x-0 bottom-0 bg-white border-t-2 border-purple-200 p-3 animate-slide-up z-20 rounded-b-xl",
                      `bg-gradient-to-br ${pref.bgGradient}`
                    )}>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Examples:</p>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {pref.examples.map((example, idx) => (
                          <li key={idx}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Preferences Summary */}
        {selectedCount > 0 && (
          <div className="p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-lg border-2 border-purple-200 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Your Selected Styles</span>
              </div>
              <Badge variant="primary" size="sm" className="animate-counter-pulse">
                {selectedCount} {selectedCount === 1 ? 'style' : 'styles'}
              </Badge>
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
                      <pref.icon className="w-3 h-3 mr-1.5" style={{ color: pref.color }} />
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
          <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-start gap-2 animate-slide-up">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Maximum of {maxSelections} selections reached. Remove a preference to select another.
            </p>
          </div>
        )}
      </div>
    );
  }

  // List view (compact)
  return (
    <div className={cn("w-full space-y-3", className)}>
      {filteredPreferences.map((pref) => {
        const Icon = pref.icon;
        const isSelected = selectedPreferences.includes(pref.value);
        
        return (
          <button
            key={pref.value}
            type="button"
            onClick={() => handleToggle(pref.value)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
              "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-200",
              isSelected
                ? `bg-gradient-to-r ${pref.bgGradient} border-[#160B53] shadow-md`
                : "bg-white border-gray-200 hover:border-purple-300"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              isSelected ? `bg-gradient-to-br ${pref.gradient}` : "bg-gray-100"
            )}>
              <Icon
                className={cn(
                  "w-6 h-6",
                  isSelected ? "text-white" : ""
                )}
                style={!isSelected ? { color: pref.color } : {}}
              />
            </div>
            <div className="flex-1 text-left">
              <p className={cn(
                "font-semibold",
                isSelected ? "text-[#160B53]" : "text-gray-900"
              )}>
                {pref.value}
              </p>
              <p className="text-sm text-gray-600">{pref.description}</p>
            </div>
            {isSelected && (
              <div className="bg-[#160B53] rounded-full p-1">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}




