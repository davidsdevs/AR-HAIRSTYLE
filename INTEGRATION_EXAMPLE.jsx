/**
 * INTEGRATION EXAMPLE
 * 
 * This file shows examples of how to integrate the new UI components
 * into your ARHairTryOn.jsx component.
 * 
 * Copy the relevant sections into your main component file.
 */

// ============================================
// 1. WRAP APP WITH TOAST PROVIDER
// ============================================
// In src/App.jsx or src/main.jsx:

import { ToastProvider } from './ui/toast';

function App() {
  return (
    <ToastProvider>
      <ARHairTryOn />
    </ToastProvider>
  );
}

// ============================================
// 2. IMPORT NEW COMPONENTS AND HOOKS
// ============================================
// At the top of ARHairTryOn.jsx:

import { toast } from '../ui/toast';
import { LoadingSpinner, LoadingOverlay, CardSkeleton } from '../ui/loading';
import { BeforeAfterSlider } from '../ui/before-after';
import { ProgressBar, StepIndicator } from '../ui/progress';
import { Modal } from '../ui/modal';
import { Tooltip } from '../ui/tooltip';
import { Badge, BadgeGroup } from '../ui/badge';
import { EmptyState } from '../ui/empty-state';
import { ComparisonView } from '../components/ComparisonView';
import { useFavorites } from '../hooks/useFavorites';

// ============================================
// 3. ADD FAVORITES FUNCTIONALITY
// ============================================

function ARHairTryOn() {
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  // ... existing code ...
}

// ============================================
// 4. ADD PROGRESS INDICATOR
// ============================================

// Add step tracking
const steps = [
  { label: "Capture Photo" },
  { label: "Face Analysis" },
  { label: "Preferences" },
  { label: "Recommendations" },
  { label: "Try On" }
];

// In your render:
<StepIndicator
  steps={steps}
  currentStep={currentStep}
  className="mb-8"
/>

// ============================================
// 5. ADD TOAST NOTIFICATIONS
// ============================================

// Success toast
const handleSaveFavorite = () => {
  addFavorite(selectedHairstyle, userImage, generatedImage);
  toast.success("Hairstyle saved to favorites!");
};

// Error toast
const handleImageGeneration = async () => {
  try {
    setIsGeneratingImage(true);
    const image = await generateHairImage(userImage, hairstyle, userData);
    setGeneratedImage(image);
    toast.success("Image generated successfully!");
  } catch (error) {
    toast.error("Failed to generate image. Please try again.");
  } finally {
    setIsGeneratingImage(false);
  }
};

// Loading toast
const handleGenerateRecommendations = async () => {
  const loadingToastId = toast.loading("Analyzing your features...");
  try {
    const recommendations = await getHairRecommendations(userData, hairstyleOptions);
    toast.success("Recommendations ready!", undefined, loadingToastId);
    setRecommendations(recommendations);
  } catch (error) {
    toast.error("Failed to get recommendations");
  }
};

// ============================================
// 6. ADD BEFORE/AFTER COMPARISON
// ============================================

{generatedImage && capturedUserImage && (
  <BeforeAfterSlider
    beforeImage={capturedUserImage}
    afterImage={generatedImage}
    beforeLabel="Your Photo"
    afterLabel={selectedHairstyle?.name || "New Hairstyle"}
    className="w-full h-[600px] rounded-xl"
    showControls={true}
  />
)}

// ============================================
// 7. ADD LOADING STATES
// ============================================

// Loading overlay
<LoadingOverlay isLoading={isGeneratingImage} text="Creating your new look...">
  {generatedImage && (
    <img src={generatedImage} alt="Generated hairstyle" />
  )}
</LoadingOverlay>

// Skeleton loaders while loading recommendations
{isLoadingRecommendations ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map(i => (
      <CardSkeleton key={i} />
    ))}
  </div>
) : (
  <HairstyleCards recommendations={recommendations} />
)}

// Spinner
{isAnalyzing && (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" text="Analyzing your face..." variant="primary" />
  </div>
)}

// ============================================
// 8. ADD COMPARISON VIEW
// ============================================

const [showComparison, setShowComparison] = useState(false);

// Button to open comparison
<Button onClick={() => setShowComparison(true)}>
  Compare All Hairstyles
</Button>

// Comparison view modal
{showComparison && (
  <ComparisonView
    userImage={capturedUserImage}
    hairstyles={recommendations.map(rec => ({
      ...rec,
      generatedImage: rec.generatedImage || null
    }))}
    onClose={() => setShowComparison(false)}
    onSelectHairstyle={(hairstyle) => {
      setSelectedHairstyle(hairstyle);
      setShowComparison(false);
      setCurrentStep(9); // Go to try-on step
    }}
  />
)}

