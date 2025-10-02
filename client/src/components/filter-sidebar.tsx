import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/hooks/use-favorites";
import type { ServerFilters } from "@shared/schema";

interface FilterSidebarProps {
  filters: ServerFilters;
  onFiltersChange: (filters: ServerFilters | ((prev: ServerFilters) => ServerFilters)) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [pingRange, setPingRange] = useState([filters.maxPing || 150]);
  const [activeTab, setActiveTab] = useState("filters");
  const { favorites, recent } = useFavorites();

  // Update filters whenever favorites/recent change and the corresponding tab is active
  useEffect(() => {
    if (activeTab === "favorites") {
      onFiltersChange(prev => ({ ...prev, favoriteAddresses: favorites, recentAddresses: undefined }));
    } else if (activeTab === "recent") {
      onFiltersChange(prev => ({ ...prev, recentAddresses: recent, favoriteAddresses: undefined }));
    }
  }, [favorites, recent, activeTab, onFiltersChange]);

  const handleFilterChange = (key: keyof ServerFilters, value: any) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickFilter = (filter: Partial<ServerFilters>) => {
    onFiltersChange(prev => ({ ...prev, ...filter }));
  };

  const resetFilters = () => {
    onFiltersChange({});
    setPingRange([150]);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === "favorites") {
      onFiltersChange(prev => ({ ...prev, favoriteAddresses: favorites, recentAddresses: undefined }));
    } else if (tab === "recent") {
      onFiltersChange(prev => ({ ...prev, recentAddresses: recent, favoriteAddresses: undefined }));
    } else {
      onFiltersChange(prev => ({ ...prev, favoriteAddresses: undefined, recentAddresses: undefined }));
    }
  };

  return (
    <aside className="w-72 bg-card border-r border-border overflow-y-auto flex-shrink-0">
      <div className="p-4 space-y-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="filters" data-testid="tab-filters">Filters</TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">Favorites</TabsTrigger>
            <TabsTrigger value="recent" data-testid="tab-recent">Recent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="filters" className="space-y-4 mt-4">
            {/* Quick Filters */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground mb-2">Quick Filters</h3>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="secondary" 
                  className={`cursor-pointer ${filters.maxPing === 50 ? 'badge-primary' : 'badge-muted'}`}
                  onClick={() => handleQuickFilter({ maxPing: 50 })}
                  data-testid="badge-low-ping"
                >
                  Low Ping
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`cursor-pointer ${filters.perspective === '1PP' ? 'badge-primary' : 'badge-muted'}`}
                  onClick={() => handleQuickFilter({ perspective: '1PP' })}
                  data-testid="badge-1pp"
                >
                  1PP Only
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`cursor-pointer ${filters.minPlayers === 50 ? 'badge-primary' : 'badge-muted'}`}
                  onClick={() => handleQuickFilter({ minPlayers: 50 })}
                  data-testid="badge-high-pop"
                >
                  High Pop
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`cursor-pointer ${filters.modCount === 'vanilla' ? 'badge-primary' : 'badge-muted'}`}
                  onClick={() => handleQuickFilter({ modCount: 'vanilla' })}
                  data-testid="badge-vanilla"
                >
                  Vanilla
                </Badge>
              </div>
            </div>

            {/* Map Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Map</label>
              <Select value={filters.map || "All Maps"} onValueChange={(value) => handleFilterChange('map', value === "All Maps" ? undefined : value)}>
                <SelectTrigger className="w-full bg-secondary border-border" data-testid="select-map">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Maps">All Maps</SelectItem>
                  <SelectItem value="Chernarus">Chernarus</SelectItem>
                  <SelectItem value="Livonia">Livonia</SelectItem>
                  <SelectItem value="Namalsk">Namalsk</SelectItem>
                  <SelectItem value="Deer Isle">Deer Isle</SelectItem>
                  <SelectItem value="Esseker">Esseker</SelectItem>
                  <SelectItem value="Takistan">Takistan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ping Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Ping Range</label>
                <span className="text-xs text-muted-foreground" data-testid="text-ping-range-filter">0-{pingRange[0]}ms</span>
              </div>
              <Slider
                value={pingRange}
                onValueChange={(value) => {
                  setPingRange(value);
                  handleFilterChange('maxPing', value[0]);
                }}
                max={300}
                step={10}
                className="w-full"
                data-testid="slider-ping"
              />
            </div>

            {/* Player Count */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Min Players</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 25, 50].map((count) => (
                  <Button
                    key={count}
                    variant={filters.minPlayers === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('minPlayers', count)}
                    className="text-xs"
                    data-testid={`button-min-players-${count}`}
                  >
                    {count}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Perspective */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Perspective</label>
              <div className="flex gap-2">
                {['1PP', '3PP', 'Both'].map((perspective) => (
                  <Button
                    key={perspective}
                    variant={filters.perspective === perspective ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('perspective', perspective === 'Both' ? undefined : perspective)}
                    className="flex-1 text-xs"
                    data-testid={`button-perspective-${perspective.toLowerCase()}`}
                  >
                    {perspective}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mod Count */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Mod Count</label>
              <div className="flex gap-2">
                {[
                  { key: 'vanilla', label: 'Vanilla' },
                  { key: '1-10', label: '1-10' },
                  { key: '10+', label: '10+' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filters.modCount === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('modCount', key)}
                    className="flex-1 text-xs"
                    data-testid={`button-mod-count-${key}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Options</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showFull"
                    checked={filters.showFull || false}
                    onCheckedChange={(checked) => handleFilterChange('showFull', checked)}
                    data-testid="checkbox-show-full"
                  />
                  <label htmlFor="showFull" className="text-sm text-foreground cursor-pointer">
                    Show Full Servers
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPassword"
                    checked={filters.showPasswordProtected || false}
                    onCheckedChange={(checked) => handleFilterChange('showPasswordProtected', checked)}
                    data-testid="checkbox-show-password"
                  />
                  <label htmlFor="showPassword" className="text-sm text-foreground cursor-pointer">
                    Show Password Protected
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showWhitelist"
                    checked={filters.showWhitelisted || false}
                    onCheckedChange={(checked) => handleFilterChange('showWhitelisted', checked)}
                    data-testid="checkbox-show-whitelist"
                  />
                  <label htmlFor="showWhitelist" className="text-sm text-foreground cursor-pointer">
                    Show Whitelisted
                  </label>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <Button 
              variant="destructive" 
              className="w-full bg-destructive/20 hover:bg-destructive/30 text-destructive"
              onClick={resetFilters}
              data-testid="button-reset-filters"
            >
              Reset All Filters
            </Button>
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No favorite servers yet
                </p>
              ) : (
                favorites.map((address) => (
                  <div key={address} className="p-2 bg-secondary rounded text-sm">
                    <code className="mono">{address}</code>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            <div className="space-y-2">
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent servers
                </p>
              ) : (
                recent.map((address) => (
                  <div key={address} className="p-2 bg-secondary rounded text-sm">
                    <code className="mono">{address}</code>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}
