import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

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

// Fetch services from Firestore
export const fetchServices = async () => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(
      servicesRef,
      where('isActive', '==', true),
      orderBy('category'),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    const services = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        name: data.name || 'Unnamed Service',
        description: data.description || '',
        category: data.category || 'General',
        duration: data.duration ? `${data.duration} mins` : 'N/A',
        image: data.imageURL || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80',
        isChemical: data.isChemical || false,
        // Get price from branchPricing (use first branch price or default)
        price: data.branchPricing 
          ? `₱${Object.values(data.branchPricing)[0]?.toLocaleString() || 0}`
          : '₱0',
        branchPricing: data.branchPricing || {}
      });
    });
    
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Fetch products from Firestore (if you have a products collection)
export const fetchProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('isActive', '==', true));
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name || 'Unnamed Product',
        description: data.description || '',
        category: data.category || 'General',
        brand: data.brand || 'David Salon',
        price: data.price ? `₱${data.price.toLocaleString()}` : '₱0',
        image: data.imageURL || 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=1920&q=80'
      });
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export { db };
