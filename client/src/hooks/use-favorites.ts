import { useState, useEffect } from "react";

interface FavoritesData {
  favorites: string[];
  recent: string[];
}

export function useFavorites() {
  const [data, setData] = useState<FavoritesData>({ favorites: [], recent: [] });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dayz-launcher-favorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch (error) {
        console.error("Failed to parse favorites from localStorage:", error);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("dayz-launcher-favorites", JSON.stringify(data));
  }, [data]);

  const addFavorite = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      favorites: [...prev.favorites.filter(addr => addr !== serverAddress), serverAddress]
    }));
  };

  const removeFavorite = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      favorites: prev.favorites.filter(addr => addr !== serverAddress)
    }));
  };

  const isFavorite = (serverAddress: string) => {
    return data.favorites.includes(serverAddress);
  };

  const addRecent = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      recent: [serverAddress, ...prev.recent.filter(addr => addr !== serverAddress)].slice(0, 10) // Keep last 10
    }));
  };

  const clearRecent = () => {
    setData(prev => ({
      ...prev,
      recent: []
    }));
  };

  return {
    favorites: data.favorites,
    recent: data.recent,
    addFavorite,
    removeFavorite,
    isFavorite,
    addRecent,
    clearRecent,
  };
}
