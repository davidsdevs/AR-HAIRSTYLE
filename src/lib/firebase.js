import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get configured branch ID from environment
const getConfiguredBranchId = () => {
  return import.meta.env.VITE_KIOSK_BRANCH_ID || null;
};

// Fetch all branches from Firestore
export const fetchBranches = async () => {
  try {
    const branchesRef = collection(db, 'branches');
    const q = query(branchesRef, where('isActive', '==', true), orderBy('name'));
    
    const querySnapshot = await getDocs(q);
    const branches = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      branches.push({
        id: doc.id,
        name: data.name || 'Unnamed Branch',
        address: data.address || '',
        contact: data.contact || '',
        email: data.email || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive || false,
        managerID: data.managerID || null,
        operatingHours: data.operatingHours || {},
        createdAt: data.createdAt,
        createdBy: data.createdBy || '',
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy || ''
      });
    });
    
    return branches;
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
};

// Fetch a specific branch by ID
export const fetchBranchById = async (branchId) => {
  try {
    if (!branchId) return null;
    
    const branchRef = doc(db, 'branches', branchId);
    const branchDoc = await getDoc(branchRef);
    
    if (branchDoc.exists()) {
      const data = branchDoc.data();
      return {
        id: branchDoc.id,
        name: data.name || 'Unnamed Branch',
        address: data.address || '',
        contact: data.contact || '',
        email: data.email || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive || false,
        managerID: data.managerID || null,
        operatingHours: data.operatingHours || {},
        createdAt: data.createdAt,
        createdBy: data.createdBy || '',
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching branch:', error);
    return null;
  }
};

// Get current kiosk branch information
export const getCurrentBranch = async () => {
  const branchId = getConfiguredBranchId();
  if (!branchId) {
    console.warn('No branch ID configured in VITE_KIOSK_BRANCH_ID');
    return null;
  }
  return await fetchBranchById(branchId);
};

// Fetch services from Firestore (optionally filtered by branch)
export const fetchServices = async (filterByBranch = true) => {
  try {
    const servicesRef = collection(db, 'services');
    const branchId = getConfiguredBranchId();
    
    // Build query - only active services
    const q = query(servicesRef, where('isActive', '==', true));
    
    const querySnapshot = await getDocs(q);
    const services = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // If filtering by branch, check if service has pricing for this branch
      if (filterByBranch && branchId) {
        // Skip services that don't have pricing for this branch
        if (!data.branchPricing || !data.branchPricing[branchId]) {
          console.log(`⚠️ Service "${data.name}" skipped - no pricing for branch ${branchId}`);
          return;
        }
      }
      
      // Get price for configured branch, or use first available branch price
      let price = '₱0';
      let priceValue = 0;
      if (data.branchPricing) {
        if (branchId && data.branchPricing[branchId]) {
          priceValue = data.branchPricing[branchId];
          price = `₱${priceValue.toLocaleString()}`;
        } else {
          const firstPrice = Object.values(data.branchPricing)[0];
          priceValue = firstPrice || 0;
          price = firstPrice ? `₱${firstPrice.toLocaleString()}` : '₱0';
        }
      }
      
      services.push({
        id: doc.id,
        name: data.name || 'Unnamed Service',
        description: data.description || '',
        category: data.category || 'General',
        duration: data.duration ? `${data.duration} mins` : 'N/A',
        image: data.imageURL || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80',
        isChemical: data.isChemical || false,
        price: price,
        priceValue: priceValue,
        branchPricing: data.branchPricing || {},
        commissionPercentage: data.commissionPercentage || 0,
        inventoryItems: data.inventoryItems || [],
        productMappings: data.productMappings || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    // Sort by category, then by name
    services.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    console.log(`✅ Fetched ${services.length} services for branch ${branchId || 'all'}`);
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Fetch products from Firestore (filtered by branch)
export const fetchProducts = async (filterByBranch = true) => {
  try {
    const productsRef = collection(db, 'products');
    const branchId = getConfiguredBranchId();
    
    // Build query - only active products
    const q = query(productsRef, where('status', '==', 'Active'));
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // If filtering by branch, check if product is available at this branch
      if (filterByBranch && branchId) {
        // Check if branches array includes this branch
        if (!data.branches || !data.branches.includes(branchId)) {
          console.log(`⚠️ Product "${data.name}" skipped - not available at branch ${branchId}`);
          return;
        }
      }
      
      // Use otcPrice (over-the-counter price) for display
      const priceValue = data.otcPrice || 0;
      const price = priceValue ? `₱${priceValue.toLocaleString()}` : '₱0';
      
      products.push({
        id: doc.id,
        name: data.name || 'Unnamed Product',
        description: data.description || '',
        category: data.category || 'General',
        brand: data.brand || 'David Salon',
        price: price,
        priceValue: priceValue,
        image: data.imageUrl || 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=1920&q=80',
        variants: data.variants || '',
        upc: data.upc || '',
        unitCost: data.unitCost || 0,
        commissionPercentage: data.commissionPercentage || 0,
        shelfLife: data.shelfLife || '',
        suppliers: data.suppliers || [],
        branches: data.branches || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });
    
    // Sort by category, then by name
    products.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    console.log(`✅ Fetched ${products.length} products for branch ${branchId || 'all'}`);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export { db };
