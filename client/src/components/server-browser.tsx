import { useState, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FilterSidebar } from "./filter-sidebar";
import { ServerCard } from "./server-card";
import { RecommendationsCard } from "./recommendations-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List } from "lucide-react";
import type { Server, ServerFilters } from "@shared/schema";
import type { ServerWithIntelligence } from "@/hooks/use-servers";

interface ServerBrowserProps {
  servers: ServerWithIntelligence[];
  isLoading: boolean;
  searchQuery: string;
  selectedServer: ServerWithIntelligence | null;
  onServerSelect: (server: ServerWithIntelligence) => void;
  onServerJoin: (server: ServerWithIntelligence) => void;
  aiFilters?: ServerFilters | null;
  realtimeResults?: any[];
}

export function ServerBrowser({ 
  servers, 
  isLoading, 
  searchQuery, 
  selectedServer, 
  onServerSelect, 
  onServerJoin,
  aiFilters,
  realtimeResults = []
}: ServerBrowserProps) {
  const [filters, setFilters] = useState<ServerFilters>({});
  const [sortBy, setSortBy] = useState("players");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const parentRef = useRef<HTMLDivElement>(null);

  // Merge cached servers with real-time search results
  const allServers = useMemo(() => {
    if (realtimeResults && realtimeResults.length > 0) {
      // When we have real-time results, show those (they're already filtered by search)
      return realtimeResults;
    }
    return servers;
  }, [servers, realtimeResults]);

  // Filter and search servers (memoized for performance)
  const filteredServers = useMemo(() => {
    // Merge AI filters with manual filters (AI filters take precedence)
    const combinedFilters = { ...filters, ...(aiFilters || {}) };
    
    return allServers.filter(server => {
      // Favorites filter (if active, show only favorited servers)
      // Note: if favoriteAddresses is defined but empty, we show NO servers (since there are no favorites)
      if (combinedFilters.favoriteAddresses !== undefined) {
        if (!combinedFilters.favoriteAddresses.includes(server.address)) {
          return false;
        }
      }

      // Recent filter (if active, show only recent servers)  
      // Note: if recentAddresses is defined but empty, we show NO servers (since there are no recents)
      if (combinedFilters.recentAddresses !== undefined) {
        if (!combinedFilters.recentAddresses.includes(server.address)) {
          return false;
        }
      }

      // Watchlist filter (if active, show only watchlisted servers)
      if (combinedFilters.watchlistAddresses !== undefined) {
        if (!combinedFilters.watchlistAddresses.includes(server.address)) {
          return false;
        }
      }

      // Search filter (only apply if no AI filters)
      if (searchQuery && !aiFilters) {
        const query = searchQuery.toLowerCase();
        if (!server.name.toLowerCase().includes(query) &&
            !server.address.toLowerCase().includes(query) &&
            !server.map?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Apply other filters
      if (combinedFilters.map && combinedFilters.map !== "All Maps" && server.map !== combinedFilters.map) {
        return false;
      }
      if (combinedFilters.minPlayers && (server.playerCount ?? 0) < combinedFilters.minPlayers) {
        return false;
      }
      if (combinedFilters.maxPing && (server.ping ?? 0) > combinedFilters.maxPing) {
        return false;
      }
      if (combinedFilters.perspective && combinedFilters.perspective !== "Both" && server.perspective !== combinedFilters.perspective) {
        return false;
      }
      if (!combinedFilters.showFull && (server.playerCount ?? 0) >= (server.maxPlayers ?? 0)) {
        return false;
      }
      if (!combinedFilters.showPasswordProtected && server.passwordProtected) {
        return false;
      }

      // Quality filters
      if (combinedFilters.minQualityScore && (!server.intelligence || server.intelligence.qualityScore < combinedFilters.minQualityScore)) {
        return false;
      }
      if (combinedFilters.hideFraud && server.intelligence && server.intelligence.fraudFlags.length > 0) {
        return false;
      }
      if (combinedFilters.verifiedOnly && (!server.intelligence || !server.intelligence.verified)) {
        return false;
      }

      return true;
    });
  }, [allServers, searchQuery, filters, aiFilters]);

  // Sort servers (memoized for performance)
  const sortedServers = useMemo(() => [...filteredServers].sort((a, b) => {
    switch (sortBy) {
      case "players":
        return (b.playerCount ?? 0) - (a.playerCount ?? 0);
      case "ping":
        return (a.ping ?? 0) - (b.ping ?? 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "map":
        return (a.map || "").localeCompare(b.map || "");
      case "quality":
        const scoreA = a.intelligence?.qualityScore ?? 0;
        const scoreB = b.intelligence?.qualityScore ?? 0;
        return scoreB - scoreA;
      default:
        return 0;
    }
  }), [filteredServers, sortBy]);

  // Virtualization for large lists (only in list view)
  const virtualizer = useVirtualizer({
    count: sortedServers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
    enabled: viewMode === "list",
  });

  // Create stable memoized handler maps to prevent unnecessary re-renders
  const selectHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    sortedServers.forEach(server => {
      handlers.set(server.address, () => onServerSelect(server));
    });
    return handlers;
  }, [sortedServers, onServerSelect]);

  const joinHandlers = useMemo(() => {
    const handlers = new Map<string, () => void>();
    sortedServers.forEach(server => {
      handlers.set(server.address, () => onServerJoin(server));
    });
    return handlers;
  }, [sortedServers, onServerJoin]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Filter Sidebar */}
      <FilterSidebar 
        filters={filters} 
        onFiltersChange={setFilters} 
      />

      {/* Server List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Sort Bar */}
        <div className="glass border-b border-primary/20 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 glass border-primary/30 hover:border-primary/50 transition-colors" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-primary/30">
                <SelectItem value="quality">Quality Score (High to Low)</SelectItem>
                <SelectItem value="players">Players (High to Low)</SelectItem>
                <SelectItem value="ping">Ping (Low to High)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="map">Map</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm">
              <span className="text-muted-foreground">Showing </span>
              <span className="text-primary-glow font-bold font-display text-lg" data-testid="text-filtered-count">{sortedServers.length}</span>
              <span className="text-muted-foreground"> of </span>
              <span className="text-foreground font-semibold" data-testid="text-total-count">{servers.length}</span>
              <span className="text-muted-foreground"> servers</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-all ${viewMode === "grid" ? "neon-glow" : ""}`}
                data-testid="button-grid-view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`p-2 transition-all ${viewMode === "list" ? "neon-glow" : ""}`}
                data-testid="button-list-view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Server Cards List */}
        <div ref={parentRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Recommendations */}
          <RecommendationsCard
            onSelectServer={(address) => {
              const server = servers.find(s => s.address === address);
              if (server) onServerSelect(server);
            }}
            onJoinServer={(address) => {
              const server = servers.find(s => s.address === address);
              if (server) onServerJoin(server);
            }}
          />

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="animate-spin w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full neon-glow"></div>
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-16 h-16 border-4 border-transparent border-t-secondary/50 rounded-full"></div>
                  </div>
                </div>
                <p className="text-muted-foreground font-display text-lg">Loading servers...</p>
              </div>
            </div>
          ) : sortedServers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center glass-card p-8 max-w-md">
                <p className="text-xl font-display font-bold text-foreground mb-2">No servers found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            </div>
          ) : viewMode === "list" ? (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const server = sortedServers[virtualItem.index];
                return (
                  <div
                    key={server.address}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="pb-3"
                  >
                    <ServerCard
                      server={server}
                      isSelected={selectedServer?.address === server.address}
                      onSelect={selectHandlers.get(server.address)!}
                      onJoin={joinHandlers.get(server.address)!}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedServers.map((server) => (
                <ServerCard
                  key={server.address}
                  server={server}
                  isSelected={selectedServer?.address === server.address}
                  onSelect={selectHandlers.get(server.address)!}
                  onJoin={joinHandlers.get(server.address)!}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
