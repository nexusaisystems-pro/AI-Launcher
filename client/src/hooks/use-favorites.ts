import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";
import { apiRequest } from "@/lib/queryClient";
import { useRef } from "react";

interface FavoritesData {
  favorites: string[];
  recent: string[];
  watchlist: string[];
}

const dedupe = (arr: string[]) => Array.from(new Set(arr));

// Shared debounce manager for batching saves with proper error rollback
class SaveManager {
  private saveTimeout: NodeJS.Timeout | null = null;
  private pendingSave: FavoritesData | null = null;
  private savePromiseResolvers: Array<{ resolve: () => void; reject: (error: any) => void }> = [];
  private preBatchSnapshot: FavoritesData | null = null;

  async scheduleSave(sessionId: string, data: FavoritesData, snapshot: FavoritesData): Promise<void> {
    return new Promise((resolve, reject) => {
      // Store the first snapshot before batching begins
      if (!this.preBatchSnapshot) {
        this.preBatchSnapshot = snapshot;
      }

      this.savePromiseResolvers.push({ resolve, reject });
      this.pendingSave = data;

      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }

      this.saveTimeout = setTimeout(async () => {
        const dataToSave = this.pendingSave!;
        const resolvers = [...this.savePromiseResolvers];
        const batchSnapshot = this.preBatchSnapshot;
        
        // Reset for next batch
        this.savePromiseResolvers = [];
        this.pendingSave = null;
        this.preBatchSnapshot = null;

        try {
          await apiRequest("POST", "/api/preferences", {
            sessionId,
            favoriteServers: dataToSave.favorites,
            recentServers: dataToSave.recent,
            watchlistServers: dataToSave.watchlist,
          });
          resolvers.forEach(r => r.resolve());
        } catch (error) {
          // All promises get the same batch snapshot for consistent rollback
          resolvers.forEach(r => r.reject({ error, batchSnapshot }));
        }
      }, 500); // 500ms debounce
    });
  }
}

const saveManager = new SaveManager();

export function useFavorites() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();

  // Fetch preferences with React Query
  const { data, isLoading } = useQuery<FavoritesData>({
    queryKey: ['preferences', sessionId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/preferences/${sessionId}`);
        
        if (response.ok) {
          const preferences = await response.json();
          return {
            favorites: dedupe(preferences.favoriteServers || []),
            recent: dedupe(preferences.recentServers || []),
            watchlist: dedupe(preferences.watchlistServers || []),
          };
        } else if (response.status === 404) {
          // Try localStorage migration
          const stored = localStorage.getItem("dayz-launcher-favorites");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const migrated = {
                favorites: dedupe(parsed.favorites || []),
                recent: dedupe(parsed.recent || []),
                watchlist: dedupe(parsed.watchlist || []),
              };
              // Migrate to backend
              await apiRequest("POST", "/api/preferences", {
                sessionId,
                favoriteServers: migrated.favorites,
                recentServers: migrated.recent,
                watchlistServers: migrated.watchlist,
              });
              return migrated;
            } catch (error) {
              console.error("Failed to migrate from localStorage:", error);
            }
          }
        }
        
        // Fallback to localStorage
        const stored = localStorage.getItem("dayz-launcher-favorites");
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            favorites: dedupe(parsed.favorites || []),
            recent: dedupe(parsed.recent || []),
            watchlist: dedupe(parsed.watchlist || []),
          };
        }
        
        return { favorites: [], recent: [], watchlist: [] };
      } catch (error) {
        console.error("Failed to load preferences:", error);
        // Fallback to localStorage
        const stored = localStorage.getItem("dayz-launcher-favorites");
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            favorites: dedupe(parsed.favorites || []),
            recent: dedupe(parsed.recent || []),
            watchlist: dedupe(parsed.watchlist || []),
          };
        }
        return { favorites: [], recent: [], watchlist: [] };
      }
    },
    staleTime: 30000, // 30 seconds
  });

  // Mutation for updating preferences with optimistic updates
  const updateMutation = useMutation({
    mutationFn: async ({ newData, snapshot }: { newData: FavoritesData; snapshot: FavoritesData }) => {
      // Save to localStorage immediately (optimistic)
      localStorage.setItem("dayz-launcher-favorites", JSON.stringify(newData));
      
      // Debounced backend save that properly reports errors with batch snapshot
      await saveManager.scheduleSave(sessionId, newData, snapshot);
      
      return newData;
    },
    onMutate: async ({ newData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['preferences', sessionId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<FavoritesData>(['preferences', sessionId]);

      // Optimistically update cache
      queryClient.setQueryData<FavoritesData>(['preferences', sessionId], newData);

      return { previousData };
    },
    onError: (err: any, variables, context) => {
      console.error("Failed to save preferences:", err);
      
      // Use batch snapshot if available (for consistent multi-mutation rollback)
      const rollbackData = err.batchSnapshot || context?.previousData;
      
      if (rollbackData) {
        // Rollback cache
        queryClient.setQueryData(['preferences', sessionId], rollbackData);
        // Rollback localStorage
        localStorage.setItem("dayz-launcher-favorites", JSON.stringify(rollbackData));
      }
    },
    onSuccess: () => {
      // Refetch to ensure cache is aligned with backend
      queryClient.invalidateQueries({ queryKey: ['preferences', sessionId] });
    },
  });

  const currentData = data || { favorites: [], recent: [], watchlist: [] };

  const addFavorite = (serverAddress: string) => {
    const newData = {
      ...currentData,
      favorites: dedupe([...currentData.favorites.filter(addr => addr !== serverAddress), serverAddress])
    };
    updateMutation.mutate({ newData, snapshot: currentData });
  };

  const removeFavorite = (serverAddress: string) => {
    const newData = {
      ...currentData,
      favorites: dedupe(currentData.favorites.filter(addr => addr !== serverAddress))
    };
    updateMutation.mutate({ newData, snapshot: currentData });
  };

  const isFavorite = (serverAddress: string) => {
    return currentData.favorites.includes(serverAddress);
  };

  const addRecent = (serverAddress: string) => {
    const newData = {
      ...currentData,
      recent: dedupe([serverAddress, ...currentData.recent.filter(addr => addr !== serverAddress)].slice(0, 10))
    };
    updateMutation.mutate({ newData, snapshot: currentData });
  };

  const clearRecent = () => {
    const newData = {
      ...currentData,
      recent: []
    };
    updateMutation.mutate({ newData, snapshot: currentData });
  };

  const addToWatchlist = (serverAddress: string) => {
    const newData = {
      ...currentData,
      watchlist: dedupe([...currentData.watchlist.filter(addr => addr !== serverAddress), serverAddress])
    };
    updateMutation.mutate({ newData, snapshot: currentData });
  };

  const removeFromWatchlist = (serverAddress: string) => {
    const newData = {
      ...currentData,
      watchlist: dedupe(currentData.watchlist.filter(addr => addr !== serverAddress))
    };
    updateMutation.mutate({ newData, snapshot: currentData });
  };

  const isWatchlisted = (serverAddress: string) => {
    return currentData.watchlist.includes(serverAddress);
  };

  return {
    favorites: currentData.favorites,
    recent: currentData.recent,
    watchlist: currentData.watchlist,
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
