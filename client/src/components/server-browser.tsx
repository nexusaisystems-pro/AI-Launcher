import { useState } from "react";
import { FilterSidebar } from "./filter-sidebar";
import { ServerCard } from "./server-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List } from "lucide-react";
import type { Server, ServerFilters } from "@shared/schema";

interface ServerBrowserProps {
  servers: Server[];
  isLoading: boolean;
  searchQuery: string;
  selectedServer: Server | null;
  onServerSelect: (server: Server) => void;
  onServerJoin: (server: Server) => void;
}

export function ServerBrowser({ 
  servers, 
  isLoading, 
  searchQuery, 
  selectedServer, 
  onServerSelect, 
  onServerJoin 
}: ServerBrowserProps) {
  const [filters, setFilters] = useState<ServerFilters>({});
  const [sortBy, setSortBy] = useState("players");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Filter and search servers
  const filteredServers = servers.filter(server => {
    // Favorites filter (if active, show only favorited servers)
    // Note: if favoriteAddresses is defined but empty, we show NO servers (since there are no favorites)
    if (filters.favoriteAddresses !== undefined) {
      if (!filters.favoriteAddresses.includes(server.address)) {
        return false;
      }
    }

    // Recent filter (if active, show only recent servers)  
    // Note: if recentAddresses is defined but empty, we show NO servers (since there are no recents)
    if (filters.recentAddresses !== undefined) {
      if (!filters.recentAddresses.includes(server.address)) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!server.name.toLowerCase().includes(query) &&
          !server.address.toLowerCase().includes(query) &&
          !server.map?.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Apply other filters
    if (filters.map && filters.map !== "All Maps" && server.map !== filters.map) {
      return false;
    }
    if (filters.minPlayers && (server.playerCount ?? 0) < filters.minPlayers) {
      return false;
    }
    if (filters.maxPing && (server.ping ?? 0) > filters.maxPing) {
      return false;
    }
    if (filters.perspective && filters.perspective !== "Both" && server.perspective !== filters.perspective) {
      return false;
    }
    if (!filters.showFull && (server.playerCount ?? 0) >= (server.maxPlayers ?? 0)) {
      return false;
    }
    if (!filters.showPasswordProtected && server.passwordProtected) {
      return false;
    }

    return true;
  });

  // Sort servers
  const sortedServers = [...filteredServers].sort((a, b) => {
    switch (sortBy) {
      case "players":
        return (b.playerCount ?? 0) - (a.playerCount ?? 0);
      case "ping":
        return (a.ping ?? 0) - (b.ping ?? 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "map":
        return (a.map || "").localeCompare(b.map || "");
      default:
        return 0;
    }
  });

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
        <div className="bg-secondary/30 border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-secondary border-border" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="players">Players (High to Low)</SelectItem>
                <SelectItem value="ping">Ping (Low to High)</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="map">Map</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-semibold" data-testid="text-filtered-count">{sortedServers.length}</span> of{" "}
              <span className="text-foreground font-semibold" data-testid="text-total-count">{servers.length}</span> servers
            </span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="p-2"
                data-testid="button-grid-view"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="p-2"
                data-testid="button-list-view"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Server Cards List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading servers...</p>
              </div>
            </div>
          ) : sortedServers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium text-foreground mb-2">No servers found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedServers.map((server) => (
                <ServerCard
                  key={server.address}
                  server={server}
                  isSelected={selectedServer?.address === server.address}
                  onSelect={() => onServerSelect(server)}
                  onJoin={() => onServerJoin(server)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
