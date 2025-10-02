import { useState, useEffect, useCallback } from "react";
import { getSessionId } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";

interface FavoritesData {
  favorites: string[];
  recent: string[];
}

export function useFavorites() {
  const [data, setData] = useState<FavoritesData>({ favorites: [], recent: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => getSessionId());

  // Load from backend on mount
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const response = await fetch(`/api/preferences/${sessionId}`);
        
        if (response.ok) {
          const preferences = await response.json();
          setData({
            favorites: preferences.favoriteServers || [],
            recent: preferences.recentServers || [],
          });
        } else if (response.status === 404) {
          // No preferences yet, try migrating from localStorage
          const stored = localStorage.getItem("dayz-launcher-favorites");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setData(parsed);
              // Save migrated data to backend
              await saveToBackend(parsed);
            } catch (error) {
              console.error("Failed to migrate from localStorage:", error);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load preferences from backend:", error);
        // Fallback to localStorage
        const stored = localStorage.getItem("dayz-launcher-favorites");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setData(parsed);
          } catch (error) {
            console.error("Failed to parse favorites from localStorage:", error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFromBackend();
  }, [sessionId]);

  // Save to backend
  const saveToBackend = useCallback(async (newData: FavoritesData) => {
    try {
      await apiRequest("POST", "/api/preferences", {
        sessionId,
        favoriteServers: newData.favorites,
        recentServers: newData.recent,
      });
    } catch (error) {
      console.error("Failed to save preferences to backend:", error);
    }
  }, [sessionId]);

  // Save to localStorage and backend whenever data changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    const current = localStorage.getItem("dayz-launcher-favorites");
    const newValue = JSON.stringify(data);
    
    // Only update if value actually changed
    if (current !== newValue) {
      // Save to localStorage as backup
      localStorage.setItem("dayz-launcher-favorites", newValue);
      // Save to backend
      saveToBackend(data);
      // Dispatch custom event for same-window updates
      window.dispatchEvent(new Event("favorites-updated"));
    }
  }, [data, isLoading, saveToBackend]);

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
    isLoading,
  };
}
