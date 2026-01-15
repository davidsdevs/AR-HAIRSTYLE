# Branch Integration - Complete Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AR Hairstyle Kiosk                        │
│                                                              │
│  .env Configuration                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv          │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Firebase Collections                        │    │
│  │                                                     │    │
│  │  branches/                                          │    │
│  │  ├─ XFL1DUK3fe3JrhygLYUv (Ayala Harbor Point)     │    │
│  │  └─ anotherBranchId (Other Branch)                 │    │
│  │                                                     │    │
│  │  services/                                          │    │
│  │  ├─ service1                                        │    │
│  │  │  └─ branchPricing:                              │    │
│  │  │     ├─ XFL1DUK3fe3JrhygLYUv: 1900              │    │
│  │  │     └─ anotherBranchId: 2100                    │    │
│  │  └─ service2                                        │    │
│  │                                                     │    │
│  │  products/                                          │    │
│  │  ├─ product1                                        │    │
│  │  │  └─ branches: [XFL1DUK3fe3JrhygLYUv, ...]      │    │
│  │  └─ product2                                        │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Application Features                        │    │
│  │                                                     │    │
│  │  ✓ Branch Settings Modal                           │    │
│  │  ✓ Branch-Filtered Services                        │    │
│  │  ✓ Branch-Filtered Products                        │    │
│  │  ✓ Branch-Specific Pricing                         │    │
│  │  ✓ Branch Info Display                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## User Flow

### 1. Application Start

```
┌─────────────────────────────────────────────────────────┐
│  [Branch]          🏢 David Salon          [Reset]      │
│     ↑                                                    │
│     │                                                    │
│  Click to view/configure branch                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Branch Settings Modal

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Kiosk Branch Settings                            [×] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Current Configuration                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ✓ Ayala Malls Harbor Point                         │ │
│ │                                                     │ │
│ │ 📍 Subic Bay, Rizal Hwy, Subic Bay Freeport Zone  │ │
│ │ 📞 +63 9465034725                                  │ │
│ │ ✉️  ds.amazinghair@gmail.com                       │ │
│ │                                                     │ │
│ │ 🕐 Operating Hours:                                │ │
│ │    Mon-Sun: Various hours                          │ │
│ │                                                     │ │
│ │ Branch ID: XFL1DUK3fe3JrhygLYUv                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Available Branches (3)                                   │
│ [List of all branches with IDs]                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Services View (Step 11)

```
┌─────────────────────────────────────────────────────────┐
│ [Back]    📍 Ayala Malls Harbor Point    [1/5]          │
│                                                          │
│                                                          │
│              ┌─────────────────────┐                    │
│              │                     │                    │
│              │   Service Image     │                    │
│              │                     │                    │
│              └─────────────────────┘                    │
│                                                          │
│                  D2 Treatment                            │
│              Deep repair treatment                       │
│                                                          │
│                    ₱1,900                                │
│                   120 mins                               │
│                                                          │
│              [Hair Treatment]                            │
│                                                          │
│                                                          │
│              ← Swipe to browse →                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Data Flow**:
```
Firebase Query
    ↓
Filter: isActive = true
    ↓
Check: branchPricing[XFL1DUK3fe3JrhygLYUv] exists?
    ↓
Yes → Include service with branch price
No  → Skip service (logged to console)
    ↓
Display filtered services
```

### 4. Products View (Step 12)

```
┌─────────────────────────────────────────────────────────┐
│ [Back]    📍 Ayala Malls Harbor Point    [1/3]          │
│                                                          │
│                                                          │
│              ┌─────────────────────┐                    │
│              │                     │                    │
│              │   Product Image     │                    │
│              │                     │                    │
│              └─────────────────────┘                    │
│                                                          │
│         Joico Defy Damage Protective Masque             │
│         Bond-strengthening treatment mask                │
│                                                          │
│                    ₱1,150                                │
│                    150ml                                 │
│                                                          │
│                   [Joico]                                │
│              [Hair Treatment]                            │
│                                                          │
│              ← Swipe to browse →                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Data Flow**:
```
Firebase Query
    ↓
Filter: status = "Active"
    ↓
Check: branches array includes XFL1DUK3fe3JrhygLYUv?
    ↓
Yes → Include product with OTC price
No  → Skip product (logged to console)
    ↓
