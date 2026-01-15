# Branch Configuration Quick Reference

## Current Branch: Ayala Malls Harbor Point

### Branch Details
- **Branch ID**: `XFL1DUK3fe3JrhygLYUv`
- **Name**: Ayala Malls Harbor Point
- **Address**: Subic Bay, Rizal Hwy, Subic Bay Freeport Zone, 2200 Zambales
- **Contact**: +63 9465034725
- **Email**: ds.amazinghair@gmail.com

### Operating Hours
| Day | Hours | Status |
|-----|-------|--------|
| Monday | 09:00 - 16:00 | Open |
| Tuesday | 09:00 - 17:00 | Open |
| Wednesday | 09:00 - 19:00 | Open |
| Thursday | 09:00 - 20:00 | Open |
| Friday | 09:00 - 21:00 | Open |
| Saturday | 09:00 - 22:00 | Open |
| Sunday | 09:00 - 18:00 | Open |

## Quick Setup

### 1. Configure in .env
```env
VITE_KIOSK_BRANCH_ID=XFL1DUK3fe3JrhygLYUv
```

### 2. Restart Application
After changing the branch ID, restart the application:
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Verify Configuration
1. Open the application
2. Click "Branch" button in top-left corner
3. Confirm the correct branch is displayed

## Access Settings

Click the **"Branch"** button in the top-left corner of the application header to:
- View current branch configuration
- See all available branches
- Get branch IDs for configuration
- View operating hours and contact information

## Common Tasks

### Change Branch Location
1. Get the new branch ID from Settings modal
2. Update `VITE_KIOSK_BRANCH_ID` in `.env`
3. Restart the application

### Add New Branch
1. Add branch to Firebase `branches` collection
2. Set `isActive: true`
3. Add branch pricing to services in `branchPricing` field
4. Configure kiosk with new branch ID

### Troubleshooting
- **No branch shown**: Check `VITE_KIOSK_BRANCH_ID` is set
- **Wrong prices**: Verify branch ID matches Firebase
- **Branch not found**: Ensure branch exists and `isActive: true`

## For More Information
See [KIOSK_BRANCH_CONFIGURATION.md](./KIOSK_BRANCH_CONFIGURATION.md) for detailed documentation.
