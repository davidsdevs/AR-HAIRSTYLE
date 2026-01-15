# Services & Products Branch Integration Guide

## Overview

The services and products sections now display branch-specific offerings based on the configured kiosk location. This ensures customers only see services and products available at their current branch.

## Features

### Branch-Specific Services
- **Automatic Filtering**: Only shows services with pricing for the configured branch
- **Branch Pricing**: Displays the correct price for the current branch location
- **Real-time Data**: Fetches services directly from Firebase
- **Fallback Support**: Shows default services if Firebase data is unavailable

### Branch-Specific Products
- **Branch Availability**: Only shows products available at the configured branch
- **OTC Pricing**: Displays over-the-counter prices for retail products
- **Product Details**: Shows brand, category, variants, and descriptions
- **Real-time Data**: Fetches products directly from Firebase

### Visual Indicators
- **Branch Name Display**: Shows current branch name at the top of services/products views
- **Loading States**: Smooth loading animations while fetching data
- **Empty States**: Clear messaging when no services/products are available
- **Magazine-Style Layout**: Full-screen swipeable cards for each item

## Data Models

### Services Collection Structure

```javascript
{
  // Service identification
  name: "D2 Treatment",
  description: "Deep repair treatment",
  category: "Hair Treatment",
  
  // Pricing by branch
  branchPricing: {
    "2jcrfvY7pxnMdsc1qbC4": 1900,  // Branch ID: Price
    "XFL1DUK3fe3JrhygLYUv": 1900,
    // ... other branches
  },
  
  // Service details
  duration: 120,  // minutes
  isChemical: false,
  isActive: true,
  
  // Business data
  commissionPercentage: 5,
  inventoryItems: [],
  productMappings: [],
  
  // Media
  imageURL: "https://res.cloudinary.com/...",
  
  // Metadata
  createdAt: Timestamp,
  createdBy: "sso_admin_001",
  updatedAt: Timestamp,
  updatedBy: "stcGp61BsS2L7XWeBsx1"
}
```

### Products Collection Structure

```javascript
{
  // Product identification
  name: "Joico Defy Damage Protective Masque",
  description: "Bond-strengthening treatment mask",
  category: "Hair Treatment",
  brand: "Joico",
  
  // Branch availability
  branches: [
    "2jcrfvY7pxnMdsc1qbC4",  // Array of branch IDs where product is available
    "XFL1DUK3fe3JrhygLYUv"
  ],
  
  // Pricing
  otcPrice: 1150,  // Over-the-counter retail price
  unitCost: 780,   // Cost per unit
  
  // Product details
  variants: "150ml",
  upc: "DS-JOIC-MASK-0020",
  shelfLife: "24",  // months
  status: "Active",
  
  // Business data
  commissionPercentage: 12,
  suppliers: ["MnirOKDWid0YLp2Xipn5"],
  
  // Media
  imageUrl: "",
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## How It Works

### Service Filtering Logic

1. **Fetch Active Services**: Query Firebase for services where `isActive: true`
2. **Check Branch Pricing**: For each service, verify `branchPricing[branchId]` exists
3. **Filter by Branch**: Skip services without pricing for the current branch
4. **Display Price**: Show the branch-specific price from `branchPricing`
5. **Sort Results**: Order by category, then by name

```javascript
// Example: Service filtering
const branchId = "XFL1DUK3fe3JrhygLYUv";
const service = {
  name: "D2 Treatment",
  branchPricing: {
    "XFL1DUK3fe3JrhygLYUv": 1900,
    "anotherBranchId": 2100
  }
};

