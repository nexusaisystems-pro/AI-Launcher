import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ServerBrowser } from "@/components/server-browser";
import { ServerDetailPanel } from "@/components/server-detail-panel";
import { JoinModal } from "@/components/join-modal";
import { DesktopJoinModal } from "@/components/desktop-join-modal";
import { DesktopAuth } from "@/components/desktop-auth";
import { useServers, useServersInfinite } from "@/hooks/use-servers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plus, Globe, Sparkles, LogOut, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Server, ServerFilters } from "@shared/schema";
import type { ServerWithIntelligence } from "@/hooks/use-servers";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { useDesktop } from "@/contexts/desktop-context";

export default function Dashboard() {
  const { isDesktop } = useDesktop();
  const [location] = useLocation();
  const [selectedServer, setSelectedServer] = useState<ServerWithIntelligence | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiFilters, setAiFilters] = useState<ServerFilters | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [realtimeResults, setRealtimeResults] = useState<any[]>([]);
  const [isSearchingRealtime, setIsSearchingRealtime] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const [filters, setFilters] = useState<ServerFilters>({});
  const [sortBy, setSortBy] = useState("players");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for deep link join events from web browser (desktop only)
  useEffect(() => {
    if (window.electronAPI?.onDeepLinkJoin) {
      window.electronAPI.onDeepLinkJoin((data: any) => {
        console.log('[Dashboard] Deep link join request:', data);
        // Create a server object from the deep link data
        const server: ServerWithIntelligence = {
          id: `deep-link-${Date.now()}`,
          gameId: 'dayz',
          address: data.serverAddress,
          name: data.serverName,
          map: null,
          playerCount: null,
          maxPlayers: null,
          ping: null,
          passwordProtected: null,
          perspective: null,
          region: null,
          version: null,
          mods: data.requiredMods?.map((mod: any) => ({
            workshopId: mod.steamWorkshopId.toString(),
            name: mod.name,
            size: 0
          })) || [],
          modList: null,
          queue: null,
          verified: null,
          lastWipe: null,
          restartSchedule: null,
          lastSeen: new Date(),
          uptime: null,
          tags: [],
          isSponsored: false,
          sponsorPriority: null,
          sponsorExpiresAt: null
        };
        setSelectedServer(server);
        setIsJoinModalOpen(true);
      });
    }
  }, []);
  
  // Use infinite scroll for paginated servers with filters and sorting
  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useServersInfinite(filters, sortBy, 100);
  
  // Flatten all pages into a single array and deduplicate by address
  const servers = useMemo(() => {
    if (!infiniteData) return [];
    const allServers = infiniteData.pages.flatMap(page => page.servers);
    // Deduplicate by address to avoid duplicate keys
    const uniqueServers = new Map<string, ServerWithIntelligence>();
    allServers.forEach(server => {
      uniqueServers.set(server.address, server);
    });
    return Array.from(uniqueServers.values());
  }, [infiniteData]);
  
  const totalServers = infiniteData?.pages[0]?.pagination.total ?? 0;
  
  const { data: statsData } = useServers("/api/stats");
  const stats = statsData && 'serversOnline' in statsData ? statsData : undefined;
  
  // Calculate distribution metrics from loaded servers
  const distributions = useMemo(() => {
    if (!Array.isArray(servers) || servers.length === 0) {
      return {
        quality: { S: 0, A: 0, B: 0, C: 0, other: 0 },
        mods: { vanilla: 0, light: 0, heavy: 0 },
        regions: { EU: 0, NA: 0, Asia: 0, other: 0 }
      };
    }
    
    const total = servers.length;
    
    // Quality distribution
    const qualityCounts = servers.reduce((acc, s) => {
      const grade = s.intelligence?.grade || 'F';
      if (grade === 'S') acc.S++;
      else if (grade === 'A') acc.A++;
      else if (grade === 'B') acc.B++;
      else if (grade === 'C') acc.C++;
      else acc.other++;
      return acc;
    }, { S: 0, A: 0, B: 0, C: 0, other: 0 });
    
    // Mod distribution
    const modCounts = servers.reduce((acc, s) => {
      const modCount = s.mods?.length || 0;
      if (modCount === 0) acc.vanilla++;
      else if (modCount <= 10) acc.light++;
      else acc.heavy++;
      return acc;
    }, { vanilla: 0, light: 0, heavy: 0 });
    
    // Region distribution
    const regionCounts = servers.reduce((acc, s) => {
      const region = s.region || 'Other';
      if (region.includes('EU')) acc.EU++;
      else if (region.includes('NA') || region.includes('US')) acc.NA++;
      else if (region.includes('Asia') || region.includes('AS')) acc.Asia++;
      else acc.other++;
      return acc;
    }, { EU: 0, NA: 0, Asia: 0, other: 0 });
    
    return {
      quality: {
        S: Math.round((qualityCounts.S / total) * 100),
        A: Math.round((qualityCounts.A / total) * 100),
        B: Math.round((qualityCounts.B / total) * 100),
        C: Math.round((qualityCounts.C / total) * 100),
        other: Math.round((qualityCounts.other / total) * 100)
      },
      mods: {
        vanilla: Math.round((modCounts.vanilla / total) * 100),
        light: Math.round((modCounts.light / total) * 100),
        heavy: Math.round((modCounts.heavy / total) * 100)
      },
      regions: {
        EU: Math.round((regionCounts.EU / total) * 100),
        NA: Math.round((regionCounts.NA / total) * 100),
        Asia: Math.round((regionCounts.Asia / total) * 100),
        other: Math.round((regionCounts.other / total) * 100)
      }
    };
  }, [servers]);

  const handleServerSelect = (server: ServerWithIntelligence) => {
    setSelectedServer(server);
  };

  const handleLogout = () => {
    // Use window.location to follow the redirect to Replit's end session URL
    window.location.href = '/api/logout';
  };

  const handleJoinServer = (server: ServerWithIntelligence) => {
    setSelectedServer(server);
    setIsJoinModalOpen(true);
  };

  const handleRefresh = () => {
    // Clear any pending search timeout to prevent race conditions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSearchQuery("");
    setAiFilters(null);
    setRealtimeResults([]);
    refetch();
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) {
      setAiFilters(null);
      return;
    }

    setIsAiSearching(true);
    try {
      const response = await apiRequest("POST", "/api/search/ai", { query: searchQuery });
      const data = await response.json();
      setAiFilters(data.filters);
    } catch (error) {
      console.error("AI search failed:", error);
      setAiFilters(null);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleRealtimeSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setRealtimeResults([]);
      return;
    }

    setIsSearchingRealtime(true);
    try {
      const response = await fetch(`/api/servers/search/realtime?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      
      if (data.servers) {
        console.log(`[Dashboard] Found ${data.servers.length} servers from BattleMetrics real-time search`);
        
        // Transform realtime results to match ServerWithIntelligence shape
        const transformedServers = data.servers.map((server: any) => ({
          ...server,
          // Required Server fields
          id: server.address, // Use address as ID for realtime results
          gameId: 'dayz',
          queue: server.queue || 0,
          lastWipe: server.lastWipe || null,
          restartSchedule: server.restartSchedule || null,
          lastSeen: server.lastSeen || new Date().toISOString(),
          uptime: server.uptime || 0,
          tags: server.tags || [],
          // Intelligence field
          intelligence: {
            qualityScore: 0,
            grade: 'N/A' as const,
            verified: server.verified || false,
            trustIndicators: {
              uptime7d: null,
              rank: null,
              trend: 'unknown' as const,
              playerConsistency: 0,
              a2sVsBmMatch: 0
            },
            fraudFlags: [],
            battlemetricsRank: null,
            battlemetricsStatus: null,
            battlemetricsId: null,
            battlemetricsName: server.name,
            cacheAge: null
          }
        }));
        
        setRealtimeResults(transformedServers);
      }
    } catch (error) {
      console.error("Real-time search failed:", error);
      setRealtimeResults([]);
    } finally {
      setIsSearchingRealtime(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value.trim() || value.trim().length < 2) {
      setAiFilters(null);
      setRealtimeResults([]);
    } else {
      // Trigger real-time search automatically when user types (debounced)
      searchTimeoutRef.current = setTimeout(() => {
        handleRealtimeSearch();
      }, 600); // Debounce 600ms
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <FavoritesProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="glass border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 holographic rounded-xl flex items-center justify-center neon-border animate-float">
                <Globe className="w-6 h-6 text-primary-glow" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl -z-10"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold font-display text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary-glow via-secondary-glow to-accent-glow animate-shimmer" style={{backgroundSize: "200% auto"}}>
                  DayZ Launcher
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Next-Gen Experience</p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex gap-1 border-l border-primary/20 pl-6">
              <Link href="/launcher">
                <a className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${location === '/launcher' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'}`} data-testid="tab-servers">
                  <Globe className="w-4 h-4" />
                  Servers
                </a>
              </Link>
              <Link href="/mods">
                <a className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${location === '/mods' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'}`} data-testid="tab-mods">
                  <Package className="w-4 h-4" />
                  Mods
                </a>
              </Link>
            </nav>
          </div>
          
          {/* AI Search Bar */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="Search ALL DayZ servers (downbad, roleplay, hardcore...) or use AI filters" 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                className="w-full glass border-primary/30 pl-12 pr-24 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:neon-glow transition-all"
                data-testid="search-input"
              />
              <Button
                size="sm"
                onClick={handleAiSearch}
                disabled={isAiSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0"
                data-testid="button-ai-search"
              >
                {isAiSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI
                  </>
                )}
              </Button>
            </div>
            {aiFilters && Object.keys(aiFilters).length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">AI Search Active:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(aiFilters).map(([key, value]) => (
                    <span key={key} className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {key}: {String(value)}
                    </span>
                  ))}
                  <button
                    onClick={() => { setAiFilters(null); setSearchQuery(""); }}
                    className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="glass border-primary/30 hover:border-primary/50 hover:neon-glow transition-all font-semibold"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="btn-primary font-bold font-display uppercase tracking-wide"
              data-testid="button-add-server"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Server
            </Button>
            {/* Desktop Auth (shows login/user menu in desktop mode) */}
            <DesktopAuth />
            {/* Web Logout */}
            {!isDesktop && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="glass border border-primary/30 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-semibold"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            )}
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="glass border-t border-primary/20 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Showing servers */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Showing:</span>
                <span className="text-base font-bold font-display text-primary-glow" data-testid="text-loaded-servers">
                  {Array.isArray(servers) ? servers.length : 0}
                </span>
                <span className="text-xs text-muted-foreground">of</span>
                <span className="text-sm font-semibold text-foreground" data-testid="text-total-servers">
                  {totalServers}
                </span>
              </div>
              
              <div className="w-px h-5 bg-primary/20"></div>
              
              {/* Players */}
              <div className="flex items-center gap-2">
                <span className="status-dot status-online"></span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Players:</span>
                <span className="text-base font-bold font-display text-success" data-testid="text-total-players">
                  {Array.isArray(servers) ? servers.reduce((sum, s) => sum + (s.playerCount ?? 0), 0) : 0}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  / {stats?.totalPlayers ?? 0}
                </span>
              </div>
              
              <div className="w-px h-5 bg-primary/20"></div>
              
              {/* Ping - Desktop Only */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ping:</span>
                <span className="text-xs font-semibold text-yellow-400/80" data-testid="text-avg-ping">
                  Desktop Only
                </span>
              </div>
              
              <div className="w-px h-5 bg-primary/20"></div>
              
              {/* Quality Distribution */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Quality:</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-yellow-400">S:{distributions.quality.S}%</span>
                  <span className="text-green-400">A:{distributions.quality.A}%</span>
                  <span className="text-blue-400">B:{distributions.quality.B}%</span>
                  <span className="text-orange-400">C:{distributions.quality.C}%</span>
                  <span className="text-muted-foreground/50">D/F:{distributions.quality.other}%</span>
                </div>
              </div>
              
              <div className="w-px h-5 bg-primary/20"></div>
              
              {/* Mod Distribution */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Mods:</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-cyan-400">V:{distributions.mods.vanilla}%</span>
                  <span className="text-blue-400">L:{distributions.mods.light}%</span>
                  <span className="text-purple-400">H:{distributions.mods.heavy}%</span>
                </div>
              </div>
              
              <div className="w-px h-5 bg-primary/20"></div>
              
              {/* Region Distribution */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Regions:</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-blue-400">EU:{distributions.regions.EU}%</span>
                  <span className="text-green-400">NA:{distributions.regions.NA}%</span>
                  <span className="text-orange-400">AS:{distributions.regions.Asia}%</span>
                </div>
              </div>
            </div>
            
            {/* Updated timestamp */}
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-md border border-primary/20 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-slow"></span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Updated:</span>
              <span className="text-xs font-semibold text-foreground mono" data-testid="text-last-updated">
                {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex overflow-hidden transition-all duration-300 ${selectedServer ? 'mr-[480px]' : ''}`}>
        <ServerBrowser 
          servers={Array.isArray(servers) ? servers : []}
          isLoading={isLoading || isSearchingRealtime}
          searchQuery={searchQuery}
          selectedServer={selectedServer}
          onServerSelect={handleServerSelect}
          onServerJoin={handleJoinServer}
          aiFilters={aiFilters}
          realtimeResults={realtimeResults}
          onFilteredCountChange={setFilteredCount}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          filters={filters}
          sortBy={sortBy}
          onFiltersChange={setFilters}
          onSortChange={setSortBy}
        />
        
        {selectedServer && (
          <ServerDetailPanel 
            server={selectedServer}
            onClose={() => setSelectedServer(null)}
            onJoin={() => handleJoinServer(selectedServer)}
          />
        )}
      </main>

      {/* Join Modal */}
      {isDesktop && selectedServer ? (
        <DesktopJoinModal
          open={isJoinModalOpen}
          onOpenChange={setIsJoinModalOpen}
          serverAddress={selectedServer.address}
          serverName={selectedServer.name}
          requiredMods={selectedServer.modList?.map(mod => ({
            name: mod.name || `Mod_${mod.workshopId}`,
            workshopId: mod.workshopId
          })) || []}
        />
      ) : (
        <JoinModal 
          server={selectedServer}
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
        />
      )}
      </div>
    </FavoritesProvider>
  );
}
