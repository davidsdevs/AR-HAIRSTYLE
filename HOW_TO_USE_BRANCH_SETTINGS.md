# How to Use Branch Settings - Visual Guide

## Accessing Branch Settings

### Step 1: Locate the Branch Button
Look for the **"Branch"** button in the top-left corner of the application header.

```
┌─────────────────────────────────────────────────────────┐
│  [Branch]          🏢 David Salon Logo          [Reset] │
│   ↑                                                      │
│   Click here!                                            │
└─────────────────────────────────────────────────────────┘
```

### Step 2: Open Settings Modal
Click the "Branch" button to open the Kiosk Branch Settings modal.

## Understanding the Settings Modal

### Current Configuration Section
Shows your currently configured branch:

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Kiosk Branch Settings                            [×] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Current Configuration                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ✓ Ayala Malls Harbor Point                         │ │
│ │                                                     │ │
│ │ 📍 Address:                                        │ │
│ │    Subic Bay, Rizal Hwy, Subic Bay Freeport Zone  │ │
│ │                                                     │ │
│ │ 📞 Contact: +63 9465034725                         │ │
│ │ ✉️  Email: ds.amazinghair@gmail.com                │ │
│ │                                                     │ │
│ │ 🕐 Operating Hours:                                │ │
│ │    Mon: 09:00 - 16:00                              │ │
│ │    Tue: 09:00 - 17:00                              │ │
│ │    Wed: 09:00 - 19:00                              │ │
│ │    Thu: 09:00 - 20:00                              │ │
│ │    Fri: 09:00 - 21:00                              │ │
│ │    Sat: 09:00 - 22:00                              │ │
│ │    Sun: 09:00 - 18:00                              │ │
│ │                                                     │ │
│ │ Branch ID: XFL1DUK3fe3JrhygLYUv                    │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Available Branches Section
Lists all branches you can configure:

```
┌─────────────────────────────────────────────────────────┐
│ Available Branches (3)                                   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Ayala Malls Harbor Point          [Current]        │ │
│ │ 📍 Subic Bay, Rizal Hwy...                         │ │
│ │ 📞 +63 9465034725                                  │ │
│ │ ID: XFL1DUK3fe3JrhygLYUv                           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ SM City Manila                                     │ │
│ │ 📍 Manila, Philippines                             │ │
│ │ 📞 +63 9123456789                                  │ │
│ │ ID: anotherBranchId123                             │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Instructions Section
Step-by-step guide at the bottom:

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ How to Change Branch                                 │
│                                                          │
│ 1. Copy the Branch ID from the list above               │
│ 2. Open your .env file in the project root              │
│ 3. Update VITE_KIOSK_BRANCH_ID with the new branch ID   │
│ 4. Restart the application for changes to take effect   │
└─────────────────────────────────────────────────────────┘
```

## Changing Branch Configuration

### Method 1: Using the Settings Modal (Recommended)

1. **Open Settings**
   - Click "Branch" button in header

2. **Find Your Branch**
   - Scroll through "Available Branches" section
   - Look for the branch you want to configure

3. **Copy Branch ID**
   - Find the line that says "ID: XFL1DUK3fe3JrhygLYUv"
   - Copy the ID (everything after "ID: ")

4. **Update .env File**
   ```env
   # Before
   VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv
   
   # After (with new branch ID)
   VITE_KIOSK_BRANCH_ID=anotherBranchId123
   ```

5. **Restart Application**
   ```bash
   # Stop the server (Ctrl+C in terminal)
   # Then restart
   npm run dev
   ```

6. **Verify Change**
   - Open Settings modal again
   - Confirm new branch shows as "Current"

### Method 2: Direct .env Edit

1. **Open .env file** in your project root

2. **Find the line:**
   ```env
   VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv
   ```

3. **Replace with new branch ID:**
   ```env
   VITE_KIOSK_BRANCH_ID=your_new_branch_id_here
   ```

4. **Save the file**

5. **Restart the application**

## Visual Indicators

### Current Branch
- **Purple border** around the branch card
- **"Current" badge** next to branch name
- **Purple background** highlighting

### Active Branches
- **Green checkmark** for configured branches
- **Green border** on branch cards

### Inactive/No Configuration
- **Yellow warning** if no branch configured
- **Gray styling** for unconfigured state

## Common Scenarios

### Scenario 1: Setting Up a New Kiosk

```
1. Start application
   ↓
2. Click "Branch" button
   ↓
3. See "No Branch Configured" warning
   ↓
4. Browse available branches
   ↓
5. Copy desired branch ID
   ↓
6. Update .env file
   ↓
7. Restart application
   ↓
8. Verify in Settings modal
```

### Scenario 2: Moving Kiosk to New Location

```
1. Click "Branch" button
   ↓
2. Note current branch (for reference)
   ↓
3. Find new location in list
   ↓
4. Copy new branch ID
   ↓
5. Update .env file
   ↓
6. Restart application
   ↓
7. Confirm new branch is active
```

### Scenario 3: Checking Current Configuration

```
1. Click "Branch" button
   ↓
2. View "Current Configuration" section
   ↓
3. Verify branch name and details
   ↓
4. Check operating hours
   ↓
5. Note branch ID for records
   ↓
6. Close modal
```

## Troubleshooting Visual Guide

### Problem: No Branch Shown

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ No Branch Configured                                 │
│                                                          │
│ This kiosk is not configured with a branch location.    │
│ Please set the VITE_KIOSK_BRANCH_ID in your .env file.  │
│                                                          │
│ VITE_KIOSK_BRANCH_ID=your_branch_id_here                │
└─────────────────────────────────────────────────────────┘
```

**Solution:**
1. Check `.env` file exists
2. Verify `VITE_KIOSK_BRANCH_ID` is set
3. Ensure branch ID is correct
4. Restart application

### Problem: Wrong Branch Displayed

**Check:**
- Branch ID in `.env` matches desired branch
- No typos in branch ID
- Application was restarted after change

**Fix:**
1. Open Settings modal
2. Verify current branch ID
3. Compare with `.env` file
4. Update if different
5. Restart application

### Problem: Branch Not in List

**Possible Causes:**
- Branch not added to Firebase
- Branch marked as `isActive: false`
- Firebase connection issue

**Fix:**
1. Check Firebase Console
2. Verify branch exists in `branches` collection
3. Ensure `isActive: true`
4. Refresh application

## Tips and Best Practices

### 🎯 Quick Tips
- Keep branch ID documented for each kiosk
- Test configuration after any changes
- Verify pricing displays correctly
- Check operating hours are current

### 📋 Checklist for New Kiosk Setup
- [ ] Branch exists in Firebase
- [ ] Branch is marked active
- [ ] Services have pricing for branch
- [ ] .env file configured
- [ ] Application restarted
- [ ] Settings modal verified
- [ ] Test transaction completed

### 🔄 Regular Maintenance
- Review branch information monthly
- Update operating hours as needed
- Verify pricing is current
- Test settings modal functionality

## Need Help?

1. **Check Documentation**
   - See `KIOSK_BRANCH_CONFIGURATION.md` for details
   - Review `BRANCH_QUICK_REFERENCE.md` for quick info

2. **Use Settings Modal**
   - Visual confirmation of configuration
   - Easy access to branch IDs
   - Clear instructions provided

3. **Verify Configuration**
   - Check `.env` file
   - Review Firebase data
   - Test with sample transaction

4. **Contact Support**
   - Provide branch ID
   - Share error messages
   - Include screenshots if possible