// ============================================
// 9. ADD TOOLTIPS
// ============================================

<Tooltip content="This hairstyle is recommended based on your face shape" position="top">
  <button className="p-2 rounded-full hover:bg-gray-100">
    <Info className="w-5 h-5" />
  </button>
</Tooltip>

// ============================================
// 10. ADD BADGES FOR STYLE TAGS
// ============================================

{hairstyle.styleTags && (
  <BadgeGroup className="mb-4">
    {hairstyle.styleTags.map((tag, idx) => (
      <Badge key={idx} variant="secondary" size="sm">
        {tag}
      </Badge>
    ))}
  </BadgeGroup>
)}

// ============================================
// 11. ADD FAVORITES BUTTON
// ============================================

<button
  onClick={() => {
    if (isFavorite(hairstyle.id)) {
      const favorite = favorites.find(f => f.hairstyle?.id === hairstyle.id);
      if (favorite) {
        removeFavorite(favorite.id);
        toast.success("Removed from favorites");
      }
    } else {
      addFavorite(hairstyle, capturedUserImage, generatedImage);
      toast.success("Added to favorites");
    }
  }}
  className="p-2 rounded-full hover:bg-gray-100"
>
  <Heart
    className={`w-6 h-6 ${
      isFavorite(hairstyle.id) ? "text-red-500 fill-current" : "text-gray-400"
    }`}
  />
</button>

// ============================================
// 12. ADD EMPTY STATES
// ============================================

// No recommendations
{recommendations.length === 0 && !isLoadingRecommendations && (
  <EmptyState
    type="noResults"
    title="No Recommendations Found"
    description="Try adjusting your preferences or capturing a new photo."
    action={{
      label: "Adjust Preferences",
      onClick: () => setCurrentStep(1)
    }}
  />
)}

// No favorites
{favorites.length === 0 && (
  <EmptyState
    type="noFavorites"
    action={{
      label: "Browse Hairstyles",
      onClick: () => setCurrentStep(9)
    }}
  />
)}

// ============================================
// 13. ADD PROGRESS BAR
// ============================================

// For image generation
<ProgressBar
  value={generationProgress}
  max={100}
  variant="primary"
  showLabel={true}
  className="mb-4"
/>

// ============================================
// 14. ADD MODAL DIALOGS
// ============================================

const [showDetailsModal, setShowDetailsModal] = useState(false);

<Modal
  isOpen={showDetailsModal}
  onClose={() => setShowDetailsModal(false)}
  title="Hairstyle Details"
  size="lg"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
        Close
      </Button>
      <Button onClick={handleTryOn}>
        Try This Style
      </Button>
    </div>
  }
>
  <div className="space-y-4">
    <img src={hairstyleImage} alt={selectedHairstyle.name} className="w-full rounded-lg" />
    <div>
      <h3 className="text-xl font-bold mb-2">{selectedHairstyle.name}</h3>
      <BadgeGroup>
        {selectedHairstyle.styleTags?.map((tag, idx) => (
          <Badge key={idx} variant="secondary">{tag}</Badge>
        ))}
      </BadgeGroup>
      {selectedHairstyle.matchScore && (
        <div className="mt-4">
          <ProgressBar value={selectedHairstyle.matchScore} max={100} />
        </div>
      )}
      <p className="mt-4 text-gray-600">{selectedHairstyle.whyRecommendation}</p>
    </div>
  </div>
</Modal>

// ============================================
// 15. ENHANCED ERROR HANDLING WITH TOASTS
// ============================================

const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  
  let message = "An unexpected error occurred";
  
  if (error.message?.includes("camera")) {
    message = "Camera access is required. Please allow camera permissions.";
  } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
    message = "Network error. Please check your connection and try again.";
  } else if (error.message?.includes("API")) {
    message = "Service temporarily unavailable. Please try again later.";
  }
  
  toast.error(message);
  setError(message);
};

// ============================================
// END OF INTEGRATION EXAMPLES
// ============================================

/**
 * NOTES:
 * 
 * 1. All imports should be at the top of your component file
 * 2. Wrap your app with ToastProvider in App.jsx or main.jsx
 * 3. Use toast notifications for user feedback instead of alerts
 * 4. Replace existing loading states with new Loading components
 * 5. Add favorites functionality using the useFavorites hook
 * 6. Use ComparisonView for comparing multiple hairstyles
 * 7. Add tooltips for helpful hints and guidance
 * 8. Use EmptyState for better empty state handling
 * 9. Use Badge components for style tags
 * 10. Use ProgressBar and StepIndicator for progress tracking
 */




