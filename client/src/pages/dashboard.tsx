import { useState } from "react";
import { ServerBrowser } from "@/components/server-browser";
import { ServerDetailPanel } from "@/components/server-detail-panel";
import { JoinModal } from "@/components/join-modal";
import { useServers } from "@/hooks/use-servers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plus, Globe, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Server, ServerFilters } from "@shared/schema";
import type { ServerWithIntelligence } from "@/hooks/use-servers";

export default function Dashboard() {
  const [selectedServer, setSelectedServer] = useState<ServerWithIntelligence | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiFilters, setAiFilters] = useState<ServerFilters | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const { data: servers = [], isLoading, refetch } = useServers("/api/servers", undefined, true);
  const { data: statsData } = useServers("/api/stats");
  const stats = statsData && 'serversOnline' in statsData ? statsData : undefined;

  const handleServerSelect = (server: ServerWithIntelligence) => {
    setSelectedServer(server);
  };

  const handleJoinServer = (server: ServerWithIntelligence) => {
    setSelectedServer(server);
    setIsJoinModalOpen(true);
  };

  const handleRefresh = () => {
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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setAiFilters(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="glass border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 holographic rounded-xl flex items-center justify-center neon-border animate-float">
              <Globe className="w-6 h-6 text-primary-glow" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl -z-10"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary-glow via-secondary-glow to-accent-glow animate-shimmer" style={{backgroundSize: "200% auto"}}>
                DayZ Server Browser
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Next-Gen Launcher</p>
            </div>
          </div>
          
          {/* AI Search Bar */}
          <div className="flex-1 max-w-2xl mx-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="Try: 'vanilla servers with low ping' or 'high pop namalsk servers'" 
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
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="glass border-t border-primary/20 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="status-dot status-online"></span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Servers:</span>
                <span className="text-base font-bold font-display text-primary-glow" data-testid="text-servers-online">
                  {stats?.serversOnline ?? (Array.isArray(servers) ? servers.length : 0)}
                </span>
              </div>
              <div className="w-px h-5 bg-primary/20"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Players:</span>
                <span className="text-base font-bold font-display text-success" data-testid="text-total-players">
                  {stats?.totalPlayers ?? (Array.isArray(servers) ? servers.reduce((sum, s) => sum + (s.playerCount ?? 0), 0) : 0)}
                </span>
              </div>
              <div className="w-px h-5 bg-primary/20"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Avg Ping:</span>
                <span className="text-base font-bold font-display text-foreground" data-testid="text-avg-ping">
                  {stats?.avgPing ?? (Array.isArray(servers) && servers.length > 0 ? Math.round(servers.reduce((sum, s) => sum + (s.ping ?? 0), 0) / servers.length) : 0)}<span className="text-sm text-muted-foreground">ms</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 rounded-md border border-primary/20">
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
      <main className="flex-1 flex overflow-hidden">
        <ServerBrowser 
          servers={Array.isArray(servers) ? servers : []}
          isLoading={isLoading}
          searchQuery={searchQuery}
          selectedServer={selectedServer}
          onServerSelect={handleServerSelect}
          onServerJoin={handleJoinServer}
          aiFilters={aiFilters}
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
      <JoinModal 
        server={selectedServer}
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}
