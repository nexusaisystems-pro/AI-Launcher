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
  
  const { data: servers = [], isLoading, refetch } = useServers();
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
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DayZ Server Browser</h1>
              <p className="text-xs text-muted-foreground">Next-Gen Launcher</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search servers by name, IP, or map..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary border-border pl-10 pr-4 py-2.5 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
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
              className="bg-secondary hover:bg-muted border-border"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-add-server"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Server
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="bg-secondary/50 border-t border-border px-6 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="status-dot status-online"></span>
                <span className="text-muted-foreground">Servers Online:</span>
                <span className="text-foreground font-semibold" data-testid="text-servers-online">
                  {stats?.serversOnline ?? (Array.isArray(servers) ? servers.length : 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Total Players:</span>
                <span className="text-success font-semibold" data-testid="text-total-players">
                  {stats?.totalPlayers ?? (Array.isArray(servers) ? servers.reduce((sum, s) => sum + (s.playerCount ?? 0), 0) : 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Avg Ping:</span>
                <span className="text-foreground font-semibold" data-testid="text-avg-ping">
                  {stats?.avgPing ?? (Array.isArray(servers) && servers.length > 0 ? Math.round(servers.reduce((sum, s) => sum + (s.ping ?? 0), 0) / servers.length) : 0)}ms
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="text-foreground font-medium" data-testid="text-last-updated">
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
