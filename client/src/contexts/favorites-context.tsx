import { createContext, useContext, ReactNode, useMemo } from "react";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoritesContextValue {
  favorites: string[];
  recent: string[];
  watchlist: string[];
  isLoading: boolean;
  isFavorite: (address: string) => boolean;
  addFavorite: (address: string) => void;
  removeFavorite: (address: string) => void;
  addRecent: (address: string) => void;
  clearRecent: () => void;
  isWatchlisted: (address: string) => boolean;
  addToWatchlist: (address: string) => void;
  removeFromWatchlist: (address: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favoritesData = useFavorites();

  // Stable memoization - only recreate when functions change (never) or loading state changes
  const value = useMemo(() => ({
    favorites: favoritesData.favorites,
    recent: favoritesData.recent,
    watchlist: favoritesData.watchlist,
    isLoading: favoritesData.isLoading,
    isFavorite: favoritesData.isFavorite,
    addFavorite: favoritesData.addFavorite,
    removeFavorite: favoritesData.removeFavorite,
    addRecent: favoritesData.addRecent,
    clearRecent: favoritesData.clearRecent,
    isWatchlisted: favoritesData.isWatchlisted,
    addToWatchlist: favoritesData.addToWatchlist,
    removeFromWatchlist: favoritesData.removeFromWatchlist,
  }), [
    // Only recreate context when data arrays actually change reference (React Query handles this)
    favoritesData.favorites,
    favoritesData.recent,
    favoritesData.watchlist,
    favoritesData.isLoading,
    // Functions are stable from React Query mutations
    favoritesData.isFavorite,
    favoritesData.addFavorite,
    favoritesData.removeFavorite,
    favoritesData.addRecent,
    favoritesData.clearRecent,
    favoritesData.isWatchlisted,
    favoritesData.addToWatchlist,
    favoritesData.removeFromWatchlist,
  ]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavoritesContext must be used within FavoritesProvider");
  }
  return context;
}
