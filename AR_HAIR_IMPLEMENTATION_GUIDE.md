# AR Hair Overlay Implementation Guide

This guide explains how to implement augmented reality hair overlay on a user's head using face detection and 3D rendering.

## Overview

To overlay hair on a user's head in AR, you'll need to:
1. Detect facial landmarks (head position, orientation)
2. Track head movement in real-time
3. Render 3D hair model aligned with head position
4. Handle lighting and shadows for realism

## Implementation Approaches

### Option 1: MediaPipe Face Mesh (Recommended for Start)

MediaPipe provides detailed face mesh detection with 468 landmarks, which is perfect for hair placement.

#### Steps:

1. **Install MediaPipe Face Mesh:**
```bash
npm install @mediapipe/face_mesh @mediapipe/drawing_utils
```

2. **Update your face detection to use Face Mesh:**
```javascript
import { FaceMesh } from '@mediapipe/face_mesh';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// In your component
const faceMeshRef = useRef(null);

const initializeFaceMesh = async () => {
  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      // Calculate head position and rotation from landmarks
      const headTransform = calculateHeadTransform(landmarks);
      // Render hair overlay
      renderHairOverlay(headTransform);
    }
  });

  faceMeshRef.current = faceMesh;
};
```

3. **Calculate Head Transform:**
```javascript
const calculateHeadTransform = (landmarks) => {
  // Get key points for head position
  const forehead = landmarks[10];  // Top of head
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];
  const nose = landmarks[4];
  
  // Calculate head center
  const centerX = (leftEar.x + rightEar.x) / 2;
  const centerY = forehead.y;
  
  // Calculate head rotation (pitch, yaw, roll)
  const yaw = Math.atan2(
    rightEar.y - leftEar.y,
    rightEar.x - leftEar.x
  );
  
  // Calculate head size (distance between ears)
  const headWidth = Math.sqrt(
    Math.pow(rightEar.x - leftEar.x, 2) + 
    Math.pow(rightEar.y - leftEar.y, 2)
  );
  
  return {
    x: centerX * canvas.width,
    y: centerY * canvas.height,
    width: headWidth * canvas.width * 1.5, // Scale for hair
    rotation: yaw,
    scale: headWidth
  };
};
```

4. **Render Hair Overlay:**
```javascript
const renderHairOverlay = (headTransform) => {
  const ctx = canvasRef.current.getContext('2d');
  
  // Clear previous hair
  // (You'll need to redraw the video frame first)
  
  // Draw hair image/sprite at calculated position
  if (selectedHairstyle && hairImage) {
    ctx.save();
    ctx.translate(headTransform.x, headTransform.y);
    ctx.rotate(headTransform.rotation);
    ctx.scale(headTransform.scale, headTransform.scale);
    
    // Draw hair image (you'll need to load hairstyle images)
    ctx.drawImage(
      hairImage,
      -hairImage.width / 2,
      -hairImage.height / 2,
      hairImage.width,
      hairImage.height
    );
    
    ctx.restore();
  }
};
```

### Option 2: Three.js + AR.js (Advanced 3D)

For more realistic 3D hair rendering:

1. **Install Three.js:**
```bash
npm install three @react-three/fiber @react-three/drei
```

2. **Create 3D Hair Component:**
```javascript
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function HairModel({ headPosition, headRotation }) {
  const { scene } = useGLTF('/models/hair.glb');
  
  useFrame(() => {
    scene.position.set(headPosition.x, headPosition.y, headPosition.z);
    scene.rotation.set(headRotation.x, headRotation.y, headRotation.z);
  });
  
  return <primitive object={scene} />;
}
```

### Option 3: TensorFlow.js + Face Landmarks (Most Accurate)

For the most accurate tracking:

```bash
npm install @tensorflow-models/face-landmarks-detection @tensorflow/tfjs
```

## Practical Implementation Steps

### Step 1: Prepare Hair Assets

Create hair images/sprites for each hairstyle:
- Front view hair image
- Side view hair images (optional)
- Hair should be transparent background (PNG)
- Size should match head proportions

### Step 2: Load Hair Images

```javascript
const [hairImages, setHairImages] = useState({});

useEffect(() => {
  const loadHairImages = async () => {
    const images = {};
    for (const style of hairstyleOptions) {
      const img = new Image();
      img.src = style.image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      images[style.id] = img;
    }
    setHairImages(images);
  };
  loadHairImages();
}, []);
```

### Step 3: Integrate with Face Detection

Update your `onResults` callback in face detection:

```javascript
faceDetection.onResults((results) => {
  // ... existing face detection code ...
  
  if (results.detections && results.detections.length > 0 && selectedHairstyle) {
    const detection = results.detections[0];
    const headTransform = calculateHeadTransform(detection);
    
    // Get hair image for selected style
    const hairImage = hairImages[selectedHairstyle.id];
    if (hairImage) {
      renderHairOverlay(headTransform, hairImage);
    }
  }
});
```

### Step 4: Handle Head Movement

Ensure hair follows head movement smoothly:

```javascript
const previousHeadPos = useRef(null);

const renderHairOverlay = (headTransform, hairImage) => {
  const ctx = canvasRef.current.getContext('2d');
  
  // Smooth movement (optional)
  if (previousHeadPos.current) {
    headTransform.x = headTransform.x * 0.7 + previousHeadPos.current.x * 0.3;
    headTransform.y = headTransform.y * 0.7 + previousHeadPos.current.y * 0.3;
  }
  previousHeadPos.current = headTransform;
  
  // Render hair...
};
```

## Advanced Features

### 1. Hair Physics (Optional)
- Use physics engine for hair movement
- Libraries: Matter.js, Cannon.js

### 2. Real-time Hair Color Change
- Use canvas filters to modify hair color
- Apply color transformations based on user selection

### 3. Multiple Hair Layers
- Render different hair layers (base, highlights, etc.)
- Blend modes for realistic hair rendering

## Resources

- MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh
- Three.js Documentation: https://threejs.org/docs/
- TensorFlow.js Face Detection: https://www.tensorflow.org/js/models

## Next Steps

1. Start with Option 1 (MediaPipe Face Mesh) - easiest to implement
2. Test with simple hair images first
3. Refine positioning and scaling
4. Add smooth transitions
5. Consider 3D rendering for more realism




































