# Kiosk Branch Configuration Guide

This guide explains how to configure which branch a kiosk is located at, enabling branch-specific pricing and information display.

## Overview

Each kiosk can be configured to represent a specific David's Salon branch location. This configuration:
- Shows branch-specific pricing for services
- Displays branch contact information and operating hours
- Enables location-aware features

## Configuration

### 1. Environment Variable Setup

The kiosk branch is configured using the `VITE_KIOSK_BRANCH_ID` environment variable in your `.env` file:

```env
# Kiosk Branch Configuration
# Set the branch ID where this kiosk is located (get from Firebase branches collection)
VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv
```

### 2. Finding Your Branch ID

You can find available branch IDs in two ways:

#### Option A: Using the Settings UI
1. Start the application
2. Click the "Branch" button in the top-left corner of the header
3. View the list of available branches with their IDs
4. Copy the Branch ID you want to use

#### Option B: From Firebase Console
1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Open the `branches` collection
4. Find your branch and copy its document ID

### 3. Branch Data Structure

Each branch in Firebase has the following structure:

```javascript
{
  name: "Ayala Malls Harbor Point",
  address: "Subic Bay, Rizal Hwy, Subic Bay Freeport Zone, 2200 Zambales",
  contact: "+63 9465034725",
  email: "ds.amazinghair@gmail.com",
  imageUrl: "",
  isActive: true,
  managerID: null,
  operatingHours: {
    monday: { open: "09:00", close: "16:00", isOpen: true },
    tuesday: { open: "09:00", close: "17:00", isOpen: true },
    wednesday: { open: "09:00", close: "19:00", isOpen: true },
    thursday: { open: "09:00", close: "20:00", isOpen: true },
    friday: { open: "09:00", close: "21:00", isOpen: true },
    saturday: { open: "09:00", close: "22:00", isOpen: true },
    sunday: { open: "09:00", close: "18:00", isOpen: true }
  },
  createdAt: Timestamp,
  createdBy: "sso_admin_001",
  updatedAt: Timestamp,
  updatedBy: "stcGp61BsS2L7XWeBsx1"
}
```

## Features

### Branch-Specific Pricing

When a branch is configured, the system will:
1. Look up service prices in the `branchPricing` field of each service
2. Display the price specific to the configured branch
3. Fall back to the first available branch price if the configured branch has no price set

Example service with branch pricing:
```javascript
{
  name: "Haircut",
  branchPricing: {
    "XFL1DUK3fe3JrhygLYUv": 250,  // Ayala Malls Harbor Point
    "anotherBranchId": 300         // Another branch
  }
}
```

### Settings Modal

The Kiosk Settings modal displays:
- **Current Configuration**: Shows the currently configured branch with full details
- **Available Branches**: Lists all active branches in the system
- **Branch Information**: Address, contact, email, and operating hours
- **Configuration Instructions**: Step-by-step guide to change the branch

## API Functions

### Firebase Functions

```javascript
// Get all active branches
const branches = await fetchBranches();

// Get a specific branch by ID
const branch = await fetchBranchById('XFL1DUK3fe3JrhygLYUv');

// Get the currently configured branch
const currentBranch = await getCurrentBranch();
```

### Service Pricing

Services automatically use branch-specific pricing:
```javascript
const services = await fetchServices();
// Each service will have the price for the configured branch
```

## Deployment

### For Each Kiosk Location

1. Clone or deploy the application
2. Create a `.env` file (or copy from `.env.example`)
3. Set `VITE_KIOSK_BRANCH_ID` to the appropriate branch ID
4. Build and deploy the application

### Example: Multiple Kiosks

**Kiosk 1 - Ayala Malls Harbor Point:**
```env
VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv
```

**Kiosk 2 - SM City Manila:**
```env
VITE_KIOSK_BRANCH_ID=anotherBranchId123
```

## Troubleshooting

### No Branch Configured Warning

If you see a warning that no branch is configured:
1. Check that `VITE_KIOSK_BRANCH_ID` is set in your `.env` file
2. Verify the branch ID exists in Firebase
3. Ensure the branch is marked as `isActive: true`
4. Restart the application after changing the `.env` file

### Incorrect Pricing

If prices don't match expectations:
1. Verify the branch ID is correct
2. Check that services have pricing for your branch in the `branchPricing` field
3. Use the Settings modal to confirm the current branch configuration

### Branch Not Found

If the configured branch doesn't load:
1. Verify the branch ID is correct (no typos)
2. Check that the branch exists in Firebase
3. Ensure the branch `isActive` field is set to `true`
4. Check Firebase connection and credentials

## Best Practices

1. **Document Branch IDs**: Keep a list of branch IDs and their locations
2. **Test Configuration**: Always test the kiosk after configuring a new branch
3. **Verify Pricing**: Check that all services have pricing for the branch
4. **Update Operating Hours**: Keep branch operating hours current in Firebase
5. **Use Descriptive Names**: Give branches clear, identifiable names

## Example Branch Setup

Here's an example of setting up a new branch:

1. **Add Branch to Firebase:**
   - Go to Firestore Console
   - Add a new document to the `branches` collection
   - Fill in all required fields (name, address, contact, etc.)
   - Set `isActive: true`
   - Copy the generated document ID

2. **Configure Services:**
   - For each service, add the branch ID to `branchPricing`
   - Set appropriate prices for the branch

3. **Configure Kiosk:**
   - Update `.env` with the branch ID
   - Restart the application
   - Test using the Settings modal

## Support

For issues or questions about branch configuration:
1. Check the Settings modal for current configuration
2. Verify Firebase connection and data
3. Review application logs for errors
4. Contact system administrator if issues persist
