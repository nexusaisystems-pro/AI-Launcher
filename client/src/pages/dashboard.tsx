import { useState } from "react";
import { ServerBrowser } from "@/components/server-browser";
import { ServerDetailPanel } from "@/components/server-detail-panel";
import { JoinModal } from "@/components/join-modal";
import { useServers } from "@/hooks/use-servers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Plus, Globe } from "lucide-react";
import type { Server } from "@shared/schema";

export default function Dashboard() {
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: servers = [], isLoading, refetch } = useServers("/api/servers", undefined, true);
  const { data: statsData } = useServers("/api/stats");
  const stats = statsData && 'serversOnline' in statsData ? statsData : undefined;

  const handleServerSelect = (server: Server) => {
    setSelectedServer(server);
  };

  const handleJoinServer = (server: Server) => {
    setSelectedServer(server);
    setIsJoinModalOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="glass border-b border-primary/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-5">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 holographic rounded-xl flex items-center justify-center neon-border animate-float">
              <Globe className="w-7 h-7 text-primary-glow" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 blur-xl -z-10"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary-glow via-secondary-glow to-accent-glow animate-shimmer" style={{backgroundSize: "200% auto"}}>
                DayZ Server Browser
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Next-Gen Launcher</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/60 group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="Search servers by name, IP, or map..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass border-primary/30 pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:neon-glow transition-all"
                data-testid="search-input"
              />
            </div>
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
        <div className="glass border-t border-primary/20 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <span className="status-dot status-online"></span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Servers:</span>
                <span className="text-lg font-bold font-display text-primary-glow" data-testid="text-servers-online">
                  {stats?.serversOnline ?? (Array.isArray(servers) ? servers.length : 0)}
                </span>
              </div>
              <div className="w-px h-6 bg-primary/20"></div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Players:</span>
                <span className="text-lg font-bold font-display text-success" data-testid="text-total-players">
                  {stats?.totalPlayers ?? (Array.isArray(servers) ? servers.reduce((sum, s) => sum + (s.playerCount ?? 0), 0) : 0)}
                </span>
              </div>
              <div className="w-px h-6 bg-primary/20"></div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Avg Ping:</span>
                <span className="text-lg font-bold font-display text-foreground" data-testid="text-avg-ping">
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
