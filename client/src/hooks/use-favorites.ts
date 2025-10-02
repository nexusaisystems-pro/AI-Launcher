import { useState, useEffect } from "react";

interface FavoritesData {
  favorites: string[];
  recent: string[];
}

export function useFavorites() {
  const [data, setData] = useState<FavoritesData>({ favorites: [], recent: [] });

  // Function to load from localStorage
  const loadFromStorage = () => {
    const stored = localStorage.getItem("dayz-launcher-favorites");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch (error) {
        console.error("Failed to parse favorites from localStorage:", error);
      }
    }
  };

  // Load from localStorage on mount and set up storage listener
  useEffect(() => {
    loadFromStorage();
    
    // Listen for storage events (changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dayz-launcher-favorites") {
        loadFromStorage();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleCustomUpdate = () => {
      loadFromStorage();
    };
    window.addEventListener("favorites-updated", handleCustomUpdate);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("favorites-updated", handleCustomUpdate);
    };
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const current = localStorage.getItem("dayz-launcher-favorites");
    const newValue = JSON.stringify(data);
    
    // Only update if value actually changed
    if (current !== newValue) {
      localStorage.setItem("dayz-launcher-favorites", newValue);
      // Dispatch custom event for same-window updates
      window.dispatchEvent(new Event("favorites-updated"));
    }
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
