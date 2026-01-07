# Style Preference Picker - Quick Start Guide

## 🚀 Quick Integration

### Step 1: Import the Component

```jsx
import { StylePreferencePickerEnhanced } from '../components/StylePreferencePickerEnhanced';
```

### Step 2: Replace Existing Code

In `ARHairTryOn.jsx`, find the Style Preferences Section (around line 3502-3548) and replace it:

**Replace this entire section:**
```jsx
{/* Style Preferences Section */}
<div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl...">
  {/* ... existing grid of buttons ... */}
</div>
```

**With this:**
```jsx
{/* Style Preferences Section */}
<div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 xl:p-8 kiosk:p-8 border-[3px] border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
  <StylePreferencePickerEnhanced
    selectedPreferences={preferences.stylePreferences}
    onSelectionChange={(newPreferences) => {
      setPreferences(prev => ({
        ...prev,
        stylePreferences: newPreferences
      }));
    }}
    maxSelections={8}
    showSearch={true}
    showCounter={true}
    showCategories={true}
    viewMode="grid"
  />
</div>
```

### Step 3: Remove Old Toggle Function (Optional)

You can remove the `toggleStylePreference` function (around line 2055) since the new component handles it internally. Or keep it for backward compatibility.

## ✨ What You Get

### Enhanced Features
- ✅ **Search Bar** - Find styles quickly
- ✅ **Category Filters** - Filter by Work, Everyday, or Fashion Forward
- ✅ **Visual Icons** - Color-coded icons for each style
- ✅ **Better Feedback** - Clear selection indicators
- ✅ **Counter** - See how many selected
- ✅ **Clear All** - Quick reset button
- ✅ **Tooltips** - Detailed descriptions
- ✅ **Badges** - Visual summary of selections
- ✅ **Animations** - Smooth transitions

### Visual Improvements
- Color-coded styles with gradients
- Icons instead of images
- Better hover states
- Selection animations
- Professional card design

## 🎨 Style Preferences

| Style | Color | Icon |
|-------|-------|------|
| Professional | 🔵 Blue | Briefcase |
| Casual | 🟢 Green | Shirt |
| Elegant | 🟣 Purple | Crown |
| Trendy | 🟡 Amber | Zap |
| Classic | ⚫ Gray | Clock |
| Bold | 🔴 Red | Flame |
| Natural | 🟢 Green | Leaf |
| Edgy | 🩷 Pink | Scissors |

## 📝 Props Reference

```jsx
<StylePreferencePickerEnhanced
  selectedPreferences={array}        // Required: Selected preference values
  onSelectionChange={function}       // Required: Callback when selection changes
  maxSelections={number}             // Optional: Max selections allowed
  showSearch={boolean}               // Optional: Show search bar (default: true)
  showCounter={boolean}              // Optional: Show counter (default: true)
  showCategories={boolean}           // Optional: Show category filters (default: true)
  viewMode={"grid" | "list"}        // Optional: Layout mode (default: "grid")
  className={string}                 // Optional: Additional CSS classes
/>
```

## 🎯 Example

```jsx
const [preferences, setPreferences] = useState({
  stylePreferences: []
});

<StylePreferencePickerEnhanced
  selectedPreferences={preferences.stylePreferences}
  onSelectionChange={(newPrefs) => {
    setPreferences(prev => ({
      ...prev,
      stylePreferences: newPrefs
    }));
  }}
  maxSelections={5}
/>
```

## 🔧 Customization

### Limit Selections
```jsx
maxSelections={5}  // Allow max 5 selections
```

### Hide Search
```jsx
showSearch={false}  // Hide search bar
```

### List View
```jsx
viewMode="list"  // Compact list layout
```

### Hide Categories
```jsx
showCategories={false}  // Hide category filters
```

## 💡 Tips

1. **Use maxSelections** to guide users (e.g., "Select up to 3 styles")
2. **Keep search enabled** for better UX
3. **Use categories** to help users organize preferences
4. **Grid view** is better for visual browsing
5. **List view** is better for compact spaces

## 🎉 That's It!

The enhanced style preference picker is ready to use. Just import and replace the existing section!

For more details, see `STYLE_PREFERENCE_ENHANCEMENTS.md`




