# Desktop Mode Guide

## 🖥️ Overview

Desktop mode is optimized for standard desktop/website viewing (1024px - 2159px) with everything compacted to fit perfectly in a 100vh screen.

## 📐 Screen Size Breakpoints

- **Mobile/Tablet**: < 1024px (standard responsive)
- **Desktop/Website Mode**: 1024px - 2159px (**100vh compact**)
- **Kiosk Mode**: 2160px+ (3180px height)

## ✨ Desktop Mode Features

### 1. **100vh Compact Layout**
- All content fits within 100vh
- No vertical scrolling required
- Optimized spacing and sizing

### 2. **Compact Styling**
- Reduced font sizes (0.875rem base)
- Compact padding and margins
- Smaller buttons and icons
- Optimized gaps and spacing

### 3. **Desktop-Specific Utilities**
Use these Tailwind classes that are automatically applied in desktop mode:

- `desktop:text-sm`, `desktop:text-base`, etc. - Compact text sizes
- `desktop-button` - Compact button styling
- `desktop-icon` - Smaller icons
- `desktop-gap-*` - Reduced gaps
- `desktop-p-*` - Compact padding
- `desktop-m-*` - Compact margins

### 4. **Automatic Optimization**
The following are automatically optimized for desktop:
- Container heights: `max-height: calc(100vh - 100px)`
- Scrollbars: Thin, styled scrollbars
- Overflow: Hidden on body, auto on containers
- Font sizes: Scaled down by default

## 🎯 Usage

### Automatic Mode Detection

The system automatically detects screen size and applies desktop mode:

```jsx
// Desktop mode is automatically active at 1024px-2159px
// No code changes needed!
```

### Using Desktop Utilities

```jsx
// Add desktop-specific classes
<div className="desktop:p-4 desktop-gap-2">
  {/* Content */}
</div>
```

### Using Helper Functions

```jsx
import { useDesktopMode, useViewportMode, getContainerMaxHeight } from '../utils/desktopMode';

function MyComponent() {
  const isDesktop = useDesktopMode();
  const mode = useViewportMode(); // 'mobile' | 'desktop' | 'kiosk'
  
  return (
    <div style={{ maxHeight: getContainerMaxHeight(80) }}>
      {isDesktop && <p>Desktop mode active!</p>}
    </div>
  );
}
```

## 📏 Desktop Mode Specifications

### Sizing
- **Base Font**: 0.875rem (14px)
- **Header Height**: ~60-80px
- **Container Height**: `calc(100vh - headerHeight)`
- **Max Content Width**: 90vw

### Spacing
- **Compact Padding**: 0.75rem - 1rem
- **Compact Margins**: 0.5rem - 1rem
- **Compact Gaps**: 0.5rem - 1rem

### Components
- **Buttons**: Smaller padding, compact text
- **Icons**: 1rem - 1.25rem
- **Cards**: Reduced padding
- **Modals**: Max 90vh height

## 🎨 CSS Classes

### Desktop Text Sizes
```css
.desktop-text-sm     /* 0.75rem */
.desktop-text-base   /* 0.875rem */
.desktop-text-lg     /* 1rem */
.desktop-text-xl     /* 1.125rem */
.desktop-text-2xl    /* 1.5rem */
.desktop-text-3xl    /* 1.875rem */
```

### Desktop Spacing
```css
.desktop-gap-1  /* 0.25rem */
.desktop-gap-2  /* 0.5rem */
.desktop-gap-3  /* 0.75rem */
.desktop-gap-4  /* 1rem */

.desktop-p-2  /* 0.5rem padding */
.desktop-p-3  /* 0.75rem padding */
.desktop-p-4  /* 1rem padding */
```

### Desktop Components
```css
.desktop-button     /* Compact button */
.desktop-icon       /* Smaller icon */
.desktop-icon-sm    /* Extra small icon */
.desktop-icon-lg    /* Large icon (but still compact) */
.desktop-card       /* Compact card */
.desktop-modal      /* Compact modal */
```

## 🔧 Implementation

### Main Container
The main container automatically uses:
```jsx
className="h-screen lg:max-h-[100vh] kiosk:h-[3180px]"
```

This ensures:
- Mobile/Tablet: Standard responsive
- Desktop: 100vh max height
- Kiosk: 3180px height

### Content Containers
Use desktop-specific max heights:
```jsx
className="desktop-step-container"
// or
style={{ maxHeight: getContainerMaxHeight(80) }}
```

### Preferences Container
Automatically uses:
```css
.preferences-container {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
```

## 📱 Responsive Behavior

### Desktop Mode (1024px - 2159px)
- ✅ Everything fits in 100vh
- ✅ Compact spacing
- ✅ Smaller fonts
- ✅ Thin scrollbars
- ✅ Optimized components

### Kiosk Mode (2160px+)
- ✅ Large sizing (3180px height)
- ✅ Big buttons and text
- ✅ Generous spacing
- ✅ Touch-friendly

### Mobile/Tablet (< 1024px)
- ✅ Standard responsive design
- ✅ Touch-optimized
- ✅ Scrollable content

## 🎯 Key Differences

| Feature | Desktop Mode | Kiosk Mode |
|---------|-------------|------------|
| Height | 100vh | 3180px |
| Base Font | 0.875rem | 1.2rem |
| Button Padding | 0.5rem 1rem | 2rem 4rem |
| Icon Size | 1rem | 3rem |
| Container | Compact | Large |
| Scrollbar | Thin (8px) | Standard |

## 💡 Tips

1. **Use desktop utilities** for fine-tuned control
2. **Test at 1024px** to see desktop mode activation
3. **Check 100vh fit** - ensure no vertical scrolling
4. **Use helper functions** for dynamic sizing
5. **Test responsiveness** between breakpoints

## 🚀 Quick Reference

### Check Current Mode
```jsx
import { useViewportMode } from '../utils/desktopMode';

const mode = useViewportMode(); // 'mobile' | 'desktop' | 'kiosk'
```

### Apply Desktop-Specific Styles
```jsx
<div className="desktop:p-4 desktop-gap-2 desktop-text-base">
  Content optimized for desktop
</div>
```

### Get Compact Dimensions
```jsx
import { getCompactSize, getCompactSpacing } from '../utils/desktopMode';

const buttonSize = getCompactSize(80, 40); // 40px on desktop, 80px on kiosk
const spacing = getCompactSpacing(32); // 16px on desktop, 32px on kiosk
```

## ✨ Benefits

1. ✅ **Perfect 100vh Fit** - No scrolling needed
2. ✅ **Optimized Sizing** - Everything scaled appropriately
3. ✅ **Professional Look** - Clean, compact design
4. ✅ **Performance** - Reduced layout shifts
5. ✅ **User Experience** - Everything visible at once

---

**Desktop mode is automatically active between 1024px and 2159px!** 🎉



