import { useState, useEffect, useCallback } from "react";
import { getSessionId } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";

interface FavoritesData {
  favorites: string[];
  recent: string[];
  watchlist: string[];
}

export function useFavorites() {
  const [data, setData] = useState<FavoritesData>({ favorites: [], recent: [], watchlist: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => getSessionId());

  const dedupe = (arr: string[]) => Array.from(new Set(arr));

  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const response = await fetch(`/api/preferences/${sessionId}`);
        
        if (response.ok) {
          const preferences = await response.json();
          setData({
            favorites: dedupe(preferences.favoriteServers || []),
            recent: dedupe(preferences.recentServers || []),
            watchlist: dedupe(preferences.watchlistServers || []),
          });
        } else if (response.status === 404) {
          const stored = localStorage.getItem("dayz-launcher-favorites");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const deduped = {
                favorites: dedupe(parsed.favorites || []),
                recent: dedupe(parsed.recent || []),
                watchlist: dedupe(parsed.watchlist || []),
              };
              setData(deduped);
              await saveToBackend(deduped);
            } catch (error) {
              console.error("Failed to migrate from localStorage:", error);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load preferences from backend:", error);
        const stored = localStorage.getItem("dayz-launcher-favorites");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setData({
              favorites: dedupe(parsed.favorites || []),
              recent: dedupe(parsed.recent || []),
              watchlist: dedupe(parsed.watchlist || []),
            });
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

  const saveToBackend = useCallback(async (newData: FavoritesData) => {
    try {
      await apiRequest("POST", "/api/preferences", {
        sessionId,
        favoriteServers: newData.favorites,
        recentServers: newData.recent,
        watchlistServers: newData.watchlist,
      });
    } catch (error) {
      console.error("Failed to save preferences to backend:", error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isLoading) return;

    const current = localStorage.getItem("dayz-launcher-favorites");
    const newValue = JSON.stringify(data);
    
    if (current !== newValue) {
      localStorage.setItem("dayz-launcher-favorites", newValue);
      saveToBackend(data);
      window.dispatchEvent(new Event("favorites-updated"));
    }
  }, [data, isLoading, saveToBackend]);

  const addFavorite = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      favorites: dedupe([...prev.favorites.filter(addr => addr !== serverAddress), serverAddress])
    }));
  };

  const removeFavorite = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      favorites: dedupe(prev.favorites.filter(addr => addr !== serverAddress))
    }));
  };

  const isFavorite = (serverAddress: string) => {
    return data.favorites.includes(serverAddress);
  };

  const addRecent = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      recent: dedupe([serverAddress, ...prev.recent.filter(addr => addr !== serverAddress)].slice(0, 10))
    }));
  };

  const clearRecent = () => {
    setData(prev => ({
      ...prev,
      recent: []
    }));
  };

  const addToWatchlist = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      watchlist: dedupe([...prev.watchlist.filter(addr => addr !== serverAddress), serverAddress])
    }));
  };

  const removeFromWatchlist = (serverAddress: string) => {
    setData(prev => ({
      ...prev,
      watchlist: dedupe(prev.watchlist.filter(addr => addr !== serverAddress))
    }));
  };

  const isWatchlisted = (serverAddress: string) => {
    return data.watchlist.includes(serverAddress);
  };

  return {
    favorites: data.favorites,
    recent: data.recent,
    watchlist: data.watchlist,
    addFavorite,
    removeFavorite,
    isFavorite,
    addRecent,
    clearRecent,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isWatchlisted,
  };
}