// This service WILL be shown at branch XFL1DUK3fe3JrhygLYUv
// Price displayed: ₱1,900
```

### Product Filtering Logic

1. **Fetch Active Products**: Query Firebase for products where `status: "Active"`
2. **Check Branch Array**: For each product, verify branch ID is in `branches` array
3. **Filter by Branch**: Skip products not available at the current branch
4. **Display Price**: Show the `otcPrice` (over-the-counter price)
5. **Sort Results**: Order by category, then by name

```javascript
// Example: Product filtering
const branchId = "XFL1DUK3fe3JrhygLYUv";
const product = {
  name: "Joico Masque",
  branches: ["XFL1DUK3fe3JrhygLYUv", "anotherBranchId"],
  otcPrice: 1150
};

// This product WILL be shown at branch XFL1DUK3fe3JrhygLYUv
// Price displayed: ₱1,150
```

## Configuration

### Environment Setup

Ensure your `.env` file has the branch ID configured:

```env
VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv
```

### Firebase Collections Required

1. **branches** - Branch information
2. **services** - Service offerings with branch pricing
3. **products** - Product catalog with branch availability

## Adding Services to a Branch

### Step 1: Create Service in Firebase

Add a new document to the `services` collection:

```javascript
{
  name: "Premium Haircut",
  description: "Haircut with senior stylist",
  category: "Haircut",
  duration: 45,
  isActive: true,
  isChemical: false,
  branchPricing: {
    "XFL1DUK3fe3JrhygLYUv": 350,  // Add your branch ID and price
    "anotherBranchId": 400
  },
  imageURL: "https://...",
  commissionPercentage: 10,
  inventoryItems: [],
  productMappings: []
}
```

### Step 2: Verify in Application

1. Open the application
2. Navigate to Services section
3. Verify the new service appears
4. Check that the correct price is displayed

## Adding Products to a Branch

### Step 1: Create Product in Firebase

Add a new document to the `products` collection:

```javascript
{
  name: "Moisturizing Shampoo",
  description: "For dry and damaged hair",
  category: "Shampoo",
  brand: "Professional Care",
  status: "Active",
  branches: [
    "XFL1DUK3fe3JrhygLYUv"  // Add your branch ID
  ],
  otcPrice: 450,
  unitCost: 300,
  variants: "250ml",
  upc: "DS-SHAM-MOIST-001",
  shelfLife: "24",
  commissionPercentage: 15,
  suppliers: [],
  imageUrl: "https://..."
}
```

### Step 2: Verify in Application

1. Open the application
2. Navigate to Products section
3. Verify the new product appears
4. Check that the correct price is displayed

## User Interface

### Services View (Step 11)

```
┌─────────────────────────────────────────────────────────┐
│ [Back]        📍 Ayala Malls Harbor Point        [1/5]  │
│                                                          │
│                                                          │
│                  [Service Image]                         │
│                                                          │
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
└─────────────────────────────────────────────────────────┘
```

### Products View (Step 12)

```
┌─────────────────────────────────────────────────────────┐
│ [Back]        📍 Ayala Malls Harbor Point        [1/3]  │
│                                                          │
│                                                          │
│                  [Product Image]                         │
│                                                          │
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
└─────────────────────────────────────────────────────────┘
```

## Console Logging

The system provides detailed console logs for debugging:

### Service Loading
```
🔄 Loading services from Firebase...
⚠️ Service "Basic Haircut" skipped - no pricing for branch XFL1DUK3fe3JrhygLYUv
✅ Fetched 5 services for branch XFL1DUK3fe3JrhygLYUv
✅ Loaded 5 services from Firebase
📋 Services: ["D2 Treatment - ₱1,900", "Premium Cut - ₱350", ...]
```

### Product Loading
```
🔄 Loading products from Firebase...
⚠️ Product "Generic Shampoo" skipped - not available at branch XFL1DUK3fe3JrhygLYUv
✅ Fetched 3 products for branch XFL1DUK3fe3JrhygLYUv
✅ Loaded 3 products from Firebase
📦 Products: ["Joico Masque - ₱1,150", "Treatment Oil - ₱850", ...]
```

## Troubleshooting

### No Services Displayed

**Problem**: Services section shows "No Services Available"

**Possible Causes**:
1. No services have pricing for the configured branch
2. All services are marked as `isActive: false`
3. Firebase connection issue
4. Branch ID not configured

**Solutions**:
1. Check Firebase Console → `services` collection
2. Verify services have `branchPricing[yourBranchId]` set
3. Ensure services have `isActive: true`
4. Check console logs for specific errors
5. Verify `VITE_KIOSK_BRANCH_ID` in `.env`

### No Products Displayed

**Problem**: Products section shows "No Products Available"

**Possible Causes**:
1. No products have the branch ID in their `branches` array
2. All products are marked as `status: "Inactive"`
3. Firebase connection issue
4. Branch ID not configured

**Solutions**:
1. Check Firebase Console → `products` collection
2. Verify products have branch ID in `branches` array
3. Ensure products have `status: "Active"`
4. Check console logs for specific errors
5. Verify `VITE_KIOSK_BRANCH_ID` in `.env`

### Wrong Prices Displayed

**Problem**: Prices don't match expected values

**For Services**:
1. Check `branchPricing` object in Firebase
2. Verify correct branch ID is used as key
3. Ensure price is a number, not a string
4. Check console logs for branch ID being used

**For Products**:
1. Check `otcPrice` field in Firebase
2. Verify it's a number, not a string
3. Ensure product is in the correct branch's array

### Services/Products Not Updating

**Problem**: Changes in Firebase don't appear in the app

**Solutions**:
1. Refresh the application (F5 or Ctrl+R)
2. Clear browser cache
3. Check browser console for errors
4. Verify Firebase connection
5. Ensure changes were saved in Firebase Console

## Best Practices

### For Services

1. **Always Set Branch Pricing**: Every service should have pricing for all branches
2. **Use Consistent Categories**: Standardize category names across services
3. **Add Quality Images**: Use high-resolution images for better presentation
4. **Set Realistic Durations**: Accurate duration helps with scheduling
5. **Mark Chemical Services**: Set `isChemical: true` for chemical treatments

### For Products

1. **Maintain Branch Arrays**: Keep `branches` array updated for all locations
2. **Use Consistent Brands**: Standardize brand names
3. **Include Variants**: Specify size/variant information
4. **Set Accurate Prices**: Keep `otcPrice` current with retail prices
5. **Add Product Images**: Use clear product images when available

### For Branch Management

1. **Regular Audits**: Review services/products availability monthly
2. **Price Updates**: Keep pricing current across all branches
3. **Inventory Sync**: Ensure products in system match physical inventory
4. **Category Organization**: Use consistent categories for easy browsing
5. **Image Quality**: Maintain high-quality images for all items

## API Reference

### fetchServices(filterByBranch)

Fetches services from Firebase, optionally filtered by branch.

**Parameters**:
- `filterByBranch` (boolean): If true, only returns services with pricing for configured branch

**Returns**: Promise<Array<Service>>

**Example**:
```javascript
const services = await fetchServices(true);
console.log(services); // Array of service objects
```

### fetchProducts(filterByBranch)

Fetches products from Firebase, optionally filtered by branch.

**Parameters**:
- `filterByBranch` (boolean): If true, only returns products available at configured branch

**Returns**: Promise<Array<Product>>

**Example**:
```javascript
const products = await fetchProducts(true);
console.log(products); // Array of product objects
```

## Future Enhancements

Potential improvements:
1. Service booking integration
2. Product inventory tracking
3. Real-time availability updates
4. Service package bundles
5. Product recommendations
6. Loyalty program integration
7. Online ordering for products
8. Service reviews and ratings
9. Stylist assignment
10. Appointment scheduling

## Support

For issues with services and products:
1. Check console logs for detailed error messages
2. Verify Firebase data structure matches documentation
3. Ensure branch ID is correctly configured
4. Review this guide for troubleshooting steps
5. Contact system administrator if issues persist