Display filtered products
```

## Data Filtering Examples

### Service Filtering

**Service 1: D2 Treatment** ✅ SHOWN
```javascript
{
  name: "D2 Treatment",
  branchPricing: {
    "XFL1DUK3fe3JrhygLYUv": 1900,  // ✓ Has pricing for this branch
    "anotherBranchId": 2100
  },
  isActive: true
}
// Result: Displayed with price ₱1,900
```

**Service 2: Basic Haircut** ❌ HIDDEN
```javascript
{
  name: "Basic Haircut",
  branchPricing: {
    "anotherBranchId": 150  // ✗ No pricing for XFL1DUK3fe3JrhygLYUv
  },
  isActive: true
}
// Result: Skipped (not shown)
// Console: ⚠️ Service "Basic Haircut" skipped - no pricing for branch
```

**Service 3: Old Treatment** ❌ HIDDEN
```javascript
{
  name: "Old Treatment",
  branchPricing: {
    "XFL1DUK3fe3JrhygLYUv": 500
  },
  isActive: false  // ✗ Not active
}
// Result: Skipped (not shown)
```

### Product Filtering

**Product 1: Joico Masque** ✅ SHOWN
```javascript
{
  name: "Joico Defy Damage Protective Masque",
  branches: [
    "XFL1DUK3fe3JrhygLYUv",  // ✓ Available at this branch
    "anotherBranchId"
  ],
  otcPrice: 1150,
  status: "Active"
}
// Result: Displayed with price ₱1,150
```

**Product 2: Generic Shampoo** ❌ HIDDEN
```javascript
{
  name: "Generic Shampoo",
  branches: [
    "anotherBranchId"  // ✗ Not available at XFL1DUK3fe3JrhygLYUv
  ],
  otcPrice: 200,
  status: "Active"
}
// Result: Skipped (not shown)
// Console: ⚠️ Product "Generic Shampoo" skipped - not available at branch
```

**Product 3: Discontinued Item** ❌ HIDDEN
```javascript
{
  name: "Discontinued Item",
  branches: ["XFL1DUK3fe3JrhygLYUv"],
  otcPrice: 300,
  status: "Inactive"  // ✗ Not active
}
// Result: Skipped (not shown)
```

## Console Output Flow

### Successful Service Load
```
User navigates to Services (Step 11)
    ↓
🔄 Loading services from Firebase...
    ↓
Query Firebase: services where isActive = true
    ↓
Service 1: "D2 Treatment"
  ✓ Has branchPricing[XFL1DUK3fe3JrhygLYUv] = 1900
  → Added to list
    ↓
Service 2: "Basic Haircut"
  ✗ No branchPricing[XFL1DUK3fe3JrhygLYUv]
  ⚠️ Service "Basic Haircut" skipped - no pricing for branch
  → Skipped
    ↓
Service 3: "Premium Cut"
  ✓ Has branchPricing[XFL1DUK3fe3JrhygLYUv] = 350
  → Added to list
    ↓
✅ Fetched 2 services for branch XFL1DUK3fe3JrhygLYUv
✅ Loaded 2 services from Firebase
📋 Services: ["D2 Treatment - ₱1,900", "Premium Cut - ₱350"]
    ↓
Display services on screen
```

### Successful Product Load
```
User navigates to Products (Step 12)
    ↓
🔄 Loading products from Firebase...
    ↓
Query Firebase: products where status = "Active"
    ↓
Product 1: "Joico Masque"
  ✓ branches includes XFL1DUK3fe3JrhygLYUv
  → Added to list
    ↓
Product 2: "Generic Shampoo"
  ✗ branches does not include XFL1DUK3fe3JrhygLYUv
  ⚠️ Product "Generic Shampoo" skipped - not available at branch
  → Skipped
    ↓
Product 3: "Treatment Oil"
  ✓ branches includes XFL1DUK3fe3JrhygLYUv
  → Added to list
    ↓
✅ Fetched 2 products for branch XFL1DUK3fe3JrhygLYUv
✅ Loaded 2 products from Firebase
📦 Products: ["Joico Masque - ₱1,150", "Treatment Oil - ₱850"]
    ↓
