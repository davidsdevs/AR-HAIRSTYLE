import { useState, useEffect } from "react";

const FAVORITES_STORAGE_KEY = "hair_tryon_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }, [favorites]);

  const addFavorite = (hairstyle, userImage, generatedImage) => {
    const favorite = {
      id: Date.now(),
      hairstyle,
      userImage,
      generatedImage,
      createdAt: new Date().toISOString(),
    };
    setFavorites((prev) => [...prev, favorite]);
    return favorite;
  };

  const removeFavorite = (id) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  };

  const isFavorite = (hairstyleId) => {
    return favorites.some((fav) => fav.hairstyle?.id === hairstyleId);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
  };
}




