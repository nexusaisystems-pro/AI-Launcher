import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFavorites } from "@/hooks/use-favorites";
import { Sliders, Star, Clock } from "lucide-react";
import type { ServerFilters } from "@shared/schema";

interface FilterSidebarProps {
  filters: ServerFilters;
  onFiltersChange: (filters: ServerFilters | ((prev: ServerFilters) => ServerFilters)) => void;
}

export function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [pingRange, setPingRange] = useState([filters.maxPing || 150]);
  const [activeTab, setActiveTab] = useState("filters");
  const { favorites, recent } = useFavorites();

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
    <aside className="w-80 glass border-r border-primary/20 overflow-y-auto flex-shrink-0 backdrop-blur-xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-primary/20">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center neon-border">
            <Sliders className="w-5 h-5 text-primary-glow" />
          </div>
          <h2 className="text-xl font-bold font-display text-foreground">Filters</h2>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass p-1 gap-1 border border-primary/20">
            <TabsTrigger 
              value="filters" 
              data-testid="tab-filters"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:neon-glow font-semibold"
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              Filters
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              data-testid="tab-favorites"
              className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:neon-glow-secondary font-semibold"
            >
              <Star className="w-4 h-4 mr-1.5" />
              Favorites
            </TabsTrigger>
            <TabsTrigger 
              value="recent" 
              data-testid="tab-recent"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-semibold"
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Recent
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="filters" className="space-y-6 mt-6">
            {/* Quick Filters */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-primary-glow">Quick Filters</h3>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="secondary" 
                  className={`cursor-pointer transition-all hover:scale-105 ${filters.maxPing === 50 ? 'badge-primary animate-pulse-slow' : 'badge-muted hover:badge-primary'}`}
                  onClick={() => handleQuickFilter({ maxPing: 50 })}
                  data-testid="badge-low-ping"
                >
                  Low Ping
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`cursor-pointer transition-all hover:scale-105 ${filters.perspective === '1PP' ? 'badge-primary animate-pulse-slow' : 'badge-muted hover:badge-primary'}`}
                  onClick={() => handleQuickFilter({ perspective: '1PP' })}
                  data-testid="badge-1pp"
                >
                  1PP Only
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`cursor-pointer transition-all hover:scale-105 ${filters.minPlayers === 50 ? 'badge-primary animate-pulse-slow' : 'badge-muted hover:badge-primary'}`}
                  onClick={() => handleQuickFilter({ minPlayers: 50 })}
                  data-testid="badge-high-pop"
                >
                  High Pop
                </Badge>
                <Badge 
                  variant="secondary"
                  className={`cursor-pointer transition-all hover:scale-105 ${filters.modCount === 'vanilla' ? 'badge-success animate-pulse-slow' : 'badge-muted hover:badge-success'}`}
                  onClick={() => handleQuickFilter({ modCount: 'vanilla' })}
                  data-testid="badge-vanilla"
                >
                  Vanilla
                </Badge>
              </div>
            </div>

            {/* Map Filter */}
            <div className="space-y-3">
              <label className="text-sm font-bold font-display uppercase tracking-wider text-foreground">Map</label>
              <Select value={filters.map || "All Maps"} onValueChange={(value) => handleFilterChange('map', value === "All Maps" ? undefined : value)}>
                <SelectTrigger className="w-full glass border-primary/30 hover:border-primary/50 transition-colors" data-testid="select-map">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-primary/30">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold font-display uppercase tracking-wider text-foreground">Ping Range</label>
                <span className="text-sm font-bold font-display text-primary-glow px-3 py-1 rounded-md glass border border-primary/30" data-testid="text-ping-range-filter">
                  0-{pingRange[0]}ms
                </span>
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
            <div className="space-y-3">
              <label className="text-sm font-bold font-display uppercase tracking-wider text-foreground">Min Players</label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 25, 50].map((count) => (
                  <Button
                    key={count}
                    variant={filters.minPlayers === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('minPlayers', count)}
                    className={`text-sm font-bold font-display ${filters.minPlayers === count ? 'neon-glow' : 'glass border-primary/20 hover:border-primary/40'}`}
                    data-testid={`button-min-players-${count}`}
                  >
                    {count}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Perspective */}
            <div className="space-y-3">
              <label className="text-sm font-bold font-display uppercase tracking-wider text-foreground">Perspective</label>
              <div className="flex gap-2">
                {['1PP', '3PP', 'Both'].map((perspective) => (
                  <Button
                    key={perspective}
                    variant={filters.perspective === perspective ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange('perspective', perspective === 'Both' ? undefined : perspective)}
                    className={`flex-1 text-sm font-bold font-display ${filters.perspective === perspective ? 'neon-glow' : 'glass border-primary/20 hover:border-primary/40'}`}
                    data-testid={`button-perspective-${perspective.toLowerCase()}`}
                  >
                    {perspective}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mod Count */}
            <div className="space-y-3">
              <label className="text-sm font-bold font-display uppercase tracking-wider text-foreground">Mod Count</label>
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
                    className={`flex-1 text-sm font-bold font-display ${filters.modCount === key ? 'neon-glow' : 'glass border-primary/20 hover:border-primary/40'}`}
                    data-testid={`button-mod-count-${key}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="text-sm font-bold font-display uppercase tracking-wider text-foreground">Options</label>
              <div className="space-y-3 glass-card p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="showFull"
                    checked={filters.showFull || false}
                    onCheckedChange={(checked) => handleFilterChange('showFull', checked)}
                    data-testid="checkbox-show-full"
                    className="border-primary/50"
                  />
                  <label htmlFor="showFull" className="text-sm text-foreground cursor-pointer font-medium">
                    Show Full Servers
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="showPassword"
                    checked={filters.showPasswordProtected || false}
                    onCheckedChange={(checked) => handleFilterChange('showPasswordProtected', checked)}
                    data-testid="checkbox-show-password"
                    className="border-primary/50"
                  />
                  <label htmlFor="showPassword" className="text-sm text-foreground cursor-pointer font-medium">
                    Show Password Protected
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="showWhitelist"
                    checked={filters.showWhitelisted || false}
                    onCheckedChange={(checked) => handleFilterChange('showWhitelisted', checked)}
                    data-testid="checkbox-show-whitelist"
                    className="border-primary/50"
                  />
                  <label htmlFor="showWhitelist" className="text-sm text-foreground cursor-pointer font-medium">
                    Show Whitelisted
                  </label>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <Button 
              variant="destructive" 
              className="w-full bg-gradient-to-r from-destructive/20 to-destructive/30 hover:from-destructive/30 hover:to-destructive/40 text-destructive border border-destructive/50 font-bold font-display uppercase tracking-wide transition-all hover:scale-105 hover:neon-glow"
              onClick={resetFilters}
              data-testid="button-reset-filters"
            >
              Reset All Filters
            </Button>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div className="space-y-3">
              {favorites.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No favorite servers yet
                  </p>
                </div>
              ) : (
                favorites.map((address) => (
                  <div key={address} className="glass-card p-3 neon-border">
                    <code className="mono text-sm text-primary-glow">{address}</code>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <div className="space-y-3">
              {recent.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No recent servers
                  </p>
                </div>
              ) : (
                recent.map((address) => (
                  <div key={address} className="glass-card p-3 border border-accent/30">
                    <code className="mono text-sm text-accent-glow">{address}</code>
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