Display products on screen
```

## Component Architecture

```
ARHairTryOn.jsx (Main Component)
    │
    ├─ Header
    │   ├─ [Branch] Button → Opens KioskSettings Modal
    │   ├─ Logo (Center)
    │   └─ [Reset] Button
    │
    ├─ KioskSettings Modal (when open)
    │   ├─ Current Branch Display
    │   ├─ Available Branches List
    │   └─ Configuration Instructions
    │
    ├─ Services View (Step 11)
    │   ├─ [Back] Button
    │   ├─ BranchInfo Component (Center)
    │   ├─ [Page Counter] (Right)
    │   └─ Service Cards (Swipeable)
    │       ├─ Image
    │       ├─ Name
    │       ├─ Description
    │       ├─ Price (from branchPricing)
    │       ├─ Duration
    │       └─ Category
    │
    └─ Products View (Step 12)
        ├─ [Back] Button
        ├─ BranchInfo Component (Center)
        ├─ [Page Counter] (Right)
        └─ Product Cards (Swipeable)
            ├─ Image
            ├─ Name
            ├─ Description
            ├─ Price (from otcPrice)
            ├─ Variant
            ├─ Brand
            └─ Category
```

## Firebase Integration

```
firebase.js
    │
    ├─ getConfiguredBranchId()
    │   └─ Returns: VITE_KIOSK_BRANCH_ID from .env
    │
    ├─ fetchBranches()
    │   └─ Returns: All active branches
    │
    ├─ fetchBranchById(branchId)
    │   └─ Returns: Specific branch details
    │
    ├─ getCurrentBranch()
    │   └─ Returns: Currently configured branch
    │
    ├─ fetchServices(filterByBranch = true)
    │   ├─ Query: services where isActive = true
    │   ├─ Filter: Has branchPricing[branchId]
    │   ├─ Price: branchPricing[branchId]
    │   └─ Returns: Filtered services array
    │
    └─ fetchProducts(filterByBranch = true)
        ├─ Query: products where status = "Active"
        ├─ Filter: branches includes branchId
        ├─ Price: otcPrice
        └─ Returns: Filtered products array
```

## Configuration Workflow

```
1. Initial Setup
   ┌─────────────────────────────────────┐
   │ Create .env file                    │
   │ Set VITE_KIOSK_BRANCH_ID            │
   └─────────────────────────────────────┘
              ↓
2. Add Branch to Firebase
   ┌─────────────────────────────────────┐
   │ Create branch document              │
   │ Set name, address, contact, etc.    │
   │ Set isActive: true                  │
   │ Copy document ID                    │
   └─────────────────────────────────────┘
              ↓
3. Configure Services
   ┌─────────────────────────────────────┐
   │ For each service:                   │
   │ Add branchId to branchPricing       │
   │ Set price for branch                │
   └─────────────────────────────────────┘
              ↓
4. Configure Products
   ┌─────────────────────────────────────┐
   │ For each product:                   │
   │ Add branchId to branches array      │
   │ Set otcPrice                        │
   └─────────────────────────────────────┘
              ↓
5. Start Application
   ┌─────────────────────────────────────┐
   │ npm run dev                         │
   │ Application loads branch config     │
   │ Services/Products filter by branch  │
   └─────────────────────────────────────┘
              ↓
6. Verify
   ┌─────────────────────────────────────┐
   │ Click [Branch] button               │
   │ Verify correct branch shown         │
   │ Navigate to Services/Products       │
   │ Verify correct items and prices     │
   └─────────────────────────────────────┘
```

## Troubleshooting Flow

```
Problem: No services/products shown
    ↓
Check 1: Is branch ID configured?
    ├─ No  → Set VITE_KIOSK_BRANCH_ID in .env
    └─ Yes → Continue
    ↓
Check 2: Does branch exist in Firebase?
    ├─ No  → Create branch document
    └─ Yes → Continue
    ↓
Check 3: Are services/products active?
    ├─ No  → Set isActive/status to true
    └─ Yes → Continue
    ↓
Check 4: Do services have branch pricing?
    ├─ No  → Add branchId to branchPricing
    └─ Yes → Continue
    ↓
Check 5: Do products have branch in array?
    ├─ No  → Add branchId to branches array
    └─ Yes → Continue
    ↓
Check 6: Check console logs
    └─ Look for specific error messages
    ↓
Problem should be resolved
```

## Summary

This visual guide shows:
- ✅ Complete system architecture
- ✅ Data flow from Firebase to UI
- ✅ Filtering logic with examples
- ✅ Console output patterns
- ✅ Component structure
- ✅ Configuration workflow
- ✅ Troubleshooting steps

All components work together to provide branch-specific services and products display with automatic filtering and pricing.
