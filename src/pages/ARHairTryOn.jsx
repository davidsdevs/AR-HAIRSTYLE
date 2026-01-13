import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Camera, Sparkles, Heart, CheckCircle, X, Loader2, Sparkle, Scan, Brain, CheckCircle2, AlertCircle, AlertTriangle, Palette, ArrowRight, Scissors, Mic, MicOff, ArrowLeft, User, Scissors as ScissorsIcon, Palette as PaletteIcon, Sparkles as SparklesIcon, Type, Volume2, UserCircle, Users, Briefcase, Shirt, Crown, Zap, Leaf, Flame, TrendingUp, Coffee, Music, Gift, Trophy, Star, Award, Target, Maximize2 as Ruler, Settings, Eye } from "lucide-react";
import { FaceMesh, FACEMESH_TESSELATION, FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYE, FACEMESH_FACE_OVAL } from "@mediapipe/face_mesh";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import * as THREE from 'three';
import { fetchServices, fetchProducts } from "../lib/firebase";

export default function ARHairTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const segmentationCanvasRef = useRef(null); // Canvas for hair segmentation mask
  const colorWheelCanvasRef = useRef(null);
  const threeCanvasRef = useRef(null); // Three.js canvas for 3D hair rendering
  const sceneRef = useRef(null); // Three.js scene
  const rendererRef = useRef(null); // Three.js renderer
  const cameraRef = useRef(null); // Three.js camera
  const hairModelRef = useRef(null); // Reference to loaded 3D hair model
  const analysisIntervalRef = useRef(null);
  const faceMeshRef = useRef(null); // MediaPipe Face Mesh
  const selfieSegmentationRef = useRef(null); // MediaPipe Selfie Segmentation
  const startScanningCountdown = useRef(null);
  const scanningCompleteRef = useRef(false); // Synchronous tracking to prevent infinite loops
  const analysisInitiatedRef = useRef(false); // Track if analysis has been initiated
  const faceLandmarksRef = useRef(null); // Store face landmarks for hair positioning
  const headPoseRef = useRef({ pitch: 0, yaw: 0, roll: 0 }); // Head rotation
  const hairMaskRef = useRef(null); // Hair segmentation mask
  const [isARActive, setIsARActive] = useState(false);
  const isARActiveRef = useRef(false); // Ref for synchronous access in callbacks
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Logo, 1: Single Page Input, 7: Camera, 8: Summary, 9: Recommendations
  const currentStepRef = useRef(0); // Ref for synchronous access in callbacks
  const [showLogo, setShowLogo] = useState(true); // Logo animation state
  const [customDescription, setCustomDescription] = useState(""); // Custom user description
  const [isListening, setIsListening] = useState(false); // Voice-to-text listening state
  const recognitionRef = useRef(null); // Speech recognition ref
  const interimTranscriptRef = useRef(''); // Ref to track interim transcript for cleanup
  const [scissorsFlying, setScissorsFlying] = useState(false); // Scissors flying animation state
  const [scissorsPosition, setScissorsPosition] = useState({ left: 0, top: 0 }); // Store button position for animation
  const scissorsButtonRef = useRef(null); // Ref for scissors button position
  const [selectedHairstyle, setSelectedHairstyle] = useState(null);
  const selectedHairstyleRef = useRef(null); // Ref for synchronous access in callbacks
  const [faceDetected, setFaceDetected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [facePositioned, setFacePositioned] = useState(false);
  const [scanningComplete, setScanningComplete] = useState(false);
  const [selectedRecommendationModal, setSelectedRecommendationModal] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [capturedUserImage, setCapturedUserImage] = useState(null);
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState(false);
  const [showSparkleEffect, setShowSparkleEffect] = useState(false); // Sparkle effect when image is generated
  const [hairImages, setHairImages] = useState({}); // Store loaded hair images for AR overlay (legacy - not used with 3D)
  const hairImagesRef = useRef({}); // Ref for synchronous access in callbacks (legacy)
  const [hair3DLoaded, setHair3DLoaded] = useState(false); // Track if 3D hair model is loaded
  const hair3DLoadedRef = useRef(false); // Ref for synchronous access in callbacks
  const [isARModeActive, setIsARModeActive] = useState(false); // AR mode in recommendations step
  const [appMode, setAppMode] = useState(null); // "ai" for AI recommendations, "ar" for AR try-on, "services" for services/products
  const [servicesTab, setServicesTab] = useState("services"); // "services" or "products"
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0); // For magazine swipe
  const [currentProductIndex, setCurrentProductIndex] = useState(0); // For magazine swipe
  
  // Touch/Swipe handlers for Services
  const serviceTouchStart = useRef(null);
  const serviceTouchEnd = useRef(null);
  const productTouchStart = useRef(null);
  const productTouchEnd = useRef(null);
  const minSwipeDistance = 50;

  const onServiceTouchStart = (e) => {
    serviceTouchEnd.current = null;
    serviceTouchStart.current = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
  };

  const onServiceTouchMove = (e) => {
    serviceTouchEnd.current = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
  };

  const onServiceTouchEnd = () => {
    if (!serviceTouchStart.current || !serviceTouchEnd.current) return;
    const distance = serviceTouchStart.current - serviceTouchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && currentServiceIndex < salonServices.length - 1) {
      setCurrentServiceIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentServiceIndex > 0) {
      setCurrentServiceIndex(prev => prev - 1);
    }
  };

  const onProductTouchStart = (e) => {
    productTouchEnd.current = null;
    productTouchStart.current = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
  };

  const onProductTouchMove = (e) => {
    productTouchEnd.current = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
  };

  const onProductTouchEnd = () => {
    if (!productTouchStart.current || !productTouchEnd.current) return;
    const distance = productTouchStart.current - productTouchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && currentProductIndex < salonProducts.length - 1) {
      setCurrentProductIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentProductIndex > 0) {
      setCurrentProductIndex(prev => prev - 1);
    }
  };
  
  // Keep refs in sync with state for use in callbacks
  useEffect(() => { isARActiveRef.current = isARActive; }, [isARActive]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { selectedHairstyleRef.current = selectedHairstyle; }, [selectedHairstyle]);
  useEffect(() => { hair3DLoadedRef.current = hair3DLoaded; }, [hair3DLoaded]);
  
  // AI Analysis Results (Automatically Detected)
  const [aiAnalysis, setAiAnalysis] = useState({
    facialStructure: null,
    faceShape: null,
    skinColor: null,
    skinTone: null,
    confidence: 0,
    faceDetected: false
  });
  
  // User Preferences State (Manual Inputs)
  const [preferences, setPreferences] = useState({
    gender: "", // "male" or "female"
    hairLength: "",
    stylePreferences: [], // Array of selected preferences
    hairType: "",
    hairColor: "", // "black", "brown", "blonde", "red", "gray", "other"
    occasion: ""
  });
  
  // Preference wizard step tracker (1: Gender, 2: Hair Length, 3: Hair Type, 4: Hair Color, 5: Style Preferences, 6: Additional Notes)
  const [preferenceStep, setPreferenceStep] = useState(1);
  const preferenceSteps = [
    { id: 1, name: "Gender", icon: "User" },
    { id: 2, name: "Hair Length", icon: "Scissors" },
    { id: 3, name: "Hair Type", icon: "Sparkles" },
    { id: 4, name: "Hair Color", icon: "Palette" },
    { id: 5, name: "Style", icon: "Heart" },
    { id: 6, name: "Notes", icon: "Type" }
  ];
  
  // Custom hair color state for "other" option
  const [customHairColor, setCustomHairColor] = useState("#6B4423"); // Default brown
  const [hairLengthValue, setHairLengthValue] = useState(50); // 0-100 for hair length slider
  const [showHairLengthModal, setShowHairLengthModal] = useState(false);
  const [showColorWheelModal, setShowColorWheelModal] = useState(false);
  const [colorPickerMode, setColorPickerMode] = useState("wheel"); // "wheel" or "palette"
  const [isDraggingColorWheel, setIsDraggingColorWheel] = useState(false);
  const [colorWheelIndicator, setColorWheelIndicator] = useState({ angle: 0, distance: 0.5 }); // angle in degrees, distance as ratio (0-1)
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState(null);
  
  // Manual overrides for AI-detected values
  const [manualOverrides, setManualOverrides] = useState({
    faceShape: null, // null means use AI detection, otherwise use override
    skinTone: null
  });

  // Hairstyle options for AR Try-On (Hair2D folder only)
  const hairstyleOptions = [
    { 
      id: 1, 
      name: "Lady Waves", 
      category: "Long",
      hairType: "wavy",
      gender: "female",
      image: "/Hair2D/—Pngtree—black partial lady hairstyle silhouette_6123264.png",
    },
    { 
      id: 2, 
      name: "Short Pixie", 
      category: "Short",
      hairType: "straight",
      gender: "female",
      image: "/Hair2D/—Pngtree—short hairstyles for black young_5552701.png",
    },
    {
      id: 3,
      name: "Classic Cut",
      category: "Short",
      hairType: "straight",
      gender: "male",
      image: "/Hair2D/—Pngtree—men black hair_9828660.png",
    },
    {
      id: 4,
      name: "Textured Bangs",
      category: "Short",
      hairType: "straight",
      gender: "male",
      image: "/Hair2D/—Pngtree—mens bangs black hair palette_8744035.png",
    },
  ];

  // Style preferences options
  const stylePreferenceOptions = [
    "Professional", "Casual", "Elegant", "Trendy", "Classic", "Bold", "Natural", "Edgy"
  ];

  // Salon Services Data - fetched from Firebase
  const [salonServices, setSalonServices] = useState([]);
  const [salonProducts, setSalonProducts] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Default fallback data for services
  const defaultServices = [
    {
      id: 1,
      category: "Haircut",
      name: "Basic Haircut",
      description: "Professional haircut with styling",
      price: "₱150",
      duration: "30 mins",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80"
    }
  ];

  // Default fallback data for products
  const defaultProducts = [
    {
      id: 1,
      category: "Shampoo",
      name: "Moisturizing Shampoo",
      description: "For dry & damaged hair",
      price: "₱450",
      brand: "Professional Care",
      image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=1920&q=80"
    }
  ];

  // Fetch services from Firebase when entering services page
  useEffect(() => {
    if (currentStep === 11 && salonServices.length === 0) {
      setIsLoadingServices(true);
      fetchServices()
        .then((services) => {
          if (services.length > 0) {
            setSalonServices(services);
          } else {
            setSalonServices(defaultServices);
          }
        })
        .catch((error) => {
          console.error('Error loading services:', error);
          setSalonServices(defaultServices);
        })
        .finally(() => {
          setIsLoadingServices(false);
        });
    }
  }, [currentStep]);

  // Fetch products from Firebase when entering products page
  useEffect(() => {
    if (currentStep === 12 && salonProducts.length === 0) {
      setIsLoadingProducts(true);
      fetchProducts()
        .then((products) => {
          if (products.length > 0) {
            setSalonProducts(products);
          } else {
            setSalonProducts(defaultProducts);
          }
        })
        .catch((error) => {
          console.error('Error loading products:', error);
          setSalonProducts(defaultProducts);
        })
        .finally(() => {
          setIsLoadingProducts(false);
        });
    }
  }, [currentStep]);

  // Helper function to convert HSL to RGB
  const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Helper function to convert RGB to HSL
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    return [h * 360, s * 100, l * 100];
  };

  // Helper function to convert hex to HSL and update indicator
  const updateIndicatorFromHex = (hex) => {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Convert RGB to HSL
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Update indicator position
    // For the color wheel, we use lightness = 50%, so we calculate distance from saturation
    // Distance is based on saturation (0-100% maps to 0-1)
    const distance = s / 100;
    setColorWheelIndicator({ angle: h, distance: Math.max(0, Math.min(1, distance)) });
  };

  // Helper function to get color from canvas coordinates
  const getColorFromCoordinates = (clientX, clientY) => {
    const canvas = colorWheelCanvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    
    const x = (clientX - rect.left) * (size / rect.width);
    const y = (clientY - rect.top) * (size / rect.height);
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= radius) {
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const distanceRatio = distance / radius;
      const saturation = Math.min(100, distanceRatio * 100);
      const lightness = 50;
      
      const hue = angle;
      const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100);
      const hex = `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
      
      // Update indicator position
      setColorWheelIndicator({ angle, distance: distanceRatio });
      
      return hex;
    }
    return null;
  };

  // Mask the user's real hair area so 3D hair can replace it
  const maskUserHair = (ctx, landmarks, canvasWidth, canvasHeight) => {
    // DISABLED for now - the mask is causing issues
    // The 3D hair will overlay on top instead
    return;
  };

  // Calculate head pose from face landmarks (pitch, yaw, roll)
  const calculateHeadPose = (landmarks) => {
    const noseTip = landmarks[1];
    const chin = landmarks[152];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const forehead = landmarks[10];
    
    const eyeDistance = rightEye.x - leftEye.x;
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const noseOffset = noseTip.x - eyeCenter;
    const yaw = Math.atan2(noseOffset, eyeDistance) * (180 / Math.PI) * 2;
    
    const verticalDistance = chin.y - forehead.y;
    const noseVerticalOffset = noseTip.y - ((forehead.y + chin.y) / 2);
    const pitch = Math.atan2(noseVerticalOffset, verticalDistance) * (180 / Math.PI) * 2;
    
    const eyeYDiff = rightEye.y - leftEye.y;
    const roll = Math.atan2(eyeYDiff, eyeDistance) * (180 / Math.PI);
    
    return { pitch, yaw, roll };
  };

  // Get hair anchor points from face landmarks
  const getHairAnchorPoints = (landmarks, canvasWidth, canvasHeight) => {
    const forehead = landmarks[10];
    const leftTemple = landmarks[54];
    const rightTemple = landmarks[284];
    const chin = landmarks[152];
    const noseTip = landmarks[1];
    
    // Calculate face dimensions
    const faceWidth = Math.abs(rightTemple.x - leftTemple.x) * canvasWidth;
    const faceHeight = Math.abs(chin.y - forehead.y) * canvasHeight;
    
    // Hair anchor should be at the top of the head (forehead level, not above it)
    // The forehead landmark (10) is already at the hairline
    const hairAnchor = {
      x: forehead.x * canvasWidth,
      y: forehead.y * canvasHeight, // Position at forehead, not above
      z: forehead.z || 0
    };
    
    return { anchor: hairAnchor, faceWidth, faceHeight };
  };

  // Initialize MediaPipe Face Mesh and Selfie Segmentation
  const initializeFaceDetection = async () => {
    try {
      if (!videoRef.current) {
        console.error("🔍 [FACE MESH] Video ref not available");
        return;
      }

      // Initialize Face Mesh for 468 facial landmarks
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Initialize Selfie Segmentation for hair detection
      const selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }
      });

      selfieSegmentation.setOptions({
        modelSelection: 1,
        selfieMode: true,
      });

      selfieSegmentation.onResults((results) => {
        if (!results.segmentationMask) return;
        hairMaskRef.current = results.segmentationMask;
      });

      faceMesh.onResults((results) => {
        if (!canvasRef.current || !videoRef.current) {
          console.warn("🔍 [FACE MESH] Canvas or video not available");
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;

        // Check if video is ready
        if (video.readyState < 2) {
          console.warn("🔍 [FACE MESH] Video not ready, readyState:", video.readyState);
          return;
        }

        const containerWidth = video.clientWidth || 640;
        const containerHeight = video.clientHeight || 480;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const videoAspect = video.videoWidth / video.videoHeight;
        const containerAspect = containerWidth / containerHeight;
        
        let sourceX = 0, sourceY = 0, sourceW = video.videoWidth, sourceH = video.videoHeight;
        
        if (containerAspect > videoAspect) {
          sourceH = video.videoWidth / containerAspect;
          sourceY = (video.videoHeight - sourceH) / 2;
        } else {
          sourceW = video.videoHeight * containerAspect;
          sourceX = (video.videoWidth - sourceW) / 2;
        }

        // Draw video frame (mirrored)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, sourceX, sourceY, sourceW, sourceH, -containerWidth, 0, containerWidth, containerHeight);
        ctx.restore();

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          setFaceDetected(true);
          const landmarks = results.multiFaceLandmarks[0];
          
          // Debug: Log face detection success periodically
          if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
            console.log("🔍 [FACE MESH] ✅ Face detected with", landmarks.length, "landmarks");
          }
          
          faceLandmarksRef.current = landmarks;
          const headPose = calculateHeadPose(landmarks);
          headPoseRef.current = headPose;
          const hairAnchors = getHairAnchorPoints(landmarks, containerWidth, containerHeight);
          const mirroredAnchorX = containerWidth - hairAnchors.anchor.x;
          
          // AR Hair Overlay - draw 2D hair on canvas
          if (currentStepRef.current === 2 && selectedHairstyleRef.current && isARActiveRef.current && hair3DLoadedRef.current) {
            // Draw 2D hair overlay directly on canvas
            drawHairOverlay2D(ctx, landmarks, containerWidth, containerHeight);
          }

          // Calculate face bounds for positioning checks
          let minX = 1, maxX = 0, minY = 1, maxY = 0;
          landmarks.forEach(lm => {
            minX = Math.min(minX, lm.x);
            maxX = Math.max(maxX, lm.x);
            minY = Math.min(minY, lm.y);
            maxY = Math.max(maxY, lm.y);
          });
          
          const faceWidth = (maxX - minX) * containerWidth;
          const faceHeight = (maxY - minY) * containerHeight;
          const faceCenterX = containerWidth - ((minX + maxX) / 2 * containerWidth);
          const faceCenterY = ((minY + maxY) / 2) * containerHeight;

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          const xOffset = Math.abs(faceCenterX - centerX) / canvas.width;
          const yOffset = Math.abs(faceCenterY - centerY) / canvas.height;
          const isCentered = xOffset < 0.3 && yOffset < 0.3;
          
          const faceSize = (faceWidth * faceHeight) / (canvas.width * canvas.height);
          const isGoodSize = faceSize > 0.03 && faceSize < 0.5;
          const isPositioned = isCentered && isGoodSize;
          setFacePositioned(isPositioned);

          // Draw face mesh in scanning mode (Step 1)
          if (currentStep === 1) {
            let meshColor = isPositioned ? 'rgba(0, 255, 0, 0.8)' : (isCentered ? 'rgba(255, 170, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)');

            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-containerWidth, 0);
            
            ctx.strokeStyle = meshColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const faceOvalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
            faceOvalIndices.forEach((idx, i) => {
              const lm = landmarks[idx];
              const x = lm.x * containerWidth;
              const y = lm.y * containerHeight;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
            ctx.restore();

            // Guide lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(canvas.width, centerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Head pose display
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '12px Arial';
            ctx.fillText(`Pitch: ${headPose.pitch.toFixed(1)}°`, 10, 20);
            ctx.fillText(`Yaw: ${headPose.yaw.toFixed(1)}°`, 10, 35);
            ctx.fillText(`Roll: ${headPose.roll.toFixed(1)}°`, 10, 50);
          }

          // Scanning logic - DISABLED: Let users manually capture
          // if (currentStep !== 2 && isPositioned && !isScanning && !scanningCompleteRef.current && !analysisComplete && !startScanningCountdown.current) {
          //   startScanning();
          // }
          
          // if (!isPositioned && isScanning && startScanningCountdown.current && !scanningCompleteRef.current) {
          //   clearInterval(startScanningCountdown.current);
          //   startScanningCountdown.current = null;
          //   setIsScanning(false);
          //   setCountdown(0);
          // }

          // Face analysis after scanning - DISABLED: Manual capture only
          // if (currentStep !== 2 && scanningCompleteRef.current && !analysisComplete && !isAnalyzing && !analysisInitiatedRef.current) {
          //   analysisInitiatedRef.current = true;
          //   analyzeFaceFromMesh(landmarks, canvas);
          // }
        } else {
          setFaceDetected(false);
          setFacePositioned(false);
          faceLandmarksRef.current = null;
          
          // Debug: Log no face detection periodically
          if (Math.random() < 0.005) { // Log 0.5% of the time to avoid spam
            console.log("🔍 [FACE MESH] ❌ No face detected in frame");
          }
          
          // Automatic scanning disabled - manual capture only
          // if (isScanning && startScanningCountdown.current && !scanningCompleteRef.current) {
          //   clearInterval(startScanningCountdown.current);
          //   startScanningCountdown.current = null;
          //   setIsScanning(false);
          //   setCountdown(0);
          // }
        }
      });

      faceMeshRef.current = faceMesh;
      selfieSegmentationRef.current = selfieSegmentation;

      const startFrameProcessing = () => {
        if (!videoRef.current || !videoRef.current.srcObject) {
          setTimeout(startFrameProcessing, 100);
          return;
        }

        const video = videoRef.current;
        if (video.readyState < 2) {
          video.addEventListener('loadedmetadata', () => startFrameProcessing(), { once: true });
          return;
        }

        let isProcessing = false;
        let lastFrameTime = 0;
        const frameInterval = 1000 / 30;

        const processFrame = async () => {
          if (!videoRef.current || !videoRef.current.srcObject || !faceMeshRef.current) {
            if (analysisIntervalRef.current) {
              cancelAnimationFrame(analysisIntervalRef.current);
              analysisIntervalRef.current = null;
            }
            return;
          }

          const video = videoRef.current;
          if (!video || video.readyState < 2) {
            requestAnimationFrame(processFrame);
            return;
          }

          const now = performance.now();
          if (now - lastFrameTime >= frameInterval) {
            lastFrameTime = now;

            if (!isProcessing) {
              isProcessing = true;
              try {
                await faceMeshRef.current.send({ image: video });
                if (selfieSegmentationRef.current && currentStepRef.current === 2) {
                  await selfieSegmentationRef.current.send({ image: video });
                }
              } catch (error) {
                console.error("🔍 [FACE MESH] Error:", error);
              } finally {
                isProcessing = false;
              }
            }
          }

          analysisIntervalRef.current = requestAnimationFrame(processFrame);
        };

        analysisIntervalRef.current = requestAnimationFrame(processFrame);
      };

      setTimeout(() => startFrameProcessing(), 500);

    } catch (error) {
      console.error("🔍 [FACE MESH] Error initializing:", error);
      setError("Failed to initialize face detection. Error: " + error.message);
    }
  };

  // Analyze face from mesh landmarks
  const analyzeFaceFromMesh = (landmarks, canvas) => {
    try {
      const forehead = landmarks[10];
      const chin = landmarks[152];
      const leftCheek = landmarks[234];
      const rightCheek = landmarks[454];
      const leftJaw = landmarks[172];
      const rightJaw = landmarks[397];
      
      const faceHeight = Math.abs(chin.y - forehead.y);
      const foreheadWidth = Math.abs(landmarks[54].x - landmarks[284].x);
      const cheekWidth = Math.abs(leftCheek.x - rightCheek.x);
      const jawWidth = Math.abs(leftJaw.x - rightJaw.x);
      
      const heightToWidthRatio = faceHeight / cheekWidth;
      const foreheadToJawRatio = foreheadWidth / jawWidth;
      const cheekToJawRatio = cheekWidth / jawWidth;
      
      let faceShape = 'oval';
      if (heightToWidthRatio > 1.5) faceShape = 'oblong';
      else if (heightToWidthRatio < 1.1) faceShape = 'round';
      else if (foreheadToJawRatio > 1.2 && cheekToJawRatio > 1.15) faceShape = 'heart';
      else if (foreheadToJawRatio < 0.95 && cheekToJawRatio > 1.1) faceShape = 'diamond';
      else if (Math.abs(foreheadWidth - jawWidth) < 0.05) faceShape = 'square';
      
      const ctx = canvas.getContext('2d');
      const cheekX = Math.floor(((leftCheek.x + rightCheek.x) / 2) * canvas.width);
      const cheekY = Math.floor(leftCheek.y * canvas.height);
      
      let skinTone = 'medium';
      let skinToneObject = { value: 'medium', label: 'Medium', color: '#E0AC69' };
      
      try {
        const imageData = ctx.getImageData(cheekX - 5, cheekY - 5, 10, 10);
        const data = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        const brightness = (r + g + b) / (3 * count);
        
        console.log('🎨 [SKIN TONE] Detected brightness:', brightness, 'from', count, 'pixels');
        console.log('🎨 [SKIN TONE] Average RGB:', Math.round(r/count), Math.round(g/count), Math.round(b/count));
        
        // Map brightness to skin tone with proper objects
        const skinTones = [
          { value: "fair", label: "Fair", color: "#FDBCB4", threshold: 200 },
          { value: "light", label: "Light", color: "#F1C27D", threshold: 180 },
          { value: "medium", label: "Medium", color: "#E0AC69", threshold: 140 },
          { value: "olive", label: "Olive", color: "#C68642", threshold: 120 },
          { value: "tan", label: "Tan", color: "#8D5524", threshold: 100 },
          { value: "brown", label: "Brown", color: "#654321", threshold: 80 },
          { value: "dark", label: "Dark", color: "#4A3728", threshold: 60 },
          { value: "deep", label: "Deep", color: "#2C1810", threshold: 0 },
        ];
        
        // Find matching skin tone
        for (const tone of skinTones) {
          if (brightness >= tone.threshold) {
            skinTone = tone.value;
            skinToneObject = tone;
            break;
          }
        }
        
        console.log('🎨 [SKIN TONE] Final detected skin tone:', skinToneObject);
      } catch (e) { 
        console.warn('🎨 [SKIN TONE] Detection failed, using default:', e.message);
      }
      
      setAiAnalysis({
        facialStructure: `${faceShape} face with ${heightToWidthRatio > 1.3 ? 'elongated' : 'balanced'} proportions`,
        faceShape, 
        skinColor: skinToneObject.value, // Use the detected skin tone value
        skinTone: skinToneObject, // Use the full skin tone object with label and color
        confidence: 0.85, 
        faceDetected: true
      });
      
      setAnalysisComplete(true);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('❌ [FACE MESH] Analysis error:', error);
      setIsAnalyzing(false);
    }
  };

  // Update 3D hair position from face mesh
  const updateHair3DPositionFromMesh = (anchorX, anchorY, faceWidth, faceHeight, headPose, canvasWidth, canvasHeight) => {
    // Now using 2D canvas drawing instead of 3D
    // The actual drawing happens in drawHairOverlay2D
    // Just store the position data for use in drawing
    hairPositionRef.current = {
      anchorX,
      anchorY,
      faceWidth,
      faceHeight,
      headPose,
      canvasWidth,
      canvasHeight
    };
  };

  // Reference to store hair position for 2D drawing
  const hairPositionRef = useRef(null);

  // Draw 2D hair overlay on canvas
  const drawHairOverlay2D = (ctx, landmarks, canvasWidth, canvasHeight) => {
    if (!selectedHairstyleRef.current) {
      return;
    }
    
    const styleId = selectedHairstyleRef.current.id;
    const hairImage = hairImageCache.current[styleId];
    
    if (!hairImage) {
      console.warn('⚠️ [2D] Hair image not loaded for style ID:', styleId, 'Available IDs:', Object.keys(hairImageCache.current));
      return;
    }
    
    // Get face landmarks for positioning
    // === FACE LANDMARK POINTS ===
    // Key landmarks for accurate face measurement
    const forehead = landmarks[10];        // Top of forehead (hairline)
    const leftTemple = landmarks[54];      // Left temple
    const rightTemple = landmarks[284];    // Right temple
    const chin = landmarks[152];           // Bottom of chin
    const leftEye = landmarks[33];         // Left eye outer corner
    const rightEye = landmarks[263];       // Right eye outer corner
    const leftCheek = landmarks[234];      // Left cheekbone
    const rightCheek = landmarks[454];     // Right cheekbone
    const leftEar = landmarks[127];        // Left ear area
    const rightEar = landmarks[356];       // Right ear area
    const noseTip = landmarks[1];          // Nose tip for depth reference
    const leftEyebrow = landmarks[70];     // Left eyebrow outer
    const rightEyebrow = landmarks[300];   // Right eyebrow outer
    
    // === CALCULATE FACE DIMENSIONS FROM LANDMARKS ===
    // Face width: distance between temples (widest part of face for hair)
    const templeWidth = Math.abs(rightTemple.x - leftTemple.x) * canvasWidth;
    
    // Cheekbone width: for reference
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x) * canvasWidth;
    
    // Ear-to-ear width: maximum head width for hair coverage
    const earToEarWidth = Math.abs(rightEar.x - leftEar.x) * canvasWidth;
    
    // Face height: from forehead to chin
    const faceHeight = Math.abs(chin.y - forehead.y) * canvasHeight;
    
    // Eye distance: key measurement for proportional scaling
    const eyeDistance = Math.abs(rightEye.x - leftEye.x) * canvasWidth;
    
    // Forehead height: from eyebrows to hairline
    const foreheadHeight = Math.abs(forehead.y - ((leftEyebrow.y + rightEyebrow.y) / 2)) * canvasHeight;
    
    // Face center (mirrored for selfie view)
    const faceCenterX = canvasWidth - (((leftTemple.x + rightTemple.x) / 2) * canvasWidth);
    const faceTopY = forehead.y * canvasHeight;
    
    // Calculate head tilt from eyes
    const eyeLeftY = leftEye.y * canvasHeight;
    const eyeRightY = rightEye.y * canvasHeight;
    const eyeLeftX = canvasWidth - (leftEye.x * canvasWidth);
    const eyeRightX = canvasWidth - (rightEye.x * canvasWidth);
    const headTilt = Math.atan2(eyeRightY - eyeLeftY, eyeRightX - eyeLeftX);
    
    // Calculate face depth/distance from camera using eye distance as reference
    // Average eye distance is ~63mm, use this to estimate face scale
    const referenceEyeDistance = 63; // mm (average human interpupillary distance)
    const faceDepthFactor = eyeDistance / 100; // Normalize based on typical canvas size
    
    // === DYNAMIC SCALING BASED ON FACE LANDMARKS ===
    // The hair width should cover from ear to ear with some padding
    // Use the larger of temple width or ear-to-ear width for full coverage
    const headWidth = Math.max(templeWidth, earToEarWidth, cheekWidth * 1.3);
    
    // Hair should extend beyond the face width to look natural
    // Scale factor based on actual face measurements
    const HAIR_WIDTH_MULTIPLIER = 1.8;  // Hair extends 80% beyond head width on each side
    const HAIR_HEIGHT_RATIO = 1.2;      // Hair height relative to face height
    
    // Calculate target hair dimensions based on face landmarks
    const targetHairWidth = headWidth * HAIR_WIDTH_MULTIPLIER;
    
    // Maintain aspect ratio of the hair image
    const hairAspectRatio = hairImage.height / hairImage.width;
    const targetHairHeight = targetHairWidth * hairAspectRatio;
    
    // Ensure minimum hair height covers the forehead properly
    const minHairHeight = faceHeight * HAIR_HEIGHT_RATIO;
    const finalHairHeight = Math.max(targetHairHeight, minHairHeight);
    const finalHairWidth = finalHairHeight / hairAspectRatio;
    
    // Final dimensions
    const hairWidth = finalHairWidth;
    const hairHeight = finalHairHeight;
    
    // === POSITION ADJUSTMENTS ===
    const HAIR_Y_OFFSET = 0.35;     // Vertical offset (increase = move down)
    const HAIR_X_OFFSET = 0;        // Horizontal offset (positive = move right)
    const FLIP_VERTICAL = true;     // Set to true if hair appears upside down
    const FLIP_HORIZONTAL = false;  // Set to true if hair appears mirrored wrong
    
    // Position hair centered on head, above forehead
    // Y position: start from forehead and offset upward
    const hairX = faceCenterX + (HAIR_X_OFFSET * headWidth);
    const hairY = faceTopY - (hairHeight * (0.5 - HAIR_Y_OFFSET));
    
    ctx.save();
    
    // Move to hair center position
    ctx.translate(hairX, hairY);
    
    // Apply head tilt
    ctx.rotate(headTilt);
    
    // Apply flips if needed
    ctx.scale(
      FLIP_HORIZONTAL ? -1 : 1,
      FLIP_VERTICAL ? -1 : 1
    );
    
    // Draw the hair image centered at origin
    ctx.drawImage(
      hairImage,
      -hairWidth / 2,
      -hairHeight / 2,
      hairWidth,
      hairHeight
    );
    
    ctx.restore();
  };

  // Manual capture function - gives users control over when to take photo
  const handleManualCapture = () => {
    console.log('📸 [MANUAL] User initiated manual capture...');
    
    // Check if face is detected
    if (!faceDetected || !faceLandmarksRef.current) {
      console.warn('📸 [MANUAL] No face detected - cannot capture');
      return;
    }
    
    // Start 3 second countdown
    setIsScanning(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsScanning(false);
          
          // Capture the image after countdown
          const capturedImage = captureUserFaceImage();
          
          if (!capturedImage) {
            console.error('📸 [MANUAL] Failed to capture image');
            return 0;
          }
          
          console.log('📸 [MANUAL] ✅ Image captured successfully!');
          
          // Perform face analysis if not already done
          if (!analysisComplete && !isAnalyzing && canvasRef.current && faceLandmarksRef.current) {
            console.log('🔍 [MANUAL] Starting face analysis...');
            analysisInitiatedRef.current = true;
            analyzeFaceFromMesh(faceLandmarksRef.current, canvasRef.current);
          }
          
          // Show photo preview modal
          setShowPhotoPreviewModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      console.log('🧪 [TEST] Testing API connection...');
      const apiBase = import.meta.env.PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/health`);
      const data = await response.json();
      console.log('🧪 [TEST] API Health Check:', data);
      
      if (data.openrouter_configured) {
        console.log('✅ [TEST] OpenRouter API is configured');
        
        // Test OpenRouter API directly
        const testResponse = await fetch(`${apiBase}/api/test-openrouter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const testData = await testResponse.json();
        console.log('🧪 [TEST] OpenRouter Test:', testData);
      } else {
        console.warn('⚠️ [TEST] OpenRouter API not configured');
      }
    } catch (error) {
      console.error('❌ [TEST] API connection failed:', error);
    }
  };

  // Start 3-second scanning countdown
  const startScanning = () => {
    // Don't start scanning in AR Mode (Step 2) - AR is just for trying on hairstyles
    if (currentStep === 2) {
      console.log("Scanning blocked: AR Mode - no scanning needed");
      return;
    }
    
    // Don't start if already scanning or complete - use ref for synchronous check
    if (startScanningCountdown.current || scanningCompleteRef.current || isScanning || analysisComplete) {
      console.log("Scanning blocked:", { hasCountdown: !!startScanningCountdown.current, scanningComplete: scanningCompleteRef.current, isScanning, analysisComplete });
      return;
    }

    console.log("Starting scan countdown...");
    setIsScanning(true);
    setCountdown(3);

    // Start countdown immediately, then continue every second
    let currentCount = 3;
    
    // Update immediately to show 3
    setCountdown(3);
    
    // Start interval for countdown
    startScanningCountdown.current = setInterval(() => {
      currentCount--;
      console.log("Countdown:", currentCount);
      
      if (currentCount <= 0) {
        console.log("Countdown complete, marking scanning as complete...");
        if (startScanningCountdown.current) {
          clearInterval(startScanningCountdown.current);
          startScanningCountdown.current = null;
        }
        setIsScanning(false);
        setCountdown(0);
        // Set ref first for synchronous check, then update state
        scanningCompleteRef.current = true;
        setScanningComplete(true);
      } else {
        setCountdown(currentCount);
      }
    }, 1000);
  };

  // Initialize Three.js scene for 3D hair rendering
  const initializeThreeJS = () => {
    if (!threeCanvasRef.current) {
      console.warn('⚠️ [3D] Three.js canvas ref not available');
      return;
    }
    
    const canvas = threeCanvasRef.current;
    
    // Get dimensions from video container
    const video = videoRef.current;
    const width = video?.clientWidth || canvas.clientWidth || 640;
    const height = video?.clientHeight || canvas.clientHeight || 480;
    
    // Create scene
    const scene = new THREE.Scene();
    
    // Add strong lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(0, 1, 5);
    scene.add(directionalLight);
    
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      alpha: true,
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    
    console.log('✅ [3D] Three.js initialized');
  };

  // Preloaded hair images
  const hairImageCache = useRef({});

  // Load 2D hair overlay images from hairstyleOptions
  const loadHair3DModel = async () => {
    console.log('🎨 [2D] Loading hair overlay images from hairstyleOptions...');
    
    // Preload all hair images from hairstyleOptions
    const imagePromises = hairstyleOptions.map((style) => {
      return new Promise((resolve) => {
        if (hairImageCache.current[style.id]) {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          hairImageCache.current[style.id] = img;
          console.log(`✅ [2D] Loaded hair image ${style.id}: ${style.name}`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`⚠️ [2D] Failed to load hair image ${style.id}: ${style.image}`);
          resolve();
        };
        img.src = style.image;
      });
    });
    
    await Promise.all(imagePromises);
    setHair3DLoaded(true);
    console.log('✅ [2D] All hair images ready, count:', Object.keys(hairImageCache.current).length);
  };

  // Create a procedural hair model that looks like actual hair
  const createProceduralHairModel = () => {
    if (!sceneRef.current) return;
    
    console.log('🎨 [3D] Creating procedural hair model...');
    
    const hairGroup = new THREE.Group();
    
    // Hair material - dark brown/black
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1209,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    
    // Main hair cap (top of head)
    const capGeometry = new THREE.SphereGeometry(0.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
    capGeometry.scale(1.1, 0.8, 1.05);
    const hairCap = new THREE.Mesh(capGeometry, hairMaterial);
    hairCap.position.set(0, 0.15, 0);
    hairGroup.add(hairCap);
    
    // Front hair volume (forehead area)
    const frontGeometry = new THREE.SphereGeometry(0.35, 24, 16);
    frontGeometry.scale(1.4, 0.5, 0.7);
    const frontHair = new THREE.Mesh(frontGeometry, hairMaterial);
    frontHair.position.set(0, 0.1, 0.35);
    hairGroup.add(frontHair);
    
    // Side hair - left
    const sideGeometry = new THREE.CapsuleGeometry(0.22, 0.5, 12, 16);
    const leftSide = new THREE.Mesh(sideGeometry, hairMaterial);
    leftSide.position.set(-0.45, -0.1, 0.05);
    leftSide.rotation.z = 0.15;
    hairGroup.add(leftSide);
    
    // Side hair - right
    const rightSide = new THREE.Mesh(sideGeometry.clone(), hairMaterial);
    rightSide.position.set(0.45, -0.1, 0.05);
    rightSide.rotation.z = -0.15;
    hairGroup.add(rightSide);
    
    // Back hair volume
    const backGeometry = new THREE.SphereGeometry(0.45, 24, 16);
    backGeometry.scale(1.0, 0.9, 0.8);
    const backHair = new THREE.Mesh(backGeometry, hairMaterial);
    backHair.position.set(0, 0, -0.25);
    hairGroup.add(backHair);
    
    // Hair texture details - small bumps for realism
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bumpGeometry = new THREE.SphereGeometry(0.12, 8, 6);
      const bump = new THREE.Mesh(bumpGeometry, hairMaterial);
      bump.position.set(
        Math.cos(angle) * 0.4,
        0.2 + Math.random() * 0.1,
        Math.sin(angle) * 0.35
      );
      bump.scale.set(1, 0.7, 1);
      hairGroup.add(bump);
    }
    
    // Set base scale
    const baseScale = 1.0;
    hairGroup.userData = { baseScale };
    hairGroup.scale.set(baseScale, baseScale, baseScale);
    
    sceneRef.current.add(hairGroup);
    hairModelRef.current = hairGroup;
    setHair3DLoaded(true);
    
    // Initial render
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    console.log('✅ [3D] Procedural hair model created');
  };

  // Update 3D hair position based on face detection
  const updateHair3DPosition = (faceCenterX, faceCenterY, faceWidth, faceHeight, canvasWidth, canvasHeight) => {
    if (!hairModelRef.current || !cameraRef.current || !rendererRef.current) {
      return;
    }
    
    // Sync renderer size
    if (rendererRef.current.domElement.width !== canvasWidth) {
      rendererRef.current.setSize(canvasWidth, canvasHeight);
      cameraRef.current.aspect = canvasWidth / canvasHeight;
      cameraRef.current.updateProjectionMatrix();
    }
    
    // Calculate head position (position hair above face center)
    const headTopY = faceCenterY - (faceHeight * 0.4);
    
    // Convert to NDC (Normalized Device Coordinates)
    const ndcX = ((faceCenterX / canvasWidth) * 2) - 1;
    const ndcY = 1 - ((headTopY / canvasHeight) * 2);
    
    // Calculate world position based on camera frustum
    const fovRad = (cameraRef.current.fov * Math.PI) / 180;
    const frustumHeight = 2 * 3 * Math.tan(fovRad / 2);
    const frustumWidth = frustumHeight * cameraRef.current.aspect;
    
    const worldX = ndcX * (frustumWidth / 2);
    const worldY = ndcY * (frustumHeight / 2);
    
    // Position model
    hairModelRef.current.position.set(worldX, worldY, 0);
    
    // Scale based on face size
    const faceWidthWorld = (faceWidth / canvasWidth) * frustumWidth;
    const baseScale = hairModelRef.current.userData?.baseScale || 1.0;
    const scaleMultiplier = (faceWidthWorld * 1.8) * baseScale;
    
    hairModelRef.current.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
    hairModelRef.current.rotation.set(0, Math.PI, 0);
    hairModelRef.current.visible = true;
    
    // Render
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  // 🎨 AR HAIR OVERLAY - Render 3D hair on detected face
  const renderHairOverlay = (ctx, detection, canvas, faceCenterX, faceCenterY, faceWidth, faceHeight) => {
    if (!selectedHairstyle || !hair3DLoaded) return;
    
    // Update 3D hair position based on face detection (this also renders)
    updateHair3DPosition(faceCenterX, faceCenterY, faceWidth, faceHeight, canvas.width, canvas.height);
  };

  // Load hair images for AR overlay
  // Load hair images for AR overlay - DISABLED: Using GLB 3D models instead
  const loadHairImages = async () => {
    // No longer loading 2D images - all hairstyles use GLB 3D models
    console.log('🎨 [AR] Skipping 2D image loading - using GLB 3D models for all hairstyles');
    setHairImages({});
    hairImagesRef.current = {};
  };

  // Initialize Three.js and load 3D hair model when entering Step 2 and AR is active
  useEffect(() => {
    if (currentStep === 2 && isARActive && threeCanvasRef.current) {
      console.log('🎨 [3D] Initializing Three.js for AR...');
      
      const timer = setTimeout(() => {
        initializeThreeJS();
        setTimeout(() => {
          // Load FBX hair model
          loadHair3DModel();
        }, 300);
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentStep, isARActive]);

  // Reload 3D hair model when selected hairstyle changes
  useEffect(() => {
    if (currentStep === 2 && isARActive && selectedHairstyle && sceneRef.current) {
      console.log('🔄 [3D] Hairstyle changed, reloading FBX model for:', selectedHairstyle.name);
      loadHair3DModel();
    }
  }, [selectedHairstyle?.id]);

  // Animation loop for Three.js
  useEffect(() => {
    if (!isARActive || !hair3DLoaded || currentStep !== 2 || !rendererRef.current || !selectedHairstyle) {
      return;
    }
    
    console.log('▶️ [3D] Three.js rendering active');
    
    if (hairModelRef.current) {
      hairModelRef.current.visible = true;
    }
    
    // Render loop
    let animationFrameId;
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current && hairModelRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isARActive, hair3DLoaded, currentStep, selectedHairstyle]);

  // Analyze face structure from MediaPipe detection
  const analyzeFaceFromDetection = (detection, canvas) => {
    // Don't analyze in AR Mode (Step 2) - AR is just for trying on hairstyles
    if (currentStep === 2) {
      console.log("Analysis blocked: AR Mode - no analysis needed");
      return;
    }
    
    // Prevent multiple calls - use ref for synchronous check
    if (isAnalyzing || analysisComplete || !scanningCompleteRef.current) {
      console.log("Analysis blocked:", { isAnalyzing, analysisComplete, scanningComplete: scanningCompleteRef.current });
      return;
    }

    console.log("Starting face analysis...");
    setIsAnalyzing(true);

    // Extract face region for skin tone analysis
    const x = detection.boundingBox.xCenter * canvas.width;
    const y = detection.boundingBox.yCenter * canvas.height;
    const width = detection.boundingBox.width * canvas.width;
    const height = detection.boundingBox.height * canvas.height;

    // Get image data from face region
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(
      canvas.width - x - width / 2, // Mirror x coordinate
      y - height / 2,
      width,
      height
    );

    // Analyze face shape based on bounding box dimensions
    const aspectRatio = width / height;
    let detectedFaceShape = "oval"; // default

    if (aspectRatio > 0.85 && aspectRatio < 1.0) {
      detectedFaceShape = "round";
    } else if (aspectRatio > 1.0 && aspectRatio < 1.15) {
      detectedFaceShape = "oval";
    } else if (aspectRatio > 1.15) {
      detectedFaceShape = "oblong";
    } else if (aspectRatio < 0.75) {
      detectedFaceShape = "square";
    }

    // Analyze skin tone from face region
    const skinTone = analyzeSkinTone(imageData);

    // Capture the full face image for later use in AI image generation
    // This is YOUR photo that will be used to generate the hairstyle try-on!
    try {
      const captureCanvas = document.createElement('canvas');
      const captureCtx = captureCanvas.getContext('2d');
      
      // Use video directly
      const source = videoRef.current;
      
      if (source && source.videoWidth > 0 && source.videoHeight > 0) {
        // Use actual video dimensions for best quality
        captureCanvas.width = source.videoWidth;
        captureCanvas.height = source.videoHeight;
        
        // Mirror the image horizontally to match what the user sees in the camera preview
        captureCtx.save();
        captureCtx.scale(-1, 1); // Flip horizontally
        captureCtx.drawImage(source, -captureCanvas.width, 0, captureCanvas.width, captureCanvas.height);
        captureCtx.restore();
        
        // Convert to base64 and save - this is YOUR photo!
        const capturedImage = captureCanvas.toDataURL('image/jpeg', 0.95); // High quality
        setCapturedUserImage(capturedImage);
        console.log('📸 [CAPTURE] ✅ YOUR photo captured and saved (mirrored to match preview)!');
        console.log('📸 [CAPTURE] Image size:', capturedImage.length, 'chars');
        console.log('📸 [CAPTURE] This photo will be used to generate your hairstyle try-on!');
        
        // Show photo preview modal after capture
        setShowPhotoPreviewModal(true);
      } else {
        console.warn('📸 [CAPTURE] Video not ready, trying canvas...');
        // Fallback to canvas if video not available
        if (canvas) {
          captureCanvas.width = canvas.width;
          captureCanvas.height = canvas.height;
          // Canvas is already mirrored for display, so we keep it mirrored to match what user sees
          captureCtx.drawImage(canvas, 0, 0, captureCanvas.width, captureCanvas.height);
          
          const capturedImage = captureCanvas.toDataURL('image/jpeg', 0.95);
          setCapturedUserImage(capturedImage);
          console.log('📸 [CAPTURE] ✅ Photo captured from canvas (mirrored)!');
          
          // Show photo preview modal after capture
          setShowPhotoPreviewModal(true);
        }
      }
    } catch (error) {
      console.error('❌ [CAPTURE] Error capturing face image:', error);
    }

    // Simulate processing delay
    setTimeout(() => {
      const analysisResults = {
        facialStructure: detectedFaceShape,
        faceShape: detectedFaceShape,
        skinColor: skinTone.value,
        skinTone: skinTone,
        confidence: Math.floor(Math.random() * 10) + 90, // 90-100% confidence with MediaPipe
        faceDetected: true
      };
      
      console.log("Analysis complete:", analysisResults);
      
      setAiAnalysis(analysisResults);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      console.log("Analysis state updated, results should be visible now");
      
      // Automatically stop camera after analysis completes to show preferences
      // Use a delay to ensure user sees the completion message, then stop camera
      setTimeout(() => {
        // Stop camera but preserve analysisComplete state
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });
          videoRef.current.srcObject = null;
        }

        // Stop face mesh
        if (faceMeshRef.current) {
          faceMeshRef.current.close();
          faceMeshRef.current = null;
        }
        if (selfieSegmentationRef.current) {
          selfieSegmentationRef.current.close();
          selfieSegmentationRef.current = null;
        }

      // Clear detection interval (requestAnimationFrame)
      if (analysisIntervalRef.current) {
        try {
          cancelAnimationFrame(analysisIntervalRef.current);
        } catch (e) {
          // Fallback to clearInterval if it was an interval
          clearInterval(analysisIntervalRef.current);
        }
        analysisIntervalRef.current = null;
      }
        
        // Clear scanning countdown
        if (startScanningCountdown.current) {
          clearInterval(startScanningCountdown.current);
          startScanningCountdown.current = null;
        }

        // Reset scanning state but keep analysisComplete true
        setIsARActive(false);
        setIsAnalyzing(false);
        setFaceDetected(false);
        setIsScanning(false);
        setCountdown(0);
        setFacePositioned(false);
        setScanningComplete(false);
        
        // Reset refs
        scanningCompleteRef.current = false;
        analysisInitiatedRef.current = false;
        
        // Navigate to Face Shape selection after analysis
        setTimeout(() => {
          setCurrentStep(10); // Face Shape selection step
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }, 2000); // 2 second delay to show completion message
    }, 1500);
  };

  // Analyze skin tone from image data
  const analyzeSkinTone = (imageData) => {
    const pixels = imageData.data;
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    // Sample pixels from the face region
    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a > 0) {
        totalR += r;
        totalG += g;
        totalB += b;
        pixelCount++;
      }
    }

    if (pixelCount === 0) {
      return { value: "medium", label: "Medium", color: "#E0AC69" };
    }

    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;

    // Calculate brightness
    const brightness = (avgR + avgG + avgB) / 3;

    // Map brightness to skin tone
    const skinTones = [
      { value: "fair", label: "Fair", color: "#FDBCB4", threshold: 200 },
      { value: "light", label: "Light", color: "#F1C27D", threshold: 180 },
      { value: "medium", label: "Medium", color: "#E0AC69", threshold: 140 },
      { value: "olive", label: "Olive", color: "#C68642", threshold: 120 },
      { value: "tan", label: "Tan", color: "#8D5524", threshold: 100 },
      { value: "brown", label: "Brown", color: "#654321", threshold: 80 },
      { value: "dark", label: "Dark", color: "#4A3728", threshold: 60 },
      { value: "deep", label: "Deep", color: "#2C1810", threshold: 0 },
    ];

    // Find matching skin tone
    for (const tone of skinTones) {
      if (brightness >= tone.threshold) {
        return tone;
      }
    }

    return skinTones[2]; // Default to medium
  };


  // Initialize camera for AR
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check secure context - Chrome requires HTTPS or localhost for camera access
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '[::1]';
      const isSecureContext = window.isSecureContext || isLocalhost;
      
      // Wait a bit for navigator to be fully available (for some browsers)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if mediaDevices exists - it may not exist if not in secure context
      if (!isSecureContext && !isLocalhost) {
        const errorMsg = `Camera access requires a secure context. You're accessing via ${window.location.hostname}, which Chrome doesn't consider secure. Please use one of these options:\n\n1. Use localhost: http://localhost:5173/\n2. Use 127.0.0.1: http://127.0.0.1:5173/\n3. Set up HTTPS for your dev server\n\nChrome blocks camera access on HTTP connections to non-localhost IP addresses for security reasons.`;
        console.error("📹 [CAMERA] ❌", errorMsg);
        throw new Error(errorMsg);
      }
      
      // Polyfill for browsers that might not expose mediaDevices immediately
      if (!navigator.mediaDevices && (navigator.getUserMedia || navigator.webkitGetUserMedia)) {
        navigator.mediaDevices = {
          getUserMedia: function(constraints) {
            const getUserMedia = navigator.getUserMedia || 
                                 navigator.webkitGetUserMedia || 
                                 navigator.mozGetUserMedia;
            
            if (!getUserMedia) {
              return Promise.reject(new Error('getUserMedia is not supported'));
            }
            
            return new Promise((resolve, reject) => {
              getUserMedia.call(navigator, constraints, resolve, reject);
            });
          }
        };
      }
      
      let getUserMedia = null;
      
      // Try modern API first
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      } 
      // Try legacy APIs
      else if (navigator.getUserMedia && typeof navigator.getUserMedia === 'function') {
        getUserMedia = (constraints) => {
          return new Promise((resolve, reject) => {
            navigator.getUserMedia(constraints, resolve, reject);
          });
        };
      } else if (navigator.webkitGetUserMedia && typeof navigator.webkitGetUserMedia === 'function') {
        getUserMedia = (constraints) => {
          return new Promise((resolve, reject) => {
            navigator.webkitGetUserMedia(constraints, resolve, reject);
          });
        };
      } else if (navigator.mozGetUserMedia && typeof navigator.mozGetUserMedia === 'function') {
        getUserMedia = (constraints) => {
          return new Promise((resolve, reject) => {
            navigator.mozGetUserMedia(constraints, resolve, reject);
          });
        };
      }
      
      if (!getUserMedia) {
        // More detailed debugging
        console.error("📹 [CAMERA] ❌ Camera API not found");
        console.error("📹 [CAMERA] navigator.mediaDevices:", navigator.mediaDevices);
        console.error("📹 [CAMERA] 'mediaDevices' in navigator:", 'mediaDevices' in navigator);
        console.error("📹 [CAMERA] navigator.getUserMedia:", navigator.getUserMedia);
        console.error("📹 [CAMERA] 'getUserMedia' in navigator:", 'getUserMedia' in navigator);
        console.error("📹 [CAMERA] navigator.webkitGetUserMedia:", navigator.webkitGetUserMedia);
        console.error("📹 [CAMERA] window.isSecureContext:", window.isSecureContext);
        console.error("📹 [CAMERA] location.protocol:", window.location.protocol);
        console.error("📹 [CAMERA] location.hostname:", window.location.hostname);
        console.error("📹 [CAMERA] User Agent:", navigator.userAgent);
        
        const errorMsg = "Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge. Make sure you're accessing the page via http://localhost:5173 (not file://). For Opera GX, check browser settings and allow camera permissions.";
        throw new Error(errorMsg);
      }
      
      const stream = await getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Wait a moment if video element is not immediately available
      if (!videoRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set the stream to the video element
        video.srcObject = stream;
        
        // Ensure video attributes are set
        video.setAttribute('autoplay', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        
        // Set AR active immediately when stream is assigned
        setIsARActive(true);
        setIsLoading(false);
        
        // Wait for video to be ready
        const handleCanPlay = () => {
          video.play()
            .then(() => {
              
              // Force video to be visible
              video.style.display = 'block';
              video.style.visibility = 'visible';
              video.style.opacity = '1';
              
              // Initialize MediaPipe Face Detection
              initializeFaceDetection();
            })
            .catch(err => {
              console.error("Error playing video:", err);
              setError("Failed to start video playback. Please try again.");
            });
        };
        
        const handleLoadedMetadata = () => {
        };
        
        // Remove any existing event listeners
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('playing', handleCanPlay);
        
        // Add event listeners
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('playing', () => {
          setIsARActive(true);
          setIsLoading(false);
        }, { once: true });
        
        // Try to play immediately if ready
        if (video.readyState >= 2) {
          console.log("Video ready state:", video.readyState);
          video.play().catch(err => {
            console.log("Immediate play failed, waiting for canplay event:", err);
          });
        }
        
        // Fallback: try playing after a short delay
        setTimeout(() => {
          if (!isARActive && video.srcObject) {
            video.play().catch(err => {
              console.error("Fallback play failed:", err);
            });
          }
        }, 500);
      } else {
        // If video ref is not available, stop the stream
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element not available");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsLoading(false);
      setIsARActive(false);
      let errorMessage = "Unable to access camera. ";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera permissions in your browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage += "No camera found. Please connect a camera device.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += error.message || "Please ensure camera permissions are granted.";
      }
      setError(errorMessage);
    }
  };

  // Stop camera
  const stopCamera = () => {
    // Stop face mesh
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    if (selfieSegmentationRef.current) {
      selfieSegmentationRef.current.close();
      selfieSegmentationRef.current = null;
    }

    // Clear detection interval (could be setInterval or requestAnimationFrame)
    if (analysisIntervalRef.current) {
      if (typeof analysisIntervalRef.current === 'number') {
        // It's a requestAnimationFrame ID
        cancelAnimationFrame(analysisIntervalRef.current);
      } else {
        // It's a setInterval ID
        clearInterval(analysisIntervalRef.current);
      }
      analysisIntervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      videoRef.current.srcObject = null;
      setIsARActive(false);
      setIsAnalyzing(false);
      // Only reset analysisComplete if analysis hasn't finished yet
      // If analysis is complete, keep it true so preferences panel shows
      if (!analysisComplete) {
        setAnalysisComplete(false);
      }
      setFaceDetected(false);
      setIsScanning(false);
      setCountdown(0);
      setFacePositioned(false);
      setScanningComplete(false);
      
      // Reset refs
      scanningCompleteRef.current = false;
      analysisInitiatedRef.current = false;
      
      // Clear scanning countdown
      if (startScanningCountdown.current) {
        clearInterval(startScanningCountdown.current);
        startScanningCountdown.current = null;
      }
    }
  };

  // Get effective face shape (use override if provided, otherwise AI detection)
  const getEffectiveFaceShape = () => {
    return manualOverrides.faceShape || aiAnalysis.faceShape || aiAnalysis.facialStructure;
  };

  // Get effective skin tone (use override if provided, otherwise AI detection)
  const getEffectiveSkinTone = () => {
    if (manualOverrides.skinTone) {
      // Find the skin tone object from the list
      const skinTones = [
        { value: "fair", label: "Fair", color: "#FDBCB4" },
        { value: "light", label: "Light", color: "#F1C27D" },
        { value: "medium", label: "Medium", color: "#E0AC69" },
        { value: "olive", label: "Olive", color: "#C68642" },
        { value: "tan", label: "Tan", color: "#8D5524" },
        { value: "brown", label: "Brown", color: "#654321" },
        { value: "dark", label: "Dark", color: "#4A3728" },
        { value: "deep", label: "Deep", color: "#2C1810" },
      ];
      return skinTones.find(t => t.value === manualOverrides.skinTone) || aiAnalysis.skinTone;
    }
    return aiAnalysis.skinTone;
  };

  
  const calculateRecommendations = async () => {
    const effectiveFaceShape = getEffectiveFaceShape();
    const effectiveSkinTone = getEffectiveSkinTone();
    
    // Try AI recommendations using OpenRouter
    try {
      console.log('🤖 [OPENROUTER] ========================================');
      console.log('🤖 [OPENROUTER] Attempting AI recommendations via OpenRouter...');
      console.log('🤖 [OPENROUTER] AI will generate dynamic hairstyle recommendations');
      console.log('🤖 [OPENROUTER] ========================================');
      
      // Prepare user data for AI
      const userDataForAI = {
        gender: preferences.gender,
        faceShape: effectiveFaceShape || 'oval',
        skinTone: effectiveSkinTone,
        hairLength: preferences.hairLength,
        hairType: preferences.hairType,
        hairColor: preferences.hairColor,
        stylePreferences: preferences.stylePreferences,
        facialStructure: aiAnalysis.facialStructure,
        skinColor: aiAnalysis.skinColor,
        customDescription: customDescription || undefined
      };
      
      console.log('🤖 [OPENROUTER] User data for AI:', JSON.stringify(userDataForAI, null, 2));
      
      // Import and call the recommendation function
      const { getHairRecommendations } = await import('../api/recommendations');
      const aiRecs = await getHairRecommendations(userDataForAI);
      
      if (aiRecs && aiRecs.length > 0) {
        console.log('🤖 [OPENROUTER] ✅✅✅ Using AI-generated recommendations!', aiRecs.length, 'recommendations');
        console.log('🤖 [OPENROUTER] ✅✅✅ THESE ARE ACTUAL AI RECOMMENDATIONS (OpenRouter) ✅✅✅');
        setAreRecommendationsAIGenerated(true); // Mark as AI-generated
        return aiRecs;
      } else {
        console.log('');
        console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
        console.log('⚠️ [FALLBACK] AI RETURNED NO RECOMMENDATIONS');
        console.log('⚠️ [FALLBACK] FALLING BACK TO RULE-BASED RECOMMENDATIONS');
        console.log('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️');
        console.log('');
      }
    } catch (error) {
      console.log('');
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.log('❌ [FALLBACK] AI RECOMMENDATIONS FAILED');
      console.log('❌ [FALLBACK] Error:', error.message);
      console.log('❌ [FALLBACK] FALLING BACK TO RULE-BASED RECOMMENDATIONS');
      console.log('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌');
      console.log('');
    }
    
    // Fallback to rule-based recommendations
    console.log('📊 [RULE-BASED] Using fallback rule-based recommendations');
    setAreRecommendationsAIGenerated(false);
    
    // Safety check for hairstyleOptions
    if (!hairstyleOptions || !Array.isArray(hairstyleOptions)) {
      console.error('❌ [RULE-BASED] hairstyleOptions is not available');
      return [];
    }
    
    // Filter hairstyles by gender if specified
    let availableStyles = hairstyleOptions;
    if (preferences.gender) {
      availableStyles = hairstyleOptions.filter(style => 
        style.gender === preferences.gender || style.gender === "both"
      );
    }
    
    return availableStyles
      .map(style => {
        let matchScore = 0;
        const factors = {
          faceShape: 0,
          skinTone: 0,
          hairLength: 0,
          hairType: 0,
          stylePreferences: 0,
          baseScore: 0
        };
        
        // Factor 1: Face Shape Compatibility (Weight: 35%)
        // Get compatibility score for detected face shape
        if (effectiveFaceShape && style.faceShapeCompatibility && style.faceShapeCompatibility[effectiveFaceShape.toLowerCase()]) {
          factors.faceShape = style.faceShapeCompatibility[effectiveFaceShape.toLowerCase()];
        } else {
          // Default compatibility if face shape not found or no compatibility data
          factors.faceShape = 70;
        }
        matchScore += factors.faceShape * 0.35;
        
        // Factor 2: Skin Tone Compatibility (Weight: 20%)
        // Some hairstyles complement certain skin tones better
        if (effectiveSkinTone && style.skinToneCompatibility && style.skinToneCompatibility[effectiveSkinTone.value]) {
          factors.skinTone = style.skinToneCompatibility[effectiveSkinTone.value];
        } else {
          factors.skinTone = 75;
        }
        matchScore += factors.skinTone * 0.20;
        
        // Factor 3: Hair Length Preference (Weight: 25%)
        // Strong preference match gets high score
        if (preferences.hairLength) {
          if (style.category.toLowerCase() === preferences.hairLength.toLowerCase()) {
            factors.hairLength = 100; // Perfect match
          } else {
            // Partial match scoring
            const lengthHierarchy = { short: 1, medium: 2, long: 3 };
            const preferred = lengthHierarchy[preferences.hairLength.toLowerCase()] || 2;
            const styleLength = lengthHierarchy[style.category.toLowerCase()] || 2;
            const difference = Math.abs(preferred - styleLength);
            factors.hairLength = 100 - (difference * 20); // Penalize by 20 points per level difference
          }
        } else {
          factors.hairLength = 80; // Neutral score if no preference
        }
        matchScore += factors.hairLength * 0.25;
        
        // Factor 4: Hair Type Preference (Weight: 10%)
        if (preferences.hairType) {
          if (style.hairType === preferences.hairType.toLowerCase()) {
            factors.hairType = 100;
          } else {
            // Some types are compatible (e.g., wavy and curly)
            const compatibleTypes = {
              straight: ['straight'],
              wavy: ['wavy', 'curly'],
              curly: ['curly', 'wavy', 'coily'],
              coily: ['coily', 'curly']
            };
            const compatible = compatibleTypes[preferences.hairType.toLowerCase()] || [];
            if (compatible.includes(style.hairType)) {
              factors.hairType = 70; // Partial compatibility
            } else {
              factors.hairType = 40; // Low compatibility
            }
          }
        } else {
          factors.hairType = 75; // Neutral if no preference
        }
        matchScore += factors.hairType * 0.10;
        
        // Factor 5: Style Preferences Match (Weight: 10%)
        // Check if style tags match user's selected style preferences
        if (preferences.stylePreferences && preferences.stylePreferences.length > 0) {
          const matchingTags = style.styleTags.filter(tag => 
            preferences.stylePreferences.some(pref => 
              tag.toLowerCase() === pref.toLowerCase()
            )
          );
          if (matchingTags.length > 0) {
            // More matches = higher score
            factors.stylePreferences = 60 + (matchingTags.length * 15); // 60-90 range
          } else {
            factors.stylePreferences = 50; // No match
          }
        } else {
          factors.stylePreferences = 70; // Neutral if no preferences selected
        }
        matchScore += factors.stylePreferences * 0.10;
        
        // Calculate final score (0-100)
        const finalScore = Math.round(Math.min(100, Math.max(0, matchScore)));
        
        return {
          ...style,
          matchScore: finalScore,
          matchFactors: factors, // Store factors for debugging/display
          matchReasons: generateMatchReasons(style, factors, effectiveFaceShape, effectiveSkinTone),
          aiGenerated: false // Explicitly mark as NOT AI-generated (rule-based)
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5); // Get minimum 5 recommendations (will show top 3)
  };

  // Generate human-readable reasons for the match score
  const generateMatchReasons = (style, factors, faceShape, skinTone) => {
    const reasons = [];
    
    // Face shape reason
    if (factors.faceShape >= 85) {
      reasons.push(`Perfect for ${faceShape} face shapes`);
    } else if (factors.faceShape >= 75) {
      reasons.push(`Great match for ${faceShape} faces`);
    } else if (factors.faceShape < 70) {
      reasons.push(`May not be ideal for ${faceShape} faces`);
    }
    
    // Skin tone reason
    if (factors.skinTone >= 90) {
      reasons.push(`Complements ${skinTone?.label || 'your'} skin tone beautifully`);
    }
    
    // Hair length reason
    if (preferences.hairLength && factors.hairLength === 100) {
      reasons.push(`Matches your preferred ${preferences.hairLength} length`);
    }
    
    // Hair type reason
    if (preferences.hairType && factors.hairType === 100) {
      reasons.push(`Perfect for ${preferences.hairType} hair`);
    }
    
    // Style preference reason
    if (preferences.stylePreferences && preferences.stylePreferences.length > 0) {
      const matchingTags = style.styleTags.filter(tag => 
        preferences.stylePreferences.some(pref => 
          tag.toLowerCase() === pref.toLowerCase()
        )
      );
      if (matchingTags.length > 0) {
        reasons.push(`Matches your ${matchingTags.join(', ')} style preference`);
      }
    }
    
    return reasons;
  };

  const [recommendations, setRecommendations] = useState([]);
  const [areRecommendationsAIGenerated, setAreRecommendationsAIGenerated] = useState(false);

  // Handle preference change
  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle style preference toggle
  const toggleStylePreference = (pref) => {
    setPreferences(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(pref)
        ? prev.stylePreferences.filter(p => p !== pref)
        : [...prev.stylePreferences, pref]
    }));
  };

  // Handle scissors icon click - fly to right then transition

  const handleStart = () => {
    if (scissorsFlying) return; // Prevent multiple clicks
    
    // Capture button position before animation
    if (scissorsButtonRef.current) {
      const rect = scissorsButtonRef.current.getBoundingClientRect();
      setScissorsPosition({ left: rect.left, top: rect.top });
    }
    
    setScissorsFlying(true);
    // Wait for animation to complete (1s), then show mode selection
    setTimeout(() => {
      setShowLogo(false);
      setScissorsFlying(false);
    }, 1000);
  };
  
  // Handle mode selection
  const handleModeSelect = (mode) => {
    setAppMode(mode);
    if (mode === 'ai') {
      setCurrentStep(1); // Go to preferences for AI recommendations
    } else if (mode === 'ar') {
      setCurrentStep(2); // Go directly to AR try-on
      // Pre-load hair images for AR mode
      loadHair3DModel();
    } else if (mode === 'services') {
      setCurrentStep(11); // Go to services page
    } else if (mode === 'products') {
      setCurrentStep(12); // Go to products page
    }
  };

  // Note: Preference steps are now handled in a single page (step 1)
  // These functions are kept for backward compatibility but are no longer used

  // Proceed from Face Shape to Skin Color
  // Note: Face shape and skin color are now combined in step 10

  // Proceed from Skin Color to Summary
  const proceedToSummary = () => {
    setCurrentStep(8); // Summary step
  };

  // Handle Face Shape selection
  const handleFaceShapeSelect = (shape) => {
    setManualOverrides(prev => ({
      ...prev,
      faceShape: shape
    }));
  };

  // Handle Skin Color selection
  const handleSkinColorSelect = (skinTone) => {
    setManualOverrides(prev => ({
      ...prev,
      skinTone: skinTone
    }));
  };

  // Proceed from summary to recommendations
  const proceedToRecommendations = async () => {
    const recs = await calculateRecommendations();
    setRecommendations(recs.slice(0, 6)); // Show top 6
    setCurrentStep(9); // Recommendations step
  };

  // Generate recommendations when moving to try on step (old function - keep for compatibility)
  const proceedToTryOn = async () => {
    if (!analysisComplete) {
      alert("Please wait for face analysis to complete");
      return;
    }
    const recs = await calculateRecommendations();
    setRecommendations(recs.slice(0, 6)); // Show top 6
    setCurrentStep(2);
    // Auto-start camera when entering AR Try On step
    // Wait for React to render the video element
    setTimeout(() => {
      // Check if video element is available
      if (videoRef.current && !isARActive) {
        startCamera();
      } else if (!videoRef.current) {
        // Retry if video element not ready yet
        setTimeout(() => {
          if (videoRef.current && !isARActive) {
            startCamera();
          }
        }, 200);
      }
    }, 300);
  };

  // Apply hairstyle in AR
  const applyHairstyle = (hairstyle) => {
    setSelectedHairstyle(hairstyle);
    console.log("🎨 [AR] Applying hairstyle:", hairstyle.name, "ID:", hairstyle.id);
    console.log("🎨 [AR] Hair image cache status:", Object.keys(hairImageCache.current));
    console.log("🎨 [AR] hair3DLoaded:", hair3DLoaded);
    console.log("🎨 [AR] isARActive:", isARActive);
  };

  // Capture user's face image from video/canvas
  const captureUserFaceImage = () => {
    // Check if we have a valid source to capture from
    const source = videoRef.current || canvasRef.current;
    
    if (!source) {
      console.warn('No video or canvas available to capture');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get canvas context');
        return null;
      }
      
      // Get source dimensions
      let sourceWidth, sourceHeight;
      if (source instanceof HTMLVideoElement) {
        sourceWidth = source.videoWidth || source.clientWidth || 640;
        sourceHeight = source.videoHeight || source.clientHeight || 480;
      } else if (source instanceof HTMLCanvasElement) {
        sourceWidth = source.width || 640;
        sourceHeight = source.height || 480;
      }
      
      // Calculate portrait crop (3:4 aspect ratio) from center
      const targetAspect = 3 / 4; // Portrait aspect ratio
      let cropWidth, cropHeight, cropX, cropY;
      
      if (sourceWidth / sourceHeight > targetAspect) {
        // Source is wider than target - crop width
        cropHeight = sourceHeight;
        cropWidth = cropHeight * targetAspect;
        cropX = (sourceWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Source is taller than target - crop height
        cropWidth = sourceWidth;
        cropHeight = cropWidth / targetAspect;
        cropX = 0;
        cropY = (sourceHeight - cropHeight) / 2;
      }
      
      // Set canvas to portrait dimensions
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Invalid canvas dimensions:', canvas.width, 'x', canvas.height);
        return null;
      }
      
      // Draw the source to canvas and mirror it to match what user sees
      if (source instanceof HTMLVideoElement) {
        // Check if video is ready
        if (source.readyState < 2) {
          console.warn('Video not ready for capture, readyState:', source.readyState);
          return null;
        }
        
        // Mirror the video and crop to portrait
        ctx.save();
        ctx.scale(-1, 1); // Flip horizontally
        ctx.drawImage(
          source, 
          cropX, cropY, cropWidth, cropHeight,  // Source crop
          -canvas.width, 0, canvas.width, canvas.height  // Destination (mirrored)
        );
        ctx.restore();
      } else if (source instanceof HTMLCanvasElement) {
        // Canvas is already mirrored for display, crop to portrait
        ctx.drawImage(
          source,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, canvas.width, canvas.height
        );
      }
      
      // Convert to base64 with error handling
      try {
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Validate the image data
        if (!imageData || imageData === 'data:,') {
          console.error('Failed to generate image data');
          return null;
        }
        
        setCapturedUserImage(imageData);
        console.log('📸 [CAPTURE] User face image captured (portrait crop), size:', imageData.length, 'chars');
        return imageData;
      } catch (error) {
        console.error('Error converting canvas to data URL:', error);
        return null;
      }
    } catch (error) {
      console.error('Error capturing user image:', error);
    }
    
    return null;
  };

  // Compress and resize image before sending to API
  const compressAndResizeImage = (dataUrl, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      try {
        console.log('🖼️ [IMAGE COMPRESSION] Starting image compression...');
        console.log('🖼️ [IMAGE COMPRESSION] Original size:', dataUrl.length, 'chars');
        
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
              width = Math.min(width, maxWidth);
              height = width / aspectRatio;
            } else {
              height = Math.min(height, maxHeight);
              width = height * aspectRatio;
            }
          }
          
          console.log('🖼️ [IMAGE COMPRESSION] Resizing from', img.width, 'x', img.height, 'to', Math.round(width), 'x', Math.round(height));
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          console.log('🖼️ [IMAGE COMPRESSION] Compressed size:', compressedDataUrl.length, 'chars');
          console.log('🖼️ [IMAGE COMPRESSION] Size reduction:', ((1 - compressedDataUrl.length / dataUrl.length) * 100).toFixed(1) + '%');
          console.log('✅ [IMAGE COMPRESSION] Compression complete');
          
          resolve(compressedDataUrl);
        };
        
        img.onerror = (error) => {
          console.error('❌ [IMAGE COMPRESSION] Error loading image:', error);
          reject(new Error('Failed to load image for compression'));
        };
        
        img.src = dataUrl;
      } catch (error) {
        console.error('❌ [IMAGE COMPRESSION] Exception:', error);
        reject(error);
      }
    });
  };

  // Generate image of user with recommended hairstyle using OpenRouter
  const handleGenerateImage = async () => {
    if (!selectedRecommendationModal) {
      console.error('❌ [IMAGE] No hairstyle selected for generation');
      return;
    }

    setIsGeneratingImage(true);
    setGeneratedImage(null);

    try {
      console.log('🎨 [IMAGE] Starting image generation process...');
      
      // Use captured image from scanning, or try to capture now if not available
      let userImage = capturedUserImage;
      
      if (!userImage) {
        console.log('📸 [IMAGE] No saved image found, attempting to capture now...');
        
        // Check if camera is active and video is ready
        if (!videoRef.current || !videoRef.current.srcObject) {
          throw new Error('❌ [IMAGE] Camera is not active! Please start the camera first.');
        }
        
        if (videoRef.current.readyState < 2) {
          throw new Error('❌ [IMAGE] Camera is not ready! Please wait for the camera to load.');
        }
        
        userImage = captureUserFaceImage();
      } else {
        console.log('📸 [IMAGE] Using saved face image from scanning');
      }

      if (!userImage) {
        throw new Error('❌ [IMAGE] No user photo available! Cannot generate image-to-image without your photo!');
      }

      console.log('✅ [IMAGE] User image available, size:', userImage.length, 'chars');

      // Compress and resize image before sending
      console.log('🖼️ [IMAGE] Compressing image before sending to API...');
      const compressedImage = await compressAndResizeImage(userImage, 1024, 1024, 0.8);
      
      // Get user data for the prompt
      const userData = {
        gender: preferences.gender,
        faceShape: getEffectiveFaceShape(),
        skinTone: getEffectiveSkinTone(),
        facialStructure: aiAnalysis.facialStructure,
        skinColor: aiAnalysis.skinColor,
        hairColor: preferences.hairColor === "other" ? customHairColor : preferences.hairColor
      };

      console.log('🎨 [IMAGE] Generating image with:', {
        hairstyle: selectedRecommendationModal.name,
        userData,
        originalImageSize: userImage.length,
        compressedImageSize: compressedImage.length,
        compressionRatio: ((1 - compressedImage.length / userImage.length) * 100).toFixed(1) + '%'
      });

      // Import and call the image generation function with compressed image
      const { generateHairImage } = await import('../api/imageGeneration');
      const generatedImageUrl = await generateHairImage(compressedImage, selectedRecommendationModal, userData);
      
      if (generatedImageUrl) {
        console.log('✅ [IMAGE] Image generated successfully!');
        setGeneratedImage(generatedImageUrl);
        
        // Auto-close modal after successful generation
        setSelectedRecommendationModal(null);
        
        // Trigger sparkle effect
        setShowSparkleEffect(true);
        setTimeout(() => setShowSparkleEffect(false), 3000); // Hide after 3 seconds
      } else {
        throw new Error('Failed to generate image. No image returned from API.');
      }
    } catch (error) {
      console.error('🎨 [IMAGE] ❌ Error generating image:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to generate image. ';
      if (error.message?.includes('Proxy server') || error.message?.includes('CORS')) {
        errorMessage = '⚠️ Having trouble connecting to image service. If you have a proxy server, make sure it\'s running. Otherwise, the service may be temporarily unavailable.';
      } else if (error.message?.includes('billing') || error.message?.includes('limit')) {
        errorMessage += 'API limit reached. Please wait a moment and try again.';
      } else if (error.message?.includes('loading')) {
        errorMessage += 'The image service is loading. Please wait a moment and try again.';
      } else if (error.message?.includes('Invalid API key')) {
        errorMessage = '⚠️ API key issue. Please check your configuration.';
      } else {
        errorMessage += error.message || 'Please try again in a moment.';
      }
      
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGeneratingImage(false);
    }
  };


  // Voice-to-text functionality with better error handling
  const startVoiceRecognition = () => {
    console.log('🎙️ [Voice Recognition] startVoiceRecognition called');
    
    // Clear any previous errors
    setVoiceError(null);
    
    // Check if already listening
    if (isListening && recognitionRef.current) {
      console.log('⚠️ [Voice Recognition] Already listening, stopping first...');
      stopVoiceRecognition();
      // Wait a bit before starting again
      setTimeout(() => {
        startVoiceRecognition();
      }, 200);
      return;
    }

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorMsg = 'Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.';
      console.error('❌ [Voice Recognition]', errorMsg);
      setVoiceError(errorMsg);
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      console.log('🔧 [Voice Recognition] Configuring recognition...');
      recognition.continuous = true;
      recognition.interimResults = true; // Enable interim results for real-time typing
      recognition.lang = 'en-US';
      
      // Clear any existing interim transcript when starting
      setInterimTranscript('');
      interimTranscriptRef.current = '';
      
      console.log('✅ [Voice Recognition] Recognition configured:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang
      });

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        console.log('✅ [Voice Recognition] Started successfully - Microphone is active');
        console.log('👂 [Voice Recognition] Listening for speech...');
      };

      recognition.onresult = (event) => {
        console.log(`🎤 [Voice Recognition] onresult called - ${event.results.length} results, starting from index ${event.resultIndex}`);
        
        let interim = '';
        let final = '';

        // Process ALL results to get complete picture
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          
          console.log(`🎤 [Voice Recognition] Result ${i}: "${transcript}" (Final: ${isFinal})`);
          
          if (isFinal) {
            // Only process final results from resultIndex onwards (new final results)
            if (i >= event.resultIndex) {
              final += transcript + ' ';
            }
          } else {
            // All interim results matter for real-time display
            interim += transcript;
          }
        }

        // Find the latest interim result across ALL results for real-time typing
        let latestInterim = '';
        for (let i = event.results.length - 1; i >= 0; i--) {
          if (!event.results[i].isFinal) {
            latestInterim = event.results[i][0].transcript;
            break;
          }
        }

        // Handle final results FIRST - add to permanent text
        if (final) {
          console.log(`✅ [Voice Recognition] FINAL TEXT: "${final.trim()}"`);
          setCustomDescription(prev => {
            const newText = prev + final;
            console.log(`📝 [Voice Recognition] Updated customDescription: "${prev}" → "${newText.trim()}"`);
            return newText;
          });
        }

        // CRITICAL: Always update interim transcript for real-time typing
        // Use latestInterim (most recent) if available, otherwise use accumulated interim
        const interimToShow = latestInterim || interim;
        if (interimToShow) {
          console.log(`⏳ [Voice Recognition] INTERIM TEXT (REAL-TIME TYPING): "${interimToShow}"`);
          setInterimTranscript(interimToShow);
          interimTranscriptRef.current = interimToShow;
        } else {
          // No interim text - clear it
          console.log('🧹 [Voice Recognition] Clearing interim transcript (no interim results)');
          setInterimTranscript('');
          interimTranscriptRef.current = '';
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ [Voice Recognition] ERROR:', event.error);
        console.error('❌ [Voice Recognition] Error details:', event);
        setIsListening(false);
        
        let errorMessage = 'Voice recognition error. ';
        switch(event.error) {
          case 'no-speech':
            console.warn('⚠️ [Voice Recognition] No speech detected - user may not have spoken');
            errorMessage = 'No speech detected. Please speak clearly.';
            break;
          case 'audio-capture':
            console.error('❌ [Voice Recognition] No microphone found');
            errorMessage = 'No microphone found. Please check your microphone settings.';
            break;
          case 'not-allowed':
            console.error('❌ [Voice Recognition] Microphone permission denied');
            errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
            break;
          case 'network':
            console.error('❌ [Voice Recognition] Network error');
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            console.error(`❌ [Voice Recognition] Unknown error: ${event.error}`);
            errorMessage = `Error: ${event.error}. Please try again.`;
        }
        setVoiceError(errorMessage);
        setTimeout(() => setVoiceError(null), 7000);
      };

      recognition.onend = () => {
        console.log('🛑 [Voice Recognition] Recognition ended');
        setIsListening(false);
        // Save any remaining interim transcript when recognition ends
        const remainingInterim = interimTranscriptRef.current;
        if (remainingInterim) {
          console.log(`💾 [Voice Recognition] Saving interim text on end: "${remainingInterim}"`);
          setCustomDescription(prev => prev + remainingInterim + ' ');
          setInterimTranscript('');
          interimTranscriptRef.current = '';
        }
        // Auto-restart if it ended unexpectedly (but not if user clicked stop)
        // Only auto-restart if in Step 1 (Additional Notes section) and recognition ref still exists
        const shouldAutoRestart = recognitionRef.current && currentStep === 1;
        if (shouldAutoRestart) {
          console.log('🔄 [Voice Recognition] Auto-restarting...');
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('✅ [Voice Recognition] Auto-restarted successfully');
              } catch (e) {
                console.log('⚠️ [Voice Recognition] Auto-restart failed:', e.message);
              }
            }
          }, 100);
        }
      };

      // Store recognition reference BEFORE starting
      recognitionRef.current = recognition;
      
      // Start recognition
      console.log('🚀 [Voice Recognition] Starting recognition...');
      try {
        recognition.start();
        console.log('✅ [Voice Recognition] Start() called successfully');
      } catch (startError) {
        console.error('❌ [Voice Recognition] Error calling start():', startError);
        setVoiceError(`Failed to start: ${startError.message}`);
        setIsListening(false);
        recognitionRef.current = null;
      }
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setVoiceError('Failed to start voice recognition. Please check your microphone permissions and try again.');
      setIsListening(false);
      setTimeout(() => setVoiceError(null), 7000);
    }
  };

  const stopVoiceRecognition = () => {
    console.log('🛑 [Voice Recognition] Stop requested by user');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('✅ [Voice Recognition] Stop() called successfully');
      } catch (e) {
        console.log('⚠️ [Voice Recognition] Error stopping:', e.message);
      }
      
      // Clear reference BEFORE saving interim (to prevent auto-restart)
      const savedRecognition = recognitionRef.current;
      recognitionRef.current = null;
      
      setIsListening(false);
      
      // Save any remaining interim transcript to final text
      const remainingInterim = interimTranscriptRef.current;
      if (remainingInterim) {
        console.log(`💾 [Voice Recognition] Saving interim text on stop: "${remainingInterim}"`);
        setCustomDescription(prev => prev + remainingInterim + ' ');
        setInterimTranscript('');
        interimTranscriptRef.current = '';
      }
    } else {
      console.log('⚠️ [Voice Recognition] No recognition instance to stop');
      setIsListening(false);
    }
  };

  // Initialize color wheel canvas (for color wheel modal)
  useEffect(() => {
    if (showColorWheelModal && colorPickerMode === "wheel" && colorWheelCanvasRef.current) {
      // Small delay to ensure canvas is rendered and has dimensions
      const timer = setTimeout(() => {
        const canvas = colorWheelCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Get the actual displayed size from the canvas element
        const rect = canvas.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height) || 200;
        canvas.width = size;
        canvas.height = size;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 10;
        
        // Draw color wheel
        for (let angle = 0; angle < 360; angle += 1) {
          const startAngle = (angle - 1) * Math.PI / 180;
          const endAngle = angle * Math.PI / 180;
          
          for (let r = 0; r < radius; r++) {
            const x = centerX + r * Math.cos(startAngle);
            const y = centerY + r * Math.sin(startAngle);
            
            const hue = angle;
            const saturation = (r / radius) * 100;
            const lightness = 50;
            
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fillRect(x, y, 2, 2);
          }
        }
        
        // Draw indicator circle
        const indicatorAngle = (colorWheelIndicator.angle * Math.PI) / 180;
        const indicatorDistance = colorWheelIndicator.distance * radius;
        const indicatorX = centerX + indicatorDistance * Math.cos(indicatorAngle);
        const indicatorY = centerY + indicatorDistance * Math.sin(indicatorAngle);
        const indicatorRadius = Math.max(8, size / 40); // Scale indicator size with canvas
        
        // Draw white circle with dark border
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#160B53';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw inner dark circle for better visibility
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorRadius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = '#160B53';
        ctx.fill();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showColorWheelModal, colorPickerMode, colorWheelIndicator]);

  // Global mouse up handler to stop dragging when mouse leaves canvas
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDraggingColorWheel(false);
    };
    
    const handleTouchEnd = () => {
      setIsDraggingColorWheel(false);
    };

    if (isDraggingColorWheel) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingColorWheel]);

  // Update indicator position when color changes from palette or hex input (only if not dragging)
  useEffect(() => {
    if (showColorWheelModal && colorPickerMode === "wheel" && customHairColor && !isDraggingColorWheel) {
      // Convert hex to RGB
      const r = parseInt(customHairColor.slice(1, 3), 16);
      const g = parseInt(customHairColor.slice(3, 5), 16);
      const b = parseInt(customHairColor.slice(5, 7), 16);
      
      // Convert RGB to HSL
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Update indicator position
      // Distance is based on saturation (0-100% maps to 0-1)
      const distance = s / 100;
      setColorWheelIndicator({ angle: h, distance: Math.max(0, Math.min(1, distance)) });
    }
  }, [customHairColor, showColorWheelModal, colorPickerMode, isDraggingColorWheel]);

  // Auto-start camera when entering step 2 (AR section) or step 7 (Camera step)
  useEffect(() => {
    if ((currentStep === 2 || currentStep === 7) && !isARActive && !isLoading) {
      // Wait for React to render the video element and ensure navigator is available
      const timer = setTimeout(() => {
        // Check if navigator is available
        if (typeof navigator === 'undefined' || !navigator) {
          console.warn("📹 [CAMERA] Navigator not available yet, retrying...");
          setTimeout(() => {
            if (videoRef.current && !isARActive && !videoRef.current.srcObject) {
              startCamera();
            }
          }, 500);
          return;
        }
        
        if (videoRef.current && !isARActive && !videoRef.current.srcObject) {
          startCamera();
        } else if (!videoRef.current) {
          // Retry if video element not ready yet
          setTimeout(() => {
            if (videoRef.current && !isARActive && !videoRef.current.srcObject) {
              startCamera();
            }
          }, 500);
        }
      }, 500); // Increased delay to ensure everything is ready
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, isARActive, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop voice recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // Stop face mesh
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
      if (selfieSegmentationRef.current) {
        selfieSegmentationRef.current.close();
      }

      // Clear detection interval (requestAnimationFrame)
      if (analysisIntervalRef.current) {
        try {
          cancelAnimationFrame(analysisIntervalRef.current);
        } catch (e) {
          // Fallback to clearInterval if it was an interval
          clearInterval(analysisIntervalRef.current);
        }
        analysisIntervalRef.current = null;
      }
      
      // Clear scanning countdown
      if (startScanningCountdown.current) {
        clearInterval(startScanningCountdown.current);
      }
      
      // Reset refs
      scanningCompleteRef.current = false;
      analysisInitiatedRef.current = false;
      
      stopCamera();
    };
  }, []);

  // Handle Continue from photo preview modal
  const handleContinueFromPreview = async () => {
    setIsGeneratingRecommendations(true);
    // Generate recommendations directly and go to results
    const recs = await calculateRecommendations();
    setRecommendations(recs.slice(0, 6)); // Show top 6
    setIsGeneratingRecommendations(false);
    setShowPhotoPreviewModal(false);
    setCurrentStep(9); // Go directly to Recommendations
  };

  // Text-to-Speech Helper Function (disabled - was only for blind mode)
  const speak = (text, priority = false) => {
    // Text-to-speech disabled - removed blind mode functionality
    return;
  };

  // Stop speaking (disabled - was only for blind mode)
  const stopSpeaking = () => {
    // Stop speaking disabled - removed blind mode functionality
    return;
  };


  // Handle Retake from photo preview modal
  const handleRetakePhoto = () => {
    setShowPhotoPreviewModal(false);
    setCapturedUserImage(null);
    // Reset scanning state to allow re-scanning
    setScanningComplete(false);
    scanningCompleteRef.current = false;
    setAnalysisComplete(false);
    analysisInitiatedRef.current = false;
    setIsAnalyzing(false);
    setFaceDetected(false);
    setFacePositioned(false);
    setIsScanning(false);
    setCountdown(0);
    
    // Restart camera if it was stopped
    if (!isARActive && videoRef.current && !videoRef.current.srcObject) {
      startCamera();
    }
  };

  // Step 0: Logo Screen & Mode Selection
  if (currentStep === 0) {
    // Show logo with start button
    if (showLogo) {
      return (
        <div className={`h-screen w-screen bg-white flex items-center justify-center transition-opacity duration-500 min-h-screen ${showLogo ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center animate-scale-in w-full max-w-[1600px] px-4 sm:px-8 lg:px-16 xl:px-24">
            <img 
              src="/logo.jpg" 
              alt="David Salon Logo" 
              className="mx-auto mb-8 sm:mb-12 lg:mb-16 xl:mb-20 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl 2xl:max-w-3xl animate-scale-in"
              style={{ animationDelay: '0.2s' }}
            />
            <div className="mt-8 sm:mt-12 lg:mt-16 xl:mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <button
                ref={scissorsButtonRef}
                onClick={handleStart}
                className={`bg-[#160B53] hover:bg-[#12094A] text-white p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 2xl:p-16 kiosk:p-24 rounded-full shadow-lg kiosk:shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-0 cursor-pointer ${
                  scissorsFlying ? 'scissors-fly-right' : 'hover:scale-110 transition-all duration-300'
                }`}
                disabled={scissorsFlying}
                style={scissorsFlying ? {
                  position: 'fixed',
                  left: scissorsPosition.left + 'px',
                  top: scissorsPosition.top + 'px',
                  zIndex: 9999
                } : {}}
              >
                <Scissors 
                  className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28 2xl:h-32 2xl:w-32 kiosk:h-48 kiosk:w-48" 
                  style={{
                    transform: scissorsFlying ? 'rotate(360deg)' : 'none',
                    transition: scissorsFlying ? 'transform 1s ease-in-out' : 'none'
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Show mode selection after logo animation
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center min-h-screen animate-fade-in">
        <div className="text-center w-full max-w-5xl px-6">
          {/* Header */}
          <div className="mb-12">
            <img 
              src="/logo.jpg" 
              alt="David Salon Logo" 
              className="mx-auto mb-6 max-w-[200px] sm:max-w-[250px]"
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-3">
              Welcome!
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600">
              How would you like to find your perfect hairstyle?
            </p>
          </div>
          
          {/* Mode Selection Cards */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* AI Recommendation Mode */}
            <button
              onClick={() => handleModeSelect('ai')}
              className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl hover:shadow-2xl border-4 border-transparent hover:border-purple-400 transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                AI Recommendation
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Let our AI analyze your features and recommend the perfect hairstyles for you
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Personalized</span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">Smart Analysis</span>
              </div>
            </button>
            
            {/* AR Try-On Mode */}
            <button
              onClick={() => handleModeSelect('ar')}
              className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl hover:shadow-2xl border-4 border-transparent hover:border-blue-400 transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                AR Try-On
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Try different hairstyles on yourself in real-time using augmented reality
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Real-time</span>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">Interactive</span>
              </div>
            </button>

            {/* Services & Products Mode */}
            <button
              onClick={() => handleModeSelect('services')}
              className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl hover:shadow-2xl border-4 border-transparent hover:border-green-400 transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Scissors className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                Our Services
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Browse our professional salon services and pricing
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Haircut</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Treatment</span>
              </div>
            </button>

            {/* Products Mode */}
            <button
              onClick={() => handleModeSelect('products')}
              className="group bg-white rounded-3xl p-8 sm:p-10 shadow-xl hover:shadow-2xl border-4 border-transparent hover:border-orange-400 transition-all duration-300 hover:scale-105 text-left"
            >
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                Products
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Shop our professional hair care products
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">Shampoo</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">Styling</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-hidden flex flex-col min-h-screen desktop:max-h-[100vh] desktop:h-[100vh] kiosk:h-[3180px] kiosk:max-h-[3180px]"
    >
      {/* Header - Minimalist with centered logo */}
      <div className="bg-white h-14 sm:h-16 md:h-20 lg:h-24 xl:h-28 desktop:h-16 kiosk:h-32 flex items-center justify-center relative px-4 sm:px-8 lg:px-16 xl:px-24 desktop:px-8 flex-shrink-0 border-b-2 border-gray-200 desktop:border-b">
        {/* Centered Logo */}
        <div className="flex items-center justify-center">
          <img 
            src="/logo.jpg" 
            alt="David Salon Logo" 
            className="h-10 sm:h-12 md:h-16 lg:h-20 kiosk:h-24 object-contain"
          />
        </div>
        
        {/* Reset Button - Top Right */}
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="absolute right-2 sm:right-4 md:right-8 lg:right-16 xl:right-24 top-1/2 -translate-y-1/2 border-2 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-600 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl kiosk:text-2xl px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 kiosk:px-12 kiosk:py-6 h-auto rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 kiosk:h-8 kiosk:w-8 mr-1 sm:mr-2 lg:mr-3" />
          Reset
        </Button>
      </div>

      {/* Step 1: Wizard-Style Preferences - McDonald's Kiosk Style */}
      {currentStep === 1 && (
        <div className="flex-1 overflow-hidden bg-white animate-fade-in min-h-0 relative">
          <div className="w-full h-full flex">
            
            {/* Left Sidebar - Thumbnail Navigation (McDonald's Style) */}
            <div className="w-20 sm:w-24 md:w-28 bg-gray-50 border-r-2 border-gray-200 py-2 flex flex-col items-center gap-1 overflow-y-auto">
              {[
                { id: 1, icon: "👤", label: "Gender", check: preferences.gender },
                { id: 2, icon: "✂️", label: "Length", check: preferences.hairLength },
                { id: 3, icon: "〰️", label: "Type", check: preferences.hairType },
                { id: 4, icon: "🎨", label: "Color", check: preferences.hairColor },
                { id: 5, icon: "✨", label: "Style", check: preferences.stylePreferences?.length > 0 },
                { id: 6, icon: "📝", label: "Notes", check: customDescription?.length > 0 }
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setPreferenceStep(step.id)}
                  className={`w-16 sm:w-20 md:w-24 aspect-square rounded-xl border-3 transition-all duration-200 flex flex-col items-center justify-center gap-0.5 relative ${
                    preferenceStep === step.id
                      ? 'border-[#160B53] bg-white shadow-lg ring-2 ring-[#160B53]/20'
                      : step.check
                        ? 'border-green-400 bg-green-50 hover:bg-green-100'
                        : 'border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl md:text-4xl">{step.icon}</span>
                  <span className={`text-[10px] sm:text-xs font-semibold ${
                    preferenceStep === step.id ? 'text-[#160B53]' : step.check ? 'text-green-600' : 'text-gray-500'
                  }`}>{step.label}</span>
                  {step.check && preferenceStep !== step.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
              
              {/* Continue Button at bottom of sidebar */}
              <div className="mt-auto pt-2 border-t border-gray-200 w-full px-1">
                <button
                  onClick={() => {
                    stopCamera();
                    setCurrentStep(7);
                  }}
                  disabled={!preferences.gender}
                  className={`w-full aspect-square rounded-xl border-3 flex flex-col items-center justify-center gap-0.5 transition-all ${
                    preferences.gender
                      ? 'border-[#160B53] bg-[#160B53] text-white hover:bg-[#12094A]'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-[10px] sm:text-xs font-semibold">Camera</span>
                </button>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-purple-700 text-white px-6 sm:px-8 py-4 sm:py-5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                  {preferenceStep === 1 && "Select Your Gender"}
                  {preferenceStep === 2 && "Preferred Hair Length"}
                  {preferenceStep === 3 && "Your Hair Type"}
                  {preferenceStep === 4 && "Hair Color Preference"}
                  {preferenceStep === 5 && "Style Preferences"}
                  {preferenceStep === 6 && "Additional Notes"}
                </h1>
                <p className="text-white/80 mt-1 text-sm sm:text-base md:text-lg">
                  {preferenceStep === 1 && "This helps us recommend the best hairstyles for you"}
                  {preferenceStep === 2 && "What length are you looking for?"}
                  {preferenceStep === 3 && "What's your natural hair texture?"}
                  {preferenceStep === 4 && "What color do you prefer?"}
                  {preferenceStep === 5 && "Select styles that match your personality (multiple allowed)"}
                  {preferenceStep === 6 && "Any specific requests or preferences? (Optional)"}
                </p>
              </div>
              
              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
                
                {/* Step 1: Gender */}
                {preferenceStep === 1 && (
                  <div className="grid grid-cols-2 gap-6 sm:gap-8 w-full max-w-3xl animate-fade-in">
                    {[
                      { value: "male", symbol: "♂", label: "Male", color: "#3B82F6", bg: "from-blue-50 to-blue-100" },
                      { value: "female", symbol: "♀", label: "Female", color: "#EC4899", bg: "from-pink-50 to-pink-100" }
                    ].map(({ value, symbol, label, color, bg }) => (
                      <button
                        key={value}
                        onClick={() => {
                          handlePreferenceChange("gender", value);
                          setTimeout(() => setPreferenceStep(2), 300);
                        }}
                        className={`p-6 sm:p-8 aspect-[3/4] rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 bg-gradient-to-br ${bg} ${
                          preferences.gender === value
                            ? "border-[#160B53] shadow-2xl ring-4 ring-[#160B53]/20"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <span className="text-7xl sm:text-8xl md:text-9xl font-bold" style={{ color: preferences.gender === value ? "#160B53" : color }}>
                          {symbol}
                        </span>
                        <span className={`text-xl sm:text-2xl md:text-3xl font-bold ${preferences.gender === value ? "text-[#160B53]" : "text-gray-700"}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Step 2: Hair Length */}
                {preferenceStep === 2 && (
                  <div className="animate-fade-in w-full max-w-4xl flex flex-col">
                    <div className="grid grid-cols-3 gap-3 sm:gap-5">
                      {[
                        { 
                          length: "Short", 
                          maleImage: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/Crew-Cut-Fade.webp?v=1755505078",
                          femaleImage: "https://entertainment.inquirer.net/files/2024/09/Michelle-Dee-Voice-for-Change-09162024.png"
                        },
                        { 
                          length: "Medium", 
                          maleImage: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/middle-part-mullet-haircut-men.webp?v=1758288627",
                          femaleImage: "https://content.latest-hairstyles.com/wp-content/uploads/simple-shoulder-length-hairstyles-ideas-500x375.jpg"
                        },
                        { 
                          length: "Long", 
                          maleImage: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/long-korean-haircut-men.webp?v=1761209100",
                          femaleImage: "https://assets-metrostyle.abs-cbn.com/prod/metrostyle/attachments/44e931b3-7ffd-44de-b6c8-3ddb53fdfb53_screen%20shot%202024-01-02%20at%2011.44.15%20am.png"
                        }
                      ].map(({ length, maleImage, femaleImage }) => (
                        <button
                          key={length}
                          onClick={() => {
                            handlePreferenceChange("hairLength", length.toLowerCase());
                            setTimeout(() => setPreferenceStep(3), 300);
                          }}
                          className={`relative overflow-hidden rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 aspect-[3/4] ${
                            preferences.hairLength === length.toLowerCase()
                              ? "border-[#160B53] shadow-xl ring-4 ring-[#160B53]/30"
                              : "border-transparent hover:border-purple-300"
                          }`}
                        >
                          <img 
                            src={preferences.gender === "male" ? maleImage : femaleImage} 
                            alt={length}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          {/* Label */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                            <span className="text-white text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg">
                              {length}
                            </span>
                          </div>
                          {/* Selected indicator */}
                          {preferences.hairLength === length.toLowerCase() && (
                            <div className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#160B53] rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Step 3: Hair Type */}
                {preferenceStep === 3 && (
                  <div className="animate-fade-in w-full max-w-4xl flex flex-col">
                    <div className="grid grid-cols-4 gap-3 sm:gap-5">
                      {[
                        { value: "straight", label: "Straight", maleImage: "/HairType/straightM.png", femaleImage: "/HairType/straight.png" },
                        { value: "wavy", label: "Wavy", maleImage: "/HairType/wavyM.png", femaleImage: "/HairType/wavy.png" },
                        { value: "curly", label: "Curly", maleImage: "/HairType/curlyM.png", femaleImage: "/HairType/curly.png" },
                        { value: "coily", label: "Coily", maleImage: "/HairType/coilyM.png", femaleImage: "/HairType/coily.png" }
                      ].map(({ value, label, maleImage, femaleImage }) => (
                        <button
                          key={value}
                          onClick={() => {
                            handlePreferenceChange("hairType", value);
                            setTimeout(() => setPreferenceStep(4), 300);
                          }}
                          className={`relative overflow-hidden rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 aspect-[3/4] ${
                            preferences.hairType === value
                              ? "border-[#160B53] shadow-xl ring-4 ring-[#160B53]/30"
                              : "border-transparent hover:border-purple-300"
                          }`}
                        >
                          <img 
                            src={preferences.gender === "male" ? maleImage : femaleImage} 
                            alt={label}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          {/* Label */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                            <span className="text-white text-lg sm:text-xl lg:text-2xl font-bold drop-shadow-lg">
                              {label}
                            </span>
                          </div>
                          {/* Selected indicator */}
                          {preferences.hairType === value && (
                            <div className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#160B53] rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Step 4: Hair Color */}
                {preferenceStep === 4 && (
                  <div className="animate-fade-in w-full max-w-5xl flex flex-col gap-6">
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3 sm:gap-4">
                      {[
                        { value: "jet-black", label: "Jet Black", color: "#0a0a0a" },
                        { value: "natural-black", label: "Natural Black", color: "#1c1c1c" },
                        { value: "dark-brown", label: "Dark Brown", color: "#3b2314" },
                        { value: "medium-brown", label: "Medium Brown", color: "#5c4033" },
                        { value: "light-brown", label: "Light Brown", color: "#8b6914" },
                        { value: "chestnut", label: "Chestnut", color: "#954535" },
                        { value: "caramel", label: "Caramel", color: "#a67b5b" },
                        { value: "honey-blonde", label: "Honey Blonde", color: "#c9a86c" },
                        { value: "golden-blonde", label: "Golden Blonde", color: "#d4a84b" },
                        { value: "platinum-blonde", label: "Platinum Blonde", color: "#e8e4c9" },
                        { value: "ash-blonde", label: "Ash Blonde", color: "#b8a990" },
                        { value: "strawberry-blonde", label: "Strawberry Blonde", color: "#cc8866" },
                        { value: "auburn", label: "Auburn", color: "#922724" },
                        { value: "copper", label: "Copper", color: "#b87333" },
                        { value: "burgundy", label: "Burgundy", color: "#722f37" },
                        { value: "red", label: "Red", color: "#8b0000" },
                        { value: "silver-gray", label: "Silver Gray", color: "#a8a8a8" },
                        { value: "pink", label: "Pink", color: "#ff69b4" },
                        { value: "purple", label: "Purple", color: "#800080" },
                        { value: "blue", label: "Blue", color: "#0066cc" },
                        { value: "green", label: "Green", color: "#228b22" },
                        { value: "orange", label: "Orange", color: "#ff8c00" },
                        { value: "teal", label: "Teal", color: "#008080" },
                        { value: "lavender", label: "Lavender", color: "#e6e6fa" },
                        { value: "rose-gold", label: "Rose Gold", color: "#b76e79" },
                        { value: "pastel-pink", label: "Pastel Pink", color: "#ffd1dc" },
                        { value: "electric-blue", label: "Electric Blue", color: "#7df9ff" }
                      ].map(({ value, label, color }) => (
                        <button
                          key={value}
                          onClick={() => {
                            handlePreferenceChange("hairColor", value);
                            setTimeout(() => setPreferenceStep(5), 300);
                          }}
                          className={`p-3 sm:p-4 rounded-xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-2 bg-white ${
                            preferences.hairColor === value
                              ? "border-[#160B53] shadow-xl ring-4 ring-[#160B53]/30"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                        >
                          <div
                            className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-gray-300 shadow-inner"
                            style={{ background: color }}
                          />
                          <span className={`text-[10px] sm:text-xs lg:text-sm font-bold text-center leading-tight ${
                            preferences.hairColor === value ? "text-[#160B53]" : "text-gray-700"
                          }`}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Step 5: Style Preferences */}
                {preferenceStep === 5 && (
                  <div className="animate-fade-in w-full max-w-5xl flex flex-col">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        { name: "Professional", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face" },
                        { name: "Casual", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face" },
                        { name: "Elegant", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face" },
                        { name: "Trendy", image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=500&fit=crop&crop=face" },
                        { name: "Classic", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face" },
                        { name: "Bold", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&crop=face" },
                        { name: "Natural", image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face" },
                        { name: "Edgy", image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=500&fit=crop&crop=face" }
                      ].map(({ name, image }) => (
                        <button
                          key={name}
                          onClick={() => toggleStylePreference(name)}
                          className={`relative overflow-hidden rounded-2xl border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 aspect-[3/4] ${
                            preferences.stylePreferences?.includes(name)
                              ? "border-[#160B53] shadow-xl ring-4 ring-[#160B53]/30"
                              : "border-transparent hover:border-purple-300"
                          }`}
                        >
                          <img 
                            src={image} 
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          {/* Label */}
                          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                            <span className="text-white text-lg sm:text-xl lg:text-2xl font-bold drop-shadow-lg">
                              {name}
                            </span>
                          </div>
                          {/* Selected indicator */}
                          {preferences.stylePreferences?.includes(name) && (
                            <div className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-[#160B53] rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Done button */}
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => setPreferenceStep(6)}
                        className="flex items-center gap-3 px-10 py-4 bg-[#160B53] text-white text-xl font-semibold rounded-xl hover:bg-[#1e0f6b] transition-colors"
                      >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Step 6: Additional Notes */}
                {preferenceStep === 6 && (
                  <div className="animate-fade-in w-full h-full flex flex-col">
                    {/* Quick suggestion buttons */}
                    <div className="flex flex-wrap gap-2 justify-center px-4 pb-3">
                      {[
                        "Low maintenance",
                        "Easy to style",
                        "Round face",
                        "Oval face",
                        "Square face",
                        "Thin hair",
                        "Thick hair",
                        "Work appropriate",
                        "Youthful look",
                        "Mature look"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            const current = customDescription || "";
                            if (!current.includes(suggestion)) {
                              setCustomDescription(current ? `${current}, ${suggestion}` : suggestion);
                            }
                          }}
                          className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                            customDescription?.includes(suggestion)
                              ? "bg-[#160B53] text-white border-[#160B53]"
                              : "bg-white text-gray-700 border-gray-300 hover:border-[#160B53] hover:text-[#160B53]"
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    
                    {/* Text display area - takes remaining space */}
                    <div className="flex-1 mx-4 mb-3 p-4 text-lg border-2 border-gray-200 rounded-xl bg-white overflow-y-auto">
                      {customDescription || <span className="text-gray-400">Tap suggestions or use keyboard below...</span>}
                    </div>
                    
                    {/* Continue button */}
                    <div className="flex justify-center pb-3">
                      <button
                        onClick={() => {
                          stopCamera();
                          setCurrentStep(7);
                        }}
                        className="flex items-center gap-3 px-10 py-4 bg-[#160B53] text-white text-xl font-semibold rounded-xl hover:bg-[#1e0f6b] transition-colors"
                      >
                        Continue to Camera
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Virtual Keyboard - fixed at bottom */}
                    <div className="bg-gray-100 p-2 space-y-1">
                      {/* Row 1 */}
                      <div className="flex gap-1">
                        {['Q','W','E','R','T','Y','U','I','O','P'].map((key) => (
                          <button
                            key={key}
                            onClick={() => setCustomDescription((prev) => (prev || '') + key.toLowerCase())}
                            className="flex-1 py-6 bg-white rounded-lg text-2xl font-semibold active:bg-gray-200"
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                      {/* Row 2 */}
                      <div className="flex gap-1 px-4">
                        {['A','S','D','F','G','H','J','K','L'].map((key) => (
                          <button
                            key={key}
                            onClick={() => setCustomDescription((prev) => (prev || '') + key.toLowerCase())}
                            className="flex-1 py-6 bg-white rounded-lg text-2xl font-semibold active:bg-gray-200"
                          >
                            {key}
                          </button>
                        ))}
                      </div>
                      {/* Row 3 */}
                      <div className="flex gap-1 px-8">
                        {['Z','X','C','V','B','N','M'].map((key) => (
                          <button
                            key={key}
                            onClick={() => setCustomDescription((prev) => (prev || '') + key.toLowerCase())}
                            className="flex-1 py-6 bg-white rounded-lg text-2xl font-semibold active:bg-gray-200"
                          >
                            {key}
                          </button>
                        ))}
                        <button
                          onClick={() => setCustomDescription((prev) => (prev || '').slice(0, -1))}
                          className="px-6 py-6 bg-gray-300 rounded-lg text-2xl font-semibold active:bg-gray-400"
                        >
                          ⌫
                        </button>
                      </div>
                      {/* Row 4 - Space and special */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCustomDescription((prev) => (prev || '') + ', ')}
                          className="px-6 py-6 bg-white rounded-lg text-2xl font-semibold active:bg-gray-200"
                        >
                          ,
                        </button>
                        <button
                          onClick={() => setCustomDescription((prev) => (prev || '') + ' ')}
                          className="flex-1 py-6 bg-white rounded-lg text-xl font-semibold active:bg-gray-200"
                        >
                          Space
                        </button>
                        <button
                          onClick={() => setCustomDescription('')}
                          className="px-6 py-6 bg-gray-300 rounded-lg text-xl font-semibold active:bg-gray-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Camera - Face/Skintone Checker */}
      {currentStep === 7 && (
        <div className="flex-1 flex flex-col bg-black overflow-hidden relative animate-fade-in">
          {/* Back Button - Top Left */}
          <div className="absolute top-4 left-4 z-30">
            <Button
              onClick={() => {
                stopCamera();
                setCurrentStep(1); // Go back to preferences
              }}
              variant="outline"
              className="bg-white/90 hover:bg-white text-gray-800 text-lg px-6 py-3 h-auto rounded-xl shadow-lg"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </div>
          
          {/* Camera View - fills available space */}
          <div className="flex-1 relative overflow-hidden">
            {/* Video element - fills container */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${isARActive ? 'block' : 'hidden'}`}
              style={{ 
                transform: 'scaleX(-1)'
              }}
            />
            
            {/* Canvas overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 2 }}
            />
            
            {/* Face Guide Frame - Corner brackets for face positioning */}
            {isARActive && !scanningComplete && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="relative w-80 h-96 sm:w-96 sm:h-[450px] md:w-[450px] md:h-[520px] lg:w-[500px] lg:h-[580px]">
                  {/* Top Left Corner */}
                  <div className={`absolute top-0 left-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-4 border-l-4 ${facePositioned ? 'border-green-400' : 'border-white'} rounded-tl-lg`} />
                  {/* Top Right Corner */}
                  <div className={`absolute top-0 right-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-t-4 border-r-4 ${facePositioned ? 'border-green-400' : 'border-white'} rounded-tr-lg`} />
                  {/* Bottom Left Corner */}
                  <div className={`absolute bottom-0 left-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-4 border-l-4 ${facePositioned ? 'border-green-400' : 'border-white'} rounded-bl-lg`} />
                  {/* Bottom Right Corner */}
                  <div className={`absolute bottom-0 right-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 border-b-4 border-r-4 ${facePositioned ? 'border-green-400' : 'border-white'} rounded-br-lg`} />
                </div>
              </div>
            )}
                  
            {/* Start Button - Simple */}
            {!isARActive && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center">
                  <Button
                    onClick={startCamera}
                    disabled={isLoading}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl kiosk:text-6xl font-bold px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 lg:px-16 lg:py-8 xl:px-20 xl:py-10 2xl:px-24 2xl:py-12 kiosk:px-48 kiosk:py-20 kiosk:min-h-[120px] h-auto rounded-lg sm:rounded-xl lg:rounded-2xl kiosk:rounded-3xl shadow-xl sm:shadow-2xl kiosk:shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                  >
                    Start
                  </Button>
                </div>
              </div>
            )}
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28 2xl:h-32 2xl:w-32 mx-auto mb-4 sm:mb-6 lg:mb-8 animate-spin" />
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold">Starting camera...</p>
                </div>
              </div>
            )}
                  
            {/* Face Positioning Guide - Text at bottom, not blocking face */}
            {isARActive && currentStep === 7 && !scanningComplete && !isAnalyzing && !isScanning && (
              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center z-20">
                {faceDetected && facePositioned ? (
                  <>
                    {/* Camera Shutter Button */}
                    <button
                      onClick={handleManualCapture}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-gray-400 hover:bg-gray-100 active:bg-red-500 transition-colors" />
                    </button>
                  </>
                ) : (
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-4 text-center text-white pointer-events-none">
                    {faceDetected ? (
                      <p className="text-lg sm:text-xl md:text-2xl font-semibold text-yellow-400">Move face to center</p>
                    ) : (
                      <p className="text-lg sm:text-xl md:text-2xl font-semibold">Position your face in the frame</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Countdown Timer Overlay */}
            {isScanning && isARActive && currentStep === 7 && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <div className="text-9xl font-bold text-white drop-shadow-lg animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Manual capture mode - automatic overlays disabled */}
            {/* Scanning Countdown Overlay - DISABLED for manual capture
            {isScanning && isARActive && currentStep === 7 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] 2xl:text-[12rem] font-bold mb-4 sm:mb-6 lg:mb-8 text-green-400 animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold mb-2 sm:mb-3 lg:mb-4">Stay Still!</p>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl opacity-75">Scanning your face...</p>
                </div>
              </div>
            )}
            */}
            
            {/* Analyzing overlay - Show when user captures and analysis is running */}
            {isAnalyzing && isARActive && currentStep === 7 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
                <div className="text-center text-white bg-black/70 px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-12 rounded-lg sm:rounded-xl lg:rounded-2xl backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 mx-auto mb-2 sm:mb-3 lg:mb-4 animate-spin" />
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-semibold">Analyzing facial structure...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 10: Face Shape & Skin Color Selection (Combined) */}
      {currentStep === 10 && (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 animate-fade-in min-h-0 overflow-y-auto">
          <div className="w-full max-w-[1800px] px-4 sm:px-8 lg:px-16 xl:px-24 py-4 sm:py-8">
            <Card className="bg-white border-2 sm:border-4 lg:border-8 border-purple-200 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl animate-scale-in">
              <CardContent className="p-4 sm:p-8 lg:p-12 xl:p-16 2xl:p-20">
                {/* Face Shape Section */}
                <div className="mb-8 sm:mb-12 lg:mb-16">
                  <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6">Select Your Face Shape</h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-gray-600 mb-2 sm:mb-3">Detected: <span className="font-bold capitalize">{getEffectiveFaceShape() || "N/A"}</span></p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-500">You can override the detection if needed</p>
                  </div>
                      
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10">
                    {[
                      { value: "oval", label: "Oval", path: "M 100 30 Q 130 30 150 50 Q 170 80 160 120 Q 150 160 130 180 Q 100 190 70 180 Q 50 160 40 120 Q 30 80 50 50 Q 70 30 100 30 Z" },
                      { value: "round", label: "Round", path: "M 100 30 Q 160 30 180 100 Q 180 170 100 190 Q 20 170 20 100 Q 20 30 100 30 Z" },
                      { value: "square", label: "Square", path: "M 50 30 L 150 30 L 170 50 L 170 150 L 150 170 L 50 170 L 30 150 L 30 50 Z" },
                      { value: "oblong", label: "Oblong", path: "M 100 20 Q 140 20 160 40 L 170 90 Q 170 130 160 160 L 100 180 Q 60 180 40 160 L 30 130 Q 30 90 40 40 Z" },
                      { value: "heart", label: "Heart", path: "M 100 40 Q 80 50 60 70 L 50 100 Q 40 120 50 140 L 70 160 Q 90 180 100 190 Q 110 180 130 160 L 150 140 Q 160 120 150 100 L 140 70 Q 120 50 100 40 Z" },
                      { value: "diamond", label: "Diamond", path: "M 100 30 L 150 80 L 100 170 L 50 80 Z" }
                    ].map((shape) => {
                      const effectiveShape = getEffectiveFaceShape();
                      const isSelected = effectiveShape === shape.value;
                      const isDetected = (aiAnalysis.faceShape || aiAnalysis.facialStructure) === shape.value && !manualOverrides.faceShape;
                      
                      return (
                        <button
                          key={shape.value}
                          type="button"
                          onClick={() => handleFaceShapeSelect(shape.value)}
                          className={`p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 sm:border-[3px] md:border-4 lg:border-[5px] transition-all ${
                            isSelected
                              ? "border-[#160B53] bg-purple-50 shadow-xl scale-105"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:scale-105"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                            <div className="relative">
                              <svg width="80" height="96" viewBox="0 0 200 240" className="mx-auto sm:w-[100px] sm:h-[120px] md:w-[120px] md:h-[144px] lg:w-[140px] lg:h-[168px]">
                                <path
                                  d={shape.path}
                                  fill={isSelected ? "#160B53" : "#E5E7EB"}
                                  stroke={isSelected ? "#160B53" : "#9CA3AF"}
                                  strokeWidth="4"
                                  className="transition-all"
                                />
                              </svg>
                              {isDetected && !isSelected && (
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-yellow-400 text-yellow-900 text-xs sm:text-sm md:text-base lg:text-lg px-2 py-1 rounded-full font-bold">
                                  Auto
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-[#160B53] text-white text-xs sm:text-sm md:text-base lg:text-lg px-2 py-1 rounded-full font-bold">
                                  ✓
                                </div>
                              )}
                            </div>
                            <p className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold ${isSelected ? "text-[#160B53]" : "text-gray-700"}`}>
                              {shape.label}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t-2 sm:border-t-3 md:border-t-4 border-gray-200 my-6 sm:my-8 lg:my-10"></div>

                {/* Skin Color Section */}
                <div>
                  <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-800 mb-3 sm:mb-4 lg:mb-6">Select Your Skin Color</h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-gray-600 mb-2 sm:mb-3">Detected: <span className="font-bold capitalize">{getEffectiveSkinTone()?.label || "N/A"}</span></p>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-500">You can override the detection if needed</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10">
                    {[
                      { value: "fair", label: "Fair", color: "#FDBCB4" },
                      { value: "light", label: "Light", color: "#F1C27D" },
                      { value: "medium", label: "Medium", color: "#E0AC69" },
                      { value: "olive", label: "Olive", color: "#C68642" },
                      { value: "tan", label: "Tan", color: "#8D5524" },
                      { value: "brown", label: "Brown", color: "#654321" },
                      { value: "dark", label: "Dark", color: "#4A3728" },
                      { value: "deep", label: "Deep", color: "#2C1810" }
                    ].map((tone) => {
                      const effectiveTone = getEffectiveSkinTone();
                      const isSelected = effectiveTone?.value === tone.value;
                      const isDetected = aiAnalysis.skinTone?.value === tone.value && !manualOverrides.skinTone;
                      
                      return (
                        <button
                          key={tone.value}
                          type="button"
                          onClick={() => handleSkinColorSelect(tone.value)}
                          className={`p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 sm:border-[3px] md:border-4 lg:border-[5px] transition-all ${
                            isSelected
                              ? "border-[#160B53] bg-purple-50 shadow-xl scale-105"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 hover:scale-105"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
                            <div className="relative">
                              <div
                                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full border-2 sm:border-[3px] md:border-4 border-gray-300 shadow-lg"
                                style={{ backgroundColor: tone.color }}
                              />
                              {isDetected && !isSelected && (
                                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-yellow-900 text-xs sm:text-sm md:text-base lg:text-lg px-2 py-0.5 rounded-full font-bold">
                                  Auto
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-[#160B53] text-white text-xs sm:text-sm md:text-base lg:text-lg px-2 py-0.5 rounded-full font-bold">
                                  ✓
                                </div>
                              )}
                            </div>
                            <p className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold ${isSelected ? "text-[#160B53]" : "text-gray-700"}`}>
                              {tone.label}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 sm:mt-12 lg:mt-16 xl:mt-20 pt-6 sm:pt-8 lg:pt-10 xl:pt-12 border-t-2 sm:border-t-4 lg:border-t-6 xl:border-t-8 border-gray-200">
                  <Button
                    onClick={() => setCurrentStep(7)}
                    variant="outline"
                    className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 lg:px-12 lg:py-6 xl:px-16 xl:py-10 kiosk:px-32 kiosk:py-14 kiosk:min-h-[100px] text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-4xl kiosk:text-5xl font-bold rounded-lg sm:rounded-xl lg:rounded-2xl kiosk:rounded-3xl border-2 sm:border-[3px] md:border-4 lg:border-[6px] xl:border-8 kiosk:border-[6px] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 kiosk:h-20 kiosk:w-20 mr-2 sm:mr-3 lg:mr-4 kiosk:mr-6 rotate-180 inline" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={proceedToSummary}
                    className="px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 lg:px-20 lg:py-8 xl:px-32 xl:py-10 2xl:px-48 2xl:py-14 kiosk:px-64 kiosk:py-20 kiosk:min-h-[120px] text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-4xl kiosk:text-6xl font-bold bg-[#160B53] hover:bg-[#12094A] text-white rounded-lg sm:rounded-xl lg:rounded-2xl kiosk:rounded-3xl shadow-xl sm:shadow-2xl kiosk:shadow-[0_20px_60px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 kiosk:hover:scale-110"
                  >
                    Continue to Summary
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12 kiosk:h-20 kiosk:w-20 ml-2 sm:ml-3 lg:ml-4 kiosk:ml-6 inline" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 8: Summary */}
      {currentStep === 8 && (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 animate-fade-in min-h-0">
          <div className="w-full max-w-[1800px] px-24">
            <Card className="bg-white border-8 border-purple-200 rounded-3xl shadow-2xl animate-scale-in">
              <CardContent className="p-20">
                <div className="text-center mb-16">
                  <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-8" />
                  <h2 className="text-8xl font-bold text-gray-800 mb-8">Summary</h2>
                  <p className="text-4xl text-gray-600">Review your information before generating recommendations</p>
                      </div>
                
                <div className="space-y-12">
                  {/* Face Analysis */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-16 rounded-3xl shadow-xl animate-slide-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-6 mb-12">
                      <Brain className="h-16 w-16 text-purple-600" />
                      <h3 className="text-6xl font-bold text-gray-800">Face Analysis</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        <p className="text-4xl text-gray-600 mb-6">Face Shape</p>
                        <p className="text-7xl font-bold text-gray-800 capitalize">{getEffectiveFaceShape() || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-4xl text-gray-600 mb-6">Skin Tone</p>
                        <div className="flex items-center gap-6">
                          <div
                            className="w-24 h-24 rounded-full border-4 border-gray-300 shadow-lg"
                            style={{ backgroundColor: getEffectiveSkinTone()?.color || "#E0AC69" }}
                          />
                          <p className="text-7xl font-bold text-gray-800 capitalize">{getEffectiveSkinTone()?.label || "N/A"}</p>
                        </div>
                      </div>
                      </div>
                    </div>
                    
                  {/* Preferences */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-16 rounded-3xl shadow-xl animate-slide-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-6 mb-12">
                      <Palette className="h-16 w-16 text-blue-600" />
                      <h3 className="text-6xl font-bold text-gray-800">Your Preferences</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                        <p className="text-4xl text-gray-600 mb-6">Gender</p>
                        <p className="text-6xl font-bold text-gray-800 capitalize">{preferences.gender || "Not set"}</p>
                        </div>
                        <div>
                        <p className="text-4xl text-gray-600 mb-6">Hair Length</p>
                        <p className="text-6xl font-bold text-gray-800 capitalize">{preferences.hairLength || "Any"}</p>
                        </div>
                      <div>
                        <p className="text-4xl text-gray-600 mb-6">Hair Type</p>
                        <p className="text-6xl font-bold text-gray-800 capitalize">{preferences.hairType || "Any"}</p>
                      </div>
                      <div>
                        <p className="text-4xl text-gray-600 mb-6">Hair Color</p>
                        <p className="text-6xl font-bold text-gray-800 capitalize">{preferences.hairColor || "Any"}</p>
                      </div>
                      <div>
                        <p className="text-4xl text-gray-600 mb-6">Styles</p>
                        <p className="text-5xl font-bold text-gray-800">{preferences.stylePreferences.join(", ") || "None"}</p>
                      </div>
                      </div>
                    {customDescription && (
                      <div className="mt-12 pt-12 border-t-4 border-gray-200">
                        <p className="text-4xl text-gray-600 mb-6">Custom Description</p>
                        <p className="text-4xl text-gray-800">{customDescription}</p>
                      </div>
                    )}
                    </div>

                    {/* Proceed Button */}
                  <div className="pt-12 border-t-8 border-gray-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                      <Button
                      onClick={proceedToRecommendations}
                      className="w-full bg-[#160B53] hover:bg-[#12094A] text-white py-12 text-6xl font-bold rounded-3xl shadow-2xl transition-all hover:scale-105"
                      >
                      <Sparkles className="h-16 w-16 mr-6 inline" />
                      Generate Recommendations
                      <ArrowRight className="h-16 w-16 ml-6 inline" />
                      </Button>
                  </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

      {/* Step 9: Recommendations - AI Generated Images Only (No AR) */}
      {currentStep === 9 && (
        <div className="flex-1 flex flex-col bg-black animate-fade-in min-h-0 overflow-hidden">
          {/* Image Display - Top Section */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            {/* Retake Button - Top Left */}
            <div className="absolute top-4 left-4 z-20">
              <Button
                onClick={() => {
                  setCapturedUserImage(null);
                  setGeneratedImage(null);
                  setRecommendations([]);
                  setCurrentStep(7); // Go back to camera
                  startCamera();
                }}
                variant="outline"
                className="bg-white/90 hover:bg-white text-gray-800 text-lg px-6 py-3 h-auto rounded-xl shadow-lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Retake Photo
              </Button>
            </div>
            
            {/* Show generated image or captured photo */}
            <div className="relative w-full h-full">
              {generatedImage ? (
                <>
                  <img 
                    src={generatedImage} 
                    alt={`You with ${selectedRecommendationModal?.name || 'selected'} hairstyle`}
                    className="w-full h-full object-contain bg-black"
                  />
                  
                  {/* Sparkle/Bling Effect Overlay */}
                  {showSparkleEffect && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {/* Animated sparkles */}
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute animate-sparkle"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${1 + Math.random() * 1}s`,
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-300">
                            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="currentColor"/>
                          </svg>
                        </div>
                      ))}
                      
                      {/* Glowing border effect */}
                      <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg animate-pulse opacity-75"></div>
                      
                      {/* Success message */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce-in">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-8 w-8 animate-spin" />
                          <span className="text-2xl font-bold">New Look Generated!</span>
                          <Sparkles className="h-8 w-8 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : capturedUserImage ? (
                <img 
                  src={capturedUserImage} 
                  alt="Your photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white h-full">
                  <Sparkles className="h-24 w-24 mb-6 opacity-50" />
                  <p className="text-3xl font-semibold">Generate an image to see preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Bar - Bottom Section */}
          <div className="bg-gradient-to-t from-white via-white to-purple-50 border-t-4 border-purple-300 p-6 sm:p-8">
            {recommendations.length === 0 ? (
              <div className="text-center py-16">
                <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-[#160B53]" />
                <p className="text-2xl text-gray-600">Generating recommendations...</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
                  <Sparkles className="h-8 w-8 text-purple-500" />
                  Recommended For You
                  <Sparkles className="h-8 w-8 text-purple-500" />
                </h3>
                <div 
                  className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 px-2" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitScrollbar: { display: 'none' }
                  }}
                >
                  {recommendations.map((style, idx) => (
                    <div
                      key={style.id}
                      onClick={() => setSelectedRecommendationModal(style)}
                      className="flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <div className={`
                        relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300
                        ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500' : 
                          idx === 1 ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-400' :
                          'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-400'}
                        p-1
                      `}>
                        <div className="bg-white rounded-xl p-4 sm:p-5 min-w-[160px] sm:min-w-[180px]">
                          {/* Match Score Badge */}
                          <div className={`
                            absolute -top-1 -right-1 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center
                            ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-purple-500' : 'bg-blue-500'}
                            text-white font-bold text-lg sm:text-xl rounded-full shadow-lg
                            border-4 border-white
                          `}>
                            {style.matchScore}%
                          </div>
                          
                          {/* Rank Badge */}
                          {idx < 3 && (
                            <div className={`
                              inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold mb-3
                              ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                idx === 1 ? 'bg-gray-100 text-gray-600' : 
                                'bg-orange-100 text-orange-600'}
                            `}>
                              {idx === 0 ? '🥇 Best Match' : idx === 1 ? '🥈 Great Choice' : '🥉 Good Fit'}
                            </div>
                          )}
                          
                          {/* Hairstyle Name */}
                          <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 pr-8">{style.name}</h4>
                          
                          {/* Category & Type */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              {style.category}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {style.hairType}
                            </span>
                          </div>
                          
                          {/* Try Button */}
                          <div className="flex items-center justify-center gap-2 mt-4 py-2 bg-[#160B53] text-white rounded-xl font-semibold text-base sm:text-lg hover:bg-[#1a0d66] transition-colors">
                            <Sparkles className="h-5 w-5" />
                            Try This Style
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: AR Try-On Section - Predefined 3D Models Only */}
      {currentStep === 2 && (
        <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
          {/* Camera container - takes remaining space above the hairstyle bar */}
          <div className="flex-1 relative overflow-hidden">
            {/* Video element - fills container */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${isARActive ? 'block' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ display: selectedHairstyle && isARActive ? "block" : "none" }}
            />
            {/* Three.js canvas for 3D hair rendering */}
            <canvas
              ref={threeCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ 
                display: selectedHairstyle && isARActive && hair3DLoaded ? "block" : "none", 
                zIndex: 10,
                backgroundColor: 'transparent'
              }}
            />
            
            {!isARActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white">
                  <Camera className="h-32 w-32 mx-auto mb-8 opacity-50" />
                  <p className="text-4xl mb-12 font-semibold">Camera not active</p>
                  <Button
                    onClick={startCamera}
                    disabled={isLoading}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-3xl px-16 py-8 h-auto rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-8 w-8 mr-4 animate-spin" />
                        Starting Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mr-4" />
                        Start Camera
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Predefined Hairstyle Selection for AR - Filter Style */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-6 border-t border-white/20">
            <div 
              className="flex justify-center gap-6 overflow-x-auto pb-2" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none'
              }}
            >
              {/* Show all predefined hairstyles */}
              {hairstyleOptions.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    applyHairstyle(style);
                    setSelectedHairstyle(style);
                    console.log('🎨 [AR] Predefined hairstyle selected for AR:', style.name);
                  }}
                  className={`flex-shrink-0 relative group transition-all duration-200 ${
                    selectedHairstyle?.id === style.id
                      ? "scale-110 z-10"
                      : "hover:scale-105"
                  }`}
                >
                  {/* Circular Image Container - LARGER */}
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 transition-all ${
                    selectedHairstyle?.id === style.id
                      ? "border-white shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                      : "border-white/40 group-hover:border-white/80"
                  }`}>
                    <img 
                      src={style.image} 
                      alt={style.name}
                      className="w-full h-full object-cover bg-gray-800"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-gray-700 text-white">
                      <Scissors className="h-10 w-10" />
                    </div>
                  </div>
                  
                  {/* Selected Indicator */}
                  {selectedHairstyle?.id === style.id && (
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Back Button */}
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => {
                  stopCamera();
                  setSelectedHairstyle(null);
                  setAppMode(null);
                  setCurrentStep(0);
                  setShowLogo(false);
                }}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white text-sm px-6 py-2 h-auto rounded-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Smart Recommendations */}
      {currentStep === 3 && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-16 py-12">
            <Card className="shadow-lg border-0">
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <Sparkles className="h-12 w-12 text-[#160B53]" />
                  <h2 className="text-4xl font-bold text-gray-800">Smart Recommendations</h2>
                </div>
                
                {/* FALLBACK BANNER - Show when using rule-based */}
                {!areRecommendationsAIGenerated && (
                  <div className="mb-8 p-6 bg-yellow-100 border-4 border-yellow-500 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-10 w-10 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-yellow-800 mb-2">
                          ⚠️ Using Rule-Based Recommendations
                        </h3>
                        <p className="text-xl text-yellow-700">
                          AI recommendations are unavailable. These recommendations are generated using a rule-based algorithm based on face shape, skin tone, and preferences matching.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI SUCCESS BANNER - Show when using AI */}
                {areRecommendationsAIGenerated && (
                  <div className="mb-8 p-6 bg-green-100 border-4 border-green-500 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-green-800 mb-2">
                          ✅ AI-Powered Recommendations
                        </h3>
                        <p className="text-xl text-green-700">
                          These recommendations are generated using OpenRouter AI based on your facial structure, skin tone, and preferences.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-2xl text-gray-600 mb-10">
                  Based on your facial structure ({getEffectiveFaceShape()}), skin tone ({getEffectiveSkinTone()?.label || getEffectiveSkinTone()?.value}), and preferences, here are our top recommendations:
                </p>

                {/* INFO: Hairstyle preview images are placeholders */}
                <div className="mb-6 p-4 bg-blue-100 border-2 border-blue-400 rounded-lg">
                  <p className="text-lg text-blue-800">
                    ℹ️ <strong>Note:</strong> The hairstyle preview images below are placeholders.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendations.map((style) => (
                    <Card
                      key={style.id}
                      className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => setSelectedRecommendationModal(style)}
                    >
                      <div className="relative bg-gradient-to-br from-purple-100 to-pink-100" style={{ height: "300px" }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-20 w-20 text-purple-300" />
                        </div>
                        <div className="absolute top-4 right-4 bg-[#160B53] text-white text-xl font-bold px-4 py-2 rounded-full">
                          {style.matchScore}% Match
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{style.name}</h3>
                        <p className="text-xl text-gray-500 mb-4">{style.category} Length • {style.hairType}</p>
                        {style.matchReasons && style.matchReasons.length > 0 ? (
                          <div className="space-y-2">
                            {style.matchReasons.map((reason, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-base text-gray-600">
                                <Heart className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-lg text-gray-600">
                            <Heart className="h-5 w-5 text-red-500" />
                            <span>Perfect for {getEffectiveFaceShape()} faces</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-12">
                  <Button
                    onClick={() => {
                      setCurrentStep(2);
                      // Auto-start camera when entering AR section
                      setTimeout(() => {
                        if (videoRef.current && !isARActive) {
                          startCamera();
                        }
                      }, 300);
                    }}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-2xl px-10 py-6 h-auto rounded-xl"
                  >
                    <Camera className="h-6 w-6 ml-3" />
                    Try AR
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep(1);
                      setAnalysisComplete(false);
                      setAiAnalysis({
                        facialStructure: null,
                        faceShape: null,
                        skinColor: null,
                        skinTone: null,
                        confidence: 0,
                        faceDetected: false
                      });
                      setPreferences({
                        hairLength: "",
                        stylePreferences: [],
                        hairType: "",
                        occasion: ""
                      });
                      setManualOverrides({
                        faceShape: null,
                        skinTone: null
                      });
                      stopCamera();
                    }}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-2xl px-10 py-6 h-auto rounded-xl"
                  >
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recommendation Modal - Shows WHY a hairstyle was recommended */}
      {selectedRecommendationModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8"
          onClick={() => setSelectedRecommendationModal(null)}
        >
          <Card 
            className="max-w-3xl w-full max-h-[85vh] bg-white shadow-2xl border-0 rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                    {selectedRecommendationModal.name}
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-4 mt-1">
                    <span className="text-lg sm:text-xl lg:text-2xl text-gray-600">{selectedRecommendationModal.category}</span>
                    <span className="text-lg sm:text-xl lg:text-2xl text-gray-400">•</span>
                    <span className="text-lg sm:text-xl lg:text-2xl text-gray-600 capitalize">{selectedRecommendationModal.hairType}</span>
                    <span className="ml-2 sm:ml-4 bg-[#160B53] text-white text-lg sm:text-xl lg:text-2xl font-bold px-4 sm:px-6 py-1.5 sm:py-3 rounded-full">
                      {selectedRecommendationModal.matchScore}% Match
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRecommendationModal(null);
                  // Keep generatedImage so it shows in main view
                }}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8" />
              </Button>
            </div>

            {/* Recommendation Details - Full Width */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {/* Why Recommendation Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 border-2 sm:border-4 border-purple-200">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Why We Recommend This For You</h3>
                  </div>
                  
                  {selectedRecommendationModal.whyRecommendation ? (
                    <p className="text-base sm:text-lg lg:text-2xl text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedRecommendationModal.whyRecommendation}
                    </p>
                  ) : selectedRecommendationModal.matchReasons && selectedRecommendationModal.matchReasons.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {selectedRecommendationModal.matchReasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-3 sm:gap-4">
                          <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 mt-1" />
                          <p className="text-base sm:text-lg lg:text-2xl text-gray-700">{reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg lg:text-2xl text-gray-700">
                      This hairstyle is recommended based on your facial structure, skin tone, and style preferences.
                    </p>
                  )}
                </div>

                {/* Compatibility Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">Face Shape Compatibility</h4>
                    <div className="space-y-2">
                      {selectedRecommendationModal.faceShapeCompatibility && Object.entries(selectedRecommendationModal.faceShapeCompatibility).map(([shape, score]) => (
                        <div key={shape} className="flex items-center justify-between">
                          <span className="text-sm sm:text-base lg:text-lg text-gray-600 capitalize">{shape}</span>
                          <span className={`text-sm sm:text-base lg:text-lg font-semibold ${score >= 85 ? 'text-green-600' : score >= 75 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">Style Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecommendationModal.styleTags?.map((tag, idx) => (
                        <span key={idx} className="bg-purple-100 text-purple-700 text-sm sm:text-base lg:text-lg px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-base sm:text-lg lg:text-2xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 h-auto rounded-xl disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3" />
                        Generate AI Image
                      </>
                    )}
                  </Button>
                </div>
            </div>
          </Card>
        </div>
      )}

      {/* Photo Preview Modal */}
      {showPhotoPreviewModal && capturedUserImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              {isGeneratingRecommendations ? (
                /* Loading State - Coffee Shop Style */
                <div className="text-center py-12">
                  <div className="relative mb-8">
                    {/* Animated Scissors */}
                    <div className="relative w-32 h-32 mx-auto">
                      <Scissors className="h-24 w-24 text-[#160B53] mx-auto animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-purple-200 border-t-[#160B53] rounded-full animate-spin"></div>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    Finding Your Perfect Style...
                  </h2>
                  <p className="text-xl text-gray-500 mb-6">
                    Our AI stylist is analyzing your features
                  </p>
                  
                  {/* Progress Messages */}
                  <div className="space-y-3 text-lg text-gray-600">
                    <p className="animate-pulse">✨ Analyzing face shape...</p>
                    <p className="animate-pulse delay-100">🎨 Matching skin tone...</p>
                    <p className="animate-pulse delay-200">💇 Curating hairstyles...</p>
                  </div>
                </div>
              ) : (
                /* Normal Preview State */
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">
                      Photo Captured!
                    </h2>
                  </div>

                  {/* Photo Preview */}
                  <div className="rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 mb-6">
                    <img
                      src={capturedUserImage}
                      alt="Your captured photo"
                      className="w-full h-auto max-h-[55vh] object-contain mx-auto"
                    />
                  </div>
                  
                  {/* Detection Results - Side by side */}
                  <div className="flex gap-4 mb-6">
                    {/* Face Shape */}
                    <div className="flex-1 bg-purple-50 rounded-xl p-5 border-2 border-purple-200 text-center">
                      <p className="text-base text-purple-600 font-medium mb-2">Face Shape</p>
                      <p className="text-2xl font-bold text-purple-800 capitalize">
                        {aiAnalysis?.faceShape || 'Detecting...'}
                      </p>
                    </div>
                    
                    {/* Skin Tone */}
                    <div className="flex-1 bg-orange-50 rounded-xl p-5 border-2 border-orange-200 text-center">
                      <p className="text-base text-orange-600 font-medium mb-2">Skin Tone</p>
                      <div className="flex items-center justify-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-orange-300"
                          style={{ backgroundColor: aiAnalysis?.skinTone?.color || '#E0AC69' }}
                        />
                        <p className="text-2xl font-bold text-orange-800 capitalize">
                          {aiAnalysis?.skinTone?.label || aiAnalysis?.skinColor || 'Detecting...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleRetakePhoto}
                      variant="outline"
                      className="text-xl px-8 py-5 h-auto rounded-xl border-2 border-gray-300"
                    >
                      <Camera className="h-6 w-6 mr-3" />
                      Retake
                    </Button>
                    <Button
                      onClick={handleContinueFromPreview}
                      className="bg-[#160B53] hover:bg-[#12094A] text-white text-xl px-8 py-5 h-auto rounded-xl"
                    >
                      <Sparkles className="h-6 w-6 mr-3" />
                      Get Recommendations
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hair Length Modal */}
      {showHairLengthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 xl:p-16 max-w-6xl lg:max-w-7xl xl:max-w-[90vw] w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 border-2 border-purple-100">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-6 lg:mb-8 pb-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Ruler className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800">Choose Specific Hair Length</h2>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-500 mt-1">Drag the slider or select a preset to customize your length</p>
                </div>
              </div>
              <button
                onClick={() => setShowHairLengthModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-110 active:scale-95"
                aria-label="Close modal"
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-6 lg:space-y-8">
              {/* Quick Preset Buttons */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border-2 border-purple-100">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">Quick Presets:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {[
                    { label: "Very Short", value: 10, icon: "✂️" },
                    { label: "Short", value: 20, icon: "👤" },
                    { label: "Chin Length", value: 35, icon: "💇" },
                    { label: "Shoulder", value: 50, icon: "👔" },
                    { label: "Armpit", value: 70, icon: "🎯" },
                    { label: "Mid-Chest", value: 90, icon: "✨" }
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setHairLengthValue(preset.value);
                        if (preset.value < 25) {
                          handlePreferenceChange("hairLength", "short");
                        } else if (preset.value < 75) {
                          handlePreferenceChange("hairLength", "medium");
                        } else {
                          handlePreferenceChange("hairLength", "long");
                        }
                      }}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all transform hover:scale-105 active:scale-95 ${
                        Math.abs(hairLengthValue - preset.value) < 5
                          ? "border-[#160B53] bg-[#160B53] text-white shadow-lg scale-105"
                          : "border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:bg-purple-50"
                      }`}
                    >
                      <div className="text-xl sm:text-2xl lg:text-3xl mb-1">{preset.icon}</div>
                      <div className="text-xs sm:text-sm lg:text-base font-semibold">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Visual Hair Representation */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 border-2 border-gray-200 shadow-inner min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] xl:min-h-[700px] flex items-center justify-center overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-purple-300 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-300 rounded-full blur-3xl"></div>
                </div>
                
                {/* Combined SVG with Head and Hair */}
                <div className="relative z-10">
                  <svg 
                    className="w-full max-w-3xl h-auto drop-shadow-lg"
                    viewBox="0 0 300 500"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Body reference line (vertical guide) */}
                    <line 
                      x1="150" 
                      y1="120" 
                      x2="150" 
                      y2="480" 
                      stroke="#E5E7EB" 
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                    
                    {/* Head circle - enhanced styling */}
                    <circle 
                      cx="150" 
                      cy="120" 
                      r="60" 
                      fill="white" 
                      stroke="#9CA3AF" 
                      strokeWidth="4"
                      className="drop-shadow-md"
                    />
                    {/* Head inner detail */}
                    <circle 
                      cx="150" 
                      cy="120" 
                      r="50" 
                      fill="none" 
                      stroke="#E5E7EB" 
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    
                    {/* Hair strands with enhanced styling */}
                    {Array.from({ length: 15 }).map((_, i) => {
                      const x = 40 + (i * 14);
                      const circleTop = 60;
                      const hairHeight = 30 + (hairLengthValue * 3.5);
                      const yStart = circleTop;
                      const yEnd = yStart + hairHeight;
                      const color = hairLengthValue < 25 ? "#8B4513" : hairLengthValue < 75 ? "#A0522D" : "#654321";
                      const width = hairLengthValue < 25 ? 4 : hairLengthValue < 75 ? 5 : 6;
                      
                      return (
                        <path
                          key={i}
                          d={`M ${x} ${yStart} Q ${x + (i % 2 === 0 ? 6 : -6)} ${yStart + hairHeight * 0.4} ${x + (i % 3 === 0 ? 3 : -3)} ${yEnd} Q ${x + (i % 2 === 0 ? -4 : 4)} ${yEnd + 5} ${x} ${yEnd}`}
                          stroke={color}
                          strokeWidth={width}
                          strokeLinecap="round"
                          fill="none"
                          opacity={0.9}
                          className="transition-all duration-300"
                        />
                      );
                    })}
                    
                    {/* Reference markers with enhanced styling */}
                    {/* Shoulder line marker */}
                    <g opacity={hairLengthValue >= 35 ? 1 : 0.3}>
                      <line 
                        x1="80" 
                        y1="180" 
                        x2="220" 
                        y2="180" 
                        stroke="#3B82F6" 
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <circle cx="80" cy="180" r="6" fill="#3B82F6" />
                      <circle cx="220" cy="180" r="6" fill="#3B82F6" />
                      <text 
                        x="150" 
                        y="165" 
                        textAnchor="middle" 
                        className="fill-blue-600 font-bold"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        Shoulder
                      </text>
                      <text 
                        x="150" 
                        y="195" 
                        textAnchor="middle" 
                        className="fill-blue-500 text-xs"
                        fontSize="12"
                      >
                        ~{Math.round(hairLengthValue)}cm
                      </text>
                    </g>
                    
                    {/* Armpit line marker */}
                    <g opacity={hairLengthValue >= 55 ? 1 : 0.3}>
                      <line 
                        x1="80" 
                        y1="220" 
                        x2="220" 
                        y2="220" 
                        stroke="#10B981" 
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <circle cx="80" cy="220" r="6" fill="#10B981" />
                      <circle cx="220" cy="220" r="6" fill="#10B981" />
                      <text 
                        x="150" 
                        y="205" 
                        textAnchor="middle" 
                        className="fill-green-600 font-bold"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        Above Armpit
                      </text>
                    </g>
                    
                    {/* Mid-chest marker */}
                    <g opacity={hairLengthValue >= 75 ? 1 : 0.3}>
                      <line 
                        x1="80" 
                        y1="280" 
                        x2="220" 
                        y2="280" 
                        stroke="#FBBF24" 
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <circle cx="80" cy="280" r="6" fill="#FBBF24" />
                      <circle cx="220" cy="280" r="6" fill="#FBBF24" />
                      <text 
                        x="150" 
                        y="265" 
                        textAnchor="middle" 
                        className="fill-yellow-600 font-bold"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        Mid-Chest
                      </text>
                    </g>
                    
                    {/* Current length indicator line */}
                    <line 
                      x1="120" 
                      y1={60 + (hairLengthValue * 3.5)} 
                      x2="180" 
                      y2={60 + (hairLengthValue * 3.5)} 
                      stroke="#160B53" 
                      strokeWidth="3"
                      strokeDasharray="6 3"
                      opacity="0.6"
                    />
                  </svg>
                </div>
              </div>
              
              {/* Enhanced Slider Control */}
              <div className="space-y-4 lg:space-y-6 bg-white rounded-xl p-6 sm:p-8 border-2 border-purple-100 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-purple-600" />
                    Hair Length
                  </label>
                  <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#160B53] bg-purple-50 px-4 py-2 rounded-lg">
                    {hairLengthValue < 25 ? "Short" : hairLengthValue < 75 ? "Medium" : "Long"} 
                    <span className="text-base sm:text-lg lg:text-xl text-gray-600 ml-2">({hairLengthValue}%)</span>
                  </div>
                </div>
                
                {/* Enhanced Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hairLengthValue}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setHairLengthValue(value);
                      if (value < 25) {
                        handlePreferenceChange("hairLength", "short");
                      } else if (value < 75) {
                        handlePreferenceChange("hairLength", "medium");
                      } else {
                        handlePreferenceChange("hairLength", "long");
                      }
                    }}
                    className="w-full h-4 sm:h-6 lg:h-8 xl:h-10 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #160B53 0%, #160B53 ${hairLengthValue}%, #e5e7eb ${hairLengthValue}%, #e5e7eb 100%)`,
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  
                  {/* Slider markers */}
                  <div className="flex justify-between mt-2 text-xs sm:text-sm lg:text-base text-gray-500">
                    <span className="font-medium">0%</span>
                    <span className="font-medium">25%</span>
                    <span className="font-medium">50%</span>
                    <span className="font-medium">75%</span>
                    <span className="font-medium">100%</span>
                  </div>
                </div>
                
                {/* Length labels */}
                <div className="flex justify-between text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-gray-600 mt-4">
                  <div className="flex flex-col items-center">
                    <span>Short</span>
                    <span className="text-xs sm:text-sm text-gray-400">0-25%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>Medium</span>
                    <span className="text-xs sm:text-sm text-gray-400">25-75%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span>Long</span>
                    <span className="text-xs sm:text-sm text-gray-400">75-100%</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex justify-end gap-4 mt-6 lg:mt-8 pt-6 border-t-2 border-gray-200">
                <Button
                  onClick={() => setShowHairLengthModal(false)}
                  variant="outline"
                  className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg lg:text-xl font-semibold border-2 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowHairLengthModal(false);
                  }}
                  className="px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg lg:text-xl font-semibold bg-[#160B53] hover:bg-[#12094A] text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2 inline" />
                  Apply Length
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Color Wheel Modal */}
      {showColorWheelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 xl:p-16 max-w-6xl lg:max-w-7xl xl:max-w-[90vw] w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800">Choose Hair Color</h2>
              <button
                onClick={() => setShowColorWheelModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-4 mb-6 lg:mb-8">
              <button
                onClick={() => setColorPickerMode("wheel")}
                className={`px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl text-lg sm:text-xl lg:text-2xl font-semibold transition-all ${
                  colorPickerMode === "wheel"
                    ? "bg-[#160B53] text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Color Wheel
              </button>
              <button
                onClick={() => setColorPickerMode("palette")}
                className={`px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl text-lg sm:text-xl lg:text-2xl font-semibold transition-all ${
                  colorPickerMode === "palette"
                    ? "bg-[#160B53] text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Color Palette <span className="text-sm">(Color Blind Friendly)</span>
              </button>
            </div>

            {/* Color Wheel Mode */}
            {colorPickerMode === "wheel" && (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-10 items-center justify-center">
                {/* Color Wheel Canvas */}
                <div className="relative">
                  <canvas
                    ref={colorWheelCanvasRef}
                    className="border-[3px] lg:border-[5px] border-gray-300 rounded-full cursor-grab active:cursor-grabbing w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] xl:w-[450px] xl:h-[450px] kiosk:w-[600px] kiosk:h-[600px] select-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsDraggingColorWheel(true);
                      const color = getColorFromCoordinates(e.clientX, e.clientY);
                      if (color) {
                        setCustomHairColor(color);
                        handlePreferenceChange("hairColor", "other");
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isDraggingColorWheel) {
                        e.preventDefault();
                        const color = getColorFromCoordinates(e.clientX, e.clientY);
                        if (color) {
                          setCustomHairColor(color);
                          handlePreferenceChange("hairColor", "other");
                        }
                      }
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      setIsDraggingColorWheel(false);
                    }}
                    onMouseLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingColorWheel(false);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setIsDraggingColorWheel(true);
                      const touch = e.touches[0];
                      const color = getColorFromCoordinates(touch.clientX, touch.clientY);
                      if (color) {
                        setCustomHairColor(color);
                        handlePreferenceChange("hairColor", "other");
                      }
                    }}
                    onTouchMove={(e) => {
                      if (isDraggingColorWheel) {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const color = getColorFromCoordinates(touch.clientX, touch.clientY);
                        if (color) {
                          setCustomHairColor(color);
                          handlePreferenceChange("hairColor", "other");
                        }
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setIsDraggingColorWheel(false);
                    }}
                    onClick={(e) => {
                      // Fallback for single click if drag didn't trigger
                      if (!isDraggingColorWheel) {
                        const color = getColorFromCoordinates(e.clientX, e.clientY);
                        if (color) {
                          setCustomHairColor(color);
                          handlePreferenceChange("hairColor", "other");
                        }
                      }
                    }}
                  />
                </div>
                
                {/* Color Preview and Input */}
                <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 items-center">
                  <div
                    className="w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52 xl:w-56 xl:h-56 kiosk:w-80 kiosk:h-80 rounded-full border-[3px] lg:border-[5px] border-gray-300 shadow-lg"
                    style={{ backgroundColor: customHairColor }}
                  />
                  <input
                    type="text"
                    value={customHairColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(color)) {
                        setCustomHairColor(color);
                        handlePreferenceChange("hairColor", "other");
                      }
                    }}
                    className="px-4 py-3 lg:px-5 lg:py-3 xl:px-6 xl:py-4 border-[3px] border-gray-300 rounded-lg text-base lg:text-lg xl:text-xl kiosk:text-2xl font-mono text-center"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}

            {/* Color Palette Mode */}
            {colorPickerMode === "palette" && (
              <div className="space-y-6 lg:space-y-8">
                {/* Color Preview */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 kiosk:w-72 kiosk:h-72 rounded-full border-[3px] lg:border-[5px] border-gray-300 shadow-lg"
                    style={{ backgroundColor: customHairColor }}
                  />
                  <input
                    type="text"
                    value={customHairColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(color)) {
                        setCustomHairColor(color);
                        handlePreferenceChange("hairColor", "other");
                      }
                    }}
                    className="px-4 py-3 lg:px-5 lg:py-3 xl:px-6 xl:py-4 border-[3px] border-gray-300 rounded-lg text-base lg:text-lg xl:text-xl kiosk:text-2xl font-mono text-center"
                    placeholder="#000000"
                  />
                </div>

                {/* Organized Color Palette */}
                <div className="space-y-6 lg:space-y-8">
                  {/* Blacks & Grays */}
                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4">Blacks & Grays</h3>
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3 lg:gap-4">
                      {[
                        { name: "Jet Black", color: "#000000" },
                        { name: "Black", color: "#1C1C1C" },
                        { name: "Charcoal", color: "#36454F" },
                        { name: "Dark Gray", color: "#4A4A4A" },
                        { name: "Gray", color: "#808080" },
                        { name: "Light Gray", color: "#A9A9A9" },
                        { name: "Silver", color: "#C0C0C0" },
                        { name: "Platinum", color: "#E5E4E2" }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => {
                            setCustomHairColor(item.color);
                            handlePreferenceChange("hairColor", "other");
                          }}
                          className={`p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-110 ${
                            customHairColor === item.color
                              ? "border-[#160B53] ring-4 ring-purple-200 shadow-lg scale-110"
                              : "border-gray-300 hover:border-purple-300"
                          }`}
                          title={item.name}
                        >
                          <div
                            className="w-full h-12 sm:h-16 lg:h-20 xl:h-24 kiosk:h-28 rounded-lg"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm lg:text-base mt-1 block text-center font-semibold text-gray-700">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browns */}
                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4">Browns</h3>
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3 lg:gap-4">
                      {[
                        { name: "Dark Brown", color: "#3D2817" },
                        { name: "Brown", color: "#8B4513" },
                        { name: "Chestnut", color: "#954535" },
                        { name: "Auburn", color: "#A52A2A" },
                        { name: "Light Brown", color: "#A0522D" },
                        { name: "Caramel", color: "#C19A6B" },
                        { name: "Honey", color: "#D4A574" },
                        { name: "Tan", color: "#D2B48C" }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => {
                            setCustomHairColor(item.color);
                            handlePreferenceChange("hairColor", "other");
                          }}
                          className={`p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-110 ${
                            customHairColor === item.color
                              ? "border-[#160B53] ring-4 ring-purple-200 shadow-lg scale-110"
                              : "border-gray-300 hover:border-purple-300"
                          }`}
                          title={item.name}
                        >
                          <div
                            className="w-full h-12 sm:h-16 lg:h-20 xl:h-24 kiosk:h-28 rounded-lg"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm lg:text-base mt-1 block text-center font-semibold text-gray-700">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blondes */}
                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4">Blondes</h3>
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3 lg:gap-4">
                      {[
                        { name: "Dark Blonde", color: "#B8860B" },
                        { name: "Dirty Blonde", color: "#C9B037" },
                        { name: "Blonde", color: "#F5DEB3" },
                        { name: "Light Blonde", color: "#FFE4B5" },
                        { name: "Platinum Blonde", color: "#FFEFD5" },
                        { name: "Strawberry Blonde", color: "#F4A460" },
                        { name: "Golden", color: "#FFD700" },
                        { name: "Honey Blonde", color: "#E6D3A3" }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => {
                            setCustomHairColor(item.color);
                            handlePreferenceChange("hairColor", "other");
                          }}
                          className={`p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-110 ${
                            customHairColor === item.color
                              ? "border-[#160B53] ring-4 ring-purple-200 shadow-lg scale-110"
                              : "border-gray-300 hover:border-purple-300"
                          }`}
                          title={item.name}
                        >
                          <div
                            className="w-full h-12 sm:h-16 lg:h-20 xl:h-24 kiosk:h-28 rounded-lg"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm lg:text-base mt-1 block text-center font-semibold text-gray-700">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reds */}
                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4">Reds</h3>
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3 lg:gap-4">
                      {[
                        { name: "Burgundy", color: "#800020" },
                        { name: "Dark Red", color: "#8B0000" },
                        { name: "Red", color: "#DC143C" },
                        { name: "Auburn Red", color: "#A52A2A" },
                        { name: "Copper", color: "#B87333" },
                        { name: "Ginger", color: "#C04000" },
                        { name: "Strawberry", color: "#FF6347" },
                        { name: "Rose Gold", color: "#E8B4B8" }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => {
                            setCustomHairColor(item.color);
                            handlePreferenceChange("hairColor", "other");
                          }}
                          className={`p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-110 ${
                            customHairColor === item.color
                              ? "border-[#160B53] ring-4 ring-purple-200 shadow-lg scale-110"
                              : "border-gray-300 hover:border-purple-300"
                          }`}
                          title={item.name}
                        >
                          <div
                            className="w-full h-12 sm:h-16 lg:h-20 xl:h-24 kiosk:h-28 rounded-lg"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm lg:text-base mt-1 block text-center font-semibold text-gray-700">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vibrant Colors */}
                  <div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4">Vibrant Colors</h3>
                    <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3 lg:gap-4">
                      {[
                        { name: "Purple", color: "#800080" },
                        { name: "Blue", color: "#0000FF" },
                        { name: "Green", color: "#008000" },
                        { name: "Pink", color: "#FF69B4" },
                        { name: "Orange", color: "#FF8C00" },
                        { name: "Teal", color: "#008080" },
                        { name: "Violet", color: "#8A2BE2" },
                        { name: "Magenta", color: "#FF00FF" }
                      ].map((item) => (
                        <button
                          key={item.color}
                          onClick={() => {
                            setCustomHairColor(item.color);
                            handlePreferenceChange("hairColor", "other");
                          }}
                          className={`p-3 lg:p-4 rounded-lg sm:rounded-xl border-2 transition-all hover:scale-110 ${
                            customHairColor === item.color
                              ? "border-[#160B53] ring-4 ring-purple-200 shadow-lg scale-110"
                              : "border-gray-300 hover:border-purple-300"
                          }`}
                          title={item.name}
                        >
                          <div
                            className="w-full h-12 sm:h-16 lg:h-20 xl:h-24 kiosk:h-28 rounded-lg"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm lg:text-base mt-1 block text-center font-semibold text-gray-700">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-4 mt-6 lg:mt-8">
              <Button
                onClick={() => setShowColorWheelModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 11: Services - Full Screen Magazine Swipe */}
      {currentStep === 11 && (
        <div 
          className="flex-1 relative overflow-hidden bg-black touch-pan-y"
          onTouchStart={onServiceTouchStart}
          onTouchMove={onServiceTouchMove}
          onTouchEnd={onServiceTouchEnd}
          onMouseDown={onServiceTouchStart}
          onMouseMove={(e) => e.buttons === 1 && onServiceTouchMove(e)}
          onMouseUp={onServiceTouchEnd}
          onMouseLeave={onServiceTouchEnd}
        >
          {/* Loading State */}
          {isLoadingServices && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white z-50">
              <Loader2 className="h-16 w-16 animate-spin mb-6 text-white/80" />
              <p className="text-2xl font-light tracking-wider">Loading Services...</p>
            </div>
          )}

          {/* No Services State */}
          {!isLoadingServices && salonServices.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
              <Scissors className="h-20 w-20 mb-6 text-white/50" />
              <p className="text-2xl font-light tracking-wider mb-4">No Services Available</p>
              <Button
                onClick={() => setCurrentStep(0)}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Menu
              </Button>
            </div>
          )}

          {/* Full Screen Service Slide */}
          {!isLoadingServices && salonServices.map((service, index) => (
            <div
              key={service.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentServiceIndex 
                  ? 'opacity-100 translate-x-0' 
                  : index < currentServiceIndex 
                    ? 'opacity-0 -translate-x-full' 
                    : 'opacity-0 translate-x-full'
              }`}
            >
              {/* Full Screen Background Image with Ken Burns Effect */}
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear ${
                  index === currentServiceIndex ? 'scale-110' : 'scale-100'
                }`}
                style={{ backgroundImage: `url(${service.image})` }}
              >
                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
                
                {/* Animated Particles/Sparkles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 3}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Content - Positioned at bottom with staggered animations */}
              <div className={`relative h-full flex flex-col justify-end text-white px-8 sm:px-16 pb-24 ${
                index === currentServiceIndex ? 'animate-fade-in' : ''
              }`}>
                {/* Category Badge with slide-in effect */}
                <div className={`transform transition-all duration-700 delay-100 ${
                  index === currentServiceIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full uppercase tracking-[0.3em] text-xs font-medium text-white/90 mb-4 border border-white/20">
                    {service.category}
                  </span>
                </div>

                {/* Service Name with slide-up effect */}
                <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-serif font-bold mb-4 tracking-tight drop-shadow-2xl transform transition-all duration-700 delay-200 ${
                  index === currentServiceIndex ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                }`}>
                  <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
                    {service.name}
                  </span>
                </h1>

                {/* Animated underline */}
                <div className={`h-1 bg-gradient-to-r from-white/80 via-white/40 to-transparent mb-6 transform transition-all duration-1000 delay-300 origin-left ${
                  index === currentServiceIndex ? 'scale-x-100' : 'scale-x-0'
                }`} style={{ maxWidth: '200px' }}></div>

                {/* Description with fade-in effect */}
                <p className={`text-lg sm:text-xl lg:text-2xl text-white/90 max-w-2xl mb-8 font-light leading-relaxed transform transition-all duration-700 delay-400 ${
                  index === currentServiceIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  {service.description}
                </p>

                {/* Price & Duration with pop-in effect */}
                <div className={`flex items-center gap-4 sm:gap-6 transform transition-all duration-700 delay-500 ${
                  index === currentServiceIndex ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                }`}>
                  <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 border border-white/20 hover:bg-white/20 transition-colors duration-300 hover:scale-105 transform">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">{service.price}</p>
                    <p className="text-white/60 uppercase tracking-wider text-xs mt-1">Price</p>
                  </div>
                  <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 border border-white/20 hover:bg-white/20 transition-colors duration-300 hover:scale-105 transform">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{service.duration}</p>
                    <p className="text-white/60 uppercase tracking-wider text-xs mt-1">Duration</p>
                  </div>
                </div>
              </div>

              {/* Decorative corner elements */}
              <div className="absolute top-20 left-8 w-20 h-20 border-l-2 border-t-2 border-white/20 opacity-50"></div>
              <div className="absolute top-20 right-8 w-20 h-20 border-r-2 border-t-2 border-white/20 opacity-50"></div>
            </div>
          ))}

          {/* Back Button */}
          <Button
            onClick={() => {
              setCurrentStep(0);
              setCurrentServiceIndex(0);
            }}
            className="absolute top-6 left-6 bg-white/10 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md z-10 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          {/* Page Counter with glow effect */}
          <div className="absolute top-6 right-6 text-white font-medium bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full z-10 border border-white/10 shadow-lg shadow-black/20">
            <span className="text-2xl font-bold text-white">{currentServiceIndex + 1}</span>
            <span className="text-white/50"> / {salonServices.length}</span>
          </div>

          {/* Swipe Hint with bounce animation */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/60 text-sm uppercase tracking-widest z-10">
            <span className="animate-bounce-left">←</span>
            <span>Swipe</span>
            <span className="animate-bounce-right">→</span>
          </div>
        </div>
      )}

      {/* Step 12: Products - Full Screen Magazine Swipe */}
      {currentStep === 12 && (
        <div 
          className="flex-1 relative overflow-hidden bg-black touch-pan-y"
          onTouchStart={onProductTouchStart}
          onTouchMove={onProductTouchMove}
          onTouchEnd={onProductTouchEnd}
          onMouseDown={onProductTouchStart}
          onMouseMove={(e) => e.buttons === 1 && onProductTouchMove(e)}
          onMouseUp={onProductTouchEnd}
          onMouseLeave={onProductTouchEnd}
        >
          {/* Loading State */}
          {isLoadingProducts && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white z-50">
              <Loader2 className="h-16 w-16 animate-spin mb-6 text-white/80" />
              <p className="text-2xl font-light tracking-wider">Loading Products...</p>
            </div>
          )}

          {/* No Products State */}
          {!isLoadingProducts && salonProducts.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
              <Gift className="h-20 w-20 mb-6 text-white/50" />
              <p className="text-2xl font-light tracking-wider mb-4">No Products Available</p>
              <Button
                onClick={() => setCurrentStep(0)}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Menu
              </Button>
            </div>
          )}

          {/* Full Screen Product Slide */}
          {!isLoadingProducts && salonProducts.map((product, index) => (
            <div
              key={product.id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentProductIndex 
                  ? 'opacity-100 translate-x-0' 
                  : index < currentProductIndex 
                    ? 'opacity-0 -translate-x-full' 
                    : 'opacity-0 translate-x-full'
              }`}
            >
              {/* Full Screen Background Image with Ken Burns Effect */}
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear ${
                  index === currentProductIndex ? 'scale-110' : 'scale-100'
                }`}
                style={{ backgroundImage: `url(${product.image})` }}
              >
                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
              </div>

              {/* Content - Positioned at bottom with staggered animations */}
              <div className={`relative h-full flex flex-col justify-end text-white px-8 sm:px-16 pb-24 ${
                index === currentProductIndex ? 'animate-fade-in' : ''
              }`}>
                {/* Brand & Category Badges with slide-in effect */}
                <div className={`flex items-center gap-3 mb-4 transform transition-all duration-700 delay-100 ${
                  index === currentProductIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500/80 to-orange-500/80 backdrop-blur-md rounded-full uppercase tracking-[0.2em] text-xs font-bold text-white border border-white/20">
                    {product.brand}
                  </span>
                  <span className="inline-block px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full uppercase tracking-[0.2em] text-xs font-medium text-white/70 border border-white/10">
                    {product.category}
                  </span>
                </div>

                {/* Product Name with slide-up effect */}
                <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-serif font-bold mb-4 tracking-tight drop-shadow-2xl transform transition-all duration-700 delay-200 ${
                  index === currentProductIndex ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                }`}>
                  <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text">
                    {product.name}
                  </span>
                </h1>

                {/* Animated underline */}
                <div className={`h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-transparent mb-6 transform transition-all duration-1000 delay-300 origin-left ${
                  index === currentProductIndex ? 'scale-x-100' : 'scale-x-0'
                }`} style={{ maxWidth: '200px' }}></div>

                {/* Description with fade-in effect */}
                <p className={`text-lg sm:text-xl lg:text-2xl text-white/90 max-w-2xl mb-8 font-light leading-relaxed transform transition-all duration-700 delay-400 ${
                  index === currentProductIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                  {product.description}
                </p>

                {/* Price & Rating with pop-in effect */}
                <div className={`flex items-center gap-4 sm:gap-6 transform transition-all duration-700 delay-500 ${
                  index === currentProductIndex ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
                }`}>
                  <div className="text-center bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl px-6 sm:px-8 py-4 border border-white/20 hover:from-white/30 hover:to-white/10 transition-all duration-300 hover:scale-105 transform shadow-xl">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">{product.price}</p>
                    <p className="text-white/60 uppercase tracking-wider text-xs mt-1">Price</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <Star 
                          key={i} 
                          className={`h-7 w-7 sm:h-8 sm:w-8 fill-yellow-400 text-yellow-400 drop-shadow-lg transform transition-all duration-300 hover:scale-125 ${
                            index === currentProductIndex ? 'animate-star-pop' : ''
                          }`}
                          style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                        />
                      ))}
                    </div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Top Rated</p>
                  </div>
                </div>
              </div>

              {/* Decorative corner elements */}
              <div className="absolute top-20 left-8 w-20 h-20 border-l-2 border-t-2 border-amber-400/30 opacity-50"></div>
              <div className="absolute top-20 right-8 w-20 h-20 border-r-2 border-t-2 border-amber-400/30 opacity-50"></div>
            </div>
          ))}

          {/* Back Button */}
          <Button
            onClick={() => {
              setCurrentStep(0);
              setCurrentProductIndex(0);
            }}
            className="absolute top-6 left-6 bg-white/10 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md z-10 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          {/* Page Counter with glow effect */}
          <div className="absolute top-6 right-6 text-white font-medium bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full z-10 border border-white/10 shadow-lg shadow-black/20">
            <span className="text-2xl font-bold text-white">{currentProductIndex + 1}</span>
            <span className="text-white/50"> / {salonProducts.length}</span>
          </div>

          {/* Swipe Hint with bounce animation */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/60 text-sm uppercase tracking-widest z-10">
            <span className="animate-bounce-left">←</span>
            <span>Swipe</span>
            <span className="animate-bounce-right">→</span>
          </div>
        </div>
      )}

    </div>
  );
}
